import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env"); // drizzle-kit doesn't read backend/.env by itself
} catch {}

// `npm run db:generate` turns changes in src/db/schema.js into SQL migrations in ./drizzle.
// The server applies pending migrations on start (see src/lib/db.js); `npm run db:migrate` does it by hand.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
