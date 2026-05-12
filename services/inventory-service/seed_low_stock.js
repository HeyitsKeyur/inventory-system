const mongoose = require('mongoose');
const Product = require('./src/models/Product');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';

const seedLowStock = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Fetch existing suppliers
        const suppliers = await mongoose.connection.db.collection('users')
            .find({ role: 'SUPPLIER' })
            .toArray();

        if (suppliers.length === 0) {
            console.error('No suppliers found in the database. Please create suppliers first.');
            process.exit(1);
        }

        console.log(`Found ${suppliers.length} suppliers: ${suppliers.map(s => s.name).join(', ')}`);

        // 2. Define products to seed
        const productsToSeed = [
            { name: 'Wireless Mouse', category: 'Electronics', price: 25.99 },
            { name: 'USB-C Cable', category: 'Accessories', price: 12.50 },
            { name: 'HDMI Adapter', category: 'Accessories', price: 18.00 },
            { name: 'Webcam 1080p', category: 'Electronics', price: 45.00 },
            { name: 'Laptop Stand', category: 'Office', price: 35.00 },
            { name: 'Mechanical Keyboard', category: 'Electronics', price: 85.00 },
            { name: 'Gaming Headset', category: 'Electronics', price: 55.00 },
            { name: 'Monitor Arm', category: 'Office', price: 40.00 },
            { name: 'Ergonomic Chair', category: 'Office', price: 250.00 },
            { name: 'Desk Lamp', category: 'Office', price: 45.00 },
            { name: 'Bluetooth Speaker', category: 'Electronics', price: 60.00 },
            { name: 'External SSD 1TB', category: 'Electronics', price: 120.00 }
        ];

        // 3. Remove previously seeded products to avoid duplicates
        const productNames = productsToSeed.map(p => p.name);
        const deleteResult = await Product.deleteMany({ name: { $in: productNames } });
        console.log(`Deleted ${deleteResult.deletedCount} old seeded products.`);

        // 4. Create new low stock products
        for (let i = 0; i < productsToSeed.length; i++) {
            const p = productsToSeed[i];
            // Round-robin assignment of suppliers
            const supplier = suppliers[i % suppliers.length];

            const stock = Math.floor(Math.random() * 10) + 1; // 1 to 10
            const threshold = stock + Math.floor(Math.random() * 10) + 5; // Threshold higher than stock

            const product = new Product({
                name: p.name,
                sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
                description: `High quality ${p.name}`,
                category: p.category,
                price: p.price,
                stock: stock,
                lowStockThreshold: threshold,
                supplierId: supplier._id,
                supplierName: supplier.name,
                isActive: true,
                isLowStockNotified: false
            });

            await product.save();
            console.log(`Created: ${product.name} (Stock: ${stock}/${threshold}) -> ${supplier.name}`);
        }

        console.log('Seeding complete');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedLowStock();
