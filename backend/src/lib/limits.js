import { ipKeyGenerator, rateLimit } from "express-rate-limit";

// In-memory counters: fine for a single server. With several instances, give each limiter a shared store (e.g. Redis).

const limiter = ({ minutes, limit, message, keyGenerator }) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ...(keyGenerator && { keyGenerator }),
    handler: (_req, res, _next, options) => {
      res.set("Retry-After", String(Math.ceil(options.windowMs / 1000)));
      res.status(429).json({ error: message });
    },
  });

/** Whole API, per IP. */
export const apiLimiter = limiter({ minutes: 15, limit: 300, message: "Too many requests — please slow down and try again shortly." });

/** Sending OTPs, per IP. */
export const otpIpLimiter = limiter({ minutes: 10, limit: 5, message: "Too many codes requested — please wait 10 minutes and try again." });

/** Sending OTPs, per phone number or email (stops one number being spammed from many IPs). */
export const otpContactLimiter = limiter({
  minutes: 10,
  limit: 3,
  message: "Too many codes sent to this number or email — please wait 10 minutes.",
  keyGenerator: (req) => {
    const contact = String(req.body?.email || req.body?.phone || "").trim().toLowerCase();
    return contact ? `contact:${contact}` : ipKeyGenerator(req.ip);
  },
});

/** Verifying OTPs, per IP. */
export const verifyLimiter = limiter({ minutes: 10, limit: 10, message: "Too many attempts — please wait 10 minutes and try again." });

/** Public lead forms (callback, credit report), per IP. */
export const leadLimiter = limiter({ minutes: 60, limit: 5, message: "You’ve sent several requests already — please try again in an hour." });
