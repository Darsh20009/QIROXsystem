# REACT_STANDARDS.md — QIROX React Frontend Standards

> **Source of truth:** docs/UI_RULES.md, docs/UX_RULES.md, docs/DESIGN_SYSTEM.md, docs/PROJECT_STRUCTURE.md  
> **Scope:** client/src/ — all React components, pages, hooks, and utilities  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the implementation rules for all React code in the QIROX frontend. These rules are derived directly from audit findings in the docs/ directory. They govern component structure, state management, routing, UI states, and bilingual/RTL requirements.

---

## Rules

### R-REACT-001 — Every Page Must Handle Three States
Every page component that fetches data must handle:
1. **Loading state** — Show `<Skeleton>` or spinner while `isLoading` is true
2. **Error state** — Show error card with retry button when query fails
3. **Empty state** — Show illustrated empty state for list pages with no data

Missing loading states per docs/UI_RULES.md UI-002. Missing error states per UI-003. Missing empty states per UI-004.

### R-REACT-002 — Use TanStack Query v5 Object Syntax Only
TanStack Query v5 requires object form exclusively:
```typescript
// CORRECT
useQuery({ queryKey: ['/api/orders'], queryFn: fetchOrders })
// FORBIDDEN
useQuery(['/api/orders'], fetchOrders)  // v4 syntax
```

### R-REACT-003 — Query Keys Must Use Array Segments for Hierarchical Data
```typescript
// CORRECT — cache invalidation works properly
queryKey: ['/api/orders', orderId]
// FORBIDDEN — breaks targeted invalidation
queryKey: [`/api/orders/${orderId}`]
```

### R-REACT-004 — Mutations Must Invalidate Cache
Every `useMutation` that changes data must call `queryClient.invalidateQueries()` on success with the relevant query keys.

### R-REACT-005 — All Forms Must Use React Hook Form + Zod
Forms use `useForm` from `@/components/ui/form` (shadcn wrapper) with `zodResolver`. No uncontrolled inputs. No manual state for form fields. Always provide `defaultValues`.

### R-REACT-006 — All Destructive Actions Require Confirmation
Every "Delete", "Cancel", "Remove", "Reset", or irreversible action must present an `AlertDialog` confirmation before proceeding. Per docs/UX_RULES.md UX-005.

### R-REACT-007 — No Hardcoded Arabic or English Strings in JSX
All user-visible strings must use the i18n hook from `client/src/lib/i18n.tsx`. No raw string literals in JSX. Mixed hardcoded + i18n strings are forbidden. Per docs/UI_RULES.md UI-009.

### R-REACT-008 — Zod Error Messages Must Be in Arabic for Arabic-First Forms
Use `zod.setErrorMap()` to provide Arabic validation error messages. English default Zod messages ("String must contain at least 8 character(s)") are forbidden in user-facing forms. Per docs/UI_RULES.md UI-008.

### R-REACT-009 — Use Logical CSS Properties (RTL-First)
Use Tailwind logical properties for RTL-compatible layouts:
- `ms-*` / `me-*` instead of `ml-*` / `mr-*`
- `ps-*` / `pe-*` instead of `pl-*` / `pr-*`
- `start-*` / `end-*` instead of `left-*` / `right-*`
Per docs/BRAND_BLUEPRINT.md Section 11 and docs/DESIGN_SYSTEM.md DS-004.

### R-REACT-010 — Respect `prefers-reduced-motion`
All Framer Motion animations must check `useReducedMotion()` and skip or simplify animations when the user prefers reduced motion. Per docs/BRAND_BLUEPRINT.md Section 5.

### R-REACT-011 — Use Lucide React for UI Icons; react-icons for Brand Icons Only
Standardize on Lucide React for all UI icons. Use `react-icons` only for brand/social icons not available in Lucide. Never use `SiLinkedin` — use Lucide `Linkedin` instead. Per docs/DESIGN_SYSTEM.md DS-005 and memory: react-icons v5 breaking change.

### R-REACT-012 — Every Interactive Element Must Have `data-testid`
All buttons, inputs, links, and elements displaying meaningful data must have a `data-testid` attribute following the pattern: `{action}-{target}` or `{type}-{content}-{id}` for dynamic elements.

### R-REACT-013 — No Direct `import React` (JSX Transform Handles It)
The Vite setup has an automatic JSX transform. Do not add `import React from 'react'`.

### R-REACT-014 — Session Expiry Must Be Handled Gracefully
On any API response returning 401, display a login modal without losing current page state. Do not silently redirect. Per docs/UX_RULES.md UX-004.

### R-REACT-015 — Pages Must Use Correct Layout Wrapper
Each page must use its role-appropriate layout:
- Public pages → `PublicLayout`
- Admin pages → `AdminLayout`
- Employee pages → `EmployeeLayout`
- Client pages → `ClientLayout`
- Merchant pages → `MerchantLayout`
Per docs/UI_RULES.md UI-001.

---

## Allowed

- `useCallback` and `useMemo` where performance benefit is measurable
- Dynamic imports (`React.lazy`) for heavy components (Monaco Editor, charts)
- `data-[state]` attributes on interactive elements for CSS-driven state styling
- Arabic-Indic numerals (٠١٢٣) in Arabic UI context; Western (0123) in technical contexts
- Custom hooks in `client/src/hooks/` for shared stateful logic

---

## Forbidden

- Raw `useState` for form fields (use React Hook Form)
- `window.location.href` for navigation (use Wouter `useLocation`)
- `document.querySelector` in component bodies (use refs)
- Hard-coded pixel values for spacing (use Tailwind scale)
- Inline `style={{ marginLeft: ... }}` for layout (use Tailwind logical properties)
- `console.log` anywhere in client/ source code
- Duplicate translation strings — add to i18n, do not inline

---

## Examples

### Loading / Error / Empty Pattern
```typescript
function OrdersList() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/orders'],
  });

  if (isLoading) return <OrdersListSkeleton />;
  if (isError) return <ErrorCard onRetry={refetch} />;
  if (!data?.length) return <EmptyState icon={ShoppingCart} titleKey="orders.empty" />;

  return <OrdersTable orders={data} />;
}
```

### Correct Mutation Pattern
```typescript
const mutation = useMutation({
  mutationFn: (id: string) => apiRequest('DELETE', `/api/orders/${id}`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    toast({ title: t('order.deleted') });
  },
});
```

---

## Checklist

- [ ] All three states handled (loading, error, empty)
- [ ] TanStack Query v5 object syntax used
- [ ] Mutation invalidates cache on success
- [ ] Forms use React Hook Form + Zod
- [ ] Destructive actions use AlertDialog confirmation
- [ ] No hardcoded strings — i18n keys used
- [ ] RTL logical properties used (`ms-`, `me-`, `ps-`, `pe-`)
- [ ] `prefers-reduced-motion` respected in animations
- [ ] `data-testid` on all interactive elements
- [ ] Correct layout wrapper used for role

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Missing loading skeleton | Add `if (isLoading) return <Skeleton />` |
| Missing error handler | Add `if (isError) return <ErrorCard onRetry={refetch} />` |
| Using `ml-4` instead of `ms-4` | RTL: use `ms-4` (margin-start) |
| Using v4 Query syntax | Use `useQuery({ queryKey: [...] })` object form |
| Hardcoded Arabic string | Extract to i18n key |
| Delete without confirm | Wrap in `<AlertDialog>` |

---

## Future Scalability Considerations

- As the page count grows beyond 166, enforce the feature-folder structure from docs/PROJECT_STRUCTURE.md — domain folders under `client/src/features/`
- Consider React Server Components (RSC) for public pages when migrating to SSR (docs/EXECUTION_PLAN.md Phase 5)
- The custom i18n system may need to be replaced with `react-i18next` for external translation management as the team grows
- Storybook should be introduced once shared components stabilize to document the design system
