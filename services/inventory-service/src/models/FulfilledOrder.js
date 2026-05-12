const mongoose = require('mongoose');

const fulfilledOrderSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    sku: {
        type: String
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    supplierName: {
        type: String
    },
    quantity: {
        type: Number,
        required: true
    },
    fulfilledAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FulfilledOrder', fulfilledOrderSchema);
