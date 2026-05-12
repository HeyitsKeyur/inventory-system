const mongoose = require('mongoose');
const Product = require('../models/Product');
const { redis } = require('../lib/redis');
const { notifyLowStockViaGrpc, notifyOrderPlacedViaGrpc } = require('../grpc/grpcClient');
const { publishLowStockAlert, publishProductCreated } = require('../rabbitmq/publisher');
const FulfilledOrder = require('../models/FulfilledOrder');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const resolvers = {
    Query: {
        products: async (_, { page = 1, limit = 10, category, search, supplierId }) => {
            const query = { isActive: true };
            if (category) query.category = category;
            if (supplierId) query.supplierId = supplierId;
            if (search) {
                query.$text = { $search: search };
            }

            const skip = (page - 1) * limit;
            return await Product.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
        },
        product: async (_, { id }) => {
            return await Product.findById(id);
        },
        recentlyVisited: async (_, __, { user }) => {
            if (!user) return [];

            // Get product IDs from Redis
            const key = `recent_products:${user.userId}`;
            console.log(`🔍 [LRU DEBUG] User: ${user.name} (${user.email}), userId: ${user.userId}, Redis key: ${key}`);

            const productIds = await redis.lrange(key, 0, 3); // Get last 4
            console.log(`🔍 [LRU DEBUG] Found ${productIds.length} products for user ${user.userId}:`, productIds);

            if (productIds.length === 0) return [];

            // Fetch products from DB (preserve order)
            const products = await Product.find({ _id: { $in: productIds } });

            // Sort by order in Redis list
            return productIds
                .map(id => products.find(p => p.id === id))
                .filter(p => p); // Remove nulls if product deleted
        },
        lowStockProducts: async (_, __, { user }) => {
            // Only for Inventory Managers and Admins
            if (!user || (user.role !== 'INVENTORY_MANAGER' && user.role !== 'ADMIN')) {
                throw new Error('Unauthorized');
            }

            return await Product.find({
                isActive: true,
                $expr: { $lte: ['$stock', '$lowStockThreshold'] },
                isLowStockNotified: { $ne: true }
            });
        },
        fulfilledOrders: async (_, { limit = 10 }, { user }) => {
            if (!user || (user.role !== 'INVENTORY_MANAGER' && user.role !== 'ADMIN')) {
                throw new Error('Unauthorized');
            }
            return await FulfilledOrder.find()
                .sort({ fulfilledAt: -1 })
                .limit(limit);
        },
        stats: async (_, __, { user }) => {
            if (!user || (user.role !== 'INVENTORY_MANAGER' && user.role !== 'ADMIN')) {
                throw new Error('Unauthorized');
            }

            const [totalProducts, lowStockCount, totalValueAgg] = await Promise.all([
                Product.countDocuments({ isActive: true }),
                Product.countDocuments({
                    isActive: true,
                    $expr: { $lte: ['$stock', '$lowStockThreshold'] }
                }),
                Product.aggregate([
                    { $match: { isActive: true } },
                    {
                        $group: {
                            _id: null,
                            totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
                        }
                    }
                ])
            ]);

            const totalValue = totalValueAgg[0]?.totalValue || 0;

            return {
                totalProducts,
                lowStockCount,
                totalValue,
                pendingOrders: 0
            };
        },
        getCart: async (_, __, { user }) => {
            if (!user) throw new Error('Unauthorized');
            let cart = await Cart.findOne({ userId: user.userId }).populate('items.productId');
            if (!cart) {
                cart = new Cart({ userId: user.userId, items: [] });
            }
            // Filter out null products (deleted)
            cart.items = cart.items.filter(item => item.productId);
            return {
                id: cart._id,
                userId: cart.userId,
                items: cart.items.map(item => ({
                    product: item.productId,
                    quantity: item.quantity
                })),
                totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                totalPrice: cart.items.reduce((sum, item) => sum + (item.quantity * item.productId.price), 0)
            };
        },
        orders: async (_, __, { user }) => {
            if (!user || (user.role !== 'INVENTORY_MANAGER' && user.role !== 'ADMIN')) {
                throw new Error('Unauthorized');
            }
            return await Order.find().sort({ createdAt: -1 });
        }
    },
    Mutation: {
        createProduct: async (_, { input }, { user }) => {
            if (!user || (user.role !== 'ADMIN' && user.role !== 'INVENTORY_MANAGER' && user.role !== 'SUPPLIER')) {
                throw new Error('Unauthorized');
            }

            let supplierId = user.userId;
            let supplierName = user.name || 'Unknown Supplier';

            if (user.role === 'SUPPLIER') {
                supplierId = user.supplierId || user.userId;
                supplierName = user.name || 'Unknown Supplier';
            } else {
                if (!input.supplierId) {
                    throw new Error('Supplier selection is required for new products');
                }
                supplierId = input.supplierId;
                supplierName = input.supplierName || 'Unknown Supplier';
            }

            const product = new Product({
                ...input,
                supplierId,
                supplierName
            });
            await product.save();

            // Broadcast new product event
            publishProductCreated(product).catch(err => {
                console.error('Failed to publish product created event:', err);
            });

            return product;
        },
        updateProduct: async (_, { id, input }, { user }) => {
            if (!user || (user.role !== 'INVENTORY_MANAGER' && user.role !== 'SUPPLIER' && user.role !== 'ADMIN')) {
                throw new Error('Unauthorized');
            }

            // Add ownership check for suppliers

            return await Product.findByIdAndUpdate(id, input, { new: true });
        },
        deleteProduct: async (_, { id }, { user }) => {
            if (!user || (user.role !== 'INVENTORY_MANAGER' && user.role !== 'ADMIN')) {
                throw new Error('Unauthorized');
            }
            await Product.findByIdAndUpdate(id, { isActive: false });
            return true;
        },
        trackVisit: async (_, { productId }, { user }) => {
            if (!user) return false;

            const key = `recent_products:${user.userId}`;
            const id = productId.toString();

            console.log(`📝 [TRACK VISIT] User: ${user.name} (${user.email}), userId: ${user.userId}, productId: ${id}, Redis key: ${key}`);

            // Use pipeline for atomicity
            const pipeline = redis.pipeline();
            pipeline.lrem(key, 0, id);
            pipeline.lpush(key, id);
            pipeline.ltrim(key, 0, 3); // Keep 4 items
            pipeline.expire(key, 60 * 60 * 24 * 7);

            await pipeline.exec();

            console.log(`✅ [TRACK VISIT] Successfully tracked visit for user ${user.userId}`);

            return true;
        },
        notifyLowStock: async (_, { productId }, { user }) => {
            // Allow Inventory Managers, Admins and Suppliers (for testing) to trigger notifications
            if (!user || (user.role !== 'INVENTORY_MANAGER' && user.role !== 'SUPPLIER' && user.role !== 'ADMIN')) {
                throw new Error('Unauthorized: Only Inventory Managers, Admins or Suppliers can send notifications');
            }

            try {
                // Get product details
                const product = await Product.findById(productId);
                if (!product) {
                    throw new Error('Product not found');
                }

                // Check if stock is actually low
                if (product.stock > product.lowStockThreshold) {
                    return {
                        success: false,
                        message: `Product stock (${product.stock}) is above threshold (${product.lowStockThreshold})`,
                        notificationId: null
                    };
                }

                // Check if already notified
                if (product.isLowStockNotified) {
                    return {
                        success: false,
                        message: `Notification already sent for ${product.name}`,
                        notificationId: null
                    };
                }

                // Prepare notification data
                const notificationData = {
                    productId: product._id.toString(),
                    productName: product.name,
                    sku: product.sku,
                    currentStock: product.stock,
                    lowStockThreshold: product.lowStockThreshold,
                    supplierId: product.supplierId.toString(),
                    supplierName: '', // Can be fetched from User model if needed
                    triggeredBy: user.userId
                };

                // Send via gRPC with RabbitMQ fallback
                let notificationId;
                try {
                    const grpcResponse = await notifyLowStockViaGrpc(notificationData);
                    notificationId = grpcResponse.notification_id;
                    console.log('Notification sent via gRPC');
                } catch (grpcError) {
                    console.warn('gRPC failed, falling back to RabbitMQ:', grpcError.message);
                    await publishLowStockAlert(notificationData);
                    notificationId = 'queued-rabbitmq';
                    console.log('Notification queued via RabbitMQ');
                }

                // Mark product as notified
                product.isLowStockNotified = true;
                await product.save();

                return {
                    success: true,
                    message: `Low stock notification sent for ${product.name}`,
                    notificationId: notificationId
                };

            } catch (error) {
                console.error('notifyLowStock error:', error);
                return {
                    success: false,
                    message: error.message || 'Failed to send notification',
                    notificationId: null
                };
            }
        },
        fulfillOrder: async (_, { productId, quantity }, { user }) => {
            try {
                if (!user || user.role !== 'SUPPLIER') {
                    throw new Error('Unauthorized: Only suppliers can fulfill orders');
                }

                const product = await Product.findById(productId);
                if (!product) {
                    throw new Error('Product not found');
                }

                product.stock += quantity;

                if (product.stock > product.lowStockThreshold) {
                    product.isLowStockNotified = false;
                }

                await product.save();

                // Create FulfilledOrder record
                await FulfilledOrder.create({
                    productId: product._id,
                    productName: product.name,
                    sku: product.sku,
                    supplierId: user.userId || user.supplierId, // Handle different user object structures
                    supplierName: user.name || 'Unknown Supplier',
                    quantity
                });

                console.log(`✅ Order fulfilled: ${product.name} stock increased by ${quantity}`);

                return {
                    success: true,
                    message: `Successfully added ${quantity} units to ${product.name}`,
                    newStock: product.stock
                };

            } catch (error) {
                console.error('fulfillOrder error:', error);
                return {
                    success: false,
                    message: error.message || 'Failed to fulfill order',
                    newStock: null
                };
            }
        },
        addToCart: async (_, { productId, quantity }, { user }) => {
            if (!user) throw new Error('Unauthorized');

            const product = await Product.findById(productId);
            if (!product) throw new Error('Product not found');
            if (product.stock < quantity) throw new Error('Insufficient stock');

            let cart = await Cart.findOne({ userId: user.userId });
            if (!cart) {
                cart = new Cart({ userId: user.userId, items: [] });
            }

            const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (existingItemIndex > -1) {
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                cart.items.push({ productId, quantity });
            }

            await cart.save();

            // Return populated cart
            await cart.populate('items.productId');
            return {
                id: cart._id,
                userId: cart.userId,
                items: cart.items.map(item => ({
                    product: item.productId,
                    quantity: item.quantity
                })),
                totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                totalPrice: cart.items.reduce((sum, item) => sum + (item.quantity * item.productId.price), 0)
            };
        },
        removeFromCart: async (_, { productId }, { user }) => {
            if (!user) throw new Error('Unauthorized');

            let cart = await Cart.findOne({ userId: user.userId });
            if (!cart) return null;

            cart.items = cart.items.filter(item => item.productId.toString() !== productId);
            await cart.save();

            await cart.populate('items.productId');
            return {
                id: cart._id,
                userId: cart.userId,
                items: cart.items.map(item => ({
                    product: item.productId,
                    quantity: item.quantity
                })),
                totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                totalPrice: cart.items.reduce((sum, item) => sum + (item.quantity * item.productId.price), 0)
            };
        },
        clearCart: async (_, __, { user }) => {
            if (!user) throw new Error('Unauthorized');
            await Cart.findOneAndDelete({ userId: user.userId });
            return true;
        },
        placeOrder: async (_, __, { user }) => {
            if (!user) throw new Error('Unauthorized');

            // 1. Get Cart
            const cart = await Cart.findOne({ userId: user.userId }).populate('items.productId');
            if (!cart || cart.items.length === 0) {
                throw new Error('Cart is empty');
            }

            // 2. Validate Stock & Calculate Total
            let totalAmount = 0;
            const orderItems = [];

            for (const item of cart.items) {
                const product = item.productId;
                if (!product) continue; // Skip deleted products

                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
                }

                totalAmount += product.price * item.quantity;
                orderItems.push({
                    productId: product._id,
                    name: product.name,
                    sku: product.sku,
                    quantity: item.quantity,
                    price: product.price
                });
            }

            // 3. Deduct Stock
            for (const item of cart.items) {
                if (item.productId) {
                    await Product.findByIdAndUpdate(item.productId._id, {
                        $inc: { stock: -item.quantity }
                    });
                }
            }

            // 4. Create Order
            const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const order = new Order({
                orderNumber,
                customerId: new mongoose.Types.ObjectId(user.userId),
                items: orderItems.map(item => ({
                    ...item,
                    productId: new mongoose.Types.ObjectId(item.productId)
                })),
                totalAmount,
                status: 'CONFIRMED'
            });

            try {
                console.log('Creating order with data:', JSON.stringify({
                    userId: user.userId,
                    items: orderItems,
                    totalAmount,
                    status: 'COMPLETED'
                }, null, 2));
                await order.save();
            } catch (saveError) {
                console.error('❌ Order Save Error:', saveError);
                if (saveError.errInfo) {
                    console.error('❌ MongoDB Validation Details:', JSON.stringify(saveError.errInfo, null, 2));
                }
                throw new Error(`Order validation failed: ${saveError.message}`);
            }

            // 5. Clear Cart
            await Cart.findOneAndDelete({ userId: user.userId });

            // 6. Notify via gRPC
            try {
                await notifyOrderPlacedViaGrpc({
                    orderId: order._id.toString(),
                    customerName: user.name || 'Unknown Customer',
                    customerEmail: user.email || 'No Email',
                    totalItems: orderItems.reduce((sum, item) => sum + item.quantity, 0),
                    totalAmount: totalAmount,
                    createdAt: order.createdAt.toISOString()
                });
            } catch (err) {
                console.error('Failed to send order notification via gRPC:', err);
            }

            return order;
        }
    }
};

module.exports = resolvers;
