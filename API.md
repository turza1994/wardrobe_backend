# ShareWardrobe API Documentation

This document provides comprehensive details on the ShareWardrobe backend API endpoints, including HTTP methods, paths, authentication requirements, request parameters, response formats, and examples. The API is built using Express.js and follows RESTful conventions.

## Base URL

All endpoints are relative to the base URL: `http://localhost:3000/api` (adjust for production).

## Authentication

Most endpoints require authentication. Include the JWT token in the `Authorization` header as `Bearer <token>`. Some endpoints require admin role or specific permissions.

## Error Handling

All responses follow a standard format:

```json
{
  "success": false,
  "error": "Error message",
  "requestId": "unique-request-id"
}
```

Successful responses:

```json
{
  "success": true,
  "data": {...},
  "requestId": "unique-request-id"
}
```

## Modules

### 1. Authentication (Auth)

#### Register

- **Method**: POST
- **Path**: `/auth/register`
- **Auth**: None
- **Description**: Register a new user account.
- **Request Body**:
  ```json
  {
    "phone": "string (regex: /^01d{9}$/)",
    "password": "string (min 6 chars)",
    "name": "string (optional)",
    "email": "string (optional)",
    "address": "string (optional)"
  }
  ```
- **Response** (201):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "number",
        "name": "string",
        "phone": "string",
        "role": "string"
      },
      "tempToken": "string",
      "requiresPhoneVerification": true
    },
    "requestId": "string"
  }
  ```
- **Example**:
  ```bash
  curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"01712345678","password":"password123","name":"John Doe"}'
  ```

#### Login

- **Method**: POST
- **Path**: `/auth/login`
- **Auth**: None
- **Description**: Authenticate user and get JWT token.
- **Request Body**:
  ```json
  {
    "phone": "string (regex: /^01d{9}$/)",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "number",
        "name": "string",
        "phone": "string",
        "email": "string",
        "role": "string",
        "phoneVerified": "boolean",
        "balance": "string"
      },
      "token": "string"
    },
    "requestId": "string"
  }
  ```

#### Get Profile

- **Method**: GET
- **Path**: `/auth/profile`
- **Auth**: Required
- **Description**: Retrieve current user's profile.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "name": "string",
      "email": "string",
      "role": "string",
      "status": "string",
      "address": "string",
      "phone": "string",
      "balance": "string",
      "verificationStatus": "string",
      "createdAt": "string"
    },
    "requestId": "string"
  }
  ```

#### Update Profile

- **Method**: PUT
- **Path**: `/auth/profile`
- **Auth**: Required
- **Description**: Update user profile.
- **Request Body**:
  ```json
  {
    "name": "string (optional)",
    "email": "string (optional)",
    "address": "string (optional)",
    "phone": "string (optional, regex: /^01d{9}$/)"
  }
  ```
- **Response**: Same as Get Profile.

### 2. Users

#### List Users

- **Method**: GET
- **Path**: `/users`
- **Auth**: Required (Admin only)
- **Description**: List all users with pagination.
- **Query Params**: `page` (default 1), `limit` (default 20)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "name": "string",
        "email": "string",
        "role": "string",
        "status": "string",
        "balance": "string",
        "verificationStatus": "string",
        "createdAt": "string"
      }
    ],
    "pagination": { "page": "number", "limit": "number" },
    "requestId": "string"
  }
  ```

#### Get User by ID

- **Method**: GET
- **Path**: `/users/:id`
- **Auth**: Required (Own profile or Admin)
- **Description**: Get user details by ID.
- **Response**: Same as list item.

#### Upload NID

- **Method**: POST
- **Path**: `/users/nid`
- **Auth**: Required
- **Description**: Upload NID documents for verification.
- **Request Body**:
  ```json
  {
    "nidFrontUrl": "string (URL)",
    "nidBackUrl": "string (URL)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "verificationStatus": "string",
      "nidFrontUrl": "string",
      "nidBackUrl": "string"
    },
    "message": "NID uploaded successfully. Verification pending.",
    "requestId": "string"
  }
  ```

#### Update User Status

- **Method**: PUT
- **Path**: `/users/:id/status`
- **Auth**: Required (Admin only)
- **Description**: Update user status.
- **Request Body**:
  ```json
  {
    "status": "enum (active, inactive, suspended)"
  }
  ```
- **Response**: Updated user object.

#### Update User Role

- **Method**: PUT
- **Path**: `/users/:id/role`
- **Auth**: Required (Admin only)
- **Description**: Update user role.
- **Request Body**:
  ```json
  {
    "role": "enum (user, seller, user_seller, admin)"
  }
  ```
- **Response**: Updated user object.

#### Verify User

- **Method**: PUT
- **Path**: `/users/:id/verify`
- **Auth**: Required (Admin only)
- **Description**: Verify user after NID upload.
- **Request Body**:
  ```json
  {
    "verificationStatus": "enum (approved, rejected)"
  }
  ```
- **Response**: Updated user object.

### 3. Items

#### List Items

- **Method**: GET
- **Path**: `/items`
- **Auth**: None
- **Description**: List items with filters and pagination.
- **Query Params**: `categoryId`, `type`, `color`, `size`, `minPrice`, `maxPrice`, `wearingTime`, `availability`, `status`, `page`, `limit`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "sellerId": "number",
        "categoryId": "number",
        "type": "string",
        "color": "string",
        "size": "string",
        "wearingTime": "string",
        "purchasePrice": "string",
        "description": "string",
        "sellPrice": "string",
        "rentPrice": "string",
        "availability": "string",
        "quantity": "number",
        "images": ["string"],
        "video": "string",
        "status": "string",
        "createdAt": "string",
        "seller": { "id": "number", "name": "string" },
        "category": { "id": "number", "name": "string" }
      }
    ],
    "pagination": { "page": "number", "limit": "number" },
    "requestId": "string"
  }
  ```

#### Get Item by ID

- **Method**: GET
- **Path**: `/items/:id`
- **Auth**: None
- **Description**: Get item details.
- **Response**: Same as list item.

#### Create Item

- **Method**: POST
- **Path**: `/items`
- **Auth**: Required
- **Description**: Create a new item.
- **Request Body**:
  ```json
  {
    "categoryId": "number",
    "type": "string",
    "color": "string (optional)",
    "size": "string (optional)",
    "wearingTime": "string (optional)",
    "purchasePrice": "number",
    "description": "string (min 10 chars)",
    "sellPrice": "number (optional)",
    "rentPrice": "number (optional)",
    "availability": "enum (sell_only, rent_only, both)",
    "quantity": "number (default 1)",
    "images": ["string (1-5)"],
    "video": "string (optional)"
  }
  ```
- **Response** (201): Created item object.

#### Update Item

- **Method**: PUT
- **Path**: `/items/:id`
- **Auth**: Required (Owner or Admin)
- **Description**: Update item details.
- **Request Body**: Same as create, all optional.
- **Response**: Updated item object.

#### Delete Item

- **Method**: DELETE
- **Path**: `/items/:id`
- **Auth**: Required (Owner or Admin)
- **Description**: Soft delete item.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Item deleted successfully",
    "requestId": "string"
  }
  ```

#### Update Item Status

- **Method**: PUT
- **Path**: `/items/:id/status`
- **Auth**: Required (Admin only)
- **Description**: Update item status.
- **Request Body**:
  ```json
  {
    "status": "string"
  }
  ```
- **Response**: Updated item object.

### 4. Categories

#### List Categories

- **Method**: GET
- **Path**: `/categories`
- **Auth**: None
- **Description**: List categories with search and pagination.
- **Query Params**: `search`, `page`, `limit`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "name": "string",
        "slug": "string",
        "description": "string"
      }
    ],
    "pagination": { "page": "number", "limit": "number", "total": "number" },
    "requestId": "string"
  }
  ```

#### Get Category by ID

- **Method**: GET
- **Path**: `/categories/:id`
- **Auth**: None
- **Description**: Get category details.
- **Response**: Category object.

#### Create Category

- **Method**: POST
- **Path**: `/categories`
- **Auth**: Required (Admin only)
- **Description**: Create a new category.
- **Request Body**:
  ```json
  {
    "name": "string (min 2 chars)",
    "slug": "string (optional)",
    "description": "string (optional)"
  }
  ```
- **Response** (201): Created category object.

#### Update Category

- **Method**: PUT
- **Path**: `/categories/:id`
- **Auth**: Required (Admin only)
- **Description**: Update category.
- **Request Body**: Same as create, optional.
- **Response**: Updated category object.

#### Delete Category

- **Method**: DELETE
- **Path**: `/categories/:id`
- **Auth**: Required (Admin only)
- **Description**: Soft delete category.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Category deleted successfully",
    "requestId": "string"
  }
  ```

### 5. Rentals

#### List Rentals

- **Method**: GET
- **Path**: `/rentals`
- **Auth**: Required (NID required)
- **Description**: List user's rentals.
- **Query Params**: `page`, `limit`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "orderItemId": "number",
        "rentalStart": "string",
        "rentalEnd": "string",
        "returnStatus": "string",
        "lateFee": "string",
        "createdAt": "string"
      }
    ],
    "pagination": { "page": "number", "limit": "number" },
    "requestId": "string"
  }
  ```

#### Get Rental by ID

- **Method**: GET
- **Path**: `/rentals/:id`
- **Auth**: Required (NID required, Own rental or Admin)
- **Description**: Get rental details.
- **Response**: Rental object with orderItem.

#### Initiate Return

- **Method**: POST
- **Path**: `/rentals/:id/return`
- **Auth**: Required (NID required)
- **Description**: Initiate rental return.
- **Response**: Updated rental object.

#### Inspect Return

- **Method**: POST
- **Path**: `/rentals/:id/inspect`
- **Auth**: Required (Admin only, NID required)
- **Description**: Inspect returned item.
- **Request Body**:
  ```json
  {
    "inspectionResult": "string",
    "refundAmount": "number",
    "lateFee": "number (default 0)"
  }
  ```
- **Response**: Updated rental object.

### 6. Admin

#### Get All Configs

- **Method**: GET
- **Path**: `/admin/configs`
- **Auth**: Required (Admin only)
- **Description**: Get all admin configurations.
- **Response**: Array of config objects.

#### Get Config

- **Method**: GET
- **Path**: `/admin/configs/:key`
- **Auth**: Required (Admin only)
- **Description**: Get specific config.
- **Response**: Config object.

#### Update Config

- **Method**: PUT
- **Path**: `/admin/configs/:key`
- **Auth**: Required (Admin only)
- **Description**: Update or create config.
- **Request Body**:
  ```json
  {
    "value": "string",
    "description": "string (optional)"
  }
  ```
- **Response**: Updated or created config object.

#### Get Revenue Report

- **Method**: GET
- **Path**: `/admin/reports/revenue`
- **Auth**: Required (Admin only)
- **Description**: Get revenue report.
- **Query Params**: `startDate`, `endDate`, `type`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "revenues": [...],
      "totalRevenue": "number",
      "period": {"startDate": "string", "endDate": "string"}
    },
    "requestId": "string"
  }
  ```

#### Get Transaction Ledger

- **Method**: GET
- **Path**: `/admin/reports/ledger`
- **Auth**: Required (Admin only)
- **Description**: Get transaction ledger.
- **Query Params**: `type`, `status`, `startDate`, `endDate`, `page`, `limit`
- **Response**: Paginated transactions.

#### Get Inventory Turnover

- **Method**: GET
- **Path**: `/admin/reports/inventory`
- **Auth**: Required (Admin only)
- **Description**: Get warehouse inventory report.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "inventory": [...],
      "summary": {"totalItems": "number", "statusCounts": {...}}
    },
    "requestId": "string"
  }
  ```

### 7. Cart

#### Get Cart

- **Method**: GET
- **Path**: `/cart`
- **Auth**: Required
- **Description**: Get user's cart items.
- **Response**: Array of cart items with item details.

#### Add to Cart

- **Method**: POST
- **Path**: `/cart`
- **Auth**: Required
- **Description**: Add item to cart.
- **Request Body**:
  ```json
  {
    "itemId": "number",
    "quantity": "number (default 1)",
    "type": "enum (buy, rent)"
  }
  ```
- **Response** (201): Cart item object.

#### Update Cart Item

- **Method**: PUT
- **Path**: `/cart/:id`
- **Auth**: Required
- **Description**: Update cart item quantity.
- **Request Body**:
  ```json
  {
    "quantity": "number"
  }
  ```
- **Response**: Updated cart item.

#### Remove from Cart

- **Method**: DELETE
- **Path**: `/cart/:id`
- **Auth**: Required
- **Description**: Remove item from cart.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Item removed from cart",
    "requestId": "string"
  }
  ```

#### Clear Cart

- **Method**: DELETE
- **Path**: `/cart`
- **Auth**: Required
- **Description**: Clear entire cart.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Cart cleared successfully",
    "requestId": "string"
  }
  ```

### 8. Orders

#### List Orders

- **Method**: GET
- **Path**: `/orders`
- **Auth**: Required
- **Description**: List user's orders.
- **Query Params**: `page`, `limit`
- **Response**: Paginated orders.

#### Get Order by ID

- **Method**: GET
- **Path**: `/orders/:id`
- **Auth**: Required
- **Description**: Get order details with items.
- **Response**: Order object with items array.

#### Create Order

- **Method**: POST
- **Path**: `/orders`
- **Auth**: Required
- **Description**: Create order from cart.
- **Request Body**:
  ```json
  {
    "paymentMethod": "enum (cod, online)",
    "deliveryAddress": "string (min 10 chars)"
  }
  ```
- **Response** (201): Created order object.

#### Update Order Status

- **Method**: PUT
- **Path**: `/orders/:id/status`
- **Auth**: Required (Admin only)
- **Description**: Update order status.
- **Request Body**:
  ```json
  {
    "status": "enum (pending, paid, shipped, delivered, returned, partially_returned, cancelled, refunded)"
  }
  ```
- **Response**: Updated order object.

### 9. OTP

#### Send OTP

- **Method**: POST
- **Path**: `/otp/send-otp`
- **Auth**: None
- **Description**: Send OTP for verification.
- **Request Body**:
  ```json
  {
    "phone": "string (regex: /^01d{9}$/)",
    "purpose": "enum (registration, login, password_reset)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "OTP sent successfully",
    "expiresIn": 300
  }
  ```

#### Verify OTP

- **Method**: POST
- **Path**: `/otp/verify-otp`
- **Auth**: None
- **Description**: Verify OTP and complete action.
- **Request Body**:
  ```json
  {
    "phone": "string (regex: /^01d{9}$/)",
    "otp": "string (6 digits)",
    "purpose": "enum (registration, login, password_reset)"
  }
  ```
- **Response**: Token and user object for registration/login.

#### Resend OTP

- **Method**: POST
- **Path**: `/otp/resend-otp`
- **Auth**: None
- **Description**: Resend OTP.
- **Request Body**: Same as send.
- **Response**: Same as send.

### 10. Transactions

#### List Transactions

- **Method**: GET
- **Path**: `/transactions`
- **Auth**: Required
- **Description**: List user's transactions.
- **Query Params**: `page`, `limit`
- **Response**: Paginated transactions.

#### Request Withdrawal

- **Method**: POST
- **Path**: `/transactions/withdraw`
- **Auth**: Required
- **Description**: Request balance withdrawal.
- **Request Body**:
  ```json
  {
    "amount": "number"
  }
  ```
- **Response** (201): Withdrawal request object.

#### Get Withdrawals

- **Method**: GET
- **Path**: `/transactions/withdrawals`
- **Auth**: Required
- **Description**: List user's withdrawal requests.
- **Query Params**: `page`, `limit`
- **Response**: Paginated withdrawals.

#### Get All Withdrawals (Admin)

- **Method**: GET
- **Path**: `/transactions/admin/withdrawals`
- **Auth**: Required (Admin only)
- **Description**: List all withdrawal requests.
- **Query Params**: `status`, `page`, `limit`
- **Response**: Paginated withdrawals with user details.

#### Process Withdrawal (Admin)

- **Method**: PUT
- **Path**: `/transactions/admin/withdrawals/:id`
- **Auth**: Required (Admin only)
- **Description**: Approve or reject withdrawal.
- **Request Body**:
  ```json
  {
    "action": "string (approve or reject)"
  }
  ```
- **Response**: Updated withdrawal object.

### 11. Deliveries

#### List Deliveries

- **Method**: GET
- **Path**: `/deliveries`
- **Auth**: Required
- **Description**: List deliveries (filtered for non-admin).
- **Query Params**: `orderId`, `page`, `limit`
- **Response**: Paginated deliveries.

#### Get Delivery by ID

- **Method**: GET
- **Path**: `/deliveries/:id`
- **Auth**: Required (Own or Admin)
- **Description**: Get delivery details.
- **Response**: Delivery object.

#### Create Delivery

- **Method**: POST
- **Path**: `/deliveries`
- **Auth**: Required
- **Description**: Create delivery for order.
- **Request Body**:
  ```json
  {
    "orderId": "number",
    "fromAddress": "string",
    "toAddress": "string",
    "isReturn": "boolean (default false)"
  }
  ```
- **Response** (201): Created delivery object.

#### Update Delivery Status

- **Method**: PUT
- **Path**: `/deliveries/:id/status`
- **Auth**: Required (Admin only)
- **Description**: Update delivery status.
- **Request Body**:
  ```json
  {
    "status": "enum (pending, picked_up, in_transit, delivered, failed)",
    "trackingId": "string (optional)"
  }
  ```
- **Response**: Updated delivery object.

### 12. Negotiations

#### List Negotiations

- **Method**: GET
- **Path**: `/negotiations`
- **Auth**: Required
- **Description**: List user's negotiations.
- **Query Params**: `page`, `limit`
- **Response**: Paginated negotiations with item details.

#### Get Negotiation by ID

- **Method**: GET
- **Path**: `/negotiations/:id`
- **Auth**: Required
- **Description**: Get negotiation details.
- **Response**: Negotiation object.

#### Create Negotiation

- **Method**: POST
- **Path**: `/negotiations`
- **Auth**: Required
- **Description**: Create price negotiation for item.
- **Request Body**:
  ```json
  {
    "itemId": "number",
    "offerPrice": "number",
    "expiresAt": "string (datetime, optional)"
  }
  ```
- **Response** (201): Created negotiation object.

#### Respond to Negotiation

- **Method**: PUT
- **Path**: `/negotiations/:id/respond`
- **Auth**: Required (Item owner)
- **Description**: Accept or reject negotiation.
- **Request Body**:
  ```json
  {
    "status": "enum (accepted, rejected)"
  }
  ```
- **Response**: Updated negotiation object.

### 13. Notifications

#### List Notifications

- **Method**: GET
- **Path**: `/notifications`
- **Auth**: Required
- **Description**: List user's notifications.
- **Query Params**: `page`, `limit`
- **Response**: Paginated notifications.

#### Mark as Read

- **Method**: PUT
- **Path**: `/notifications/:id/read`
- **Auth**: Required
- **Description**: Mark notification as read.
- **Response**: Updated notification object.

#### Mark All as Read

- **Method**: PUT
- **Path**: `/notifications/read-all`
- **Auth**: Required
- **Description**: Mark all notifications as read.
- **Response**:
  ```json
  {
    "success": true,
    "message": "All notifications marked as read",
    "requestId": "string"
  }
  ```

### 14. Warehouse

#### List Inventory

- **Method**: GET
- **Path**: `/warehouse`
- **Auth**: Required (Admin only)
- **Description**: List warehouse inventory.
- **Query Params**: `status`, `page`, `limit`
- **Response**: Paginated inventory with item details.

#### Get Inventory Item

- **Method**: GET
- **Path**: `/warehouse/:id`
- **Auth**: Required (Admin only)
- **Description**: Get inventory item details.
- **Response**: Inventory object with item details.

#### Add to Warehouse

- **Method**: POST
- **Path**: `/warehouse`
- **Auth**: Required (Admin only)
- **Description**: Add item to warehouse.
- **Request Body**:
  ```json
  {
    "itemId": "number",
    "quantity": "number",
    "status": "enum (in_warehouse, returned_pending, damaged, default: in_warehouse)"
  }
  ```
- **Response** (201): Created inventory object.

#### Update Inventory Item

- **Method**: PUT
- **Path**: `/warehouse/:id`
- **Auth**: Required (Admin only)
- **Description**: Update inventory item.
- **Request Body**:
  ```json
  {
    "quantity": "number (optional)",
    "status": "enum (optional)"
  }
  ```
- **Response**: Updated inventory object.

#### Delete Inventory Item

- **Method**: DELETE
- **Path**: `/warehouse/:id`
- **Auth**: Required (Admin only)
- **Description**: Remove item from warehouse.
- **Response**:
  ```json
  {
    "success": true,
    "message": "Warehouse item deleted successfully",
    "requestId": "string"
  }
  ```

This documentation covers all major endpoints. For any additional details or updates, refer to the source code.
