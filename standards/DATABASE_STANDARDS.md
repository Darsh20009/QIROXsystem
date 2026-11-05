# DATABASE_STANDARDS.md — QIROX Database Standards

> **Source of truth:** docs/DATABASE.md, docs/DATABASE_BLUEPRINT.md, docs/ARCHITECTURE.md  
> **Scope:** server/models/, MongoDB Atlas, Mongoose schemas  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the rules for all database work in QIROX. Derived from docs/DATABASE.md audit findings. MongoDB (Mongoose) is the primary database. PostgreSQL (Drizzle) status is undecided — do not use until clarified per docs/DATABASE.md DB-004.

---

## Rules

### R-DB-001 — One Model Per File
Every Mongoose model lives in its own file under `server/models/`. Naming: `{domain}.model.ts`. No file may define more than one top-level model. Per docs/ARCHITECTURE.md ISSUE-ARCH-002 and docs/DATABASE.md DB-001.

### R-DB-002 — Required Indexes on All Models
Every model must define indexes for all fields used in queries. At minimum:
- All foreign key / reference fields (`userId`, `orderId`, `projectId`)
- `status` on any model filtered by status
- `createdAt` on any time-series collection
- Compound indexes for fields always queried together
Per docs/DATABASE_BLUEPRINT.md Section 4.

### R-DB-003 — TTL Indexes on Expiring Collections
Collections that accumulate indefinitely must have TTL indexes:
- `notifications`: 30-day TTL on `createdAt`
- `activity_logs`: 90-day TTL on `createdAt`
- `otps`: TTL on `expiresAt`
Per docs/DATABASE_BLUEPRINT.md Section 4.

### R-DB-004 — Soft Delete on Financial Records
Financial and compliance-critical models must never use hard delete. Required models: Invoice, PayrollRecord, ReceiptVoucher, WalletTransaction. These models must have:
- `deletedAt: { type: Date, default: null }`
- `isDeleted: { type: Boolean, default: false }`
All queries on these models must filter `{ isDeleted: { $ne: true } }`. Per docs/DATABASE.md DB-005.

### R-DB-005 — Wallet Balance Operations Must Use MongoDB Transactions
Any operation that modifies `wallet.balance` must use a MongoDB session transaction to prevent race conditions and negative balances. Per docs/DATABASE_BLUEPRINT.md Section 6.

### R-DB-006 — All List Queries Must Have Default Pagination
`Model.find()` without `.limit()` is forbidden in route handlers. Default: `.limit(50).skip(0)`. Maximum enforced limit: 100. Per docs/DATABASE.md DB-006.

### R-DB-007 — MongoDB Connection Pool Must Be Configured
The Mongoose connection must set:
- `maxPoolSize: 20` (or higher based on Atlas tier)
- `serverSelectionTimeoutMS: 5000`
- `socketTimeoutMS: 45000`
Per docs/DATABASE.md DB-007.

### R-DB-008 — No MongoDB URI Regex Manipulation
MongoDB URIs must never be modified by regex string operations. Per docs/DATABASE.md DB-004, docs/SECURITY.md SEC-HIGH-003.

### R-DB-009 — File Upload Metadata Must Be Tracked in Database
Every file stored in `uploads/` must have a corresponding record in `UploadModel` containing: `originalName`, `mimeType`, `size`, `uploadedBy` (ObjectId → users), `uploadedAt`, `path`. Per docs/DATABASE.md DB-008.

### R-DB-010 — Do Not Use PostgreSQL / Drizzle Until Clarified
`shared/schema.ts` (Drizzle/PostgreSQL schema) must not be used in new features until the PostgreSQL role is documented and `DATABASE_URL` is provisioned. Per docs/DATABASE.md DB-004.

### R-DB-011 — No `$where`, `$function`, or JavaScript Execution in Queries
MongoDB queries must never use JavaScript execution operators (`$where`, `$function`). These bypass indexes and create injection risk. All query operators must use the standard MongoDB query language.

### R-DB-012 — AI Tool Executor Queries Must Reject `$` Keys in Arguments
Before any AI tool calls a Mongoose operation, all tool argument keys and nested keys must be checked: any key starting with `$` must be rejected with an error. Per docs/SECURITY.md SEC-HIGH-001.

---

## Allowed

- `Model.countDocuments()` for pagination totals
- Aggregation pipelines with `$lookup`, `$group`, `$match` for analytics
- `{ background: true }` on index creation to avoid blocking reads
- Embedded documents for 1:1 relationships with stable, bounded data (e.g., `webAuthnCredentials` in users)
- `Model.findOneAndUpdate({ ..., deletedAt: null }, update, { new: true })` for safe soft-delete-aware updates

---

## Forbidden

- `Model.find()` without `.limit()` in route handlers
- Hard delete (`Model.deleteOne()`, `Model.deleteMany()`) on financial/compliance models
- Wallet balance updates outside a MongoDB session transaction
- `$where` or JavaScript operators in queries
- AI tool arguments passed directly to queries without `$`-key rejection
- MongoDB URI manipulation by string regex
- New feature code using Drizzle/PostgreSQL without explicit sign-off

---

## Examples

### Model File Structure
```typescript
// server/models/invoice.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  orderId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  pdfPath: string;
  dueDate: Date;
  paidAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'draft' },
  pdfPath: String,
  dueDate: Date,
  paidAt: Date,
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// Required indexes
InvoiceSchema.index({ clientId: 1, status: 1 });
InvoiceSchema.index({ clientId: 1, createdAt: -1 });
InvoiceSchema.index({ isDeleted: 1 });

export const InvoiceModel = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
```

### Atomic Wallet Update
```typescript
const session = await mongoose.startSession();
try {
  await session.withTransaction(async () => {
    const wallet = await WalletModel.findOneAndUpdate(
      { userId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { session, new: true }
    );
    if (!wallet) throw new Error('INSUFFICIENT_BALANCE');
    await TransactionModel.create([{ walletId: wallet._id, amount: -amount, type: 'debit' }], { session });
  });
} finally {
  session.endSession();
}
```

---

## Checklist

- [ ] One model per file in server/models/
- [ ] All query fields have indexes defined in schema
- [ ] TTL indexes on notifications, activity_logs, otps
- [ ] Financial models have `isDeleted` + `deletedAt` fields
- [ ] Wallet operations use MongoDB session transactions
- [ ] All list queries have `.limit()` with default 50
- [ ] Connection pool configured (maxPoolSize: 20)
- [ ] No MongoDB URI regex manipulation
- [ ] File uploads tracked in UploadModel
- [ ] No `$where` or JS operators in queries

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `InvoiceModel.deleteOne({ _id: id })` | `InvoiceModel.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() })` |
| `OrderModel.find()` — no limit | `OrderModel.find().limit(50).skip(skip)` |
| Wallet: `WalletModel.updateOne({ $inc: { balance: -amount } })` outside transaction | Wrap in `session.withTransaction()` |
| Index missing on `status` field | Add `Schema.index({ status: 1 })` |
| `$where: "this.amount > 100"` | Use `{ amount: { $gt: 100 } }` |

---

## Future Scalability Considerations

- When Atlas tier allows, increase `maxPoolSize` to 50+ for high-concurrency endpoints
- Introduce change streams for real-time event broadcasting instead of polling-based WS updates
- TTL indexes handle cleanup automatically — as data volume grows, verify they run within Atlas maintenance windows
- When object storage is adopted (docs/ARCHITECTURE.md ARCH-006), `UploadModel.path` becomes a CDN URL — schema is already designed for this transition
- Consider sharding `notifications` and `activity_logs` collections if they grow beyond 100M documents
