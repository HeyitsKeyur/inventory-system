const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const User = require('../auth-service/src/models/User'); // Access User model from Auth Service
require('dotenv').config({ path: '../../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory';

async function assignSuppliers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Find all suppliers
        // We need to define the User schema temporarily or require it if possible.
        // Since we are in inventory-service, requiring from auth-service might fail due to path or dependencies.
        // Safer to just query the 'users' collection directly or define a minimal User schema.

        const userSchema = new mongoose.Schema({
            name: String,
            email: String,
            role: String,
            supplierId: mongoose.Schema.Types.ObjectId
        });
        const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

        let suppliers = await UserModel.find({ role: 'SUPPLIER' });
        console.log(`Found ${suppliers.length} existing suppliers.`);

        // 2. If no suppliers, create some dummy ones
        if (suppliers.length === 0) {
            console.log('Creating dummy suppliers...');
            const dummySuppliers = [
                { name: 'Tech Supplies Inc.', email: 'supplier1@tech.com', role: 'SUPPLIER', password: 'hashed_dummy' },
                { name: 'Global Gadgets Ltd.', email: 'supplier2@gadgets.com', role: 'SUPPLIER', password: 'hashed_dummy' },
                { name: 'FastTrack Logistics', email: 'supplier3@fast.com', role: 'SUPPLIER', password: 'hashed_dummy' }
            ];

            // We won't create them properly with auth hashing here to avoid complexity, 
            // just enough to have IDs and Names for products. 
            // Ideally, you should register them via API, but for this task, we just need the DB records.
            // Actually, let's just create them if they don't exist so we have IDs.
            // But wait, if we create them here without proper password hashing, they can't login.
            // So better to just use placeholders if we can't find any, OR assume the user will register them.
            // Let's just create them with a placeholder password hash (bcrypt) if needed, or just skip login for them for now.
            // Or better: Just use the first user found as a fallback if no suppliers.

            // Let's create them properly-ish
            suppliers = await UserModel.insertMany(dummySuppliers);
            console.log(`Created ${suppliers.length} dummy suppliers.`);
        }

        // 3. Update all products
        const products = await Product.find({});
        console.log(`Found ${products.length} products.`);

        for (const product of products) {
            const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];

            product.supplierId = randomSupplier._id;
            product.supplierName = randomSupplier.name;

            await product.save();
            console.log(`Updated ${product.name} -> Supplier: ${product.supplierName}`);
        }

        console.log('✅ All products assigned to random suppliers.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

assignSuppliers();
