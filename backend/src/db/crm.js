import { customType, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./schema.js";

// Tables created and migrated by the CRM project (../CRM/backend/src/db/schema.js), which shares this database.
// Kept out of schema.js on purpose so `npm run db:generate` here never writes migrations for them.
// Keep these columns in step with the CRM's definitions.

const bytea = customType({ dataType: () => "bytea" });
const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

// Same list as the CRM's DOCUMENT_TYPES (enforced there by a CHECK constraint).
export const DOCUMENT_TYPES = ["pan", "aadhaar", "photo", "address_proof", "bank_statement", "salary_slip", "itr", "form16", "property", "other"];

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => users.id),
  applicationId: uuid("application_id"),
  docType: text("doc_type").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(),
  content: bytea("content").notNull(),
  status: text("status").notNull().default("uploaded"), // uploaded | verified | rejected (set by CRM staff)
  note: text("note"), // staff note, e.g. why it was rejected
  uploadedBy: uuid("uploaded_by"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete: the CRM keeps a record of what was held
  deletedBy: uuid("deleted_by"),
  createdAt,
  updatedAt,
});

// The CRM's per-customer activity feed.
export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  type: text("type").notNull(),
  actorId: uuid("actor_id"),
  body: text("body"),
  meta: jsonb("meta").notNull().default({}),
  createdAt,
});
