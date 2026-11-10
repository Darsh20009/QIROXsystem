import type { ProductOptionGroup, ProductVariant } from "./schema";

const MAX_OPTION_GROUPS = 8;
const MAX_VALUES_PER_GROUP = 30;
const MAX_VARIANTS = 200;

export function variantCombinationKey(choices: Record<string, string>): string {
  return Object.keys(choices).sort().map((key) => `${key}:${choices[key]}`).join("|");
}

function createVariantId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `variant_${cryptoApi.randomUUID()}`;
  return `variant_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function buildProductVariantMatrix(
  groups: ProductOptionGroup[],
  existing: ProductVariant[],
  defaultPrice: number,
): { variants: ProductVariant[]; error?: string } {
  if (!groups.length) return { variants: [] };
  if (groups.length > MAX_OPTION_GROUPS) return { variants: [], error: `يمكن إضافة ${MAX_OPTION_GROUPS} خصائص كحد أقصى.` };
  if (groups.some((group) => !group.values?.length)) return { variants: [], error: "أضف قيمة واحدة على الأقل لكل خاصية." };

  let combinations: Record<string, string>[] = [{}];
  for (const group of groups) {
    if (group.values.length > MAX_VALUES_PER_GROUP) {
      return { variants: [], error: `الحد الأقصى ${MAX_VALUES_PER_GROUP} قيمة لكل خاصية.` };
    }
    combinations = combinations.flatMap((combination) =>
      group.values.map((value) => ({ ...combination, [group.id]: value.id })),
    );
    if (combinations.length > MAX_VARIANTS) {
      return { variants: [], error: `عدد التركيبات يتجاوز الحد الآمن (${MAX_VARIANTS}). قلّل عدد القيم.` };
    }
  }

  const existingByKey = new Map(existing.map((variant) => [variantCombinationKey(variant.choices || {}), variant]));
  return {
    variants: combinations.map((choices) => {
      const previous = existingByKey.get(variantCombinationKey(choices));
      return {
        id: previous?.id || createVariantId(),
        choices,
        price: Number.isFinite(Number(previous?.price)) ? Number(previous?.price) : defaultPrice,
      };
    }),
  };
}

export function validateProductVariantData(
  groups: ProductOptionGroup[] | undefined,
  variants: ProductVariant[] | undefined,
): string | null {
  const optionGroups = groups || [];
  const productVariants = variants || [];
  if (!optionGroups.length) return productVariants.length ? "لا يمكن حفظ التركيبات دون خصائص." : null;
  if (optionGroups.length > MAX_OPTION_GROUPS) return `الحد الأقصى ${MAX_OPTION_GROUPS} خصائص.`;
  if (!productVariants.length) return "ولّد تركيبات الخيارات وحدد سعرًا نهائيًا لكل تركيبة.";
  if (productVariants.length > MAX_VARIANTS) return `الحد الأقصى ${MAX_VARIANTS} تركيبة.`;

  const groupIds = new Set<string>();
  for (const group of optionGroups) {
    if (!group?.id || !group.name?.trim() || !group.nameAr?.trim() || groupIds.has(group.id)) {
      return "أدخل اسمًا عربيًا وإنجليزيًا فريدًا لكل خاصية.";
    }
    groupIds.add(group.id);
    if (!Array.isArray(group.values) || !group.values.length || group.values.length > MAX_VALUES_PER_GROUP) {
      return `أضف من 1 إلى ${MAX_VALUES_PER_GROUP} قيمة لكل خاصية.`;
    }
    const valueIds = new Set<string>();
    for (const value of group.values) {
      if (!value?.id || !value.name?.trim() || !value.nameAr?.trim() || valueIds.has(value.id)) {
        return "أدخل قيمة عربية وإنجليزية فريدة لكل خيار.";
      }
      valueIds.add(value.id);
    }
  }

  const variantIds = new Set<string>();
  const combinationKeys = new Set<string>();
  for (const variant of productVariants) {
    if (!variant?.id || variantIds.has(variant.id)) return "معرّفات التركيبات يجب أن تكون فريدة.";
    variantIds.add(variant.id);
    if (!Number.isFinite(Number(variant.price)) || Number(variant.price) < 0) return "أدخل سعرًا نهائيًا صحيحًا لكل تركيبة.";
    const choices = variant.choices || {};
    if (Object.keys(choices).length !== optionGroups.length) return "كل تركيبة يجب أن تحتوي على قيمة من كل خاصية.";
    for (const group of optionGroups) {
      if (!group.values.some((value) => value.id === choices[group.id])) return "إحدى التركيبات تحتوي على خيار غير موجود.";
    }
    const key = variantCombinationKey(choices);
    if (combinationKeys.has(key)) return "توجد تركيبات مكررة.";
    combinationKeys.add(key);
  }
  return null;
}

export function productVariantSummary(
  variant: ProductVariant,
  groups: ProductOptionGroup[],
  language: "ar" | "en" = "ar",
): string {
  return groups
    .map((group) => {
      const value = group.values.find((option) => option.id === variant.choices?.[group.id]);
      if (!value) return null;
      const groupName = language === "ar" ? group.nameAr : group.name;
      const valueName = language === "ar" ? value.nameAr : value.name;
      return `${groupName}: ${valueName}`;
    })
    .filter(Boolean)
    .join(" · ");
}
