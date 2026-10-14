const permissions: Array<[string, RegExp]> = [
  ["accounting", /^\/api\/accounting(?:\/|$)/],
  ["sales-reports", /^\/api\/reports\/(?:sales|employee-sales)(?:\/|$)/],
  ["advanced-reports", /^\/api\/(?:analytics|advanced-reports|bi-analytics|reports)(?:\/|$)/],
  ["inventory", /^\/api\/(?:inventory|raw-items|recipes|stock|stocktake|warehouses|branch-stock|suppliers)(?:\/|$)/],
  ["attendance", /^\/api\/(?:attendance|hr|human-resources|payroll|employees\/(?:attendance|payroll))(?:\/|$)/],
  ["customer-management", /^\/api\/(?:customer-management|crm|customers\/(?:management|admin)|admin\/customers)(?:\/|$)/],
  ["reviews", /^\/api\/(?:reviews|ratings)(?:\/|$)/],
  ["apple-wallet", /^\/api\/(?:wallet|apple-wallet|wallet-passes)(?:\/|$)/],
  ["integrations", /^\/api\/(?:integrations|integration|webhooks|email)(?:\/|$)/],
  ["pwa", /^\/api\/pwa(?:\/|$)/],
  ["payments", /^\/api\/(?:payments?|pay|payment-gateway|payment-methods|refunds)(?:\/|$)/],
  ["loyalty", /^\/api\/(?:loyalty|customer\/loyalty|loyalty-config|referrals)(?:\/|$)/],
  ["push", /^\/api\/push(?:\/|$)/],
];

export function hasSaasExtraFeature(path: string, input?: any): boolean {
  try {
    const config = input || JSON.parse(process.env.BUSINESS_CONFIG_JSON || "{}");
    const features = new Set(Array.isArray(config.extraFeatures) ? config.extraFeatures : []);
    return permissions.some(([id, pattern]) => features.has(id) && pattern.test(path));
  } catch { return false; }
}