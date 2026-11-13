import { randomBytes } from "node:crypto";
import { Router } from "express";
import { HttpError, PHONE_RE, requireFields, requireUser } from "../lib/http.js";
import { ACTIVITY_LISTS, Activity, Application, Lead, User } from "../models/index.js";

// Per-user dashboard data (replaces the browser-only store in frontend/src/lib/activity.js)
// plus public lead forms (callback, credit report).

const r = Router();
const MAX_ITEMS = 100;

const toApp = (a) => ({
  ...a.details,
  ref: a.ref, id: a.lenderId, name: a.lenderName, type: a.type, loanAmount: a.loanAmount,
  tenureMonths: a.tenureMonths, rate: a.rate, emi: a.emi, emp: a.emp, pincode: a.pincode,
  status: a.status, ts: new Date(a.createdAt).getTime(),
});

async function dashboard(userId) {
  const [act, apps, user] = await Promise.all([
    Activity.findOne({ user: userId }).lean(),
    Application.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    User.findById(userId, "profile").lean(),
  ]);
  const out = Object.fromEntries(ACTIVITY_LISTS.map((k) => [k, act?.[k] ?? []]));
  return { ...out, applications: apps.map(toApp), profile: user?.profile ?? {} };
}

const pushItem = (userId, list, item) =>
  Activity.updateOne(
    { user: userId },
    { $push: { [list]: { $each: [item], $position: 0, $slice: MAX_ITEMS } } },
    { upsert: true }
  );

/* ---------- logged-in user ---------- */

r.get("/me/activity", requireUser, async (req, res) => {
  res.json(await dashboard(req.user._id));
});

/** PUT /api/me/activity — replace activity lists (e.g. merge guest activity from the browser after login). */
r.put("/me/activity", requireUser, async (req, res) => {
  const body = req.body ?? {};
  const $set = {};
  for (const k of ACTIVITY_LISTS) {
    if (Array.isArray(body[k])) $set[k] = body[k].slice(0, MAX_ITEMS);
  }
  await Activity.updateOne({ user: req.user._id }, { $set }, { upsert: true });
  if (body.profile && typeof body.profile === "object") await setProfile(req.user._id, body.profile);
  res.json(await dashboard(req.user._id));
});

/** POST /api/me/activity/:list — prepend one item (search, saved offer, compare, …). */
r.post("/me/activity/:list", requireUser, async (req, res) => {
  const { list } = req.params;
  if (!ACTIVITY_LISTS.includes(list)) throw new HttpError(404, "Unknown activity list");
  const item = { ...(req.body ?? {}), ts: Date.now() };
  await pushItem(req.user._id, list, item);
  res.status(201).json(item);
});

async function setProfile(userId, patch) {
  const $set = {};
  for (const [k, v] of Object.entries(patch)) {
    if (/^[\w-]+$/.test(k)) $set[`profile.${k}`] = v; // no dots / $ operators from the client
  }
  if (typeof patch.name === "string" && patch.name.trim()) $set.name = patch.name.trim().slice(0, 80);
  const u = await User.findByIdAndUpdate(userId, { $set }, { new: true, lean: true });
  return u.profile;
}

r.patch("/me/profile", requireUser, async (req, res) => {
  res.json({ profile: await setProfile(req.user._id, req.body ?? {}) });
});

/** POST /api/applications — apply to a lender offer. */
r.post("/applications", requireUser, async (req, res) => {
  requireFields(req.body, ["id", "name", "type", "loanAmount"]);
  const { id, name, type, loanAmount, tenureMonths, rate, emi, emp, pincode, ...details } = req.body;
  delete details.ref; delete details.status; delete details.ts;
  const app = await Application.create({
    ref: "AVD" + randomBytes(4).toString("hex").toUpperCase(),
    user: req.user._id,
    contact: { name: req.user.name, phone: req.user.phone, email: req.user.email },
    lenderId: id, lenderName: name, type, loanAmount: Number(loanAmount),
    tenureMonths, rate, emi, emp, pincode, details,
  });
  res.status(201).json(toApp(app.toObject()));
});

r.get("/applications", requireUser, async (req, res) => {
  const apps = await Application.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(apps.map(toApp));
});

/* ---------- public lead forms ---------- */

function lead(kind, list) {
  return async (req, res) => {
    requireFields(req.body, ["name", "phone"]);
    const { name, phone, email, message, ...details } = req.body;
    if (!PHONE_RE.test(String(phone))) throw new HttpError(400, "Enter a valid 10-digit mobile number");
    await Lead.create({ kind, name: String(name), phone: String(phone), email, message, details, user: req.user?._id });
    if (req.user) await pushItem(req.user._id, list, { name: String(name).trim(), ts: Date.now() });
    // TODO: notify the sales team / CRM here.
    res.status(201).json({ ok: true });
  };
}

r.post("/leads/callback", lead("callback", "callbacks"));
r.post("/leads/credit-report", lead("credit-report", "credit"));

export default r;
