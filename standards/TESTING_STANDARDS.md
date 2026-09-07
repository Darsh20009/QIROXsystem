# TESTING_STANDARDS.md — QIROX Testing Standards

> **Source of truth:** docs/EXECUTION_PLAN.md Phase 7, docs/API_BLUEPRINT.md, docs/SECURITY.md  
> **Scope:** tests/ directory — unit, integration, and E2E tests  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the testing requirements, organization, and coverage targets for QIROX. Testing is introduced in docs/EXECUTION_PLAN.md Phase 7. Before Phase 7, critical paths are manually verified; after Phase 7, automated tests gate all merges.

---

## Rules

### R-TEST-001 — Test Directory Structure
```
tests/
├── unit/
│   ├── services/      — pure service function tests
│   └── utils/         — utility function tests
├── integration/
│   ├── auth/          — auth flow tests
│   ├── payments/      — payment flow tests
│   └── ai/            — AI tool executor tests
└── e2e/
    ├── public/        — public page flows
    ├── client-portal/ — client role flows
    └── admin/         — admin role flows
```
Per docs/PROJECT_STRUCTURE.md.

### R-TEST-002 — Critical Path Integration Tests Are Mandatory
The following integration test suites are required before production deployment (Phase 7):
1. **Auth flow** — register, login, 2FA, logout, session expiry
2. **Payment flow** — PayPal create + capture, wallet pay, bank transfer proof upload
3. **AI tool executor** — tool argument validation, `$`-operator rejection
Per docs/EXECUTION_PLAN.md Phase 7.

### R-TEST-003 — Auth Tests Must Cover Role Boundary Conditions
Every integration test that hits a protected route must include:
- A test with no session → expects 401
- A test with wrong role → expects 403
- A test with correct role → expects 200/201

### R-TEST-004 — Wallet Tests Must Cover Race Conditions
Wallet payment tests must include a concurrent payment test: two simultaneous requests to deduct from the same wallet with insufficient combined balance — only one must succeed. This validates MongoDB transaction atomicity.

### R-TEST-005 — Health Endpoint Test
`GET /api/health` must be tested: expects 200 with DB connection status and uptime in under 500ms. Per docs/EXECUTION_PLAN.md Phase 7.

### R-TEST-006 — All Tests Must Run in Under 2 Minutes (Full Suite)
The full integration test suite must complete in under 2 minutes in CI. Long-running tests (>30s each) must be split or parallelized.

### R-TEST-007 — Tests Must Use a Separate Test Database
Integration tests must never run against the production MongoDB Atlas cluster. Use either:
- A separate `MONGODB_URI_TEST` connection string pointing to a test database
- MongoDB Memory Server (`mongodb-memory-server`) for self-contained tests

### R-TEST-008 — Test Data Must Be Cleaned Up After Each Test
Each integration test must clean up the documents it creates (afterEach or afterAll teardown). No test may depend on state left by a previous test.

### R-TEST-009 — E2E Tests Must Cover the 11 User Role Portals
E2E tests must cover at least one critical flow per user role:
- Admin: create user, view analytics
- Manager: assign project, view team attendance
- Client: submit order, view invoice, pay with wallet
- Employee roles: check-in, view tasks
Per docs/PERMISSIONS.md Section 3.

### R-TEST-010 — CI Must Block Merge on Test Failure
No code may be merged to the main branch if any test suite fails. This is a hard CI/CD gate — not advisory.

---

## Allowed

- Mocking external APIs (OpenAI, PayPal, SMTP) in integration tests — do not make real API calls in tests
- Snapshot tests for UI components that are stable and well-defined
- `beforeAll` database seeding for read-only test data shared across a suite
- Parallel test execution across different test files

---

## Forbidden

- Tests that hit the production MongoDB Atlas cluster
- Tests that leave data in the database after completion (missing teardown)
- Tests that depend on execution order (each test must be independent)
- Skipping tests with `it.skip()` without a documented reason
- Tests that call real OpenAI/PayPal/SMTP APIs (use mocks)

---

## Examples

### Auth Integration Test Structure
```typescript
describe('POST /api/auth/login', () => {
  it('returns 401 when credentials are invalid', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 and sets session cookie on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'ValidPass123' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
```

### Role Boundary Test
```typescript
describe('GET /api/admin/users', () => {
  it('returns 401 without session', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 for client role', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', clientSession);
    expect(res.status).toBe(403);
  });

  it('returns 200 for admin role', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminSession);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

---

## Checklist

- [ ] Test directory structure matches docs/PROJECT_STRUCTURE.md
- [ ] Integration tests for auth, payments, AI tool executor
- [ ] Each protected route tested with: no session (401), wrong role (403), correct role (200)
- [ ] Wallet concurrency test included
- [ ] Health endpoint test included
- [ ] Tests use separate test database (not production)
- [ ] Each test cleans up created data in teardown
- [ ] CI blocks merge on test failure
- [ ] External APIs mocked (no real calls in tests)

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Tests hitting production Atlas | Use `MONGODB_URI_TEST` or memory server |
| No `afterEach` cleanup | Add `await UserModel.deleteMany({ testData: true })` in afterEach |
| Tests running in a fixed order | Make each test independent; no shared mutable state |
| `it.skip()` without explanation | Add `// TODO: unskip when SEC-CRIT-002 is resolved` |
| Calling real OpenAI in AI tests | Mock with `jest.mock('openai')` or `nock` |

---

## Future Scalability Considerations

- As API surface grows beyond 710 endpoints, generate test stubs from the OpenAPI spec (Phase 3 output)
- Contract testing (Pact) between mobile app and API server will catch breaking API changes before release
- Visual regression testing (Percy or Chromatic) for the design system components as the team grows
- Load testing (k6 or autocannon) should be run before each major release to verify rate limiters and DB pool configuration under traffic spikes
