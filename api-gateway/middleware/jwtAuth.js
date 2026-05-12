const axios = require('axios');

const AUTH_SERVICE_URL = `http://localhost:${process.env.AUTH_SERVICE_PORT || 4001}`;

/**
 * Middleware to verify JWT token via Auth Service
 */
exports.authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Verify token with Auth Service
        const response = await axios.post(
            `${AUTH_SERVICE_URL}/api/auth/verify-token`,
            {},
            {
                headers: { Authorization: token }
            }
        );

        if (response.data.success) {
            // Attach user info to request
            req.user = response.data.data;
            next();
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                success: false,
                message: 'Error verifying token'
            });
        }
    }
};

/**
 * Middleware to check user role
 */
exports.authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource'
            });
        }

        next();
    };
};
