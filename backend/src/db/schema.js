import { sql } from "drizzle-orm";
import { boolean, check, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// PostgreSQL schema. After changing it, run `npm run db:generate` to write a migration into ./drizzle.

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());
const inList = (column, values) => sql`${column} in (${sql.raw(values.map((v) => `'${v}'`).join(", "))})`;

/* ---------- Lender catalogue ---------- */

export const LENDER_KINDS = ["PVT Bank", "PSU Bank", "HFC", "NBFC"];

// products: [{ type, rate, maxAmount, maxTenure, features: [] }]
export const lenders = pgTable(
  "lenders",
  {
    id: text("id").primaryKey(), // slug, e.g. "sbi"
    name: text("name").notNull(), // short brand name
    fullName: text("full_name"), // full / registered name
    logo: text("logo"),
    kind: text("kind"),
    tier: integer("tier"),
    sortOrder: integer("sort_order").notNull().default(0), // display order
    products: jsonb("products").notNull().default([]),
    fee: text("fee"),
    about: text("about"),
    lowestRate: doublePrecision("lowest_rate"),
    active: boolean("active").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("lenders_sort_order_idx").on(t.sortOrder),
    index("lenders_kind_idx").on(t.kind),
    index("lenders_products_idx").using("gin", t.products), // fast `products @> '[{"type": …}]'`
    check("lenders_kind_check", inList(t.kind, LENDER_KINDS)),
  ]
);

/* ---------- Users & auth ---------- */

// A user signs in with a mobile number OR an email address (or later links both).
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }),
  phone: text("phone").unique(),
  email: text("email").unique(), // stored lower-cased
  profile: jsonb("profile").notNull().default({}), // personal + employment details from the dashboard
  createdAt,
  updatedAt,
});

// OTPs and sessions store a SHA-256 hash, never the raw value. Expired rows are purged by lib/db.js.
export const otps = pgTable(
  "otps",
  {
    identifier: text("identifier").primaryKey(), // phone number or lower-cased email
    codeHash: text("code_hash").notNull(),
    tries: integer("tries").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("otps_expires_at_idx").on(t.expiresAt)]
);

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId), index("sessions_expires_at_idx").on(t.expiresAt)]
);

/* ---------- Dashboard activity ---------- */

export const ACTIVITY_LISTS = ["searches", "saved", "compares", "credit", "callbacks"];

// One row per user; each list is a JSON array, newest first, capped at 100 items.
export const activities = pgTable("activities", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  searches: jsonb("searches").notNull().default([]),
  saved: jsonb("saved").notNull().default([]),
  compares: jsonb("compares").notNull().default([]),
  credit: jsonb("credit").notNull().default([]),
  callbacks: jsonb("callbacks").notNull().default([]),
  createdAt,
  updatedAt,
});

/* ---------- Applications & leads ---------- */

export const APPLICATION_STATUSES = ["submitted", "in_review", "approved", "rejected", "disbursed"];

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ref: text("ref").notNull().unique(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    contact: jsonb("contact").notNull().default({}), // { name, phone, email } snapshot for the ops team
    lenderId: text("lender_id").notNull(),
    lenderName: text("lender_name"),
    type: text("type").notNull(),
    loanAmount: doublePrecision("loan_amount").notNull(),
    tenureMonths: integer("tenure_months"),
    rate: doublePrecision("rate"),
    emi: doublePrecision("emi"),
    emp: text("emp"),
    pincode: text("pincode"),
    status: text("status").notNull().default("submitted"),
    details: jsonb("details").notNull().default({}), // anything else the offer snapshot carried
    createdAt,
    updatedAt,
  },
  (t) => [
    index("applications_user_created_idx").on(t.userId, t.createdAt),
    check("applications_status_check", inList(t.status, APPLICATION_STATUSES)),
  ]
);

export const LEAD_KINDS = ["callback", "credit-report"];

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    message: text("message"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // set when the visitor was logged in
    details: jsonb("details").notNull().default({}),
    handled: boolean("handled").notNull().default(false),
    createdAt,
    updatedAt,
  },
  (t) => [index("leads_kind_created_idx").on(t.kind, t.createdAt), check("leads_kind_check", inList(t.kind, LEAD_KINDS))]
);
