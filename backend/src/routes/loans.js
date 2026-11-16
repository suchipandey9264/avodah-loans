import { and, asc, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { DOCUMENTS, ELIGIBILITY, EMPLOYMENT, LENDER_KINDS, LOAN_TYPES, getOffers } from "../data/loans.js";
import { emi } from "../lib/emi.js";
import { HttpError } from "../lib/http.js";
import { emiBody, offersQuery, parse } from "../lib/validate.js";
import { lenders } from "../db/schema.js";
import { db } from "../lib/db.js";

const r = Router();
// Columns the browser sees (no timestamps / active flag / sort order).
const PUBLIC = {
  id: lenders.id, name: lenders.name, fullName: lenders.fullName, logo: lenders.logo, kind: lenders.kind,
  tier: lenders.tier, products: lenders.products, fee: lenders.fee, about: lenders.about, lowestRate: lenders.lowestRate,
};
const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null));

/** Active lenders in display order; optionally only one kind and/or those offering a loan type. */
async function activeLenders({ kind, type } = {}) {
  const where = [eq(lenders.active, true)];
  if (kind) where.push(eq(lenders.kind, kind));
  if (type) where.push(sql`${lenders.products} @> ${JSON.stringify([{ type }])}::jsonb`);
  const rows = await db.select(PUBLIC).from(lenders).where(and(...where)).orderBy(asc(lenders.sortOrder));
  return rows.map(compact);
}

r.get("/loan-types", (_req, res) => res.json(LOAN_TYPES));
r.get("/employment-types", (_req, res) => res.json(EMPLOYMENT));

r.get("/lenders", async (req, res) => {
  const kind = typeof req.query.kind === "string" ? req.query.kind : undefined;
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  res.json({ kinds: LENDER_KINDS, lenders: await activeLenders({ kind, type }) });
});

r.get("/lenders/:id", async (req, res) => {
  const ids = (await db.select({ id: lenders.id }).from(lenders).where(eq(lenders.active, true)).orderBy(asc(lenders.sortOrder))).map((l) => l.id);
  const i = ids.indexOf(req.params.id);
  if (i < 0) throw new HttpError(404, "Lender not found");
  res.json({
    lender: compact((await db.select(PUBLIC).from(lenders).where(eq(lenders.id, req.params.id)).limit(1))[0]),
    prev: ids[(i - 1 + ids.length) % ids.length],
    next: ids[(i + 1) % ids.length],
    eligibility: ELIGIBILITY,
    documents: DOCUMENTS,
  });
});

/** GET /api/offers?type=home&amount=3500000&tenure=20&income=1200000 */
r.get("/offers", async (req, res) => {
  const q = parse(offersQuery, req.query);
  const type = LOAN_TYPES.find((t) => t.id === q.type);
  const { amount, tenure, income: annualIncome } = q;
  if (!(amount >= type.min && amount <= type.max)) throw new HttpError(400, `Amount must be between ${type.min} and ${type.max}`, { fields: { amount: "Out of range" } });

  const list = await activeLenders({ type: type.id });
  const offers = getOffers({ type: type.id, amount, tenure, annualIncome }, emi, list).map((o) => ({ ...o, tenureMonths: tenure * 12 }));
  res.json({ type: type.id, amount, tenure, annualIncome, count: offers.length, offers });
});

/** POST /api/emi { principal, rate, months } */
r.post("/emi", (req, res) => {
  const { principal, rate, months } = parse(emiBody, req.body);
  const monthly = emi(principal, rate, months);
  res.json({ emi: monthly, totalPayment: monthly * months, totalInterest: monthly * months - principal });
});

export default r;
