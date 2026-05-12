const amqp = require('amqplib');

let connection = null;
let channel = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'inventory.events';

/**
 * Connect to RabbitMQ and create channel (with timeout)
 */
async function connect() {
    if (!connection) {
        try {
            // Add 5 second timeout to prevent hanging
            const connectPromise = amqp.connect(RABBITMQ_URL);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('RabbitMQ connection timeout after 5s')), 5000)
            );

            connection = await Promise.race([connectPromise, timeoutPromise]);
            channel = await connection.createChannel();

            // Declare exchange (topic type for flexible routing)
            await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

            console.log('📡 RabbitMQ Publisher connected');

            // Handle connection errors
            connection.on('error', (err) => {
                console.error('❌ RabbitMQ connection error:', err);
                connection = null;
                channel = null;
            });

            connection.on('close', () => {
                console.warn('⚠️ RabbitMQ connection closed');
                connection = null;
                channel = null;
            });

        } catch (error) {
            console.warn('⚠️ RabbitMQ not available:', error.message);
            connection = null;
            channel = null;
            throw error;
        }
    }
    return channel;
}

/**
 * Publish low stock alert to RabbitMQ
 * @param {Object} data - Low stock alert data
 * @returns {Promise<void>}
 */
async function publishLowStockAlert(data) {
    try {
        const ch = await connect();

        const message = {
            productId: data.productId,
            productName: data.productName,
            sku: data.sku,
            currentStock: data.currentStock,
            lowStockThreshold: data.lowStockThreshold,
            supplierId: data.supplierId,
            supplierName: data.supplierName || '',
            triggeredBy: data.triggeredBy,
            timestamp: new Date().toISOString()
        };

        console.log(`📨 RabbitMQ: Publishing low stock alert for ${data.productName}`);

        // Publish to exchange with routing key
        const published = ch.publish(
            EXCHANGE_NAME,
            'stock.low',  // Routing key
            Buffer.from(JSON.stringify(message)),
            {
                persistent: true,  // Survive broker restart
                contentType: 'application/json',
                timestamp: Date.now()
            }
        );

        if (published) {
            console.log(`✅ RabbitMQ: Low stock alert published successfully`);
        } else {
            console.warn('⚠️ RabbitMQ: Message buffered (will be sent when ready)');
        }

    } catch (error) {
        // Graceful degradation - don't fail if RabbitMQ is unavailable
        console.warn('⚠️ RabbitMQ unavailable (this is OK for testing):', error.message);
        console.log('💡 Notification will still be sent via gRPC');
    }
}

/**
 * Publish product created event to RabbitMQ
 * @param {Object} product - Product data
 * @returns {Promise<void>}
 */
async function publishProductCreated(product) {
    try {
        const ch = await connect();

        const message = {
            productId: product._id.toString(),
            name: product.name,
            category: product.category,
            price: product.price,
            sku: product.sku,
            timestamp: new Date().toISOString()
        };

        console.log(`📨 RabbitMQ: Publishing product created event for ${product.name}`);

        const published = ch.publish(
            EXCHANGE_NAME,
            'product.created',
            Buffer.from(JSON.stringify(message)),
            {
                persistent: true,
                contentType: 'application/json',
                timestamp: Date.now()
            }
        );

        if (published) {
            console.log(`✅ RabbitMQ: Product created event published successfully`);
        } else {
            console.warn('⚠️ RabbitMQ: Message buffered');
        }

    } catch (error) {
        console.warn('⚠️ RabbitMQ unavailable:', error.message);
    }
}

/**
 * Close RabbitMQ connection
 */
async function closeConnection() {
    try {
        if (channel) {
            await channel.close();
        }
        if (connection) {
            await connection.close();
        }
        console.log('🛑 RabbitMQ Publisher disconnected');
    } catch (error) {
        console.error('❌ Error closing RabbitMQ connection:', error);
    }
}

// Graceful shutdown
process.on('SIGTERM', closeConnection);
process.on('SIGINT', closeConnection);

module.exports = {
    publishLowStockAlert,
    publishProductCreated,
    closeConnection
};
