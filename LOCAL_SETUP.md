# 🚀 Local Setup Guide (Without Docker)

This guide will help you set up the Mini-Inventory system on your local machine without Docker.

## 📋 Prerequisites

You need to install the following software on your Windows machine:

### 1. Node.js (Required)
- **Download**: https://nodejs.org/
- **Version**: 20.x or higher
- **Verify**: `node --version` and `npm --version`

### 2. MongoDB (Required)
- **Download**: https://www.mongodb.com/try/download/community
- **Version**: 7.x
- **Installation**:
  1. Download MongoDB Community Server
  2. Run the installer (choose "Complete" installation)
  3. Install as a Windows Service (recommended)
  4. Install MongoDB Compass (GUI tool - optional but helpful)
- **Verify**: `mongosh --version`

### 3. Redis (Required for Phase 3+)
- **Download**: https://github.com/microsoftarchive/redis/releases
- **Version**: Latest (3.x for Windows)
- **Installation**:
  1. Download `Redis-x64-3.x.xxx.msi`
  2. Run installer
  3. Keep default port (6379)
  4. Install as Windows Service
- **Alternative**: Use Memurai (Redis-compatible for Windows)
  - Download: https://www.memurai.com/get-memurai
- **Verify**: `redis-cli ping` (should return PONG)

### 4. Apache Kafka (Required for Phase 5+)
- **Download**: https://kafka.apache.org/downloads
- **Alternative**: Use Confluent Platform
  - Download: https://www.confluent.io/download/
- **Note**: Kafka setup is complex on Windows. Consider using Docker just for Kafka later.

---

## 🔧 Phase 1 Setup (Current)

### Step 1: Install Dependencies

```powershell
# Navigate to project directory
cd c:\Users\vyask\Desktop\Invetory

# Install root dependencies
npm install

# Install database script dependencies
cd database
npm install
cd ..
```

### Step 2: Configure Environment

```powershell
# Copy example environment file
copy .env.example .env

# Edit .env if needed (default values should work)
notepad .env
```

### Step 3: Start MongoDB

MongoDB should be running as a Windows Service. If not:

```powershell
# Start MongoDB service
net start MongoDB

# Or run manually
mongod --dbpath C:\data\db
```

**Verify MongoDB is running:**
```powershell
mongosh
# You should see MongoDB shell
# Type: exit
```

### Step 4: Initialize Database

```powershell
# Create database and indexes
cd database
npm run init
```

**Expected output:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB
📦 Creating collections...
  ✓ Users collection created
  ✓ Products collection created
  ✓ Orders collection created
  ✓ Notifications collection created
📊 Creating indexes...
  ✓ Users indexes created
  ✓ Products indexes created
  ✓ Orders indexes created
  ✓ Notifications indexes created
✅ Database initialization completed successfully!
```

### Step 5: Seed Test Data

```powershell
# Still in database directory
npm run seed
```

**Expected output:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB
🗑️  Clearing existing data...
👥 Seeding users...
  ✓ Created 9 users (1 admin, 1 manager, 2 customers, 5 suppliers)
📦 Seeding products...
  ✓ Created 53 products across 6 categories
🛒 Seeding sample orders...
  ✓ Created 10 sample orders
✅ Database seeded successfully!
```

### Step 6: Verify Setup

```powershell
# Open MongoDB Compass (GUI) or use mongosh
mongosh

# In MongoDB shell:
use inventory
db.users.countDocuments()      # Should return 9
db.products.countDocuments()   # Should return 53
db.orders.countDocuments()     # Should return 10

# View sample data
db.users.find({}, {email: 1, role: 1, name: 1})

# Exit
exit
```

---

## 🧪 Testing Phase 1

### Test 1: Check Collections

```powershell
mongosh inventory --eval "db.getCollectionNames()"
```

**Expected**: `[ 'notifications', 'orders', 'products', 'users' ]`

### Test 2: Verify Indexes

```powershell
mongosh inventory --eval "db.products.getIndexes()"
```

**Expected**: Multiple indexes including `sku`, `category_1_stock_1`, etc.

### Test 3: Query Test Data

```powershell
# Get all users
mongosh inventory --eval "db.users.find({}, {email: 1, role: 1, _id: 0}).toArray()"

# Get low stock products
mongosh inventory --eval "db.products.find({ stock: { \$lt: 10 } }, {sku: 1, name: 1, stock: 1, _id: 0}).toArray()"

# Get products by category
mongosh inventory --eval "db.products.aggregate([{ \$group: { _id: '\$category', count: { \$sum: 1 } } }]).toArray()"
```

---

## 📊 Test Credentials

All users have password: `password123`

| Role | Email | Purpose |
|------|-------|---------|
| Admin | admin@inventory.com | Full system access |
| Inventory Manager | manager@inventory.com | Stock management |
| Customer | customer@test.com | Place orders |
| Customer | customer2@test.com | Place orders |
| Supplier 1 | supplier1@supply.com | Supply products |
| Supplier 2 | supplier2@supply.com | Supply products |
| Supplier 3 | supplier3@supply.com | Supply products |
| Supplier 4 | supplier4@supply.com | Supply products |
| Supplier 5 | supplier5@supply.com | Supply products |

---

## 🐛 Troubleshooting

### MongoDB Connection Error

**Error**: `MongoServerError: connect ECONNREFUSED`

**Solution**:
```powershell
# Check if MongoDB service is running
sc query MongoDB

# Start MongoDB service
net start MongoDB

# Or check if mongod process is running
tasklist | findstr mongod
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
```powershell
# Find process using port 27017
netstat -ano | findstr :27017

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database Not Found

**Error**: `Database 'inventory' not found`

**Solution**:
```powershell
# Re-run initialization
cd database
npm run init
npm run seed
```

---

## 📝 Next Steps

### ✅ Phase 1 Complete
- MongoDB installed and running
- Database initialized with schemas and indexes
- Test data seeded

### 🔜 Phase 2: Auth Service & API Gateway
Once Phase 1 is verified, we'll build:
- Authentication service with JWT
- API Gateway with rate limiting
- Role-based access control

**No additional software needed for Phase 2!** (Just Node.js and MongoDB)

### 🔜 Phase 3: Inventory Service
Requirements:
- ✅ MongoDB (already installed)
- ✅ Redis (install before Phase 3)

### 🔜 Phase 5: Notification Service
Requirements:
- ✅ MongoDB (already installed)
- ✅ Redis (already installed)
- ⏳ Kafka (can use Docker just for Kafka)

---

## 💡 Tips

### Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Browse `inventory` database
4. View collections, run queries visually

### Quick Commands

```powershell
# Check MongoDB status
sc query MongoDB

# Start MongoDB
net start MongoDB

# Stop MongoDB
net stop MongoDB

# Open MongoDB shell
mongosh

# View all databases
mongosh --eval "show dbs"

# Count documents
mongosh inventory --eval "db.products.countDocuments()"
```

---

## 🎯 Current Status

✅ **Phase 1: Foundation & Database Setup**
- Project structure created
- MongoDB configured
- Database schemas defined
- Indexes created
- Test data seeded

📝 **Ready for Phase 2**: Auth Service & API Gateway

---

**Need help?** Check the main [README.md](./README.md) for architecture details.
