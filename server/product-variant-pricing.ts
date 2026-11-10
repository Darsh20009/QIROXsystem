import { productVariantSummary } from "@shared/product-variants";
import type { ProductOptionGroup, ProductVariant } from "@shared/schema";

export function applyProductVariantPricing(
  item: Record<string, any>,
  product: Record<string, any>,
): { item?: Record<string, any>; error?: string } {
  const optionGroups = (product.optionGroups || []) as ProductOptionGroup[];
  const variants = (product.variants || []) as ProductVariant[];
  const selectedId = String(item.config?.productVariantId || "");

  if (!variants.length) {
    return selectedId
      ? { error: "هذا المنتج لا يحتوي على التركيبة المحددة. حدّث الصفحة واختر من جديد." }
      : { item };
  }
  if (!product.isActive) return { error: "هذا المنتج غير متاح حاليًا." };
  if (!selectedId) return { error: "اختر مواصفات المنتج قبل إضافته إلى السلة." };

  const variant = variants.find((entry) => entry.id === selectedId);
  if (!variant || !Number.isFinite(Number(variant.price)) || Number(variant.price) < 0) {
    return { error: "تركيبة المنتج لم تعد متاحة. حدّث الصفحة واختر من جديد." };
  }

  const config = item.config && typeof item.config === "object" ? { ...item.config } : {};
  config.productVariantId = variant.id;
  config.variantSummaryAr = productVariantSummary(variant, optionGroups, "ar");
  config.variantSummary = productVariantSummary(variant, optionGroups, "en");

  return {
    item: {
      ...item,
      name: product.name || item.name,
      nameAr: product.nameAr || item.nameAr,
      price: Number(variant.price),
      imageUrl: product.images?.[0] || item.imageUrl,
      config,
    },
  };
}
