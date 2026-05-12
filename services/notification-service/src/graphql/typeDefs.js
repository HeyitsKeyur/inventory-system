import gql from 'graphql-tag';

const typeDefs = gql`
  type Notification {
    id: ID!
    type: String!
    productId: String
    productName: String
    sku: String
    currentStock: Int
    lowStockThreshold: Int
    supplierId: String
    supplierName: String
    triggeredBy: String
    message: String!
    read: Boolean!
    createdAt: String!
  }

  type Query {
    notifications(supplierId: String, userId: String, unreadOnly: Boolean, limit: Int): [Notification!]!
    unreadCount(supplierId: String, userId: String): Int!
  }

  type Mutation {
    markAsRead(notificationId: ID!): Notification
    markAllAsRead(supplierId: String, userId: String): Boolean!
  }
`;

export default typeDefs;
