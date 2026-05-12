import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['LOW_STOCK', 'ORDER_PLACED', 'ORDER_SHIPPED', 'SYSTEM', 'NEW_PRODUCT'],
        default: 'LOW_STOCK'
    },
    recipientRole: {
        type: String,
        enum: ['INVENTORY_MANAGER', 'SUPPLIER', 'ADMIN', 'CUSTOMER'],
        index: true
    },
    orderId: {
        type: String
    },
    totalAmount: {
        type: Number
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: function () { return this.type === 'LOW_STOCK' || this.type === 'NEW_PRODUCT'; }
    },
    productName: {
        type: String,
        required: function () { return this.type === 'LOW_STOCK' || this.type === 'NEW_PRODUCT'; }
    },
    sku: {
        type: String
    },
    currentStock: {
        type: Number
    },
    lowStockThreshold: {
        type: Number
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () { return this.type === 'LOW_STOCK'; },
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () { return this.type === 'NEW_PRODUCT'; },
        index: true
    },
    supplierName: {
        type: String
    },
    triggeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ supplierId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ supplierId: 1, createdAt: -1 });

// Virtual for notification age
notificationSchema.virtual('age').get(function () {
    return Date.now() - this.createdAt;
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function () {
    this.read = true;
    this.readAt = new Date();
    return await this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (supplierId) {
    return await this.countDocuments({ supplierId, read: false });
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = async function (userId, userRole, limit = 10, unreadOnly = false) {
    const query = {
        $or: [
            { supplierId: userId },
            { userId: userId },
            { recipientRole: userRole }
        ]
    };

    if (unreadOnly) {
        query.read = false;
    }
    return await this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
