// Loads the sample lender catalogue (src/data/loans.js) into MongoDB.
// Run: npm run seed   (safe to re-run — upserts by lender id)
import mongoose from "mongoose";
import { LENDERS } from "../data/loans.js";
import { connectDB } from "../lib/db.js";
import { Lender } from "../models/index.js";

await connectDB();
const res = await Lender.bulkWrite(
  LENDERS.map((l, order) => ({
    updateOne: { filter: { id: l.id }, update: { $set: { ...l, order, active: true } }, upsert: true },
  }))
);
console.log(`Lenders: ${res.upsertedCount} added, ${res.modifiedCount} updated, ${LENDERS.length} total`);
await mongoose.disconnect();
