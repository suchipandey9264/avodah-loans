import { z } from "zod";
import { EMPLOYMENT, LOAN_TYPES } from "../data/loans.js";
import { HttpError } from "./http.js";

// Request schemas. Keep the field rules in sync with frontend/src/lib/schemas.js.

export const phone = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
export const email = z.string().trim().toLowerCase().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address");
export const personName = z
  .string()
  .trim()
  .min(2, "Enter your full name")
  .max(80, "Name is too long")
  .regex(/^[\p{L}][\p{L} .'-]*$/u, "Name can only contain letters, spaces and . ' -");
export const pan = z.string().trim().toUpperCase().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "PAN format: ABCDE1234F");
export const pincode = z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode");
const loanType = z.enum(LOAN_TYPES.map((t) => t.id), { error: "Unknown loan type" });
const employment = z.enum(EMPLOYMENT.map((e) => e.id), { error: "Unknown employment type" });
const shortText = (max) => z.string().trim().max(max);

/* ---------- auth ---------- */
export const otpCode = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");
export const verifyBody = z.object({ otp: otpCode, name: shortText(80).optional().default("") });

/* ---------- lead forms ---------- */
export const callbackLead = z.object({
  name: personName,
  phone,
  email: email.optional(),
  message: shortText(1000).optional(),
});
export const creditLead = z.object({
  name: personName,
  phone,
  pan,
  consent: z.literal(true, { error: "Please give consent to fetch your report" }),
});

/* ---------- logged-in user data ---------- */
// Applications carry an offer snapshot; known fields are checked, the rest is kept but size-capped.
export const applicationBody = z.looseObject({
  id: shortText(60).min(1, "Lender is required"),
  name: shortText(120).min(1, "Lender name is required"),
  type: loanType,
  loanAmount: z.coerce.number().positive("Loan amount must be positive").max(1e10),
  tenureMonths: z.coerce.number().int().min(1).max(600).optional(),
  rate: z.coerce.number().min(0).max(100).optional(),
  emi: z.coerce.number().min(0).max(1e9).optional(),
  emp: employment.optional(),
  pincode: pincode.optional(),
});

const scalar = z.union([shortText(500), z.number().finite(), z.boolean(), z.null()]);
const profileValue = z.union([scalar, z.record(z.string().regex(/^[\w-]{1,40}$/), scalar)]);
// Free-form profile fields (no dots or $ in keys), with the sensitive ones format-checked when present.
export const profilePatch = z
  .record(z.string().regex(/^[\w-]{1,40}$/, "Invalid field name"), profileValue)
  .superRefine((p, ctx) => {
    const check = (key, schema) => {
      if (typeof p[key] === "string" && p[key] !== "" && !schema.safeParse(p[key]).success) {
        ctx.addIssue({ code: "custom", path: [key], message: schema.safeParse(p[key]).error.issues[0].message });
      }
    };
    check("pan", pan);
    check("pincode", pincode);
    check("email", email);
    if (typeof p.name === "string" && p.name !== "") check("name", personName);
  });

const activityItem = z.record(z.string().max(40), z.unknown()).refine((o) => JSON.stringify(o).length <= 4000, "Item is too large");
export const activityItemBody = activityItem;
export const activityPut = z.object({
  searches: z.array(activityItem).max(100).optional(),
  saved: z.array(activityItem).max(100).optional(),
  compares: z.array(activityItem).max(100).optional(),
  credit: z.array(activityItem).max(100).optional(),
  callbacks: z.array(activityItem).max(100).optional(),
  profile: profilePatch.optional(),
});

/* ---------- public tools ---------- */
export const offersQuery = z.object({
  type: loanType,
  amount: z.coerce.number({ error: "Amount must be a number" }).positive("Amount is required"),
  tenure: z.coerce.number({ error: "Tenure must be a number" }).int().min(1, "Tenure must be 1–30 years").max(30, "Tenure must be 1–30 years"),
  income: z.coerce.number({ error: "Annual income must be a number" }).positive("Annual income is required"),
});
export const emiBody = z.object({
  principal: z.number().positive().max(1e10),
  rate: z.number().min(0).max(100),
  months: z.number().int().min(1).max(600),
});

/** Parses `data` with `schema`, or throws a 400 with the first message plus every field's message. */
export function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  const fields = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  throw new HttpError(400, result.error.issues[0]?.message ?? "Invalid request", { fields });
}
