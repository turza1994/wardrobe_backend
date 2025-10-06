import {
  pgTable,
  serial,
  text,
  decimal,
  integer,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

export const roleEnum = pgEnum('role', ['user', 'admin'])
export const userStatusEnum = pgEnum('user_status', [
  'active',
  'inactive',
  'deleted',
  'suspended',
])
export const itemAvailabilityEnum = pgEnum('item_availability', [
  'sell_only',
  'rent_only',
  'both',
])
export const itemStatusEnum = pgEnum('item_status', [
  'pending_approval',
  'available',
  'in_warehouse',
  'rented',
  'sold',
  'returned_pending',
  'damaged',
  'rejected',
])
export const orderTypeEnum = pgEnum('order_type', ['buy', 'rent'])
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'returned',
  'partially_returned',
  'cancelled',
  'refunded',
])
export const orderItemStatusEnum = pgEnum('order_item_status', [
  'pending',
  'shipped',
  'delivered',
  'returned',
  'cancelled',
  'refunded',
])
export const paymentMethodEnum = pgEnum('payment_method', ['cod', 'online'])
export const negotiationStatusEnum = pgEnum('negotiation_status', [
  'pending',
  'accepted',
  'rejected',
])
export const deliveryStatusEnum = pgEnum('delivery_status', [
  'pending',
  'picked_up',
  'in_transit',
  'delivered',
  'failed',
])
export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'approved',
  'rejected',
])
export const transactionTypeEnum = pgEnum('transaction_type', [
  'payment',
  'refund',
  'withdrawal',
  'fee',
])
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
])
export const notificationTypeEnum = pgEnum('notification_type', [
  'order_confirmation',
  'rental_reminder',
  'negotiation',
  'system',
])
export const rentalReturnStatusEnum = pgEnum('rental_return_status', [
  'pending',
  'inspected',
  'refunded',
  'completed',
  'rejected',
])
export const withdrawalStatusEnum = pgEnum('withdrawal_status', [
  'pending',
  'processed',
  'rejected',
])

export const adminConfigs = pgTable('admin_configs', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug'),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    nameIndex: uniqueIndex('categories_name_deleted_idx')
      .on(table.name)
      .where(sql`${table.deletedAt} IS NULL`),
  })
)

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: text('name'), // ❌ Made optional
    email: text('email'), // ❌ Made optional for notifications
    phone: text('phone').notNull().unique(), // ✅ Primary identifier
    phoneVerified: boolean('phone_verified').notNull().default(false), // ✅ Phone verification status
    phoneVerifiedAt: timestamp('phone_verified_at'), // ✅ When phone was verified
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull().default('user'),
    status: userStatusEnum('status').notNull().default('active'),
    address: text('address'),
    balance: decimal('balance', { precision: 14, scale: 2 })
      .notNull()
      .default('0.00'),
    nidFrontUrl: text('nid_front_url'),
    nidBackUrl: text('nid_back_url'),
    verificationStatus: verificationStatusEnum('verification_status').default(
      'pending'
    ),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    phoneIndex: uniqueIndex('users_phone_deleted_idx')
      .on(table.phone)
      .where(sql`${table.deletedAt} IS NULL`),
    balanceCheck: check('users_balance_check', sql`${table.balance} >= 0`),
  })
)

export const items = pgTable(
  'items',
  {
    id: serial('id').primaryKey(),
    sellerId: integer('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    type: text('type').notNull(),
    color: text('color'),
    size: text('size'),
    wearingTime: text('wearing_time'),
    purchasePrice: decimal('purchase_price', {
      precision: 14,
      scale: 2,
    }).notNull(),
    description: text('description').notNull(),
    sellPrice: decimal('sell_price', { precision: 14, scale: 2 }),
    rentPrice: decimal('rent_price', { precision: 14, scale: 2 }),
    availability: itemAvailabilityEnum('availability').notNull(),
    quantity: integer('quantity').notNull().default(1),
    images: jsonb('images').notNull().$type<string[]>(),
    video: text('video'),
    status: itemStatusEnum('status').notNull().default('pending_approval'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    sellerIdx: index('items_seller_idx').on(table.sellerId),
    categoryIdx: index('items_category_idx').on(table.categoryId),
    statusIdx: index('items_status_idx').on(table.status),
    availabilityIdx: index('items_availability_idx').on(table.availability),
    typeIdx: index('items_type_idx').on(table.type),
    colorIdx: index('items_color_idx').on(table.color),
    sizeIdx: index('items_size_idx').on(table.size),
    quantityCheck: check('items_quantity_check', sql`${table.quantity} >= 1`),
    purchasePriceCheck: check(
      'items_purchase_price_check',
      sql`${table.purchasePrice} >= 0`
    ),
    sellPriceCheck: check(
      'items_sell_price_check',
      sql`${table.sellPrice} IS NULL OR ${table.sellPrice} >= 0`
    ),
    rentPriceCheck: check(
      'items_rent_price_check',
      sql`${table.rentPrice} IS NULL OR ${table.rentPrice} >= 0`
    ),
  })
)

export const cartItems = pgTable(
  'cart_items',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    type: orderTypeEnum('type').notNull(),
    negotiatedPrice: decimal('negotiated_price', { precision: 14, scale: 2 }),
    negotiatedExpiresAt: timestamp('negotiated_expires_at'),
    negotiationId: integer('negotiation_id').references(() => negotiations.id, {
      onDelete: 'set null',
    }),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueIndex: uniqueIndex('cart_items_user_item_type_idx').on(
      table.userId,
      table.itemId,
      table.type
    ),
    userIdx: index('cart_items_user_idx').on(table.userId),
    expiresIdx: index('cart_items_expires_idx').on(table.negotiatedExpiresAt),
    quantityCheck: check(
      'cart_items_quantity_check',
      sql`${table.quantity} >= 1`
    ),
  })
)

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    buyerId: integer('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull(),
    deliveryCharge: decimal('delivery_charge', {
      precision: 14,
      scale: 2,
    }).notNull(),
    safetyDeposit: decimal('safety_deposit', {
      precision: 14,
      scale: 2,
    }).default('0.00'),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    status: orderStatusEnum('status').notNull().default('pending'),
    paymentDueAt: timestamp('payment_due_at'),
    deliveryChargePaid: boolean('delivery_charge_paid')
      .notNull()
      .default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    buyerIdx: index('orders_buyer_idx').on(table.buyerId),
    statusIdx: index('orders_status_idx').on(table.status),
    paymentDueIdx: index('orders_payment_due_idx').on(table.paymentDueAt),
    totalCheck: check('orders_total_check', sql`${table.totalAmount} >= 0`),
    deliveryChargeCheck: check(
      'orders_delivery_charge_check',
      sql`${table.deliveryCharge} >= 0`
    ),
    depositCheck: check(
      'orders_deposit_check',
      sql`${table.safetyDeposit} >= 0`
    ),
  })
)

export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    price: decimal('price', { precision: 14, scale: 2 }).notNull(),
    type: orderTypeEnum('type').notNull(),
    status: orderItemStatusEnum('status').notNull().default('pending'),
  },
  (table) => ({
    orderIdx: index('order_items_order_idx').on(table.orderId),
    itemIdx: index('order_items_item_idx').on(table.itemId),
    quantityCheck: check(
      'order_items_quantity_check',
      sql`${table.quantity} >= 1`
    ),
    priceCheck: check('order_items_price_check', sql`${table.price} >= 0`),
  })
)

export const negotiations = pgTable(
  'negotiations',
  {
    id: serial('id').primaryKey(),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    buyerId: integer('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    offerPrice: decimal('offer_price', { precision: 14, scale: 2 }).notNull(),
    status: negotiationStatusEnum('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    itemIdx: index('negotiations_item_idx').on(table.itemId),
    buyerIdx: index('negotiations_buyer_idx').on(table.buyerId),
    offerPriceCheck: check(
      'negotiations_offer_price_check',
      sql`${table.offerPrice} >= 0`
    ),
  })
)

export const deliveries = pgTable(
  'deliveries',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    fromAddress: text('from_address').notNull(),
    toAddress: text('to_address').notNull(),
    status: deliveryStatusEnum('status').notNull().default('pending'),
    trackingId: text('tracking_id'),
    isReturn: boolean('is_return').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    orderIdx: index('deliveries_order_idx').on(table.orderId),
    trackingIdx: index('deliveries_tracking_idx').on(table.trackingId),
  })
)

export const rentals = pgTable(
  'rentals',
  {
    id: serial('id').primaryKey(),
    orderItemId: integer('order_item_id')
      .notNull()
      .references(() => orderItems.id, { onDelete: 'cascade' })
      .unique(),
    rentalStart: timestamp('rental_start').notNull(),
    rentalEnd: timestamp('rental_end').notNull(),
    returnStatus: rentalReturnStatusEnum('return_status').default('pending'),
    inspectionResult: text('inspection_result'),
    refundAmount: decimal('refund_amount', { precision: 14, scale: 2 }),
    lateFee: decimal('late_fee', { precision: 14, scale: 2 })
      .notNull()
      .default('0.00'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    orderItemIdx: index('rentals_order_item_idx').on(table.orderItemId),
    lateFeeCheck: check('rentals_late_fee_check', sql`${table.lateFee} >= 0`),
    refundCheck: check(
      'rentals_refund_check',
      sql`${table.refundAmount} IS NULL OR ${table.refundAmount} >= 0`
    ),
  })
)

export const transactions = pgTable(
  'transactions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    orderId: integer('order_id').references(() => orders.id, {
      onDelete: 'restrict',
    }),
    amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
    type: transactionTypeEnum('type').notNull(),
    status: transactionStatusEnum('status').notNull().default('pending'),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    userIdx: index('transactions_user_idx').on(table.userId),
    orderIdx: index('transactions_order_idx').on(table.orderId),
    typeIdx: index('transactions_type_idx').on(table.type),
  })
)

export const withdrawalRequests = pgTable(
  'withdrawal_requests',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
    status: withdrawalStatusEnum('status').notNull().default('pending'),
    processedAt: timestamp('processed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    userIdx: index('withdrawal_requests_user_idx').on(table.userId),
    amountCheck: check(
      'withdrawal_requests_amount_check',
      sql`${table.amount} > 0`
    ),
  })
)

export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    userIdx: index('notifications_user_idx').on(table.userId),
  })
)

export const warehouseInventory = pgTable(
  'warehouse_inventory',
  {
    id: serial('id').primaryKey(),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    status: itemStatusEnum('status').notNull().default('in_warehouse'),
    lastUpdated: timestamp('last_updated')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    itemIdx: index('warehouse_inventory_item_idx').on(table.itemId),
    quantityCheck: check(
      'warehouse_inventory_quantity_check',
      sql`${table.quantity} >= 1`
    ),
  })
)

export const otpVerifications = pgTable(
  'otp_verifications',
  {
    id: serial('id').primaryKey(),
    phone: text('phone').notNull(),
    otp: text('otp').notNull(),
    purpose: text('purpose').notNull(), // 'registration', 'login', 'password_reset'
    status: text('status').notNull().default('pending'), // 'pending', 'verified', 'expired'
    expiresAt: timestamp('expires_at').notNull(),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    verifiedAt: timestamp('verified_at'),
  },
  (table) => ({
    phoneIdx: index('otp_phone_idx').on(table.phone),
    expiresIdx: index('otp_expires_idx').on(table.expiresAt),
    phonePurposeIdx: uniqueIndex('otp_phone_purpose_idx').on(
      table.phone,
      table.purpose
    ),
  })
)

export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  cartItems: many(cartItems),
  orders: many(orders),
  negotiations: many(negotiations),
  transactions: many(transactions),
  withdrawalRequests: many(withdrawalRequests),
  notifications: many(notifications),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items),
}))

export const itemsRelations = relations(items, ({ one, many }) => ({
  seller: one(users, { fields: [items.sellerId], references: [users.id] }),
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  negotiations: many(negotiations),
  warehouseInventory: many(warehouseInventory),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  item: one(items, { fields: [cartItems.itemId], references: [items.id] }),
  negotiation: one(negotiations, {
    fields: [cartItems.negotiationId],
    references: [negotiations.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.id] }),
  orderItems: many(orderItems),
  deliveries: many(deliveries),
  transactions: many(transactions),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  item: one(items, { fields: [orderItems.itemId], references: [items.id] }),
  rental: one(rentals, {
    fields: [orderItems.id],
    references: [rentals.orderItemId],
  }),
}))

export const negotiationsRelations = relations(negotiations, ({ one }) => ({
  item: one(items, { fields: [negotiations.itemId], references: [items.id] }),
  buyer: one(users, { fields: [negotiations.buyerId], references: [users.id] }),
}))

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, { fields: [deliveries.orderId], references: [orders.id] }),
}))

export const rentalsRelations = relations(rentals, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [rentals.orderItemId],
    references: [orderItems.id],
  }),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}))

export const withdrawalRequestsRelations = relations(
  withdrawalRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [withdrawalRequests.userId],
      references: [users.id],
    }),
  })
)

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}))

export const warehouseInventoryRelations = relations(
  warehouseInventory,
  ({ one }) => ({
    item: one(items, {
      fields: [warehouseInventory.itemId],
      references: [items.id],
    }),
  })
)
