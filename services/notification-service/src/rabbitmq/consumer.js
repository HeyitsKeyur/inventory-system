import amqp from 'amqplib';
import Notification from '../models/Notification.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'inventory.events';
const QUEUE_NAME = 'low-stock-alerts';

let connection = null;
let channel = null;

/**
 * Start RabbitMQ Consumer with retry logic
 */
export async function startRabbitMQConsumer(maxRetries = 5, retryDelay = 2000) {
    let retries = 0;

    while (retries < maxRetries) {
        try {
            // Connect to RabbitMQ
            connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();

            console.log('📡 RabbitMQ Consumer connected');

            // Declare exchange
            await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

            // Declare queue
            await channel.assertQueue(QUEUE_NAME, {
                durable: true,
                arguments: {
                    'x-message-ttl': 86400000,
                    'x-max-length': 10000
                }
            });

            // Bind queue to exchange with routing keys for both events
            await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'product.created');
            await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'stock.low');

            // Set prefetch to 1
            await channel.prefetch(1);

            console.log(`📨 RabbitMQ Consumer: Listening to queue '${QUEUE_NAME}'`);
            console.log(`🔗 Bound to exchange '${EXCHANGE_NAME}' with routing keys: 'product.created' and 'stock.low'`);

            // Consume messages
            channel.consume(QUEUE_NAME, async (msg) => {
                if (msg) {
                    try {
                        const data = JSON.parse(msg.content.toString());
                        const routingKey = msg.fields.routingKey;

                        if (routingKey === 'product.created') {
                            console.log(`📬 RabbitMQ: Received new product alert for ${data.name}`);

                            try {
                                const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
                                const url = `${AUTH_SERVICE_URL}/api/auth/internal/users?role=CUSTOMER`;
                                console.log(`Fetching customers from: ${url}`);
                                const response = await fetch(url);

                                if (!response.ok) {
                                    const text = await response.text();
                                    console.error(`Failed to fetch customers: ${response.status} ${response.statusText} - ${text}`);
                                    throw new Error(`Auth service returned ${response.status}`);
                                }

                                const result = await response.json();

                                if (result.success && result.data) {
                                    const customers = result.data;
                                    console.log(`Found ${customers.length} customers to notify`);

                                    for (const customer of customers) {
                                        const notification = new Notification({
                                            type: 'NEW_PRODUCT',
                                            productId: data.productId,
                                            productName: data.name,
                                            sku: data.sku,
                                            message: `New product available: ${data.name} - $${data.price}`,
                                            userId: customer._id,
                                            read: false
                                        });
                                        await notification.save();
                                    }
                                    console.log(`✅ Created ${customers.length} notifications`);
                                }
                            } catch (err) {
                                console.error('Failed to fetch customers or create notifications:', err);
                            }

                            channel.ack(msg);
                            return;
                        }

                        console.log(`📬 RabbitMQ: Received low stock alert for ${data.productName}`);

                        // Create notification in database
                        const notification = new Notification({
                            type: 'LOW_STOCK',
                            productId: data.productId,
                            productName: data.productName,
                            sku: data.sku,
                            currentStock: data.currentStock,
                            lowStockThreshold: data.lowStockThreshold,
                            supplierId: data.supplierId,
                            supplierName: data.supplierName,
                            triggeredBy: data.triggeredBy,
                            message: `Low stock alert: ${data.productName} (SKU: ${data.sku}) has ${data.currentStock} units remaining (threshold: ${data.lowStockThreshold})`,
                            read: false
                        });

                        await notification.save();
                        console.log(`✅ Notification created from RabbitMQ: ${notification._id}`);

                        channel.ack(msg);

                    } catch (error) {
                        console.error('❌ Error processing RabbitMQ message:', error);
                        channel.nack(msg, false, true);
                    }
                }
            }, {
                noAck: false
            });

            // Handle connection errors
            connection.on('error', (err) => {
                console.error('❌ RabbitMQ connection error:', err);
            });

            connection.on('close', () => {
                console.warn('⚠️ RabbitMQ connection closed');
                connection = null;
                channel = null;
            });

            // Connection successful, exit retry loop
            return;

        } catch (error) {
            retries++;
            console.error(`❌ RabbitMQ Consumer error (attempt ${retries}/${maxRetries}):`, error.message);

            if (retries >= maxRetries) {
                console.warn('⚠️ RabbitMQ Consumer failed to start after maximum retries');
                console.warn('💡 Notifications will only work via gRPC');
                throw error;
            }

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, retries - 1);
            console.log(`⏳ Retrying RabbitMQ connection in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Stop RabbitMQ Consumer
 */
export async function stopRabbitMQConsumer() {
    try {
        if (channel) {
            await channel.close();
        }
        if (connection) {
            await connection.close();
        }
        console.log('🛑 RabbitMQ Consumer disconnected');
    } catch (error) {
        console.error('❌ Error stopping RabbitMQ consumer:', error);
    }
}

export default { startRabbitMQConsumer, stopRabbitMQConsumer };
