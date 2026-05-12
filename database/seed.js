/**
 * Database Seed Script
 * Seeds the database with initial data for testing
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

// For local MongoDB (single instance)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'inventory';

// Sample data
const categories = ['Electronics', 'Clothing', 'Books', 'Home & Kitchen', 'Sports', 'Toys'];

const productNames = {
    Electronics: ['Laptop', 'Smartphone', 'Headphones', 'Tablet', 'Smart Watch', 'Camera', 'Speaker', 'Monitor'],
    Clothing: ['T-Shirt', 'Jeans', 'Jacket', 'Sneakers', 'Dress', 'Hoodie', 'Shorts', 'Sweater'],
    Books: ['Fiction Novel', 'Programming Guide', 'Cookbook', 'Biography', 'Science Book', 'History Book'],
    'Home & Kitchen': ['Blender', 'Coffee Maker', 'Cookware Set', 'Vacuum Cleaner', 'Air Fryer', 'Toaster'],
    Sports: ['Yoga Mat', 'Dumbbells', 'Running Shoes', 'Tennis Racket', 'Basketball', 'Bicycle'],
    Toys: ['Building Blocks', 'Action Figure', 'Board Game', 'Puzzle', 'Doll', 'Remote Car']
};

async function seedDatabase() {
    const client = new MongoClient(MONGO_URI);

    try {
        console.log('🔌 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(DB_NAME);

        // Clear existing data
        console.log('\n🗑️  Clearing existing data...');
        await db.collection('users').deleteMany({});
        await db.collection('products').deleteMany({});
        await db.collection('orders').deleteMany({});
        await db.collection('notifications').deleteMany({});
        console.log('  ✓ Collections cleared');

        // Seed Users
        console.log('\n👥 Seeding users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const users = [
            {
                _id: new ObjectId(),
                email: 'admin@inventory.com',
                password: hashedPassword,
                role: 'ADMIN',
                name: 'Admin User',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: new ObjectId(),
                email: 'manager@inventory.com',
                password: hashedPassword,
                role: 'INVENTORY_MANAGER',
                name: 'Inventory Manager',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: new ObjectId(),
                email: 'customer@test.com',
                password: hashedPassword,
                role: 'CUSTOMER',
                name: 'John Customer',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: new ObjectId(),
                email: 'customer2@test.com',
                password: hashedPassword,
                role: 'CUSTOMER',
                name: 'Jane Doe',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Create suppliers
        const suppliers = [];
        for (let i = 1; i <= 5; i++) {
            const supplierId = new ObjectId();
            suppliers.push({
                _id: supplierId,
                email: `supplier${i}@supply.com`,
                password: hashedPassword,
                role: 'SUPPLIER',
                name: `Supplier ${i}`,
                supplierId: supplierId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        const allUsers = [...users, ...suppliers];
        await db.collection('users').insertMany(allUsers);
        console.log(`  ✓ Created ${allUsers.length} users (1 admin, 1 manager, 2 customers, 5 suppliers)`);

        // Seed Products
        console.log('\n📦 Seeding products...');
        const products = [];
        let skuCounter = 1000;

        for (const category of categories) {
            const productList = productNames[category];
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

            for (const productName of productList) {
                const stock = Math.floor(Math.random() * 200) + 10;
                const lowStockThreshold = Math.floor(Math.random() * 20) + 5;

                products.push({
                    _id: new ObjectId(),
                    sku: `SKU-${skuCounter++}`,
                    name: productName,
                    description: `High-quality ${productName.toLowerCase()} from our premium collection. Perfect for everyday use.`,
                    category: category,
                    price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
                    stock: stock,
                    lowStockThreshold: lowStockThreshold,
                    supplierId: supplier._id,
                    images: [
                        `https://via.placeholder.com/400x400?text=${encodeURIComponent(productName)}`,
                        `https://via.placeholder.com/400x400?text=${encodeURIComponent(productName)}+2`
                    ],
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        // Add some low stock products for testing
        for (let i = 0; i < 5; i++) {
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
            products.push({
                _id: new ObjectId(),
                sku: `SKU-${skuCounter++}`,
                name: `Low Stock Item ${i + 1}`,
                description: 'This item is running low on stock',
                category: categories[Math.floor(Math.random() * categories.length)],
                price: parseFloat((Math.random() * 100 + 20).toFixed(2)),
                stock: Math.floor(Math.random() * 3) + 1, // 1-3 items
                lowStockThreshold: 10,
                supplierId: supplier._id,
                images: [`https://via.placeholder.com/400x400?text=Low+Stock+${i + 1}`],
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        await db.collection('products').insertMany(products);
        console.log(`  ✓ Created ${products.length} products across ${categories.length} categories`);

        // Seed Sample Orders
        console.log('\n🛒 Seeding sample orders...');
        const customers = users.filter(u => u.role === 'CUSTOMER');
        const orders = [];
        const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

        for (let i = 0; i < 10; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const numItems = Math.floor(Math.random() * 3) + 1;
            const orderItems = [];
            let totalAmount = 0;

            for (let j = 0; j < numItems; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;
                const itemTotal = product.price * quantity;
                totalAmount += itemTotal;

                orderItems.push({
                    productId: product._id,
                    sku: product.sku,
                    name: product.name,
                    quantity: quantity,
                    price: product.price
                });
            }

            orders.push({
                _id: new ObjectId(),
                orderNumber: `ORD-${Date.now()}-${i}`,
                customerId: customer._id,
                items: orderItems,
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
                deliveryAddress: {
                    street: `${Math.floor(Math.random() * 999) + 1} Main Street`,
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                    country: 'USA'
                },
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
                updatedAt: new Date()
            });
        }

        await db.collection('orders').insertMany(orders);
        console.log(`  ✓ Created ${orders.length} sample orders`);

        // Print summary
        console.log('\n✅ Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`👥 Users: ${allUsers.length}`);
        console.log(`   • Admin: 1 (admin@inventory.com)`);
        console.log(`   • Inventory Manager: 1 (manager@inventory.com)`);
        console.log(`   • Customers: 2 (customer@test.com, customer2@test.com)`);
        console.log(`   • Suppliers: 5 (supplier1-5@supply.com)`);
        console.log(`   • Password for all: password123`);
        console.log(`\n📦 Products: ${products.length}`);
        console.log(`   • Categories: ${categories.join(', ')}`);
        console.log(`   • Low stock items: 5`);
        console.log(`\n🛒 Orders: ${orders.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🚀 Ready to start the application!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await client.close();
    }
}

// Run seeding
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { seedDatabase };
