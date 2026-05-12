import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';

const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000';

const inventoryLink = new HttpLink({
    uri: `${gatewayUrl}/graphql`,
});

const notificationLink = new HttpLink({
    uri: `${gatewayUrl}/notifications/graphql`,
});

const authLink = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem('token');
    operation.setContext({
        headers: {
            authorization: token ? `Bearer ${token}` : '',
        }
    });
    return forward(operation);
});

const splitLink = new ApolloLink((operation, forward) => {
    const context = operation.getContext();
    if (context.service === 'notification') {
        return notificationLink.request(operation, forward);
    }
    return inventoryLink.request(operation, forward);
});

const client = new ApolloClient({
    link: authLink.concat(splitLink),
    cache: new InMemoryCache(),
});

export default client;
