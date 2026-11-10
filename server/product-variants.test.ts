import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProductVariantMatrix,
  productVariantSummary,
  validateProductVariantData,
} from "../shared/product-variants";
import type { ProductOptionGroup, ProductVariant } from "../shared/schema";

const groups: ProductOptionGroup[] = [
  {
    id: "storage",
    name: "Storage",
    nameAr: "السعة",
    values: [
      { id: "128", name: "128 GB", nameAr: "١٢٨ جيجابايت" },
      { id: "256", name: "256 GB", nameAr: "٢٥٦ جيجابايت" },
    ],
  },
  {
    id: "color",
    name: "Color",
    nameAr: "اللون",
    values: [
      { id: "black", name: "Black", nameAr: "أسود" },
      { id: "white", name: "White", nameAr: "أبيض" },
    ],
  },
];

test("builds every option combination and preserves saved final prices", () => {
  const saved: ProductVariant[] = [
    { id: "saved-variant", choices: { storage: "128", color: "black" }, price: 1299 },
  ];
  const result = buildProductVariantMatrix(groups, saved, 1000);
  assert.equal(result.error, undefined);
  assert.equal(result.variants.length, 4);
  assert.equal(result.variants.find((variant) => variant.id === "saved-variant")?.price, 1299);
  assert.equal(result.variants.find((variant) => variant.choices.storage === "256" && variant.choices.color === "white")?.price, 1000);
});

test("rejects duplicate or incomplete variant definitions", () => {
  assert.equal(validateProductVariantData(groups, []), "ولّد تركيبات الخيارات وحدد سعرًا نهائيًا لكل تركيبة.");
  const valid = buildProductVariantMatrix(groups, [], 1000).variants;
  assert.equal(validateProductVariantData(groups, valid), null);
  assert.match(validateProductVariantData(groups, [valid[0], { ...valid[0], id: "duplicate" }]) || "", /تركيبات مكررة/);
});

test("shows localized option labels in the selected variant summary", () => {
  const variant: ProductVariant = { id: "v", choices: { storage: "256", color: "black" }, price: 1500 };
  assert.equal(productVariantSummary(variant, groups, "ar"), "السعة: ٢٥٦ جيجابايت · اللون: أسود");
  assert.equal(productVariantSummary(variant, groups, "en"), "Storage: 256 GB · Color: Black");
});
