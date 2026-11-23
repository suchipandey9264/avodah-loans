// Run: node --test src/routes/documents.test.js
import assert from "node:assert/strict";
import test from "node:test";
import { cleanName, sniff } from "./documents.js";

test("sniff detects file type from content, not the name", () => {
  assert.equal(sniff(Buffer.from("%PDF-1.7\n")), "application/pdf");
  assert.equal(sniff(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(sniff(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), "image/png");
  assert.equal(sniff(Buffer.from("<html><script>")), null);
  assert.equal(sniff(Buffer.from("")), null);
});

test("cleanName strips folders and unsafe characters", () => {
  assert.equal(cleanName("C:\\fakepath\\pan card.pdf"), "pan card.pdf");
  assert.equal(cleanName('../../a"<b>.pdf'), "a__b_.pdf");
  assert.equal(cleanName(""), "document");
  assert.equal(cleanName("x".repeat(200) + ".pdf").length, 120);
  assert.ok(cleanName("x".repeat(200) + ".pdf").endsWith(".pdf"));
});
