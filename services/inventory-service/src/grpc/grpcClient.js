const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

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

// gRPC Client
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'localhost:50051';
const client = new notificationProto.NotificationService(
    NOTIFICATION_SERVICE_URL,
    grpc.credentials.createInsecure()
);

/**
 * Send low stock notification via gRPC
 * @param {Object} data - Low stock data
 * @returns {Promise<Object>} Response from notification service
 */
async function notifyLowStockViaGrpc(data) {
    return new Promise((resolve, reject) => {
        const request = {
            product_id: data.productId,
            product_name: data.productName,
            sku: data.sku,
            current_stock: data.currentStock,
            low_stock_threshold: data.lowStockThreshold,
            supplier_id: data.supplierId,
            supplier_name: data.supplierName || '',
            triggered_by: data.triggeredBy
        };

        console.log(`📡 gRPC: Sending low stock alert for ${data.productName}`);

        client.NotifyLowStock(request, (error, response) => {
            if (error) {
                console.error('❌ gRPC call failed:', error);
                reject(error);
            } else {
                console.log(`✅ gRPC response: ${response.message}`);
                resolve(response);
            }
        });
    });
}

/**
 * Get notifications for a user via gRPC
 * @param {String} userId - User ID
 * @param {Number} limit - Number of notifications to fetch
 * @param {Boolean} unreadOnly - Fetch only unread notifications
 * @returns {Promise<Object>} Notifications response
 */
async function getNotificationsViaGrpc(userId, limit = 10, unreadOnly = false) {
    return new Promise((resolve, reject) => {
        const request = {
            user_id: userId,
            limit,
            unread_only: unreadOnly
        };

        client.GetNotifications(request, (error, response) => {
            if (error) {
                console.error('❌ gRPC GetNotifications failed:', error);
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Mark notification as read via gRPC
 * @param {String} notificationId - Notification ID
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Response
 */
async function markAsReadViaGrpc(notificationId, userId) {
    return new Promise((resolve, reject) => {
        const request = {
            notification_id: notificationId,
            user_id: userId
        };

        client.MarkAsRead(request, (error, response) => {
            if (error) {
                console.error('❌ gRPC MarkAsRead failed:', error);
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Send order placed notification via gRPC
 * @param {Object} data - Order data
 * @returns {Promise<Object>} Response from notification service
 */
async function notifyOrderPlacedViaGrpc(data) {
    return new Promise((resolve, reject) => {
        const request = {
            order_id: data.orderId,
            customer_name: data.customerName,
            customer_email: data.customerEmail,
            total_items: data.totalItems,
            total_amount: data.totalAmount,
            created_at: data.createdAt
        };

        console.log(`📡 gRPC: Sending order placed alert for Order #${data.orderId}`);

        client.NotifyOrderPlaced(request, (error, response) => {
            if (error) {
                console.error('❌ gRPC call failed:', error);
                reject(error);
            } else {
                console.log(`✅ gRPC response: ${response.message}`);
                resolve(response);
            }
        });
    });
}

module.exports = {
    notifyLowStockViaGrpc,
    getNotificationsViaGrpc,
    markAsReadViaGrpc,
    notifyOrderPlacedViaGrpc
};
