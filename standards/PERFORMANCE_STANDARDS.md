# PERFORMANCE_STANDARDS.md — QIROX Performance Standards

> **Source of truth:** docs/SEO_ENGINEERING.md, docs/DATABASE_BLUEPRINT.md, docs/API_BLUEPRINT.md, docs/EXECUTION_PLAN.md  
> **Scope:** Frontend bundle, API response times, database queries, caching  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the performance targets and implementation rules for the QIROX platform. Derived from docs/SEO_ENGINEERING.md (Core Web Vitals targets) and docs/DATABASE_BLUEPRINT.md (query optimization plan).

---

## Rules

### R-PERF-001 — Core Web Vitals Targets
Per docs/EXECUTION_PLAN.md Phase 5 success criteria:
| Metric | Target |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.1 |
| INP (Interaction to Next Paint) | < 200ms |
| Lighthouse Performance Score | > 80 on public pages |
| Lighthouse SEO Score | > 95 on public pages |

### R-PERF-002 — No Unbounded Database Queries
`Model.find()` without `.limit()` is forbidden in route handlers. All list queries enforce a default limit of 50 and a maximum of 100. Per docs/DATABASE_BLUEPRINT.md Section 5.

### R-PERF-003 — Heavy Aggregations Must Be Cached
Endpoints that run MongoDB aggregation pipelines (analytics, profit reports, finance summaries) must cache results in `server/cache.ts`:
| Endpoint Type | Cache TTL |
|---|---|
| `/api/public/settings` | 5 minutes |
| `/api/services` | 10 minutes |
| `/api/admin/analytics` | 15 minutes |
| `/api/admin/profit-report` | 30 minutes |
Per docs/API_BLUEPRINT.md Section 6.

### R-PERF-004 — PDFs Must Not Be Regenerated on Every Request
Invoice, Quotation, and Receipt PDFs must be cached to disk after first generation. Serve the cached file on subsequent requests. Only regenerate when the underlying document changes. Per docs/API_BLUEPRINT.md Section 6.

### R-PERF-005 — `ParticleCanvas.tsx` Must Be Disabled on Mobile
The particle animation component must check if the device is mobile (`window.innerWidth < 768` or `prefers-reduced-motion`) and skip rendering entirely. Per docs/BRAND_BLUEPRINT.md Section 5.

### R-PERF-006 — Images Must Be Optimized (WebP + srcset)
All images used in public-facing pages must be:
- Served in WebP format (with JPEG/PNG fallback)
- Sized with `srcset` for different viewport widths
- Lazy-loaded with `loading="lazy"` except above-the-fold hero images
Per docs/EXECUTION_PLAN.md Phase 5.

### R-PERF-007 — Monaco Editor Must Be Lazy-Loaded
Monaco Editor is a heavy dependency (~2MB). It must be loaded with `React.lazy()` and a `<Suspense>` boundary on any page that uses it. Do not include it in the main bundle. Per docs/UI_RULES.md UI-006.

### R-PERF-008 — Vite Manual Chunk Splitting Must Be Maintained
The `vite.config.ts` `manualChunks` configuration must be maintained when adding new heavy dependencies:
- `vendor-react` — react, react-dom
- `vendor-query` — @tanstack/react-query
- `vendor-ui` — lucide-react, framer-motion
- `vendor-form` — react-hook-form, @hookform/resolvers

### R-PERF-009 — Notification Unread Count Must Be Pushed via WebSocket
The notification unread count must not be fetched by polling. It must be updated via WebSocket push events when a new notification is created. Per docs/DATABASE_BLUEPRINT.md Section 5 (N+1 optimization).

### R-PERF-010 — N+1 Queries Are Forbidden
Routes that return a list of documents with nested references must use `.populate()` or a `$lookup` aggregation — never a loop of individual queries. Per docs/DATABASE_BLUEPRINT.md Section 5.

### R-PERF-011 — Response Compression Is Required
Gzip/Brotli compression via the `compression` middleware must remain active on all routes. Do not bypass it for any route except SSE streams. Per server/index.ts (already in place — maintain).

---

## Allowed

- `Promise.all()` for parallel independent database queries
- In-memory cache for read-heavy, infrequently-changed data
- Stale-while-revalidate pattern for public API endpoints
- Database aggregation pipelines for complex analytics (with mandatory caching)
- Service workers for static asset caching (Cache First strategy for JS/CSS/fonts)

---

## Forbidden

- `Model.find()` without `.limit()` — OOM risk under load
- Heavy aggregations without caching — repeated `$group` on millions of documents
- PDF regeneration on every request — unnecessary CPU and disk I/O
- Particle animations on mobile — known performance killer
- Monaco Editor in the main bundle — adds ~2MB to initial load
- Notification unread count via polling — WebSocket push is mandatory
- N+1 query loops (individual DB lookups per list item)

---

## Examples

### Cached Aggregation Endpoint
```typescript
router.get('/admin/analytics', requireRole('admin'), async (req, res, next) => {
  try {
    const cacheKey = 'admin-analytics';
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const data = await OrderModel.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$status', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    cache.set(cacheKey, data, 15 * 60); // 15 minute TTL
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
```

### Lazy-Loaded Monaco
```typescript
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

function SandboxIDE() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <MonacoEditor language="javascript" value={code} onChange={setCode} />
    </Suspense>
  );
}
```

---

## Checklist

- [ ] All list queries have `.limit(50)` default
- [ ] Heavy aggregations cached with appropriate TTL
- [ ] PDFs cached to disk after first generation
- [ ] Particle animation disabled on mobile
- [ ] Monaco Editor lazy-loaded
- [ ] Images in WebP + srcset on public pages
- [ ] Vite chunk splits maintained when adding heavy deps
- [ ] Notification count pushed via WebSocket (not polled)
- [ ] No N+1 query loops — use `.populate()` or `$lookup`

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `InvoiceModel.find()` — no limit | Add `.limit(50).skip(skip)` |
| Calling profit report aggregation on every page load | Cache result for 30 minutes |
| Generating PDF on every `/api/invoices/:id/pdf` request | Check if cached PDF exists; return it; only regenerate on change |
| Import Monaco at top of sandbox page | `React.lazy(() => import('@monaco-editor/react'))` |
| Fetching notification count every 5 seconds | Subscribe to WS `notification` event — update count in real time |

---

## Future Scalability Considerations

- When Render instance count increases, move in-memory cache to Redis (shared across instances)
- CDN (Cloudflare) in front of the server will handle static asset caching and edge compression
- When AI endpoint usage grows, implement request queuing to prevent cost spikes from concurrent LLM calls
- Consider read replicas on MongoDB Atlas for analytics/reporting queries to offload the primary
- Image optimization pipeline (WebP conversion on upload) should run server-side to avoid client-side processing overhead
