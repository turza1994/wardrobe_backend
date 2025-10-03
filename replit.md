# ShareWardrobe Backend API

## Project Overview
ShareWardrobe is a professional backend service for a peer-to-peer fashion marketplace built with Node.js, Express.js, TypeScript, and Drizzle ORM. The system enables users to buy, sell, and rent fashion items with complete transaction management, delivery tracking, and rental lifecycle management.

## Architecture

### Key Design Principles
- **Pluggable Services**: All external integrations (auth, storage, payment, delivery, notifications, background jobs) use interface-based design for easy swapping
- **Type Safety**: Full TypeScript coverage with Zod runtime validation
- **Error Handling**: Centralized error middleware with request ID tracking for observability
- **Database**: PostgreSQL with Drizzle ORM, includes check constraints, indexes, and soft deletes
- **Security**: JWT authentication, RBAC, rate limiting, helmet security headers

### Pluggable Service Architecture

#### 1. **Authentication** (Currently: JWT, Future: Keycloak)
- Interface: `IAuthService` in `src/services/auth/authService.interface.ts`
- Current: `JWTAuthService` using jsonwebtoken
- To switch to Keycloak: Implement `IAuthService` and swap in `src/services/auth/index.ts`

#### 2. **File Storage** (Currently: Local, Future: MinIO)
- Interface: `IStorageService` in `src/services/storage/storageService.interface.ts`
- Current: `LocalStorageService` stores files in `./uploads` directory
- To switch to MinIO: Implement `IStorageService` with MinIO client and swap in `src/services/storage/index.ts`

#### 3. **Background Jobs** (Currently: In-Memory, Future: Redis + BullMQ)
- Interface: `IJobService` in `src/services/jobs/jobService.interface.ts`
- Current: `InMemoryJobService` logs job info (no actual execution)
- To switch to Redis + BullMQ: Implement `IJobService` with BullMQ and swap in `src/services/jobs/index.ts`

#### 4. **Notifications** (Currently: In-App, Future: Email/SMS/Socket.io)
- Interface: `INotificationService` in `src/services/notification/notificationService.interface.ts`
- Current: `InAppNotificationService` saves to database only
- To add Email/SMS: Implement methods in service or create new service implementing `INotificationService`

#### 5. **Payment Gateway** (Currently: Mock, Future: Bkash/Stripe)
- Interface: `IPaymentService` in `src/services/payment/paymentService.interface.ts`
- Current: `MockPaymentService` logs payment info
- To integrate Bkash/Stripe: Implement `IPaymentService` and swap in `src/services/payment/index.ts`

#### 6. **Delivery** (Currently: Mock, Future: Pathao)
- Interface: `IDeliveryService` in `src/services/delivery/deliveryService.interface.ts`
- Current: `MockDeliveryService` logs delivery info
- To integrate Pathao: Implement `IDeliveryService` and swap in `src/services/delivery/index.ts`

## Database Schema

### Core Tables
- **users**: User accounts with roles (user, seller, user_seller, admin), balances, NID verification
- **categories**: Item categories
- **items**: Items for sale/rent with images, prices, quantities, and statuses
- **cart_items**: Shopping cart with negotiated prices and expiration
- **orders**: Orders with payment method, delivery charges, safety deposits
- **order_items**: Individual items in orders
- **negotiations**: Price negotiation history
- **deliveries**: Delivery tracking with return flags
- **rentals**: Rental lifecycle with late fees and return inspection
- **transactions**: All financial movements (payment, refund, withdrawal, fee)
- **withdrawal_requests**: Seller withdrawal requests
- **notifications**: In-app notifications
- **warehouse_inventory**: Warehouse stock management
- **admin_configs**: Dynamic platform configuration

### Key Features
- **Soft Deletes**: All tables have `deletedAt` for data retention
- **Partial Unique Indexes**: Email unique only when not deleted
- **Check Constraints**: Enforce business rules (e.g., quantity >= 1, prices >= 0)
- **Indexes**: On foreign keys and commonly filtered columns for performance

## API Endpoints

### Health Checks
- `GET /api/v1/health` - Full health check with database
- `GET /api/v1/health/ready` - Readiness check
- `GET /api/v1/health/live` - Liveness check

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/profile` - Get user profile (authenticated)

### Admin Configuration
- `GET /api/v1/admin/configs` - List all configs (admin only)
- `GET /api/v1/admin/configs/:key` - Get specific config (admin only)
- `PUT /api/v1/admin/configs/:key` - Update/create config (admin only)

### Categories
- `GET /api/v1/categories` - List all categories (public)
- `GET /api/v1/categories/:id` - Get category by ID (public)
- `POST /api/v1/categories` - Create category (admin only)
- `PUT /api/v1/categories/:id` - Update category (admin only)
- `DELETE /api/v1/categories/:id` - Delete category (admin only)

### Items
- `GET /api/v1/items` - List items with filters (public)
- `GET /api/v1/items/:id` - Get item details (public)
- `POST /api/v1/items` - Create item listing (authenticated)
- `PUT /api/v1/items/:id` - Update item (owner/admin)
- `DELETE /api/v1/items/:id` - Delete item (owner/admin)
- `PUT /api/v1/items/:id/status` - Update item status (admin only)

### Cart
- `GET /api/v1/cart` - Get user's cart (authenticated)
- `POST /api/v1/cart` - Add item to cart (authenticated)
- `PUT /api/v1/cart/:id` - Update cart item quantity (authenticated)
- `DELETE /api/v1/cart/:id` - Remove item from cart (authenticated)
- `DELETE /api/v1/cart` - Clear entire cart (authenticated)

### Orders
- `GET /api/v1/orders` - List user's orders (authenticated)
- `GET /api/v1/orders/:id` - Get order details (authenticated)
- `POST /api/v1/orders` - Create order from cart (authenticated)
- `PUT /api/v1/orders/:id/status` - Update order status (admin only)

### Negotiations
- `GET /api/v1/negotiations` - List user's negotiations (authenticated)
- `GET /api/v1/negotiations/:id` - Get negotiation details (authenticated)
- `POST /api/v1/negotiations` - Create price offer (authenticated)
- `PUT /api/v1/negotiations/:id/respond` - Accept/reject negotiation (seller only)

### Notifications
- `GET /api/v1/notifications` - List user's notifications (authenticated)
- `PUT /api/v1/notifications/:id/read` - Mark notification as read (authenticated)
- `PUT /api/v1/notifications/read-all` - Mark all as read (authenticated)

### Transactions
- `GET /api/v1/transactions` - List user's transactions (authenticated)
- `POST /api/v1/transactions/withdraw` - Request withdrawal (authenticated)
- `GET /api/v1/transactions/withdrawals` - List withdrawal requests (authenticated)

## Environment Variables

```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
ADMIN_EMAIL=admin@sharewardrobe.com
ADMIN_PASSWORD=admin123
```

## Default Admin Credentials
- Email: `admin@sharewardrobe.com`
- Password: `admin123`
- **Important**: Change these credentials in production!

## Default Admin Configurations
- `delivery_charge_per_order`: 100.00 TK
- `safety_deposit_percentage`: 30%
- `rental_period_days`: 7 days
- `platform_fee_sale_percent`: 8%
- `platform_fee_rental_percent`: 16%
- `negotiation_hold_minutes`: 1440 minutes (24 hours)
- `payment_timeout_minutes`: 1440 minutes (24 hours)

## Scripts

```bash
npm run dev          # Start development server with hot reload
npm run start        # Start production server
npm run build        # Compile TypeScript to JavaScript
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with default configs and admin user
npm run db:studio    # Open Drizzle Studio (database GUI)
```

## Error Handling

All errors return a structured JSON response:
```json
{
  "success": false,
  "error": "Error message",
  "requestId": "uuid-request-id"
}
```

Request IDs are included in:
- All API responses
- `X-Request-ID` response header
- Server logs for tracing

## Security Features

- **JWT Authentication**: Secure token-based auth
- **RBAC**: Role-based access control (user, seller, user_seller, admin)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing enabled
- **Input Validation**: Zod schemas at controller layer
- **Database Constraints**: Check constraints as last line of defense

## Future Integrations Roadmap

### Immediate Next Steps
1. Implement remaining CRUD APIs (items, categories, cart, orders, negotiations, rentals)
2. Add transaction management for order processing
3. Implement inventory management with SELECT FOR UPDATE

### Phase 2
1. Switch to MinIO for file storage
2. Integrate Redis + BullMQ for background jobs (cart expiry, rental reminders, payment timeouts)
3. Add email/SMS notifications (Twilio, SendGrid)

### Phase 3
1. Integrate Bkash/Stripe for payments
2. Integrate Pathao for delivery tracking
3. Add real-time notifications with Socket.io
4. Consider Keycloak for advanced auth

## Development Guidelines

### Adding New API Endpoints
1. Create validation schema in `src/validations/`
2. Create controller in `src/controllers/`
3. Create route in `src/routes/`
4. Add route to `src/routes/index.ts`

### Database Changes
1. Update schema in `src/db/schema.ts`
2. Run `npm run db:push` to sync (or `npm run db:push --force` if needed)
3. Update seed script if adding new default data

### Switching Pluggable Services
1. Implement the service interface
2. Update the export in `src/services/[service]/index.ts`
3. No other code changes required!

## Project Structure

```
src/
├── config/          # Environment configuration
├── controllers/     # Request handlers
├── db/              # Database schema and connection
├── middleware/      # Express middleware (auth, validation, errors)
├── routes/          # API routes
├── scripts/         # Utility scripts (seed, etc.)
├── services/        # Pluggable services (auth, storage, jobs, etc.)
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and error classes
├── validations/     # Zod validation schemas
├── app.ts           # Express app configuration
└── server.ts        # Server entry point
```

## Recent Changes
- 2025-10-03: Initial backend setup with pluggable architecture
- Database schema created with all tables, indexes, and constraints
- Core authentication and admin APIs implemented
- Health check endpoints added
- Database seeded with default configurations
- Implemented complete Category, Item, Cart, Order, Negotiation, Notification, and Transaction APIs
- All core marketplace features are now functional
- Integrated pluggable payment and delivery services
- Added comprehensive validation and error handling across all endpoints
- **2025-10-03: Successfully imported and configured for Replit environment**
  - Installed all npm dependencies
  - Created PostgreSQL database (Neon-backed)
  - Pushed database schema and seeded initial data
  - Configured environment variables
  - Server running on port 5000
  - Deployment configured for autoscale (stateless API)

## User Preferences
- Priority: Pluggable architecture for future integrations
- File storage: Local directory (scope for MinIO)
- Background jobs: In-memory logging (scope for Redis + BullMQ)
- Auth: JWT (scope for Keycloak)
- Notifications: In-app only (scope for email/SMS/Socket.io)
- Payment: Mock service (scope for Bkash/Stripe)
- Delivery: Mock service (scope for Pathao)
