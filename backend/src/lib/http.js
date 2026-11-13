import { createHash } from "node:crypto";
import { Session, User } from "../models/index.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const PHONE_RE = /^[6-9]\d{9}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const sha256 = (s) => createHash("sha256").update(s).digest("hex");

export function requireFields(body, fields) {
  for (const f of fields) {
    if (body?.[f] == null || String(body[f]).trim() === "") throw new HttpError(400, `"${f}" is required`);
  }
}

/** Reads the Bearer token and attaches req.user (or null). */
export async function session(req, _res, next) {
  req.user = null;
  req.tokenHash = null;
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return next();
  const tokenHash = sha256(token);
  const s = await Session.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).lean();
  if (s) {
    req.tokenHash = tokenHash;
    req.user = await User.findById(s.user).lean();
  }
  next();
}

export function requireUser(req, _res, next) {
  if (!req.user) return next(new HttpError(401, "Please log in"));
  next();
}

/** Shape returned to the browser. `id` is the phone or email the user signed in with. */
export const publicUser = (u) => ({
  id: u.phone || u.email,
  name: u.name ?? "",
  phone: u.phone ?? null,
  email: u.email ?? null,
  since: new Date(u.createdAt).getTime(),
  profile: u.profile ?? {},
});
