import { fileURLToPath } from "node:url";
import { lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "../db/schema.js";

const MIGRATIONS = fileURLToPath(new URL("../../drizzle", import.meta.url));

// Hosted databases (Neon, Supabase, Render external URLs) need SSL — add ?sslmode=require to DATABASE_URL.
// Keep idle connections for 5 minutes (pg's default is 10s): reconnecting to a far-away database costs ~1s of TLS + auth.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX ?? 10),
  idleTimeoutMillis: 5 * 60 * 1000,
  keepAlive: true,
});
pool.on("error", (err) => console.error("[db] idle connection error:", err.message));
export const db = drizzle(pool, { schema });

let purgeTimer;

/** Connects, applies pending migrations from ./drizzle, and starts the expired-OTP/session cleanup. */
export async function connectDB() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in backend/.env (your PostgreSQL connection string)");
  await pool.query("select 1");
  await migrate(db, { migrationsFolder: MIGRATIONS });
  const { rows } = await pool.query("select current_database() as name");
  console.log(`PostgreSQL connected (db: ${rows[0].name})`);

  // PostgreSQL has no TTL indexes: delete expired OTPs and sessions every 30 minutes.
  const purge = async () => {
    const now = new Date();
    await db.delete(schema.otps).where(lt(schema.otps.expiresAt, now));
    await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, now));
  };
  await purge().catch(() => {});
  purgeTimer ??= setInterval(() => purge().catch((err) => console.error("[db] purge failed:", err.message)), 30 * 60 * 1000);
  purgeTimer.unref();
}

export async function closeDB() {
  clearInterval(purgeTimer);
  purgeTimer = undefined;
  await pool.end();
}
