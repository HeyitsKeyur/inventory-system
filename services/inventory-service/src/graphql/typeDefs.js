const { gql } = require('graphql-tag');

const typeDefs = gql`
  type Product {
    id: ID!
    sku: String!
    name: String!
    description: String
    category: String!
    price: Float!
    stock: Int!
    lowStockThreshold: Int!
    supplierId: ID!
    supplierName: String
    images: [String]
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  input ProductInput {
    sku: String!
    name: String!
    description: String
    category: String!
    price: Float!
    stock: Int!
    lowStockThreshold: Int
    images: [String]
    supplierId: ID
    supplierName: String
  }

  input ProductUpdateInput {
    name: String
    description: String
    category: String
    price: Float
    stock: Int
    lowStockThreshold: Int
    images: [String]
    isActive: Boolean
  }

  type FulfilledOrder {
      id: ID!
      productId: ID!
      productName: String!
      sku: String
      supplierId: ID!
      supplierName: String
      quantity: Int!
      fulfilledAt: String!
  }

  type Query {
    products(page: Int, limit: Int, category: String, search: String, supplierId: ID): [Product]
    product(id: ID!): Product
    recentlyVisited: [Product]
    lowStockProducts: [Product]
    fulfilledOrders(limit: Int): [FulfilledOrder]
    getCart: Cart
    stats: InventoryStats
    orders: [Order]
  }

  type Mutation {
    createProduct(input: ProductInput!): Product
    updateProduct(id: ID!, input: ProductUpdateInput!): Product
    deleteProduct(id: ID!): Boolean
    trackVisit(productId: ID!): Boolean
    notifyLowStock(productId: ID!): NotificationResponse
    fulfillOrder(productId: ID!, quantity: Int!): FulfillResponse
    addToCart(productId: ID!, quantity: Int!): Cart
    removeFromCart(productId: ID!): Cart
    clearCart: Boolean
    placeOrder: Order
  }

  type Cart {
    id: ID!
    userId: String!
    items: [CartItem]
    totalItems: Int
    totalPrice: Float
  }

  type CartItem {
    product: Product
    quantity: Int!
  }

  type FulfillResponse {
    success: Boolean!
    message: String!
    newStock: Int
  }

  type NotificationResponse {
    success: Boolean!
    message: String!
    notificationId: String
  }

  type InventoryStats {
    totalProducts: Int!
    lowStockCount: Int!
    totalValue: Float!
    pendingOrders: Int!
  }

  type Order {
    id: ID!
    orderNumber: String!
    customerId: ID!
    items: [OrderItem]!
    totalAmount: Float!
    status: String!
    createdAt: String!
  }

  type OrderItem {
    productId: ID!
    name: String!
    sku: String!
    quantity: Int!
    price: Float!
  }
`;

module.exports = typeDefs;
