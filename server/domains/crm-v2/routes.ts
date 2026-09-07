// ── CRM V2 API Routes ─────────────────────────────────────────────────────────
// Sprint 008 — CRM V2 Foundation.
// ADDITIVE ONLY. New /api/v2/crm/* endpoints. No existing endpoint touched.
// Gate: FEATURE_CRM_V2 flag (default false).
//
// Endpoints:
//   GET  /api/v2/crm/customers/:id/timeline
//   GET  /api/v2/crm/customers/:id/interactions
//   POST /api/v2/crm/customers/:id/interactions
//   GET  /api/v2/crm/customers/:id/score
//   POST /api/v2/crm/customers/:id/score/refresh
//   GET  /api/v2/crm/leads/:id/timeline
//   GET  /api/v2/crm/leads/:id/interactions
//   POST /api/v2/crm/leads/:id/interactions
//   GET  /api/v2/crm/leads/:id/score
//   GET  /api/v2/crm/tags
//   POST /api/v2/crm/tags
//   GET  /api/v2/crm/segments
//   POST /api/v2/crm/segments
//   GET  /api/v2/crm/follow-up-rules
//   POST /api/v2/crm/follow-up-rules
//   GET  /api/v2/crm/reminders
//   POST /api/v2/crm/reminders
//   PATCH /api/v2/crm/reminders/:id
//   GET  /api/v2/crm/opportunities
//   POST /api/v2/crm/opportunities
//   PATCH /api/v2/crm/opportunities/:id
//   GET  /api/v2/crm/pipeline
//   POST /api/v2/crm/pipeline/stages
//   GET  /api/v2/crm/stats

import type { Express, Request, Response } from "express";
import { buildTimeline } from "./timeline";
import { computeScores } from "./scoring";
import {
  TRIGGER_CATALOGUE,
  ACTION_CATALOGUE,
  REMINDER_TYPES,
  PRIORITY_FRAMEWORK,
  ESCALATION_MATRIX,
} from "./follow-up-engine";

const STAFF_ROLES = new Set(["admin", "manager", "sales", "marketing", "support", "employee"]);

function requireStaff(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) { res.sendStatus(401); return false; }
  const role = (req.user as any)?.role;
  if (!STAFF_ROLES.has(role)) { res.sendStatus(403); return false; }
  return true;
}

function actorId(req: Request): string {
  return String((req.user as any)?.id ?? "unknown");
}
function actorName(req: Request): string {
  return String((req.user as any)?.fullName ?? (req.user as any)?.username ?? "");
}

export function registerCrmV2Routes(app: Express) {

  // ── Customer Timeline ──────────────────────────────────────────────────────
  app.get("/api/v2/crm/customers/:id/timeline", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const uid = req.params.id;
    try {
      const {
        OrderModel, ProjectModel, InvoiceModel, QuotationModel,
        WalletTransactionModel, NotificationModel, MeetingRequestModel,
      } = await import("../../models");
      const {
        CrmV2InteractionModel, CrmV2ReminderModel, CrmV2OpportunityModel,
      } = await import("../../models/crm-v2");

      const projectDocs = await ProjectModel.find({ clientId: uid }).lean();
      const projectIds = projectDocs.map((p: any) => String(p._id));

      const [orders, invoices, quotations, walletTxs, notifications, meetings, interactions, reminders, opportunities] =
        await Promise.all([
          OrderModel.find({ userId: uid }).sort({ createdAt: -1 }).limit(50).lean(),
          InvoiceModel.find({ userId: uid }).sort({ createdAt: -1 }).limit(30).lean(),
          QuotationModel.find({ userId: uid }).sort({ createdAt: -1 }).limit(20).lean(),
          WalletTransactionModel.find({ userId: uid }).sort({ createdAt: -1 }).limit(30).lean(),
          NotificationModel.find({ userId: uid }).sort({ createdAt: -1 }).limit(20).lean(),
          projectIds.length > 0
            ? MeetingRequestModel.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).limit(10).lean()
            : [],
          CrmV2InteractionModel.find({ subjectType: "customer", subjectId: uid }).sort({ createdAt: -1 }).limit(50).lean(),
          CrmV2ReminderModel.find({ subjectType: "customer", subjectId: uid, status: "done" }).sort({ completedAt: -1 }).limit(20).lean(),
          CrmV2OpportunityModel.find({ subjectType: "customer", subjectId: uid }).sort({ createdAt: -1 }).limit(10).lean(),
        ]);

      const timeline = buildTimeline({
        userId: uid,
        orders, projects: projectDocs, invoices, quotations,
        walletTransactions: walletTxs, meetings, notifications,
        interactions, reminders, opportunities,
      });

      res.json({ timeline, total: timeline.length });
    } catch (err: any) {
      console.error("[CrmV2] customer timeline error:", err?.message);
      res.status(500).json({ error: "Failed to build timeline" });
    }
  });

  // ── Lead Timeline ──────────────────────────────────────────────────────────
  app.get("/api/v2/crm/leads/:id/timeline", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const leadId = req.params.id;
    try {
      const { CrmLeadModel }             = await import("../../models/crm");
      const { CrmV2InteractionModel, CrmV2ReminderModel, CrmV2OpportunityModel } =
        await import("../../models/crm-v2");

      const lead = await CrmLeadModel.findById(leadId).lean() as any;
      if (!lead) return res.status(404).json({ error: "Lead not found" });

      const [interactions, reminders, opportunities] = await Promise.all([
        CrmV2InteractionModel.find({ subjectType: "lead", subjectId: leadId }).sort({ createdAt: -1 }).limit(50).lean(),
        CrmV2ReminderModel.find({ subjectType: "lead", subjectId: leadId, status: "done" }).sort({ completedAt: -1 }).limit(20).lean(),
        CrmV2OpportunityModel.find({ subjectType: "lead", subjectId: leadId }).sort({ createdAt: -1 }).limit(10).lean(),
      ]);

      const crmActivities = (lead.activities || []).map((a: any) => ({
        ...a,
        createdAt: a.createdAt || lead.createdAt,
      }));

      const timeline = buildTimeline({
        leadId,
        crmActivities,
        interactions, reminders, opportunities,
      });

      res.json({ timeline, total: timeline.length, lead });
    } catch (err: any) {
      console.error("[CrmV2] lead timeline error:", err?.message);
      res.status(500).json({ error: "Failed to build timeline" });
    }
  });

  // ── Interactions — Customer ────────────────────────────────────────────────
  app.get("/api/v2/crm/customers/:id/interactions", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2InteractionModel } = await import("../../models/crm-v2");
    const uid = req.params.id;
    const type = req.query.type as string | undefined;
    const filter: any = { subjectType: "customer", subjectId: uid };
    if (type) filter.type = type;
    const interactions = await CrmV2InteractionModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ interactions: interactions.map((i: any) => ({ ...i, id: String(i._id) })) });
  });

  app.post("/api/v2/crm/customers/:id/interactions", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2InteractionModel } = await import("../../models/crm-v2");
    const uid = req.params.id;
    const { type, content, direction, channel, summary, outcome, sentiment,
            durationSeconds, followUpAt, attachmentUrl, attachmentName,
            refOrderId, refProjectId, refInvoiceId, refMeetingId, isPrivate } = req.body;
    if (!type || !content) return res.status(400).json({ error: "type and content are required" });
    const interaction = await CrmV2InteractionModel.create({
      subjectType: "customer", subjectId: uid,
      type, content, direction: direction || "outbound",
      channel: channel || "", summary: summary || "",
      outcome: outcome || "", sentiment: sentiment || "",
      durationSeconds: durationSeconds || 0,
      followUpAt: followUpAt || null,
      attachmentUrl: attachmentUrl || "", attachmentName: attachmentName || "",
      refOrderId: refOrderId || null, refProjectId: refProjectId || null,
      refInvoiceId: refInvoiceId || null, refMeetingId: refMeetingId || null,
      isPrivate: Boolean(isPrivate),
      createdBy: actorId(req), createdByName: actorName(req),
    });
    res.status(201).json({ interaction: { ...interaction.toObject(), id: String(interaction._id) } });
  });

  // ── Interactions — Lead ────────────────────────────────────────────────────
  app.get("/api/v2/crm/leads/:id/interactions", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2InteractionModel } = await import("../../models/crm-v2");
    const leadId = req.params.id;
    const interactions = await CrmV2InteractionModel.find({ subjectType: "lead", subjectId: leadId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ interactions: interactions.map((i: any) => ({ ...i, id: String(i._id) })) });
  });

  app.post("/api/v2/crm/leads/:id/interactions", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2InteractionModel } = await import("../../models/crm-v2");
    const leadId = req.params.id;
    const { type, content, direction, channel, summary, outcome, sentiment,
            durationSeconds, followUpAt, isPrivate } = req.body;
    if (!type || !content) return res.status(400).json({ error: "type and content are required" });
    const interaction = await CrmV2InteractionModel.create({
      subjectType: "lead", subjectId: leadId,
      type, content, direction: direction || "outbound",
      channel: channel || "", summary: summary || "",
      outcome: outcome || "", sentiment: sentiment || "",
      durationSeconds: durationSeconds || 0,
      followUpAt: followUpAt || null,
      isPrivate: Boolean(isPrivate),
      createdBy: actorId(req), createdByName: actorName(req),
    });
    res.status(201).json({ interaction: { ...interaction.toObject(), id: String(interaction._id) } });
  });

  // ── Score ─────────────────────────────────────────────────────────────────
  app.get("/api/v2/crm/customers/:id/score", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const uid = req.params.id;
    try {
      const { CrmV2LeadScoreModel } = await import("../../models/crm-v2");
      const existing = await CrmV2LeadScoreModel.findOne({ subjectType: "customer", subjectId: uid }).lean() as any;
      if (existing) return res.json({ score: existing });
      // Return baseline if never computed
      res.json({ score: { leadScore: 0, healthScore: 0, engagementScore: 0, grade: "C", computedAt: null } });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to retrieve score" });
    }
  });

  app.post("/api/v2/crm/customers/:id/score/refresh", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const uid = req.params.id;
    try {
      const {
        OrderModel, ProjectModel, InvoiceModel, WalletTransactionModel, NotificationModel,
      } = await import("../../models");
      const { CrmV2InteractionModel, CrmV2LeadScoreModel, CrmV2OpportunityModel } =
        await import("../../models/crm-v2");

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [orders, projects, invoices, interactions, opportunities, notifications] = await Promise.all([
        OrderModel.find({ userId: uid }).lean(),
        ProjectModel.find({ clientId: uid }).lean(),
        InvoiceModel.find({ userId: uid }).lean(),
        CrmV2InteractionModel.find({ subjectType: "customer", subjectId: uid, createdAt: { $gte: thirtyDaysAgo } }).lean(),
        CrmV2OpportunityModel.find({ subjectType: "customer", subjectId: uid, isWon: false, isLost: false }).lean(),
        NotificationModel.find({ userId: uid, read: false }).lean(),
      ]);

      const lastInteraction = await CrmV2InteractionModel.findOne(
        { subjectType: "customer", subjectId: uid },
        { createdAt: 1 },
        { sort: { createdAt: -1 } }
      ).lean() as any;

      const daysSince = lastInteraction
        ? Math.floor((Date.now() - new Date(lastInteraction.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const activeProjects = (projects as any[]).filter((p: any) => p.status !== "completed" && p.status !== "cancelled");
      const completedProjects = (projects as any[]).filter((p: any) => p.status === "completed");
      const paidInvoices = (invoices as any[]).filter((i: any) => i.status === "paid");
      const pendingOrders = (orders as any[]).filter((o: any) => ["pending", "approved"].includes(o.status));
      const totalRevenue = (invoices as any[])
        .filter((i: any) => i.status === "paid")
        .reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);

      const result = computeScores({
        subjectId: uid, subjectType: "customer",
        totalOrders: (orders as any[]).length,
        pendingOrders: pendingOrders.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        paidInvoices: paidInvoices.length,
        totalInvoices: (invoices as any[]).length,
        totalRevenue,
        openOpportunities: (opportunities as any[]).length,
        interactionCount30d: (interactions as any[]).length,
        daysSinceLastContact: daysSince,
        unreadNotifications: (notifications as any[]).length,
        totalInteractions: 0,
      });

      const updated = await CrmV2LeadScoreModel.findOneAndUpdate(
        { subjectType: "customer", subjectId: uid },
        { ...result, subjectType: "customer", subjectId: uid, computedAt: new Date(), computedBy: actorId(req) },
        { upsert: true, new: true }
      ).lean();

      res.json({ score: updated });
    } catch (err: any) {
      console.error("[CrmV2] score refresh error:", err?.message);
      res.status(500).json({ error: "Failed to refresh score" });
    }
  });

  app.get("/api/v2/crm/leads/:id/score", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const leadId = req.params.id;
    const { CrmV2LeadScoreModel } = await import("../../models/crm-v2");
    const score = await CrmV2LeadScoreModel.findOne({ subjectType: "lead", subjectId: leadId }).lean();
    res.json({ score: score || { leadScore: 0, healthScore: 0, engagementScore: 0, grade: "C", computedAt: null } });
  });

  // ── Tags ──────────────────────────────────────────────────────────────────
  app.get("/api/v2/crm/tags", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2TagModel } = await import("../../models/crm-v2");
    const category = req.query.category as string | undefined;
    const filter = category ? { category } : {};
    const tags = await CrmV2TagModel.find(filter).sort({ usageCount: -1 }).lean();
    res.json({ tags: tags.map((t: any) => ({ ...t, id: String(t._id) })) });
  });

  app.post("/api/v2/crm/tags", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2TagModel } = await import("../../models/crm-v2");
    const { name, nameAr, color, category } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    try {
      const tag = await CrmV2TagModel.create({
        name, nameAr: nameAr || "", color: color || "#000000",
        category: category || "general", createdBy: actorId(req),
      });
      res.status(201).json({ tag: { ...tag.toObject(), id: String(tag._id) } });
    } catch (err: any) {
      if (err.code === 11000) return res.status(409).json({ error: "Tag already exists" });
      res.status(500).json({ error: "Failed to create tag" });
    }
  });

  // ── Segments ──────────────────────────────────────────────────────────────
  app.get("/api/v2/crm/segments", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2SegmentModel } = await import("../../models/crm-v2");
    const segments = await CrmV2SegmentModel.find().sort({ createdAt: -1 }).lean();
    res.json({ segments: segments.map((s: any) => ({ ...s, id: String(s._id) })) });
  });

  app.post("/api/v2/crm/segments", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2SegmentModel } = await import("../../models/crm-v2");
    const { name, nameAr, description, color, filters } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const seg = await CrmV2SegmentModel.create({
      name, nameAr: nameAr || "", description: description || "",
      color: color || "#000000", filters: filters || {},
      createdBy: actorId(req),
    });
    res.status(201).json({ segment: { ...seg.toObject(), id: String(seg._id) } });
  });

  // ── Follow-Up Rules ────────────────────────────────────────────────────────
  app.get("/api/v2/crm/follow-up-rules", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2FollowUpRuleModel } = await import("../../models/crm-v2");
    const rules = await CrmV2FollowUpRuleModel.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    res.json({
      rules: rules.map((r: any) => ({ ...r, id: String(r._id) })),
      catalogue: {
        triggers: TRIGGER_CATALOGUE,
        actions: ACTION_CATALOGUE,
        reminderTypes: REMINDER_TYPES,
        priorityFramework: PRIORITY_FRAMEWORK,
        escalationMatrix: ESCALATION_MATRIX,
      },
    });
  });

  app.post("/api/v2/crm/follow-up-rules", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2FollowUpRuleModel } = await import("../../models/crm-v2");
    const { name, nameAr, description, trigger, triggerConfig, actions, appliesTo, priority, escalation } = req.body;
    if (!name || !trigger) return res.status(400).json({ error: "name and trigger are required" });
    const rule = await CrmV2FollowUpRuleModel.create({
      name, nameAr: nameAr || "", description: description || "",
      trigger, triggerConfig: triggerConfig || {},
      actions: actions || [], appliesTo: appliesTo || {},
      priority: priority || "medium", escalation: escalation || { enabled: false },
      isActive: false, // always starts inactive
      createdBy: actorId(req),
    });
    res.status(201).json({ rule: { ...rule.toObject(), id: String(rule._id) } });
  });

  // ── Reminders ─────────────────────────────────────────────────────────────
  app.get("/api/v2/crm/reminders", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2ReminderModel } = await import("../../models/crm-v2");
    const me = actorId(req);
    const status = req.query.status as string | undefined;
    const filter: any = { assignedTo: me };
    if (status) filter.status = status;
    else filter.status = { $in: ["pending", "snoozed"] };
    const reminders = await CrmV2ReminderModel.find(filter).sort({ dueAt: 1 }).lean();
    res.json({ reminders: reminders.map((r: any) => ({ ...r, id: String(r._id) })) });
  });

  app.post("/api/v2/crm/reminders", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2ReminderModel } = await import("../../models/crm-v2");
    const { subjectType, subjectId, title, titleAr, body, dueAt, priority, assignedTo, assignedToName } = req.body;
    if (!subjectType || !subjectId || !title || !dueAt) {
      return res.status(400).json({ error: "subjectType, subjectId, title, dueAt are required" });
    }
    const reminder = await CrmV2ReminderModel.create({
      subjectType, subjectId, title, titleAr: titleAr || "",
      body: body || "", dueAt: new Date(dueAt),
      priority: priority || "medium",
      assignedTo: assignedTo || actorId(req),
      assignedToName: assignedToName || actorName(req),
      status: "pending",
    });
    res.status(201).json({ reminder: { ...reminder.toObject(), id: String(reminder._id) } });
  });

  app.patch("/api/v2/crm/reminders/:id", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2ReminderModel } = await import("../../models/crm-v2");
    const { status, completionNote, snoozedUntil } = req.body;
    const update: any = { status };
    if (status === "done") {
      update.completedAt = new Date();
      update.completedBy = actorId(req);
      update.completionNote = completionNote || "";
    }
    if (status === "snoozed" && snoozedUntil) {
      update.snoozedUntil = new Date(snoozedUntil);
    }
    const reminder = await CrmV2ReminderModel.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!reminder) return res.status(404).json({ error: "Not found" });
    res.json({ reminder: { ...(reminder as any), id: String((reminder as any)._id) } });
  });

  // ── Opportunities ─────────────────────────────────────────────────────────
  app.get("/api/v2/crm/opportunities", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2OpportunityModel } = await import("../../models/crm-v2");
    const { stageId, assignedTo, isWon, isLost, subjectId } = req.query as any;
    const filter: any = {};
    if (stageId)    filter.stageId = stageId;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (isWon !== undefined) filter.isWon = isWon === "true";
    if (isLost !== undefined) filter.isLost = isLost === "true";
    if (subjectId)  filter.subjectId = subjectId;
    const opps = await CrmV2OpportunityModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ opportunities: opps.map((o: any) => ({ ...o, id: String(o._id) })) });
  });

  app.post("/api/v2/crm/opportunities", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2OpportunityModel, CrmV2PipelineStageModel } = await import("../../models/crm-v2");
    const {
      title, titleAr, subjectType, subjectId, subjectName,
      stageId, value, currency, probability, expectedCloseAt,
      assignedTo, assignedToName, tags, notes,
      refLeadId, refOrderId, refQuotationId, refProjectId, refInvoiceId,
    } = req.body;
    if (!title || !subjectType || !subjectId || !stageId) {
      return res.status(400).json({ error: "title, subjectType, subjectId, stageId are required" });
    }
    const stage = await CrmV2PipelineStageModel.findById(stageId).lean() as any;
    const opp = await CrmV2OpportunityModel.create({
      title, titleAr: titleAr || "", subjectType, subjectId,
      subjectName: subjectName || "",
      stageId, stageName: stage?.name || "",
      value: Number(value) || 0, currency: currency || "SAR",
      probability: Number(probability) || (stage?.probability ?? 0),
      weightedValue: (Number(value) || 0) * (Number(probability) || stage?.probability || 0) / 100,
      expectedCloseAt: expectedCloseAt ? new Date(expectedCloseAt) : null,
      assignedTo: assignedTo || actorId(req),
      assignedToName: assignedToName || actorName(req),
      tags: tags || [], notes: notes || "",
      refLeadId: refLeadId || null, refOrderId: refOrderId || null,
      refQuotationId: refQuotationId || null, refProjectId: refProjectId || null,
      refInvoiceId: refInvoiceId || null,
      stageHistory: [{ stageId, stageName: stage?.name || "", enteredAt: new Date(), movedBy: actorId(req) }],
      createdBy: actorId(req),
    });
    res.status(201).json({ opportunity: { ...opp.toObject(), id: String(opp._id) } });
  });

  app.patch("/api/v2/crm/opportunities/:id", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2OpportunityModel, CrmV2PipelineStageModel } = await import("../../models/crm-v2");
    const opp = await CrmV2OpportunityModel.findById(req.params.id) as any;
    if (!opp) return res.status(404).json({ error: "Not found" });

    const {
      stageId, isWon, isLost, lostReason, value, probability,
      expectedCloseAt, notes, assignedTo, assignedToName, tags,
    } = req.body;

    if (stageId && stageId !== String(opp.stageId)) {
      const stage = await CrmV2PipelineStageModel.findById(stageId).lean() as any;
      // Close out current stage history entry
      const last = opp.stageHistory[opp.stageHistory.length - 1];
      if (last && !last.exitedAt) last.exitedAt = new Date();
      opp.stageHistory.push({ stageId, stageName: stage?.name || "", enteredAt: new Date(), movedBy: actorId(req) });
      opp.stageId = stageId;
      opp.stageName = stage?.name || "";
    }

    if (isWon !== undefined) opp.isWon = Boolean(isWon);
    if (isLost !== undefined) { opp.isLost = Boolean(isLost); opp.closedAt = new Date(); }
    if (lostReason !== undefined) opp.lostReason = lostReason;
    if (value !== undefined) opp.value = Number(value);
    if (probability !== undefined) opp.probability = Number(probability);
    opp.weightedValue = opp.value * opp.probability / 100;
    if (expectedCloseAt !== undefined) opp.expectedCloseAt = expectedCloseAt ? new Date(expectedCloseAt) : null;
    if (notes !== undefined) opp.notes = notes;
    if (assignedTo !== undefined) opp.assignedTo = assignedTo;
    if (assignedToName !== undefined) opp.assignedToName = assignedToName;
    if (tags !== undefined) opp.tags = tags;

    await opp.save();
    res.json({ opportunity: { ...opp.toObject(), id: String(opp._id) } });
  });

  // ── Pipeline ──────────────────────────────────────────────────────────────
  app.get("/api/v2/crm/pipeline", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2PipelineStageModel, CrmV2OpportunityModel } = await import("../../models/crm-v2");
    const stages = await CrmV2PipelineStageModel.find().sort({ sortOrder: 1 }).lean();
    const opportunities = await CrmV2OpportunityModel.find({ isWon: false, isLost: false }).lean();
    const byStage = stages.map((s: any) => ({
      ...s, id: String(s._id),
      opportunities: (opportunities as any[])
        .filter((o: any) => String(o.stageId) === String(s._id))
        .map((o: any) => ({ ...o, id: String(o._id) })),
    }));
    const totalValue = (opportunities as any[]).reduce((sum: number, o: any) => sum + (o.value || 0), 0);
    const weightedValue = (opportunities as any[]).reduce((sum: number, o: any) => sum + (o.weightedValue || 0), 0);
    res.json({ stages: byStage, totalValue, weightedValue, totalOpportunities: (opportunities as any[]).length });
  });

  app.post("/api/v2/crm/pipeline/stages", async (req, res) => {
    if (!requireStaff(req, res)) return;
    const { CrmV2PipelineStageModel } = await import("../../models/crm-v2");
    const { name, nameAr, slug, color, sortOrder, isTerminal, isWon, isLost, probability } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
    try {
      const stage = await CrmV2PipelineStageModel.create({
        name, nameAr: nameAr || "", slug, color: color || "#000000",
        sortOrder: sortOrder || 0, isTerminal: Boolean(isTerminal),
        isWon: Boolean(isWon), isLost: Boolean(isLost),
        probability: Number(probability) || 0,
        createdBy: actorId(req),
      });
      res.status(201).json({ stage: { ...stage.toObject(), id: String(stage._id) } });
    } catch (err: any) {
      if (err.code === 11000) return res.status(409).json({ error: "Slug already exists" });
      res.status(500).json({ error: "Failed to create stage" });
    }
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  app.get("/api/v2/crm/stats", async (req, res) => {
    if (!requireStaff(req, res)) return;
    try {
      const {
        CrmV2InteractionModel, CrmV2OpportunityModel,
        CrmV2ReminderModel, CrmV2TagModel, CrmV2SegmentModel,
        CrmV2FollowUpRuleModel,
      } = await import("../../models/crm-v2");

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalInteractions, interactions30d, openOpps, wonOpps,
        pendingReminders, tags, segments, rules,
      ] = await Promise.all([
        CrmV2InteractionModel.countDocuments(),
        CrmV2InteractionModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        CrmV2OpportunityModel.countDocuments({ isWon: false, isLost: false }),
        CrmV2OpportunityModel.countDocuments({ isWon: true }),
        CrmV2ReminderModel.countDocuments({ status: { $in: ["pending", "snoozed"] } }),
        CrmV2TagModel.countDocuments(),
        CrmV2SegmentModel.countDocuments(),
        CrmV2FollowUpRuleModel.countDocuments(),
      ]);

      const oppValueAgg = await CrmV2OpportunityModel.aggregate([
        { $match: { isWon: false, isLost: false } },
        { $group: { _id: null, total: { $sum: "$value" }, weighted: { $sum: "$weightedValue" } } },
      ]);
      const totalPipelineValue = oppValueAgg[0]?.total || 0;
      const weightedPipelineValue = oppValueAgg[0]?.weighted || 0;

      const interactionsByType = await CrmV2InteractionModel.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]);

      res.json({
        interactions: { total: totalInteractions, last30d: interactions30d, byType: interactionsByType },
        opportunities: { open: openOpps, won: wonOpps, totalPipelineValue, weightedPipelineValue },
        reminders: { pending: pendingReminders },
        taxonomy: { tags, segments, rules },
      });
    } catch (err: any) {
      console.error("[CrmV2] stats error:", err?.message);
      res.status(500).json({ error: "Failed to load stats" });
    }
  });
}
