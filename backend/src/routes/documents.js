import { createHash } from "node:crypto";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import express, { Router } from "express";
import { DOCUMENT_TYPES, documents, timelineEvents } from "../db/crm.js";
import { db } from "../lib/db.js";
import { HttpError, requireUser } from "../lib/http.js";

// Loan documents the logged-in customer uploads (PAN, Aadhaar, salary slips…).
// They land in the CRM's `documents` table, where staff verify or reject them.

const r = Router();
const MAX_BYTES = 5 * 1024 * 1024; // the CRM's documents_size_check allows up to 5 MB
const MAX_FILES = 30;

/** The file type from its first bytes (same rule as the CRM). The browser's Content-Type and file name can't be trusted. */
export function sniff(buf) {
  if (buf.length >= 5 && buf.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  return null;
}

/** Base name only, with the CRM's safe character set, at most 120 characters (keeping the extension). */
export const cleanName = (s) =>
  (String(s ?? "").split(/[\\/]/).pop().trim().replace(/[^\w.\- ()]/g, "_").slice(-120)) || "document";

const meta = {
  id: documents.id, kind: documents.docType, name: documents.fileName, mime: documents.mimeType, size: documents.sizeBytes,
  status: documents.status, note: documents.note, createdAt: documents.createdAt,
};
const toDoc = ({ createdAt, ...d }) => ({ ...d, ts: new Date(createdAt).getTime() });
const mine = (req, id) => and(eq(documents.id, id), eq(documents.customerId, req.user.id), isNull(documents.deletedAt));
const event = (tx, req, type, m) => tx.insert(timelineEvents).values({ entityType: "customer", entityId: req.user.id, type, actorId: req.user.id, meta: m });

r.get("/me/documents", requireUser, async (req, res) => {
  const rows = await db.select(meta).from(documents)
    .where(and(eq(documents.customerId, req.user.id), isNull(documents.deletedAt)))
    .orderBy(desc(documents.createdAt));
  res.json(rows.map(toDoc));
});

/** POST /api/me/documents?kind=pan&name=pan.pdf — the request body is the raw file (PDF, JPG or PNG, ≤ 5 MB). */
r.post("/me/documents", requireUser, express.raw({ type: () => true, limit: MAX_BYTES }), async (req, res) => {
  const kind = String(req.query.kind ?? "");
  if (!DOCUMENT_TYPES.includes(kind)) throw new HttpError(400, "Pick a document type");
  const data = Buffer.isBuffer(req.body) ? req.body : null;
  if (!data?.length) throw new HttpError(400, "The file is empty");
  const mime = sniff(data);
  if (!mime) throw new HttpError(415, "Only PDF, JPG or PNG files can be uploaded");

  const live = and(eq(documents.customerId, req.user.id), isNull(documents.deletedAt));
  const [{ n }] = await db.select({ n: count() }).from(documents).where(live);
  if (n >= MAX_FILES) throw new HttpError(429, `You can keep up to ${MAX_FILES} documents — delete one to upload another`);
  const sha256 = createHash("sha256").update(data).digest("hex");
  const [dup] = await db.select({ id: documents.id }).from(documents).where(and(live, eq(documents.sha256, sha256))).limit(1);
  if (dup) throw new HttpError(409, "You’ve already uploaded this exact file");

  const fileName = cleanName(req.query.name);
  const doc = await db.transaction(async (tx) => {
    const [row] = await tx.insert(documents)
      .values({ customerId: req.user.id, docType: kind, fileName, mimeType: mime, sizeBytes: data.length, sha256, content: data, uploadedBy: req.user.id })
      .returning(meta);
    await event(tx, req, "document_uploaded", { documentId: row.id, docType: kind, fileName, source: "website" });
    return row;
  });
  res.status(201).json(toDoc(doc));
});

r.get("/me/documents/:id", requireUser, async (req, res) => {
  const [doc] = await db.select({ name: documents.fileName, mime: documents.mimeType, content: documents.content })
    .from(documents).where(mine(req, req.params.id)).limit(1);
  if (!doc) throw new HttpError(404, "Document not found");
  res.set({
    "Content-Type": doc.mime,
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  });
  res.send(doc.content);
});

/** Soft delete, like the CRM. Verified documents stay: the lender file already relies on them. */
r.delete("/me/documents/:id", requireUser, async (req, res) => {
  const [doc] = await db.select({ status: documents.status, kind: documents.docType, name: documents.fileName })
    .from(documents).where(mine(req, req.params.id)).limit(1);
  if (!doc) throw new HttpError(404, "Document not found");
  if (doc.status === "verified") throw new HttpError(409, "This document is already verified — ask your advisor to replace it");
  await db.transaction(async (tx) => {
    await tx.update(documents).set({ deletedAt: new Date(), deletedBy: req.user.id }).where(eq(documents.id, req.params.id));
    await event(tx, req, "document_deleted", { documentId: req.params.id, docType: doc.kind, fileName: doc.name, source: "website" });
  });
  res.status(204).end();
});

export default r;
