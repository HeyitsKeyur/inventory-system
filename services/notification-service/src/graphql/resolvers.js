import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

const resolvers = {
    Query: {
        notifications: async (_, { supplierId, userId, unreadOnly = false, limit = 10 }) => {
            try {
                const query = {};

                if (supplierId) {
                    query.supplierId = new mongoose.Types.ObjectId(supplierId);
                }

                if (userId) {
                    query.userId = new mongoose.Types.ObjectId(userId);
                }

                if (unreadOnly) {
                    query.read = false;
                }

                const notifications = await Notification.find(query)
                    .sort({ createdAt: -1 })
                    .limit(limit);

                return notifications.map(n => ({
                    id: n._id.toString(),
                    type: n.type,
                    productId: n.productId?.toString(),
                    productName: n.productName,
                    sku: n.sku,
                    currentStock: n.currentStock,
                    lowStockThreshold: n.lowStockThreshold,
                    supplierId: n.supplierId?.toString(),
                    supplierName: n.supplierName,
                    triggeredBy: n.triggeredBy?.toString(),
                    message: n.message,
                    read: n.read,
                    createdAt: n.createdAt.toISOString()
                }));
            } catch (error) {
                console.error('Error fetching notifications:', error);
                throw new Error('Failed to fetch notifications');
            }
        },

        unreadCount: async (_, { supplierId, userId }) => {
            try {
                const query = { read: false };
                if (supplierId) query.supplierId = new mongoose.Types.ObjectId(supplierId);
                if (userId) query.userId = new mongoose.Types.ObjectId(userId);

                return await Notification.countDocuments(query);
            } catch (error) {
                console.error('Error counting unread notifications:', error);
                return 0;
            }
        }
    },

    Mutation: {
        markAsRead: async (_, { notificationId }) => {
            try {
                const notification = await Notification.findById(notificationId);

                if (!notification) {
                    throw new Error('Notification not found');
                }

                await notification.markAsRead();

                return {
                    id: notification._id.toString(),
                    type: notification.type,
                    productId: notification.productId?.toString(),
                    productName: notification.productName,
                    sku: notification.sku,
                    currentStock: notification.currentStock,
                    lowStockThreshold: notification.lowStockThreshold,
                    supplierId: notification.supplierId?.toString(),
                    supplierName: notification.supplierName,
                    triggeredBy: notification.triggeredBy?.toString(),
                    message: notification.message,
                    read: notification.read,
                    createdAt: notification.createdAt.toISOString()
                };
            } catch (error) {
                console.error('Error marking notification as read:', error);
                throw new Error('Failed to mark notification as read');
            }
        },

        markAllAsRead: async (_, { supplierId, userId }) => {
            try {
                const query = { read: false };
                if (supplierId) query.supplierId = new mongoose.Types.ObjectId(supplierId);
                if (userId) query.userId = new mongoose.Types.ObjectId(userId);

                await Notification.updateMany(
                    query,
                    { $set: { read: true } }
                );
                return true;
            } catch (error) {
                console.error('Error marking all as read:', error);
                return false;
            }
        }
    }
};

export default resolvers;
