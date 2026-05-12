import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const notificationLink = createHttpLink({
    uri: `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000'}/notifications/graphql`,
});

export const notificationClient = new ApolloClient({
    link: notificationLink,
    cache: new InMemoryCache(),
});
