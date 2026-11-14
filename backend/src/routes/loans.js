import { Router } from "express";
import { DOCUMENTS, ELIGIBILITY, EMPLOYMENT, LENDER_KINDS, LOAN_TYPES, getOffers } from "../data/loans.js";
import { emi } from "../lib/emi.js";
import { HttpError } from "../lib/http.js";
import { emiBody, offersQuery, parse } from "../lib/validate.js";
import { Lender } from "../models/index.js";

const r = Router();
const PUBLIC = "-_id -__v -createdAt -updatedAt -active -order";
const activeLenders = (filter = {}) => Lender.find({ active: true, ...filter }, PUBLIC).sort({ order: 1 }).lean();

r.get("/loan-types", (_req, res) => res.json(LOAN_TYPES));
r.get("/employment-types", (_req, res) => res.json(EMPLOYMENT));

r.get("/lenders", async (req, res) => {
  const filter = {};
  if (typeof req.query.kind === "string") filter.kind = req.query.kind;
  if (typeof req.query.type === "string") filter["products.type"] = req.query.type;
  res.json({ kinds: LENDER_KINDS, lenders: await activeLenders(filter) });
});

r.get("/lenders/:id", async (req, res) => {
  const ids = (await Lender.find({ active: true }, "id").sort({ order: 1 }).lean()).map((l) => l.id);
  const i = ids.indexOf(req.params.id);
  if (i < 0) throw new HttpError(404, "Lender not found");
  res.json({
    lender: await Lender.findOne({ id: req.params.id }, PUBLIC).lean(),
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

  const lenders = await activeLenders({ "products.type": type.id });
  const offers = getOffers({ type: type.id, amount, tenure, annualIncome }, emi, lenders).map((o) => ({ ...o, tenureMonths: tenure * 12 }));
  res.json({ type: type.id, amount, tenure, annualIncome, count: offers.length, offers });
});

/** POST /api/emi { principal, rate, months } */
r.post("/emi", (req, res) => {
  const { principal, rate, months } = parse(emiBody, req.body);
  const monthly = emi(principal, rate, months);
  res.json({ emi: monthly, totalPayment: monthly * months, totalInterest: monthly * months - principal });
});

export default r;
