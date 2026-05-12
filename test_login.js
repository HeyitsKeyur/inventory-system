const axios = require('axios');

const login = async () => {
    try {
        console.log('Attempting login...');
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@inventory.com',
            password: 'password123'
        });
        console.log('Login successful!');
        console.log('Token:', response.data.data.token ? 'Received' : 'Missing');
    } catch (error) {
        console.error('Login failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

login();
