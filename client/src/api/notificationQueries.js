import { gql } from '@apollo/client';

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($supplierId: String, $unreadOnly: Boolean, $limit: Int) {
    notifications(supplierId: $supplierId, unreadOnly: $unreadOnly, limit: $limit) {
      id
      type
      productId
      productName
      sku
      currentStock
      lowStockThreshold
      supplierId
      supplierName
      triggeredBy
      message
      read
      createdAt
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadCount($supplierId: String!) {
    unreadCount(supplierId: $supplierId)
  }
`;

export const MARK_AS_READ = gql`
  mutation MarkAsRead($notificationId: ID!) {
    markAsRead(notificationId: $notificationId) {
      id
      read
    }
  }
`;

export const MARK_ALL_AS_READ = gql`
  mutation MarkAllAsRead($supplierId: String!) {
    markAllAsRead(supplierId: $supplierId)
  }
`;
