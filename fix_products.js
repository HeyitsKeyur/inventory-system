const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = 'mongodb://127.0.0.1:27017/inventory';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to MongoDB');

        const result = await mongoose.connection.db.collection('products').updateMany(
            { isActive: { $exists: false } },
            { $set: { isActive: true } }
        );

        console.log(`Updated ${result.modifiedCount} products`);
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
