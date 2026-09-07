// ── CRM V2 Timeline Service ────────────────────────────────────────────────────
// Sprint 008 — CRM V2 Foundation.
// Aggregates ALL touchpoints for a lead or customer into one chronological feed.
//
// Sources aggregated:
//   - Orders
//   - Projects
//   - Invoices
//   - Quotations
//   - Wallet transactions
//   - Meetings
//   - Notifications
//   - CRM V1 activities (read-only — from existing embedded activities)
//   - CRM V2 interactions (new standalone collection)
//   - Events (support tickets, notes, tasks, etc.)

export interface TimelineEvent {
  id: string;
  type:
    | "order"
    | "project"
    | "project_update"
    | "invoice"
    | "quotation"
    | "payment"
    | "meeting"
    | "notification"
    | "crm_activity"
    | "interaction"
    | "note"
    | "call"
    | "email"
    | "whatsapp"
    | "task"
    | "attachment"
    | "support"
    | "contract"
    | "reminder"
    | "opportunity";
  title: string;
  titleAr: string;
  body?: string;
  status?: string;
  amount?: number;
  currency?: string;
  createdBy?: string;
  createdByName?: string;
  refId?: string;
  refType?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  source: string; // which system produced this event
}

/**
 * Build a unified chronological timeline from multiple domain object arrays.
 * Pure function — all DB queries happen in the route handler.
 */
export function buildTimeline(params: {
  userId?: string;
  leadId?: string;
  orders?: any[];
  projects?: any[];
  invoices?: any[];
  quotations?: any[];
  walletTransactions?: any[];
  meetings?: any[];
  notifications?: any[];
  crmActivities?: any[]; // embedded CRM V1 activities
  interactions?: any[];  // CRM V2 standalone interactions
  reminders?: any[];
  opportunities?: any[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // ── Orders ──────────────────────────────────────────────────────────────────
  for (const o of params.orders ?? []) {
    events.push({
      id:       `order-${o._id || o.id}`,
      type:     "order",
      title:    `Order: ${o.status || "placed"}`,
      titleAr:  `طلب: ${o.status || "جديد"}`,
      body:     o.sector || o.orderType || "",
      status:   o.status,
      amount:   o.amount || o.totalAmount || 0,
      currency: "SAR",
      refId:    String(o._id || o.id),
      refType:  "order",
      timestamp: new Date(o.createdAt),
      source:   "orders",
      metadata: { sector: o.sector, step: o.step },
    });
  }

  // ── Projects ─────────────────────────────────────────────────────────────────
  for (const p of params.projects ?? []) {
    events.push({
      id:      `project-${p._id || p.id}`,
      type:    "project",
      title:   `Project: ${p.name || "New"}`,
      titleAr: `مشروع: ${p.name || "جديد"}`,
      status:  p.status,
      body:    p.currentPhase || "",
      refId:   String(p._id || p.id),
      refType: "project",
      timestamp: new Date(p.createdAt),
      source:  "projects",
      metadata: { phase: p.currentPhase, completion: p.completionPercentage },
    });

    // Phase changes as additional events
    for (const ph of p.phaseHistory ?? []) {
      events.push({
        id:      `project-phase-${p._id || p.id}-${ph.phase}`,
        type:    "project_update",
        title:   `Phase changed → ${ph.phase}`,
        titleAr: `تغيير المرحلة → ${ph.phase}`,
        refId:   String(p._id || p.id),
        refType: "project",
        timestamp: new Date(ph.startedAt || p.createdAt),
        source:  "projects",
        metadata: { phase: ph.phase },
      });
    }
  }

  // ── Invoices ─────────────────────────────────────────────────────────────────
  for (const i of params.invoices ?? []) {
    events.push({
      id:      `invoice-${i._id || i.id}`,
      type:    "invoice",
      title:   `Invoice ${i.invoiceNumber || ""}`,
      titleAr: `فاتورة ${i.invoiceNumber || ""}`,
      status:  i.status,
      amount:  i.totalAmount || i.amount || 0,
      currency:"SAR",
      refId:   String(i._id || i.id),
      refType: "invoice",
      timestamp: new Date(i.createdAt),
      source:  "invoices",
    });
  }

  // ── Quotations ───────────────────────────────────────────────────────────────
  for (const q of params.quotations ?? []) {
    events.push({
      id:      `quotation-${q._id || q.id}`,
      type:    "quotation",
      title:   `Quote sent: ${q.title || q.projectType || ""}`,
      titleAr: `عرض سعر: ${q.title || q.projectType || ""}`,
      status:  q.status,
      amount:  q.totalAmount || 0,
      currency:"SAR",
      refId:   String(q._id || q.id),
      refType: "quotation",
      timestamp: new Date(q.createdAt),
      source:  "quotations",
    });
  }

  // ── Wallet Transactions ───────────────────────────────────────────────────────
  for (const t of params.walletTransactions ?? []) {
    events.push({
      id:      `payment-${t._id || t.id}`,
      type:    "payment",
      title:   `Payment: ${t.type === "credit" ? "+" : "−"}${t.amount} SAR`,
      titleAr: `دفعة: ${t.type === "credit" ? "+" : "−"}${t.amount} ر.س`,
      amount:  t.amount,
      currency:"SAR",
      body:    t.description || "",
      refId:   String(t._id || t.id),
      refType: "walletTransaction",
      timestamp: new Date(t.createdAt),
      source:  "wallet",
      metadata: { txType: t.type, method: t.method },
    });
  }

  // ── Meetings ──────────────────────────────────────────────────────────────────
  for (const m of params.meetings ?? []) {
    events.push({
      id:      `meeting-${m._id || m.id}`,
      type:    "meeting",
      title:   `Meeting: ${m.title || m.type || ""}`,
      titleAr: `اجتماع: ${m.title || m.type || ""}`,
      status:  m.status,
      refId:   String(m._id || m.id),
      refType: "meeting",
      timestamp: new Date(m.scheduledAt || m.createdAt),
      source:  "meetings",
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────────────
  for (const n of params.notifications ?? []) {
    events.push({
      id:      `notification-${n._id || n.id}`,
      type:    "notification",
      title:   n.title || "Notification",
      titleAr: n.title || "إشعار",
      body:    n.body || "",
      refId:   String(n._id || n.id),
      refType: "notification",
      timestamp: new Date(n.createdAt),
      source:  "notifications",
    });
  }

  // ── CRM V1 Activities (read-only, from embedded lead activities) ──────────────
  for (const a of params.crmActivities ?? []) {
    events.push({
      id:          `crm-activity-${a._id || a.id || Math.random()}`,
      type:        (a.type as any) || "crm_activity",
      title:       `CRM: ${a.type || "activity"}`,
      titleAr:     `CRM: ${a.type || "نشاط"}`,
      body:        a.content || "",
      createdBy:   a.createdBy,
      refType:     "crmActivity",
      timestamp:   new Date(a.createdAt || Date.now()),
      source:      "crm_v1",
    });
  }

  // ── CRM V2 Interactions ───────────────────────────────────────────────────────
  for (const i of params.interactions ?? []) {
    events.push({
      id:          `interaction-${i._id || i.id}`,
      type:        (i.type as any) || "interaction",
      title:       `${i.type}: ${i.summary || i.content?.substring(0, 60) || ""}`,
      titleAr:     `${i.type}: ${i.summary || i.content?.substring(0, 60) || ""}`,
      body:        i.content || "",
      createdBy:   i.createdBy,
      createdByName: i.createdByName,
      refId:       String(i._id || i.id),
      refType:     "interaction",
      timestamp:   new Date(i.createdAt),
      source:      "crm_v2",
      metadata: {
        direction: i.direction,
        outcome:   i.outcome,
        sentiment: i.sentiment,
        channel:   i.channel,
      },
    });
  }

  // ── Reminders ─────────────────────────────────────────────────────────────────
  for (const r of params.reminders ?? []) {
    if (r.status === "done") {
      events.push({
        id:          `reminder-${r._id || r.id}`,
        type:        "reminder",
        title:       `Follow-up completed: ${r.title}`,
        titleAr:     `متابعة مكتملة: ${r.title}`,
        body:        r.completionNote || "",
        createdBy:   r.completedBy || r.assignedTo,
        refId:       String(r._id || r.id),
        refType:     "reminder",
        timestamp:   new Date(r.completedAt || r.updatedAt),
        source:      "crm_v2",
      });
    }
  }

  // ── Opportunities ─────────────────────────────────────────────────────────────
  for (const o of params.opportunities ?? []) {
    events.push({
      id:      `opportunity-${o._id || o.id}`,
      type:    "opportunity",
      title:   `Opportunity: ${o.title}`,
      titleAr: `فرصة: ${o.titleAr || o.title}`,
      status:  o.isWon ? "won" : o.isLost ? "lost" : "open",
      amount:  o.value,
      currency: o.currency || "SAR",
      refId:   String(o._id || o.id),
      refType: "opportunity",
      timestamp: new Date(o.createdAt),
      source:  "crm_v2",
    });
  }

  // ── Sort by timestamp, newest first ──────────────────────────────────────────
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return events;
}
