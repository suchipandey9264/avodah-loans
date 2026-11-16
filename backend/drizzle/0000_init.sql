CREATE TABLE "activities" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"searches" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"saved" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"compares" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"credit" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"callbacks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text NOT NULL,
	"user_id" uuid NOT NULL,
	"contact" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"lender_id" text NOT NULL,
	"lender_name" text,
	"type" text NOT NULL,
	"loan_amount" double precision NOT NULL,
	"tenure_months" integer,
	"rate" double precision,
	"emi" double precision,
	"emp" text,
	"pincode" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_ref_unique" UNIQUE("ref"),
	CONSTRAINT "applications_status_check" CHECK ("applications"."status" in ('submitted', 'in_review', 'approved', 'rejected', 'disbursed'))
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"message" text,
	"user_id" uuid,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"handled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_kind_check" CHECK ("leads"."kind" in ('callback', 'credit-report'))
);
--> statement-breakpoint
CREATE TABLE "lenders" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"full_name" text,
	"logo" text,
	"kind" text,
	"tier" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"products" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fee" text,
	"about" text,
	"lowest_rate" double precision,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lenders_kind_check" CHECK ("lenders"."kind" in ('PVT Bank', 'PSU Bank', 'HFC', 'NBFC'))
);
--> statement-breakpoint
CREATE TABLE "otps" (
	"identifier" text PRIMARY KEY NOT NULL,
	"code_hash" text NOT NULL,
	"tries" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80),
	"phone" text,
	"email" text,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_user_created_idx" ON "applications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_kind_created_idx" ON "leads" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "lenders_sort_order_idx" ON "lenders" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "lenders_kind_idx" ON "lenders" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "lenders_products_idx" ON "lenders" USING gin ("products");--> statement-breakpoint
CREATE INDEX "otps_expires_at_idx" ON "otps" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");