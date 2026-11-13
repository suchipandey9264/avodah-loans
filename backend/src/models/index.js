import mongoose from "mongoose";

const { Schema, model } = mongoose;
const Mixed = Schema.Types.Mixed;
const UserRef = { type: Schema.Types.ObjectId, ref: "User", required: true, index: true };

/* ---------- Lender catalogue ---------- */

const productSchema = new Schema(
  {
    type: { type: String, required: true },
    rate: { type: Number, required: true },
    maxAmount: Number,
    maxTenure: Number,
    features: [String],
  },
  { _id: false }
);

export const Lender = model(
  "Lender",
  new Schema(
    {
      id: { type: String, required: true, unique: true }, // slug, e.g. "sbi"
      name: { type: String, required: true }, // short brand name
      fullName: String, // full / registered name
      logo: String,
      kind: { type: String, enum: ["PVT Bank", "PSU Bank", "HFC", "NBFC"], index: true },
      tier: Number,
      order: { type: Number, index: true }, // display order
      products: [productSchema],
      fee: String,
      about: String,
      lowestRate: Number,
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

/* ---------- Users & auth ---------- */

// A user signs in with a mobile number OR an email address (or later links both).
export const User = model(
  "User",
  new Schema(
    {
      name: { type: String, trim: true, maxlength: 80 },
      phone: { type: String, unique: true, sparse: true },
      email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
      profile: { type: Mixed, default: {} }, // personal + employment details from the dashboard
    },
    { timestamps: true, minimize: false }
  )
);

// OTPs and sessions store a SHA-256 hash, never the raw value. TTL indexes delete them when they expire.
export const Otp = model(
  "Otp",
  new Schema({
    identifier: { type: String, required: true, unique: true }, // phone number or lower-cased email
    codeHash: { type: String, required: true },
    tries: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, expires: 0 },
  })
);

export const Session = model(
  "Session",
  new Schema(
    {
      tokenHash: { type: String, required: true, unique: true },
      user: UserRef,
      expiresAt: { type: Date, required: true, expires: 0 },
    },
    { timestamps: true }
  )
);

/* ---------- Dashboard activity ---------- */

export const ACTIVITY_LISTS = ["searches", "saved", "compares", "credit", "callbacks"];

export const Activity = model(
  "Activity",
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
      searches: { type: [Mixed], default: [] },
      saved: { type: [Mixed], default: [] },
      compares: { type: [Mixed], default: [] },
      credit: { type: [Mixed], default: [] },
      callbacks: { type: [Mixed], default: [] },
    },
    { timestamps: true }
  )
);

/* ---------- Applications & leads ---------- */

export const Application = model(
  "Application",
  new Schema(
    {
      ref: { type: String, required: true, unique: true },
      user: UserRef,
      contact: { name: String, phone: String, email: String }, // snapshot for the ops team
      lenderId: { type: String, required: true },
      lenderName: String,
      type: { type: String, required: true },
      loanAmount: { type: Number, required: true },
      tenureMonths: Number,
      rate: Number,
      emi: Number,
      emp: String,
      pincode: String,
      status: { type: String, enum: ["submitted", "in_review", "approved", "rejected", "disbursed"], default: "submitted" },
      details: { type: Mixed, default: {} }, // anything else the offer snapshot carried
    },
    { timestamps: true }
  )
);

export const Lead = model(
  "Lead",
  new Schema(
    {
      kind: { type: String, enum: ["callback", "credit-report"], required: true, index: true },
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true },
      email: String,
      message: String,
      user: { type: Schema.Types.ObjectId, ref: "User" }, // set when the visitor was logged in
      details: { type: Mixed, default: {} },
      handled: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);
