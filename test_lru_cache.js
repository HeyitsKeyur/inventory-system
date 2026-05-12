// Test script to verify per-user LRU cache
// Run this after logging in as different customers

const GATEWAY_URL = 'http://localhost:3000';

// Test data
const customers = [
    {
        email: 'customer@test.com',
        password: 'password123',
        name: 'John Customer'
    },
    {
        email: 'customer2@test.com',
        password: 'password123',
        name: 'Jane Doe'
    }
];

async function login(email, password) {
    const response = await fetch(`${GATEWAY_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    return data.data.token;
}

async function trackVisit(token, productId) {
    const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            query: `mutation { trackVisit(productId: "${productId}") }`
        })
    });
    return await response.json();
}

async function getRecentlyVisited(token) {
    const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            query: `query { recentlyVisited { id name } }`
        })
    });
    return await response.json();
}

async function testLRUCache() {
    console.log('🧪 Testing Per-User LRU Cache\n');

    // Login as Customer 1
    console.log('1️⃣ Logging in as Customer 1...');
    const token1 = await login(customers[0].email, customers[0].password);
    console.log('✅ Customer 1 logged in\n');

    // Login as Customer 2
    console.log('2️⃣ Logging in as Customer 2...');
    const token2 = await login(customers[1].email, customers[1].password);
    console.log('✅ Customer 2 logged in\n');

    // Customer 1 visits products
    console.log('3️⃣ Customer 1 visiting products...');
    await trackVisit(token1, '674...product1'); // Replace with actual product IDs
    await trackVisit(token1, '674...product2');
    console.log('✅ Customer 1 visited 2 products\n');

    // Customer 2 visits different products
    console.log('4️⃣ Customer 2 visiting different products...');
    await trackVisit(token2, '674...product3'); // Replace with actual product IDs
    await trackVisit(token2, '674...product4');
    console.log('✅ Customer 2 visited 2 products\n');

    // Check Customer 1's recently visited
    console.log('5️⃣ Checking Customer 1 recently visited...');
    const recent1 = await getRecentlyVisited(token1);
    console.log('Customer 1 recently visited:', recent1.data.recentlyVisited);

    // Check Customer 2's recently visited
    console.log('\n6️⃣ Checking Customer 2 recently visited...');
    const recent2 = await getRecentlyVisited(token2);
    console.log('Customer 2 recently visited:', recent2.data.recentlyVisited);

    // Verify they are different
    console.log('\n📊 RESULT:');
    if (JSON.stringify(recent1) === JSON.stringify(recent2)) {
        console.log('❌ FAILED: Both customers see the same products!');
    } else {
        console.log('✅ PASSED: Each customer has their own LRU cache!');
    }
}

// Run the test
testLRUCache().catch(console.error);
