// Loads the sample lender catalogue (src/data/loans.js) into PostgreSQL.
// Run: npm run seed   (safe to re-run — upserts by lender id; applies pending migrations first)
import { sql } from "drizzle-orm";
import { LENDERS } from "../data/loans.js";
import { lenders } from "../db/schema.js";
import { closeDB, connectDB, db } from "../lib/db.js";

await connectDB();
const rows = LENDERS.map((l, sortOrder) => ({ ...l, sortOrder, active: true }));
const excluded = (column) => sql.raw(`excluded."${column.name}"`);
const result = await db
  .insert(lenders)
  .values(rows)
  .onConflictDoUpdate({
    target: lenders.id,
    set: Object.fromEntries(
      ["name", "fullName", "logo", "kind", "tier", "sortOrder", "products", "fee", "about", "lowestRate", "active"].map((k) => [k, excluded(lenders[k])])
    ),
  })
  .returning({ id: lenders.id });
console.log(`Lenders: ${result.length} upserted`);
await closeDB();
