import { createHash } from "node:crypto";
import { Session, User } from "../models/index.js";

export class HttpError extends Error {
  /** `extra.fields` maps field names to messages (set by validate.parse). */
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.fields = extra.fields;
  }
}

export const sha256 = (s) => createHash("sha256").update(s).digest("hex");

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
