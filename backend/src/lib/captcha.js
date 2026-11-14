import { HttpError } from "./http.js";

// Cloudflare Turnstile. Set TURNSTILE_SECRET_KEY to turn verification on; without it the check is skipped
// (handy for local work, never for production).
const SECRET = process.env.TURNSTILE_SECRET_KEY?.trim();
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const captchaEnabled = Boolean(SECRET);

export async function verifyCaptcha(token, ip) {
  if (!SECRET) return;
  if (typeof token !== "string" || !token || token.length > 2048) {
    throw new HttpError(400, "Please complete the security check");
  }
  let data;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret: SECRET, response: token, ...(ip && { remoteip: ip }) }),
      signal: AbortSignal.timeout(8000),
    });
    data = await res.json();
  } catch {
    throw new HttpError(503, "Security check is unavailable right now — please try again");
  }
  if (!data?.success) throw new HttpError(400, "Security check failed — please try again");
}

/** Express middleware: verifies `captchaToken` from the JSON body, then removes it. */
export async function requireCaptcha(req, _res, next) {
  await verifyCaptcha(req.body?.captchaToken, req.ip);
  if (req.body) delete req.body.captchaToken;
  next();
}
