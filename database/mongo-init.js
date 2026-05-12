/**
 * MongoDB Replica Set Initialization Script
 * This script initializes the replica set and creates indexes
 */

const { MongoClient } = require('mongodb');

// For local MongoDB (single instance)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'inventory';

// Note: Replica set features (like transactions) won't work with single instance
// Use Docker Compose for full replica set setup

async function initializeDatabase() {
    const client = new MongoClient(MONGO_URI);

    try {
        console.log('🔌 Connecting to MongoDB replica set...');
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(DB_NAME);

        // Create collections with validation
        console.log('\n📦 Creating collections...');

        // Users collection
        await db.createCollection('users', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['email', 'password', 'role', 'name'],
                    properties: {
                        email: {
                            bsonType: 'string',
                            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                            description: 'must be a valid email'
                        },
                        password: {
                            bsonType: 'string',
                            description: 'must be a hashed password string'
                        },
                        role: {
                            enum: ['ADMIN', 'INVENTORY_MANAGER', 'CUSTOMER', 'SUPPLIER'],
                            description: 'must be one of the allowed roles'
                        },
                        name: {
                            bsonType: 'string',
                            description: 'must be a string'
                        },
                        supplierId: {
                            bsonType: ['objectId', 'null'],
                            description: 'optional supplier reference'
                        }
                    }
                }
            }
        });
        console.log('  ✓ Users collection created');

        // Products collection
        await db.createCollection('products', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['sku', 'name', 'category', 'price', 'stock', 'lowStockThreshold'],
                    properties: {
                        sku: {
                            bsonType: 'string',
                            description: 'must be a unique string'
                        },
                        name: {
                            bsonType: 'string',
                            description: 'must be a string'
                        },
                        description: {
                            bsonType: 'string',
                            description: 'optional description'
                        },
                        category: {
                            bsonType: 'string',
                            description: 'must be a string'
                        },
                        price: {
                            bsonType: 'number',
                            minimum: 0,
                            description: 'must be a positive number'
                        },
                        stock: {
                            bsonType: 'int',
                            minimum: 0,
                            description: 'must be a non-negative integer'
                        },
                        lowStockThreshold: {
                            bsonType: 'int',
                            minimum: 0,
                            description: 'must be a non-negative integer'
                        },
                        supplierId: {
                            bsonType: 'objectId',
                            description: 'must be a valid ObjectId'
                        },
                        images: {
                            bsonType: 'array',
                            items: {
                                bsonType: 'string'
                            },
                            description: 'array of image URLs'
                        }
                    }
                }
            }
        });
        console.log('  ✓ Products collection created');

        // Orders collection
        await db.createCollection('orders', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['orderNumber', 'customerId', 'items', 'totalAmount', 'status'],
                    properties: {
                        orderNumber: {
                            bsonType: 'string',
                            description: 'must be a unique string'
                        },
                        customerId: {
                            bsonType: 'objectId',
                            description: 'must be a valid ObjectId'
                        },
                        items: {
                            bsonType: 'array',
                            minItems: 1,
                            items: {
                                bsonType: 'object',
                                required: ['productId', 'sku', 'name', 'quantity', 'price'],
                                properties: {
                                    productId: { bsonType: 'objectId' },
                                    sku: { bsonType: 'string' },
                                    name: { bsonType: 'string' },
                                    quantity: { bsonType: 'int', minimum: 1 },
                                    price: { bsonType: 'number', minimum: 0 }
                                }
                            }
                        },
                        totalAmount: {
                            bsonType: 'number',
                            minimum: 0,
                            description: 'must be a positive number'
                        },
                        status: {
                            enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
                            description: 'must be one of the allowed statuses'
                        },
                        deliveryAddress: {
                            bsonType: 'object',
                            required: ['street', 'city', 'zipCode'],
                            properties: {
                                street: { bsonType: 'string' },
                                city: { bsonType: 'string' },
                                state: { bsonType: 'string' },
                                zipCode: { bsonType: 'string' },
                                country: { bsonType: 'string' }
                            }
                        }
                    }
                }
            }
        });
        console.log('  ✓ Orders collection created');

        // Notifications collection
        await db.createCollection('notifications');
        console.log('  ✓ Notifications collection created');

        // Create indexes
        console.log('\n📊 Creating indexes...');

        // Users indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ role: 1 });
        console.log('  ✓ Users indexes created');

        // Products indexes
        await db.collection('products').createIndex({ sku: 1 }, { unique: true });
        await db.collection('products').createIndex({ category: 1, stock: 1 });
        await db.collection('products').createIndex({ supplierId: 1, updatedAt: -1 });
        await db.collection('products').createIndex({ name: 'text', description: 'text' });
        await db.collection('products').createIndex({ stock: 1 }); // For low stock queries
        console.log('  ✓ Products indexes created');

        // Orders indexes
        await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
        await db.collection('orders').createIndex({ customerId: 1, createdAt: -1 });
        await db.collection('orders').createIndex({ status: 1, createdAt: -1 });
        await db.collection('orders').createIndex({ 'items.sku': 1 });
        console.log('  ✓ Orders indexes created');

        // Notifications indexes (with TTL)
        await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 });
        await db.collection('notifications').createIndex(
            { createdAt: 1 },
            { expireAfterSeconds: 2592000 } // 30 days TTL
        );
        console.log('  ✓ Notifications indexes created');

        console.log('\n✅ Database initialization completed successfully!');
        console.log(`📊 Database: ${DB_NAME}`);
        console.log('📦 Collections: users, products, orders, notifications');
        console.log('🔍 Indexes created for optimal performance');

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        await client.close();
    }
}

// Run initialization
if (require.main === module) {
    initializeDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };
