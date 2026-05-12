const axios = require('axios');

const query = `
  query {
    products(limit: 5) {
      id
      name
      price
      stock
    }
  }
`;

const testInventory = async () => {
    try {
        console.log('Testing Inventory Service GraphQL via Gateway...');
        const response = await axios.post('http://localhost:3000/graphql', {
            query
        });

        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.errors) {
            console.error('❌ GraphQL Errors:', response.data.errors);
        } else {
            console.log('✅ GraphQL Query Successful');
        }
    } catch (error) {
        console.error('❌ Request Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
};

testInventory();
