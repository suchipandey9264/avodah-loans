import { randomBytes, randomInt } from "node:crypto";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { otps, sessions, users } from "../db/schema.js";
import { requireCaptcha } from "../lib/captcha.js";
import { db } from "../lib/db.js";
import { HttpError, publicUser, requireUser, sha256 } from "../lib/http.js";
import { otpContactLimiter, otpIpLimiter, verifyLimiter } from "../lib/limits.js";
import { email, parse, phone, verifyBody } from "../lib/validate.js";

const r = Router();
// Demo mode (any 6 digits log in) must be switched on explicitly, and is refused in production (see server.js).
export const DEMO = process.env.OTP_DEMO === "true";
const OTP_TTL = 5 * 60 * 1000;
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

/** Accepts { phone } or { email }; returns { field, value } or throws a 400. */
function identify(body) {
  if (body?.email != null && String(body.email).trim()) {
    return { field: "email", value: parse(z.object({ email }), { email: String(body.email) }).email };
  }
  return { field: "phone", value: parse(z.object({ phone }), { phone: String(body?.phone ?? "") }).phone };
}

/** POST /api/auth/otp { phone } | { email }, captchaToken — sends a 6-digit OTP by SMS or email. */
r.post("/otp", otpIpLimiter, otpContactLimiter, requireCaptcha, async (req, res) => {
  const { field, value } = identify(req.body);
  const code = String(randomInt(100000, 1000000));
  const entry = { codeHash: sha256(code), tries: 0, expiresAt: new Date(Date.now() + OTP_TTL) };
  await db.insert(otps).values({ identifier: value, ...entry }).onConflictDoUpdate({ target: otps.identifier, set: entry });
  // TODO: send `code` by SMS (MSG91, Twilio…) when field === "phone", or by email (Resend, SES, Nodemailer…) when "email".
  if (DEMO) console.log(`[otp] ${value} → ${code}`);
  res.json({ sent: true, channel: field, expiresIn: OTP_TTL / 1000, ...(DEMO && { devOtp: code }) });
});

/** POST /api/auth/verify { phone | email, otp, name? } → { token, user } */
r.post("/verify", verifyLimiter, async (req, res) => {
  const { field, value } = identify(req.body);
  const { otp, name } = parse(verifyBody, req.body);

  // Demo mode mirrors the old front-end behaviour: any 6 digits work.
  if (!DEMO) {
    const [entry] = await db
      .update(otps)
      .set({ tries: sql`${otps.tries} + 1` })
      .where(and(eq(otps.identifier, value), lt(otps.tries, 5), gt(otps.expiresAt, new Date())))
      .returning({ codeHash: otps.codeHash });
    if (!entry) throw new HttpError(400, "Code expired or too many attempts — request a new one");
    if (entry.codeHash !== sha256(otp)) throw new HttpError(400, "Incorrect code");
  }
  await db.delete(otps).where(eq(otps.identifier, value));

  // Find-or-create the user by phone/email; update the name when one was given.
  const [user] = await db
    .insert(users)
    .values({ [field]: value, ...(name && { name }) })
    .onConflictDoUpdate({ target: users[field], set: name ? { name } : { [field]: value } })
    .returning();

  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({ tokenHash: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL) });
  res.json({ token, user: publicUser(user) });
});

r.get("/me", requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

r.post("/logout", async (req, res) => {
  if (req.tokenHash) await db.delete(sessions).where(eq(sessions.tokenHash, req.tokenHash));
  res.json({ ok: true });
});

export default r;
