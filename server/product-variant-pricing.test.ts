import assert from "node:assert/strict";
import test from "node:test";
import { applyProductVariantPricing } from "./product-variant-pricing";

const product = {
  isActive: true,
  name: "Laptop",
  nameAr: "حاسوب",
  images: ["/laptop.png"],
  optionGroups: [{
    id: "storage",
    name: "Storage",
    nameAr: "السعة",
    values: [{ id: "256", name: "256 GB", nameAr: "٢٥٦ جيجابايت" }],
  }],
  variants: [{ id: "variant-256", choices: { storage: "256" }, price: 4200 }],
};

test("uses the catalog's final variant price, not a client-provided price", () => {
  const result = applyProductVariantPricing({
    type: "product",
    refId: "product-id",
    price: 1,
    config: { productVariantId: "variant-256" },
  }, product);
  assert.equal(result.error, undefined);
  assert.equal(result.item?.price, 4200);
  assert.equal(result.item?.nameAr, "حاسوب");
  assert.equal(result.item?.config.variantSummaryAr, "السعة: ٢٥٦ جيجابايت");
});

test("rejects missing or unknown variant identifiers", () => {
  assert.match(applyProductVariantPricing({ config: {} }, product).error || "", /اختر مواصفات/);
  assert.match(applyProductVariantPricing({ config: { productVariantId: "forged" } }, product).error || "", /لم تعد متاحة/);
});

test("keeps legacy products without variants unchanged", () => {
  const legacyItem = { price: 5, name: "Old item", config: {} };
  const result = applyProductVariantPricing(legacyItem, { variants: [] });
  assert.deepEqual(result.item, legacyItem);
});
