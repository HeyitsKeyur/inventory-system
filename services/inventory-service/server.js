require('dotenv').config({ path: '../../.env' });
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { json } = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const typeDefs = require('./src/graphql/typeDefs');
const resolvers = require('./src/graphql/resolvers');
const jwt = require('jsonwebtoken');

const PORT = process.env.INVENTORY_SERVICE_PORT || 5005;

async function startServer() {
    const app = express();

    // Connect to MongoDB
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.MONGO_DB_NAME || 'inventory'
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }

    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await server.start();

    app.use(
        '/graphql',
        cors(),
        json(),
        expressMiddleware(server, {
            context: async ({ req }) => {
                const token = req.headers.authorization || '';
                try {
                    if (token) {
                        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
                        return { user: decoded };
                    }
                } catch (error) {
                    // Invalid token
                }
                return { user: null };
            },
        }),
    );

    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', service: 'Inventory Service' });
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Inventory Service ready at http://localhost:${PORT}/graphql`);
    });
}

startServer();
