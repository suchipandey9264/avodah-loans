// Applies pending SQL migrations from ./drizzle. The server also does this on start.
// Run: npm run db:migrate
import { closeDB, connectDB } from "../lib/db.js";

await connectDB();
await closeDB();
console.log("Migrations are up to date.");
