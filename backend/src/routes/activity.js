import { randomBytes } from "node:crypto";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { ACTIVITY_LISTS, activities, applications, leads, users } from "../db/schema.js";
import { requireCaptcha } from "../lib/captcha.js";
import { db } from "../lib/db.js";
import { HttpError, requireUser } from "../lib/http.js";
import { leadLimiter } from "../lib/limits.js";
import { activityItemBody, activityPut, applicationBody, callbackLead, creditLead, parse, profilePatch } from "../lib/validate.js";

// Per-user dashboard data (replaces the browser-only store in frontend/src/lib/activity.js)
// plus public lead forms (callback, credit report).

const r = Router();
const MAX_ITEMS = 100;
const json = (value) => sql`${JSON.stringify(value)}::jsonb`;

const toApp = (a) => ({
  ...a.details,
  ref: a.ref, id: a.lenderId, name: a.lenderName, type: a.type, loanAmount: a.loanAmount,
  tenureMonths: a.tenureMonths, rate: a.rate, emi: a.emi, emp: a.emp, pincode: a.pincode,
  status: a.status, ts: new Date(a.createdAt).getTime(),
});

const userApplications = (userId) =>
  db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));

async function dashboard(userId) {
  const [[act], apps, [user]] = await Promise.all([
    db.select().from(activities).where(eq(activities.userId, userId)).limit(1),
    userApplications(userId),
    db.select({ profile: users.profile }).from(users).where(eq(users.id, userId)).limit(1),
  ]);
  const out = Object.fromEntries(ACTIVITY_LISTS.map((k) => [k, act?.[k] ?? []]));
  return { ...out, applications: apps.map(toApp), profile: user?.profile ?? {} };
}

/** Prepends `item` to one activity list, keeping the newest MAX_ITEMS. */
const pushItem = (userId, list, item) =>
  db
    .insert(activities)
    .values({ userId, [list]: [item] })
    .onConflictDoUpdate({
      target: activities.userId,
      set: { [list]: sql`jsonb_path_query_array(jsonb_build_array(${json(item)}) || ${activities[list]}, ${`$[0 to ${MAX_ITEMS - 1}]`}::jsonpath)` },
    });

/* ---------- logged-in user ---------- */

r.get("/me/activity", requireUser, async (req, res) => {
  res.json(await dashboard(req.user.id));
});

/** PUT /api/me/activity — replace activity lists (e.g. merge guest activity from the browser after login). */
r.put("/me/activity", requireUser, async (req, res) => {
  const body = parse(activityPut, req.body);
  const lists = Object.fromEntries(ACTIVITY_LISTS.filter((k) => body[k]).map((k) => [k, body[k]]));
  if (Object.keys(lists).length) {
    await db.insert(activities).values({ userId: req.user.id, ...lists }).onConflictDoUpdate({ target: activities.userId, set: lists });
  }
  if (body.profile) await setProfile(req.user.id, body.profile);
  res.json(await dashboard(req.user.id));
});

/** POST /api/me/activity/:list — prepend one item (search, saved offer, compare, …). */
r.post("/me/activity/:list", requireUser, async (req, res) => {
  const { list } = req.params;
  if (!ACTIVITY_LISTS.includes(list)) throw new HttpError(404, "Unknown activity list");
  const item = { ...parse(activityItemBody, req.body), ts: Date.now() };
  await pushItem(req.user.id, list, item);
  res.status(201).json(item);
});

/** Shallow-merges `patch` into the user's profile (keys already validated: no dots / $ operators). */
async function setProfile(userId, patch) {
  const set = { profile: sql`${users.profile} || ${json(patch)}` };
  if (typeof patch.name === "string" && patch.name) set.name = patch.name;
  // Only update while the merged profile stays small (stops one account growing its row without limit).
  const merged = sql`${users.profile} || ${json(patch)}`;
  const [u] = await db
    .update(users)
    .set(set)
    .where(and(eq(users.id, userId), sql`(select count(*) from jsonb_object_keys(${merged})) <= 60`))
    .returning({ profile: users.profile });
  if (!u) throw new HttpError(400, "Profile has too many fields");
  return u.profile;
}

r.patch("/me/profile", requireUser, async (req, res) => {
  res.json({ profile: await setProfile(req.user.id, parse(profilePatch, req.body)) });
});

/** POST /api/applications — apply to a lender offer. */
r.post("/applications", requireUser, async (req, res) => {
  const { id, name, type, loanAmount, tenureMonths, rate, emi, emp, pincode, ...details } = parse(applicationBody, req.body);
  delete details.ref; delete details.status; delete details.ts;
  if (JSON.stringify(details).length > 8000) throw new HttpError(400, "Application details are too large");
  const [{ n }] = await db.select({ n: count() }).from(applications).where(eq(applications.userId, req.user.id));
  if (n >= 50) throw new HttpError(429, "You have too many applications — contact support to apply for more");
  const [app] = await db
    .insert(applications)
    .values({
      ref: "AVD" + randomBytes(4).toString("hex").toUpperCase(),
      userId: req.user.id,
      contact: { name: req.user.name, phone: req.user.phone, email: req.user.email },
      lenderId: id, lenderName: name, type, loanAmount,
      tenureMonths, rate, emi, emp, pincode, details,
    })
    .returning();
  res.status(201).json(toApp(app));
});

r.get("/applications", requireUser, async (req, res) => {
  res.json((await userApplications(req.user.id)).map(toApp));
});

/* ---------- public lead forms (rate-limited + captcha) ---------- */

function lead(kind, list, schema) {
  return async (req, res) => {
    const { name, phone, email, message, ...details } = parse(schema, req.body);
    await db.insert(leads).values({ kind, name, phone, email, message, details, userId: req.user?.id });
    if (req.user) await pushItem(req.user.id, list, { name, ts: Date.now() });
    // TODO: notify the sales team / CRM here.
    res.status(201).json({ ok: true });
  };
}

r.post("/leads/callback", leadLimiter, requireCaptcha, lead("callback", "callbacks", callbackLead));
r.post("/leads/credit-report", leadLimiter, requireCaptcha, lead("credit-report", "credit", creditLead));

export default r;
