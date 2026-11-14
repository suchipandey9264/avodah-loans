import { z } from "zod";
import { formatShort } from "./emi";

// Form schemas. Keep the field rules in sync with backend/src/lib/validate.js.

export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."));
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address, like name@example.com.");
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name as on your PAN card.")
  .max(80, "That name is too long.")
  .regex(/^[\p{L}][\p{L} .'-]*$/u, "Use letters, spaces and . ' - only.");
export const panSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{5}\d{4}[A-Z]$/, "PAN format: ABCDE1234F");
export const pincodeSchema = z.string().trim().regex(/^[1-9]\d{5}$/, "Enter your 6-digit residential pincode.");

/** Login: name plus either a mobile number or an email. */
export const loginSchema = (method) =>
  z.object({
    name: nameSchema,
    contact: method === "phone" ? phoneSchema : emailSchema,
  });

export const otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/, "Enter all 6 digits of the code.") });

export const callbackSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name.").pipe(nameSchema),
  phone: phoneSchema,
});

export const creditReportSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  pan: panSchema,
  consent: z.literal(true, { error: "Please give consent to fetch your report." }),
});

/** Search details step; the amount range depends on the loan type. */
export const detailsSchema = (type) =>
  z.object({
    amount: z
      .number()
      .positive("Enter the loan amount you need.")
      .min(type.min, `Enter an amount between ${formatShort(type.min)} and ${formatShort(type.max)}.`)
      .max(type.max, `Enter an amount between ${formatShort(type.min)} and ${formatShort(type.max)}.`),
    pincode: pincodeSchema,
    income: z.number().min(100000, "Enter your annual income (minimum ₹1,00,000)."),
  });

/**
 * Runs `schema` on `data`. Returns { data, errors } where `errors` maps each failing field to its
 * first message ({} when valid) and `data` is the parsed value (undefined when invalid).
 */
export function check(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data, errors: {} };
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    errors[key] ??= issue.message;
  }
  return { data: undefined, errors };
}
