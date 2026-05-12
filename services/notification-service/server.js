import 'dotenv/config';
import mongoose from 'mongoose';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { startGrpcServer } from './src/grpc/grpcServer.js';
import { startRabbitMQConsumer, stopRabbitMQConsumer } from './src/rabbitmq/consumer.js';
import typeDefs from './src/graphql/typeDefs.js';
import resolvers from './src/graphql/resolvers.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory';
const GRPC_PORT = process.env.GRPC_PORT || 50051;
const HTTP_PORT = process.env.PORT || 5002;

async function startServer() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI, {
            dbName: 'inventory'
        });
        console.log('✅ MongoDB connected successfully');

        // Create Express app
        const app = express();

        // Create Apollo Server
        const apolloServer = new ApolloServer({
            typeDefs,
            resolvers,
        });

        await apolloServer.start();
        console.log('✅ GraphQL Server initialized');

        // Apply GraphQL middleware
        app.use(
            '/graphql',
            cors(),
            express.json(),
            expressMiddleware(apolloServer)
        );

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({ status: 'healthy', service: 'Notification Service' });
        });

        // Start HTTP server for GraphQL
        app.listen(HTTP_PORT, '0.0.0.0', () => {
            console.log(`🚀 GraphQL API: http://localhost:${HTTP_PORT}/graphql`);
        });

        // Start gRPC Server
        startGrpcServer(GRPC_PORT);

        // Start RabbitMQ Consumer (optional - graceful degradation)
        if (process.env.SKIP_RABBITMQ !== 'true') {
            try {
                await startRabbitMQConsumer();
            } catch (rabbitError) {
                console.warn('⚠️ RabbitMQ Consumer failed to start (continuing without RabbitMQ)');
                console.warn('💡 Notifications will only work via gRPC');
            }
        } else {
            console.log('⏭️ Skipping RabbitMQ Consumer (SKIP_RABBITMQ=true)');
        }

        console.log('🎉 Notification Service started successfully');
        console.log(`📡 gRPC Server: localhost:${GRPC_PORT}`);
        console.log(`📊 GraphQL API: http://localhost:${HTTP_PORT}/graphql`);

    } catch (error) {
        console.error('❌ Failed to start Notification Service:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    await stopRabbitMQConsumer();
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received. Shutting down gracefully...');
    await stopRabbitMQConsumer();
    await mongoose.connection.close();
    process.exit(0);
});

// Start the server
startServer();
