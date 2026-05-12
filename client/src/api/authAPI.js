import apiClient from './apiClient';

export const authAPI = {
    register: async (userData) => {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    },

    login: async (credentials) => {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    },

    getProfile: async () => {
        const response = await apiClient.get('/auth/profile');
        return response.data;
    },

    logout: async () => {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    },

    getSuppliers: async () => {
        const response = await apiClient.get('/auth/users', {
            params: { role: 'SUPPLIER' }
        });
        return response.data;
    },

    getUsers: async (role) => {
        const params = role ? { role } : {};
        const response = await apiClient.get('/auth/users', { params });
        return response.data;
    },

    deleteUser: async (userId) => {
        const response = await apiClient.delete(`/auth/users/${userId}`);
        return response.data;
    }
};
