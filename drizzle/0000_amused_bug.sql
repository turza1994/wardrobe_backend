CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'picked_up', 'in_transit', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."item_availability" AS ENUM('sell_only', 'rent_only', 'both');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('pending_approval', 'available', 'in_warehouse', 'rented', 'sold', 'returned_pending', 'damaged', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."negotiation_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('order_confirmation', 'rental_reminder', 'negotiation', 'system');--> statement-breakpoint
CREATE TYPE "public"."order_item_status" AS ENUM('pending', 'shipped', 'delivered', 'returned', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'shipped', 'delivered', 'returned', 'partially_returned', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('buy', 'rent');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cod', 'online');--> statement-breakpoint
CREATE TYPE "public"."rental_return_status" AS ENUM('pending', 'inspected', 'refunded', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'seller', 'user_seller', 'admin');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('payment', 'refund', 'withdrawal', 'fee');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'deleted', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'processed', 'rejected');--> statement-breakpoint
CREATE TABLE "admin_configs" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"type" "order_type" NOT NULL,
	"negotiated_price" numeric(14, 2),
	"negotiated_expires_at" timestamp,
	"negotiation_id" integer,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_quantity_check" CHECK ("cart_items"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"from_address" text NOT NULL,
	"to_address" text NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"tracking_id" text,
	"is_return" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"type" text NOT NULL,
	"color" text,
	"size" text,
	"wearing_time" text,
	"purchase_price" numeric(14, 2) NOT NULL,
	"description" text NOT NULL,
	"sell_price" numeric(14, 2),
	"rent_price" numeric(14, 2),
	"availability" "item_availability" NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"images" jsonb NOT NULL,
	"video" text,
	"status" "item_status" DEFAULT 'pending_approval' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "items_quantity_check" CHECK ("items"."quantity" >= 1),
	CONSTRAINT "items_purchase_price_check" CHECK ("items"."purchase_price" >= 0),
	CONSTRAINT "items_sell_price_check" CHECK ("items"."sell_price" IS NULL OR "items"."sell_price" >= 0),
	CONSTRAINT "items_rent_price_check" CHECK ("items"."rent_price" IS NULL OR "items"."rent_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "negotiations" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"buyer_id" integer NOT NULL,
	"offer_price" numeric(14, 2) NOT NULL,
	"status" "negotiation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "negotiations_offer_price_check" CHECK ("negotiations"."offer_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	"type" "order_type" NOT NULL,
	"status" "order_item_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "order_items_quantity_check" CHECK ("order_items"."quantity" >= 1),
	CONSTRAINT "order_items_price_check" CHECK ("order_items"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_id" integer NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"delivery_charge" numeric(14, 2) NOT NULL,
	"safety_deposit" numeric(14, 2) DEFAULT '0.00',
	"payment_method" "payment_method" NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_due_at" timestamp,
	"delivery_charge_paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "orders_total_check" CHECK ("orders"."total_amount" >= 0),
	CONSTRAINT "orders_delivery_charge_check" CHECK ("orders"."delivery_charge" >= 0),
	CONSTRAINT "orders_deposit_check" CHECK ("orders"."safety_deposit" >= 0)
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_item_id" integer NOT NULL,
	"rental_start" timestamp NOT NULL,
	"rental_end" timestamp NOT NULL,
	"return_status" "rental_return_status" DEFAULT 'pending',
	"inspection_result" text,
	"refund_amount" numeric(14, 2),
	"late_fee" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "rentals_order_item_id_unique" UNIQUE("order_item_id"),
	CONSTRAINT "rentals_late_fee_check" CHECK ("rentals"."late_fee" >= 0),
	CONSTRAINT "rentals_refund_check" CHECK ("rentals"."refund_amount" IS NULL OR "rentals"."refund_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"order_id" integer,
	"amount" numeric(14, 2) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"address" text,
	"phone" text,
	"balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"nid_front_url" text,
	"nid_back_url" text,
	"verification_status" "verification_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_balance_check" CHECK ("users"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "warehouse_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" "item_status" DEFAULT 'in_warehouse' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "warehouse_inventory_quantity_check" CHECK ("warehouse_inventory"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "withdrawal_requests_amount_check" CHECK ("withdrawal_requests"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_negotiation_id_negotiations_id_fk" FOREIGN KEY ("negotiation_id") REFERENCES "public"."negotiations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_user_item_type_idx" ON "cart_items" USING btree ("user_id","item_id","type");--> statement-breakpoint
CREATE INDEX "cart_items_user_idx" ON "cart_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_items_expires_idx" ON "cart_items" USING btree ("negotiated_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_deleted_idx" ON "categories" USING btree ("name") WHERE "categories"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "deliveries_order_idx" ON "deliveries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "deliveries_tracking_idx" ON "deliveries" USING btree ("tracking_id");--> statement-breakpoint
CREATE INDEX "items_seller_idx" ON "items" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "items_category_idx" ON "items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "items_status_idx" ON "items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "items_availability_idx" ON "items" USING btree ("availability");--> statement-breakpoint
CREATE INDEX "items_type_idx" ON "items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "items_color_idx" ON "items" USING btree ("color");--> statement-breakpoint
CREATE INDEX "items_size_idx" ON "items" USING btree ("size");--> statement-breakpoint
CREATE INDEX "negotiations_item_idx" ON "negotiations" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "negotiations_buyer_idx" ON "negotiations" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_item_idx" ON "order_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "orders_buyer_idx" ON "orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_payment_due_idx" ON "orders" USING btree ("payment_due_at");--> statement-breakpoint
CREATE INDEX "rentals_order_item_idx" ON "rentals" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "transactions_user_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_order_idx" ON "transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_deleted_idx" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "warehouse_inventory_item_idx" ON "warehouse_inventory" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "withdrawal_requests_user_idx" ON "withdrawal_requests" USING btree ("user_id");