import { randomBytes, randomInt } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { HttpError, publicUser, requireUser, sha256 } from "../lib/http.js";
import { requireCaptcha } from "../lib/captcha.js";
import { otpContactLimiter, otpIpLimiter, verifyLimiter } from "../lib/limits.js";
import { email, parse, phone, verifyBody } from "../lib/validate.js";
import { Otp, Session, User } from "../models/index.js";

const r = Router();
const DEMO = process.env.OTP_DEMO !== "false";
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
  await Otp.findOneAndUpdate(
    { identifier: value },
    { codeHash: sha256(code), tries: 0, expiresAt: new Date(Date.now() + OTP_TTL) },
    { upsert: true }
  );
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
    const entry = await Otp.findOne({ identifier: value });
    if (!entry || entry.expiresAt < new Date()) throw new HttpError(400, "Code expired — request a new one");
    if (entry.tries >= 5) throw new HttpError(429, "Too many attempts — request a new code");
    if (entry.codeHash !== sha256(otp)) {
      await Otp.updateOne({ _id: entry._id }, { $inc: { tries: 1 } });
      throw new HttpError(400, "Incorrect code");
    }
  }
  await Otp.deleteOne({ identifier: value });

  const update = { $setOnInsert: { [field]: value } };
  if (name) update.$set = { name };
  const user = await User.findOneAndUpdate({ [field]: value }, update, { upsert: true, new: true, lean: true });

  const token = randomBytes(32).toString("hex");
  await Session.create({ tokenHash: sha256(token), user: user._id, expiresAt: new Date(Date.now() + SESSION_TTL) });
  res.json({ token, user: publicUser(user) });
});

r.get("/me", requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

r.post("/logout", async (req, res) => {
  if (req.tokenHash) await Session.deleteOne({ tokenHash: req.tokenHash });
  res.json({ ok: true });
});

export default r;
