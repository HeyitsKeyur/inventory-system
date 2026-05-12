const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['ADMIN', 'INVENTORY_MANAGER', 'CUSTOMER', 'SUPPLIER'],
        default: 'CUSTOMER',
        required: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes are defined in the schema options (unique: true) or will be created automatically
// We don't need manual index definitions here that conflict with schema options

// Method to check if user has permission
userSchema.methods.hasPermission = function (permission) {
    const rolePermissions = {
        ADMIN: ['*'], // All permissions
        INVENTORY_MANAGER: [
            'inventory:read', 'inventory:write', 'inventory:delete',
            'orders:read', 'users:read', 'notifications:read'
        ],
        CUSTOMER: [
            'inventory:read', 'orders:read', 'orders:write', 'notifications:read'
        ],
        SUPPLIER: [
            'inventory:read', 'orders:read', 'notifications:read'
        ]
    };

    const permissions = rolePermissions[this.role] || [];
    return permissions.includes('*') || permissions.includes(permission);
};

// Method to get user permissions
userSchema.methods.getPermissions = function () {
    const rolePermissions = {
        ADMIN: ['*'],
        INVENTORY_MANAGER: [
            'inventory:read', 'inventory:write', 'inventory:delete',
            'orders:read', 'users:read', 'notifications:read'
        ],
        CUSTOMER: [
            'inventory:read', 'orders:read', 'orders:write', 'notifications:read'
        ],
        SUPPLIER: [
            'inventory:read', 'orders:read', 'notifications:read'
        ]
    };

    return rolePermissions[this.role] || [];
};

// Don't return password in JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);
