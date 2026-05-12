import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import Notification from '../models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load proto file
const PROTO_PATH = path.join(__dirname, '../../../../proto/notification.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const notificationProto = grpc.loadPackageDefinition(packageDefinition).notification;

// gRPC Service Implementation
const notificationService = {
    // Handle low stock notification
    NotifyLowStock: async (call, callback) => {
        try {
            const {
                product_id,
                product_name,
                sku,
                current_stock,
                low_stock_threshold,
                supplier_id,
                supplier_name,
                triggered_by
            } = call.request;

            console.log(`📢 gRPC: Received low stock alert for ${product_name}`);

            // Create notification in database
            const notification = new Notification({
                type: 'LOW_STOCK',
                productId: product_id,
                productName: product_name,
                sku,
                currentStock: current_stock,
                lowStockThreshold: low_stock_threshold,
                supplierId: supplier_id,
                supplierName: supplier_name,
                triggeredBy: triggered_by,
                message: `Low stock alert: ${product_name} (SKU: ${sku}) has ${current_stock} units remaining (threshold: ${low_stock_threshold})`,
                read: false
            });

            await notification.save();

            console.log(`✅ Notification created: ${notification._id}`);

            // Send success response
            callback(null, {
                success: true,
                message: 'Low stock notification created successfully',
                notification_id: notification._id.toString()
            });

        } catch (error) {
            console.error('❌ gRPC NotifyLowStock error:', error);
            callback({
                code: grpc.status.INTERNAL,
                details: error.message
            });
        }
    },

    // Handle order placed notification
    NotifyOrderPlaced: async (call, callback) => {
        try {
            const {
                order_id,
                customer_name,
                customer_email,
                total_items,
                total_amount,
                created_at
            } = call.request;

            console.log(`📢 gRPC: Received order placed alert for Order #${order_id}`);

            // Create notification for Inventory Managers
            const notification = new Notification({
                type: 'ORDER_PLACED',
                recipientRole: 'INVENTORY_MANAGER',
                orderId: order_id,
                totalAmount: total_amount,
                message: `New Order #${order_id.substring(0, 8)}... placed by ${customer_name} (${total_items} items, $${total_amount})`,
                read: false
            });

            await notification.save();

            console.log(`✅ Notification created: ${notification._id}`);

            callback(null, {
                success: true,
                message: 'Order notification created successfully',
                notification_id: notification._id.toString()
            });

        } catch (error) {
            console.error('❌ gRPC NotifyOrderPlaced error:', error);
            callback({
                code: grpc.status.INTERNAL,
                details: error.message
            });
        }
    },

    // Get notifications for a user
    GetNotifications: async (call, callback) => {
        try {
            const { user_id, limit = 10, unread_only = false, user_role } = call.request;

            const notifications = await Notification.getRecent(user_id, user_role, limit, unread_only);
            const unreadCount = await Notification.getUnreadCount(user_id);

            callback(null, {
                notifications: notifications.map(n => ({
                    id: n._id.toString(),
                    type: n.type,
                    product_id: n.productId?.toString() || '',
                    product_name: n.productName || '',
                    message: n.message,
                    read: n.read,
                    created_at: n.createdAt.toISOString()
                })),
                total_count: notifications.length,
                unread_count: unreadCount
            });

        } catch (error) {
            console.error('❌ gRPC GetNotifications error:', error);
            callback({
                code: grpc.status.INTERNAL,
                details: error.message
            });
        }
    },

    // Mark notification as read
    MarkAsRead: async (call, callback) => {
        try {
            const { notification_id, user_id } = call.request;

            const notification = await Notification.findOne({
                _id: notification_id,
                supplierId: user_id
            });

            if (!notification) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'Notification not found'
                });
            }

            await notification.markAsRead();

            callback(null, {
                success: true,
                message: 'Notification marked as read'
            });

        } catch (error) {
            console.error('❌ gRPC MarkAsRead error:', error);
            callback({
                code: grpc.status.INTERNAL,
                details: error.message
            });
        }
    }
};

// Start gRPC Server
export function startGrpcServer(port = 50051) {
    const server = new grpc.Server();

    server.addService(notificationProto.NotificationService.service, notificationService);

    server.bindAsync(
        `0.0.0.0:${port}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
            if (error) {
                console.error('❌ Failed to start gRPC server:', error);
                return;
            }
            console.log(`🚀 gRPC Server running on port ${port}`);
            server.start();
        }
    );

    return server;
}

export default { startGrpcServer, notificationService };
