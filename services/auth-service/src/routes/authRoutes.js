const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-token', authController.verifyToken);
// Internal service route
router.get('/internal/users', authController.getUsers);
// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);
router.get('/users', authenticate, authorize('ADMIN', 'INVENTORY_MANAGER'), authController.getUsers);
router.delete('/users/:id', authenticate, authorize('ADMIN'), authController.deleteUser);

module.exports = router;
