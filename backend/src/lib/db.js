import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_DB_URI;
  if (!uri) throw new Error("MONGO_DB_URI is not set in backend/.env");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME || "avodahloans" });
  // Bring indexes in line with the schemas (drops indexes from older schema versions).
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  console.log(`MongoDB connected (db: ${mongoose.connection.name})`);
}
