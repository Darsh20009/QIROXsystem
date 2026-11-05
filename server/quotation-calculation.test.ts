import test from "node:test";
import assert from "node:assert/strict";
import { calculateQuotationTotals } from "./quotation-calculation";

test("quotation discount reduces the VAT base and final total", () => {
  const totals = calculateQuotationTotals(
    [{ name: "Service", qty: 2, unitPrice: 100 }],
    15,
    10,
  );
  assert.equal(totals.amount, 200);
  assert.equal(totals.discountAmount, 20);
  assert.equal(totals.vatAmount, 27);
  assert.equal(totals.totalAmount, 207);
});

test("zero VAT and zero discount are preserved", () => {
  const totals = calculateQuotationTotals([{ name: "Service", qty: 1, unitPrice: 99.99 }], 0, 0);
  assert.equal(totals.vatAmount, 0);
  assert.equal(totals.discountAmount, 0);
  assert.equal(totals.totalAmount, 99.99);
});

test("invalid line items and rates are rejected", () => {
  assert.throws(() => calculateQuotationTotals([], 15, 0));
  assert.throws(() => calculateQuotationTotals([{ name: "Bad", qty: -1, unitPrice: 10 }]));
  assert.throws(() => calculateQuotationTotals([{ name: "Service", qty: 1, unitPrice: 1 }], 101, 0));
});
