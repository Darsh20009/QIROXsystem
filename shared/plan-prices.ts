export const PLAN_PRICES = {
  restaurant: { lite: { sm: 399, yr: 899, life: 5299 }, pro: { sm: 799, yr: 1699, life: 9299 }, infinity: { sm: 1699, yr: 3299, life: 17299 } },
  ecommerce: { lite: { sm: 649, yr: 1349, life: 7599 }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  education: { lite: { sm: 999, yr: 1849, life: 9699 }, pro: { sm: 2099, yr: 3599, life: 17199 }, infinity: { sm: 4087, yr: 6787, life: 30787 } },
  healthcare: { lite: { sm: 1248, yr: 1948, life: 8198 }, pro: { sm: 2238, yr: 3388, life: 13788 }, infinity: { sm: 3899, yr: 5999, life: 25299 } },
  realestate: { lite: { sm: 649, yr: 1349, life: 7599 }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  corporate: { lite: { sm: 1249, yr: 2399, life: 12799 }, pro: { sm: 2599, yr: 4899, life: 25299 }, infinity: { sm: 5399, yr: 9999, life: 50799 } },
  fitness: { lite: { sm: 649, yr: 1349, life: 7599 }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  beauty: { lite: { sm: 998, yr: 1498, life: 5898 }, pro: { sm: 1788, yr: 2688, life: 10288 }, infinity: { sm: 3199, yr: 4799, life: 18799 } },
  events: { lite: { sm: 649, yr: 1349, life: 7599 }, pro: { sm: 1249, yr: 2399, life: 12799 }, infinity: { sm: 2399, yr: 4499, life: 23799 } },
  marketing: { lite: { sm: 899, yr: 1749, life: 9599 }, pro: { sm: 1699, yr: 3199, life: 16799 }, infinity: { sm: 3099, yr: 5799, life: 29799 } },
  ai: { lite: { sm: 1249, yr: 2399, life: 12799 }, pro: { sm: 2599, yr: 4899, life: 25299 }, infinity: { sm: 5399, yr: 9999, life: 50799 } },
  other: { lite: { sm: 0, yr: 0, life: 0 }, pro: { sm: 0, yr: 0, life: 0 }, infinity: { sm: 0, yr: 0, life: 0 } },
} as const;

/** Policy used when a customer asks for a project outside the published packages. */
export const CUSTOM_QUOTE_BASE_WEBSITE_VALUE = 5000;
export const CUSTOM_QUOTE_MULTIPLIER = 4;
export const CUSTOM_QUOTE_BASE_PRICE = CUSTOM_QUOTE_BASE_WEBSITE_VALUE * CUSTOM_QUOTE_MULTIPLIER;

type PlanTier = "lite" | "pro" | "infinity" | "infinite";

function normalizeTier(tier: string): "lite" | "pro" | "infinity" {
  return tier === "infinite" ? "infinity" : tier as "lite" | "pro" | "infinity";
}

function normalizeSector(segment: string): keyof typeof PLAN_PRICES {
  const value = segment.toLowerCase();
  if (value in PLAN_PRICES) return value as keyof typeof PLAN_PRICES;
  if (["store", "commerce", "e-commerce"].includes(value)) return "ecommerce";
  return "other";
}

export function multiYearPlanPrice(annual: number, years: number) {
  let total = 0;
  for (let i = 0; i < years; i++) total += annual * Math.max(1 - i * 0.05, 0.6);
  return Math.round(total);
}

export function getPlanPrice(
  tier: string,
  period: string,
  segment: string,
  years = Number(period.match(/^(\d+)y$/)?.[1] || 2),
) {
  if (!(["lite", "pro", "infinity", "infinite"] as PlanTier[]).includes(tier as PlanTier)) return 0;
  const prices = PLAN_PRICES[normalizeSector(segment)][normalizeTier(tier)];
  if (period === "sixmonth") return prices.sm;
  if (period === "annual") return prices.yr;
  if (period === "lifetime") return prices.life;
  if (period === "multiyear" || /^\d+y$/.test(period)) return multiYearPlanPrice(prices.yr, Math.max(1, years));
  return 0;
}