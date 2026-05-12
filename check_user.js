const mongoose = require('mongoose');
const User = require('./services/auth-service/src/models/User');
require('dotenv').config();

// Force local connection string for this check
const mongoURI = 'mongodb://127.0.0.1:27017/inventory';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const count = await User.countDocuments();
        console.log(`Total users in DB: ${count}`);

        const admin = await User.findOne({ email: 'admin@inventory.com' });
        if (admin) {
            console.log('Admin user FOUND');
        } else {
            console.log('Admin user NOT FOUND');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
