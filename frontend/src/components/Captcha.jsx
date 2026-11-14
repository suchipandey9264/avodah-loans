import { useEffect, useImperativeHandle, useRef } from "react";

// Cloudflare Turnstile, rendered invisibly: most visitors never see it; a checkbox appears only when
// Cloudflare wants a human check. Set VITE_TURNSTILE_SITE_KEY to enable; without it, getToken() resolves to undefined.

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
export const captchaEnabled = Boolean(SITE_KEY);

let scriptPromise;
function loadTurnstile() {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => { scriptPromise = undefined; reject(new Error("load")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export class CaptchaError extends Error {}

/**
 * <Captcha ref={captcha} /> then `await captcha.current.getToken()` right before submitting.
 * Each token is single-use; getToken() always fetches a fresh one.
 */
export function Captcha({ ref, theme = "light", className = "" }) {
  const box = useRef(null);
  const widget = useRef(null);
  const pending = useRef(null);

  const settle = (fn, value) => {
    const p = pending.current;
    pending.current = null;
    if (p) { clearTimeout(p.timer); p[fn](value); }
  };

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !box.current) return;
        widget.current = ts.render(box.current, {
          sitekey: SITE_KEY,
          theme,
          execution: "execute",
          appearance: "interaction-only",
          callback: (token) => settle("resolve", token),
          "error-callback": () => { settle("reject", new CaptchaError("Security check failed — please try again.")); return true; },
          "expired-callback": () => window.turnstile?.reset(widget.current),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widget.current != null) window.turnstile?.remove(widget.current);
      widget.current = null;
      settle("reject", new CaptchaError("Security check was interrupted."));
    };
  }, [theme]);

  useImperativeHandle(ref, () => ({
    async getToken() {
      if (!SITE_KEY) return undefined;
      let ts;
      try {
        ts = await loadTurnstile();
      } catch {
        throw new CaptchaError("The security check couldn’t load. Check your connection and try again.");
      }
      if (widget.current == null) throw new CaptchaError("The security check is still loading — try again in a moment.");
      settle("reject", new CaptchaError("Security check was restarted."));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => settle("reject", new CaptchaError("The security check timed out — please try again.")), 60000);
        pending.current = { resolve, reject, timer };
        ts.reset(widget.current);
        ts.execute(widget.current);
      });
    },
  }));

  if (!SITE_KEY) return null;
  return <div ref={box} className={className} />;
}
