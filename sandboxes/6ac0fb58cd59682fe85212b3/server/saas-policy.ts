import { hasSaasExtraFeature } from "./saas-extra-features";
import type { Request, Response, NextFunction } from "express";
const rank: Record<string, number> = { lite: 1, pro: 2, infinity: 3 };
const rules: Array<[RegExp, number]> = [
  [/^\/api\/(?:inventory|raw-items|recipes|stock|stocktake|warehouses|branch-stock|suppliers)(?:\/|$)/, 3],
  [/^\/api\/(?:analytics|advanced-reports|bi-analytics)(?:\/|$)/, 3],
  [/^\/api\/reports\/(?!sales(?:\/|$)|employee-sales(?:\/|$))[^/]+(?:\/|$)/, 3],
  [/^\/api\/(?:attendance|hr|human-resources|payroll|employees\/(?:attendance|payroll))(?:\/|$)/, 3],
  [/^\/api\/(?:accounting|reports(?:\/(?:sales|employee-sales))?)(?:\/|$)/, 2],
  [/^\/api\/(?:loyalty|customer\/loyalty|loyalty-config|referrals)(?:\/|$)/, 2],
  [/^\/api\/(?:customer-management|crm|customers\/(?:management|admin)|admin\/customers)(?:\/|$)/, 2],
  [/^\/api\/(?:reviews|ratings)(?:\/|$)/, 2],
  [/^\/api\/(?:wallet|apple-wallet|wallet-passes)(?:\/|$)/, 2],
  [/^\/api\/(?:integrations|integration|webhooks|pwa)(?:\/|$)/, 2],
  [/^\/api\/(?:payments?|pay|payment-gateway|payment-methods|refunds)(?:\/|$)/, 2],
  [/^\/api\/(?:push|email)(?:\/|$)/, 2],
];
export function requiredTierForPath(path: string): number {
  return rules.reduce((minimum, [pattern, tier]) => pattern.test(path) ? Math.max(minimum, tier) : minimum, 1);
}
export function isFeatureAvailable(path: string, tier: string): boolean {
  const configured = rank[String(tier || "").toLowerCase()] || 0;
  return configured >= requiredTierForPath(path);
}
export function isPlanManagementMutation(method: string, path: string): boolean {
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
  const isManagementPath = /^\/api\/(?:admin\/)?(?:plans?|plan[-_]features?|subscriptions?(?:[-_](?:config|features?|plan))?)(?:\/|$)/i.test(path)
    || /^\/api\/admin\/.*(?:plan|subscription)/i.test(path)
    || /(?:switch|upgrade|downgrade|change)[-_]?plan|plan[-_]features?/i.test(path);
  return isMutation && isManagementPath;
}
export function isDemoApiPath(path: string): boolean {
  return /^\/api\/(?:admin\/)?demo(?:\/|-|$)|^\/api\/admin\/(?:demo-customers|demo-orders|demo-stats)(?:\/|$)/i.test(path);
}
export function saasFeatureGate(req: Request, res: Response, next: NextFunction) {
  const configured = rank[String(process.env.PROJECT_PLAN_TIER || "").toLowerCase()] || 0;
  if (!configured) return res.status(503).json({ error: "PROJECT_PLAN_TIER is not configured" });
  if (isPlanManagementMutation(req.method, req.path)) {
    return res.status(404).json({ error: "Not found" });
  }
  if (isDemoApiPath(req.path)) return res.status(404).json({ error: "Not found" });
  if (!isFeatureAvailable(req.path, process.env.PROJECT_PLAN_TIER || "") && !hasSaasExtraFeature(req.path)) return res.status(403).json({ error: "This feature is not available in the active project plan", code: "featureNotIncluded" });
  const tenantId = String(process.env.TENANT_ID || "");
  if (!tenantId) return res.status(503).json({ error: "TENANT_ID is not configured" });
  if (req.path.startsWith("/api")) {
    (req as any).tenantId = tenantId;
    req.headers["x-tenant-id"] = tenantId;
    req.headers["x-tenant"] = tenantId;
    const currentQuery = (req.query || {}) as Record<string, unknown>;
    const query = { ...currentQuery, tenantId };
    if (Object.prototype.hasOwnProperty.call(currentQuery, "cafeId")) query.cafeId = tenantId;
    Object.defineProperty(req, "query", { configurable: true, writable: true, value: query });
    if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
      req.body.tenantId = tenantId;
      if (Object.prototype.hasOwnProperty.call(req.body, "cafeId")) req.body.cafeId = tenantId;
    }
    let params: Record<string, unknown> = {};
    Object.defineProperty(req, "params", {
      configurable: true,
      get: () => params,
      set: (value: Record<string, unknown>) => {
        params = value && typeof value === "object" ? { ...value } : {};
        if (Object.prototype.hasOwnProperty.call(params, "tenantId")) params.tenantId = tenantId;
        if (Object.prototype.hasOwnProperty.call(params, "cafeId")) params.cafeId = tenantId;
      },
    });
  }
  next();
}
