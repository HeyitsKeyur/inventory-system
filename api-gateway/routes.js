const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authLimiter } = require('./middleware/rateLimiter');

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || `http://localhost:${process.env.AUTH_SERVICE_PORT || 4001}`;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5002';

/**
 * Proxy helper function
 */
const proxyRequest = async (req, res, serviceUrl, path) => {
    try {
        const response = await axios({
            method: req.method,
            url: `${serviceUrl}${path}`,
            data: req.body,
            headers: {
                ...req.headers,
                host: undefined, // Remove host header
            },
            params: req.query
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                message: 'Service unavailable',
                error: error.message
            });
        }
    }
};

// Auth Service routes
router.post('/auth/register', authLimiter, (req, res) => {
    proxyRequest(req, res, AUTH_SERVICE_URL, '/api/auth/register');
});

router.post('/auth/login', authLimiter, (req, res) => {
    proxyRequest(req, res, AUTH_SERVICE_URL, '/api/auth/login');
});

router.get('/auth/profile', (req, res) => {
    proxyRequest(req, res, AUTH_SERVICE_URL, '/api/auth/profile');
});

router.post('/auth/logout', (req, res) => {
    proxyRequest(req, res, AUTH_SERVICE_URL, '/api/auth/logout');
});

router.get('/auth/users', (req, res) => {
    proxyRequest(req, res, AUTH_SERVICE_URL, '/api/auth/users');
});

// Notification Service GraphQL route
router.post('/notifications/graphql', (req, res) => {
    proxyRequest(req, res, NOTIFICATION_SERVICE_URL, '/graphql');
});

router.get('/notifications/graphql', (req, res) => {
    proxyRequest(req, res, NOTIFICATION_SERVICE_URL, '/graphql');
});

// Health check for all services
router.get('/health', async (req, res) => {
    const services = {
        auth: `${AUTH_SERVICE_URL}/health`,
    };

    const healthChecks = await Promise.allSettled(
        Object.entries(services).map(async ([name, url]) => {
            try {
                const response = await axios.get(url, { timeout: 3000 });
                return { name, status: 'healthy', data: response.data };
            } catch (error) {
                return { name, status: 'unhealthy', error: error.message };
            }
        })
    );

    const results = healthChecks.map(result => result.value);
    const allHealthy = results.every(r => r.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        gateway: 'healthy',
        services: results,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
