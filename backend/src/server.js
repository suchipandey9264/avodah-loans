import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { connectDB } from "./lib/db.js";
import { HttpError, session } from "./lib/http.js";
import { captchaEnabled } from "./lib/captcha.js";
import { apiLimiter } from "./lib/limits.js";
import activity from "./routes/activity.js";
import auth from "./routes/auth.js";
import loans from "./routes/loans.js";

const app = express();
// Behind a proxy (Render, Nginx…) set TRUST_PROXY=1 so rate limits see the visitor's IP, not the proxy's.
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 0));
const PORT = Number(process.env.PORT ?? 4000);
const origins = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((s) => s.trim());

app.use(cors({ origin: origins }));
app.use(express.json({ limit: "100kb" }));
app.use("/api", apiLimiter);
app.use(session);

app.get("/api/health", (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.use("/api", loans);
app.use("/api/auth", auth);
app.use("/api", activity);

app.use("/api", (_req, _res, next) => next(new HttpError(404, "Not found")));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  let status = err.status ?? 500;
  let message = err.message;
  if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) status = 400;
  if (err.code === 11000) { status = 409; message = "Already exists"; }
  if (err.type === "entity.parse.failed") { status = 400; message = "Invalid JSON"; }
  if (err.type === "entity.too.large") { status = 413; message = "Request is too large"; }
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 && status !== 503 ? "Something went wrong" : message, ...(err.fields && { fields: err.fields }) });
});

try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`AvodahLoans API on http://localhost:${PORT}`);
    if (!captchaEnabled) console.warn("[captcha] TURNSTILE_SECRET_KEY is not set — captcha checks are OFF");
  });
} catch (err) {
  console.error("Could not connect to MongoDB:", err.message);
  process.exit(1);
}
