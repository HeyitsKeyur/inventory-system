require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const routes = require('./routes');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// GraphQL Proxy - Must be before body parsing
app.use('/graphql', createProxyMiddleware({
    target: process.env.INVENTORY_SERVICE_URL ? `${process.env.INVENTORY_SERVICE_URL}/graphql` : 'http://localhost:4002/graphql',
    changeOrigin: true,
    ws: true, // For subscriptions later
    logLevel: 'debug'
}));

// Notification GraphQL Proxy
app.use('/notifications/graphql', createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL ? `${process.env.NOTIFICATION_SERVICE_URL}/graphql` : 'http://localhost:4003/graphql',
    changeOrigin: true,
    ws: true,
    logLevel: 'debug'
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Rate limiting
app.use('/api', generalLimiter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Mini-Inventory API Gateway',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/profile',
                logout: 'POST /api/auth/logout'
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📍 Gateway URL: http://localhost:${PORT}`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server...');
    process.exit(0);
});
