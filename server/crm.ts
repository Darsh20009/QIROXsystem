import { type Express } from "express";
import { CrmLeadModel } from "./models";

const CRM_ROLES = ["admin", "manager", "sales", "sales_manager", "marketing"];

function requireCRM(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!CRM_ROLES.includes((req.user as any).role)) return res.sendStatus(403);
  next();
}

export function registerCrmRoutes(app: Express) {
  // ── List leads ──────────────────────────────────────────────────────────────
  app.get("/api/crm/leads", requireCRM, async (req, res) => {
    try {
      const { stage, assignedTo, search } = req.query as Record<string, string>;
      const query: any = {};
      if (stage && stage !== "all") query.stage = stage;
      if (assignedTo) query.assignedTo = assignedTo;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      const leads = await CrmLeadModel.find(query).sort({ updatedAt: -1 }).lean();
      res.json(leads);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  app.get("/api/crm/stats", requireCRM, async (_req, res) => {
    try {
      const [total, byStage, totalValue] = await Promise.all([
        CrmLeadModel.countDocuments(),
        CrmLeadModel.aggregate([{ $group: { _id: "$stage", count: { $sum: 1 }, value: { $sum: "$value" } } }]),
        CrmLeadModel.aggregate([{ $group: { _id: null, total: { $sum: "$value" } } }]),
      ]);
      const stages: Record<string, { count: number; value: number }> = {};
      for (const s of byStage) stages[s._id] = { count: s.count, value: s.value };
      res.json({ total, stages, totalValue: totalValue[0]?.total || 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Create lead ──────────────────────────────────────────────────────────────
  app.post("/api/crm/leads", requireCRM, async (req, res) => {
    try {
      const user = req.user as any;
      const { name, phone, email, company, source, stage, value, currency, assignedTo, assignedToName, notes, tags, nextFollowUpAt } = req.body;
      if (!name) return res.status(400).json({ error: "الاسم مطلوب" });
      const lead = await CrmLeadModel.create({
        name, phone, email, company, source, stage, value: Number(value) || 0,
        currency: currency || "SAR", assignedTo: assignedTo || String(user._id),
        assignedToName: assignedToName || user.fullName || user.username,
        notes, tags: tags || [], nextFollowUpAt: nextFollowUpAt || null,
      });
      res.status(201).json(lead);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Update lead ──────────────────────────────────────────────────────────────
  app.patch("/api/crm/leads/:id", requireCRM, async (req, res) => {
    try {
      const lead = await CrmLeadModel.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );
      if (!lead) return res.status(404).json({ error: "العميل غير موجود" });
      res.json(lead);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Bulk import leads ────────────────────────────────────────────────────────
  app.post("/api/crm/leads/import", requireCRM, async (req, res) => {
    try {
      const user = req.user as any;
      const { rows } = req.body as { rows: Record<string, string>[] };
      if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: "لا توجد بيانات" });

      let created = 0, skipped = 0;
      const errors: string[] = [];

      for (const row of rows) {
        const name = (row.name || row["الاسم"] || row["اسم"] || "").trim();
        if (!name) { skipped++; continue; }

        const phone   = (row.phone   || row["الهاتف"]  || row["رقم"] || row["جوال"] || "").trim();
        const company = (row.company || row["الشركة"]  || row["المتجر"] || row["المطعم"] || row["النشاط"] || "").trim();
        const email   = (row.email   || row["البريد"]  || "").trim();
        const notes   = (row.notes   || row["ملاحظات"] || row["العنوان"] || row["الموقع"] || "").trim();
        const source  = (row.source  || row["المصدر"]  || "other").trim();
        const value   = Number(row.value || row["القيمة"] || 0) || 0;

        // skip duplicates by phone
        if (phone) {
          const exists = await CrmLeadModel.findOne({ phone }).lean();
          if (exists) { skipped++; continue; }
        }

        try {
          await CrmLeadModel.create({
            name, phone, email, company, source: source || "other",
            stage: "new", value,
            currency: "SAR",
            assignedTo: String(user._id),
            assignedToName: user.fullName || user.username,
            notes, tags: [],
          });
          created++;
        } catch (e: any) {
          errors.push(`${name}: ${e.message}`);
        }
      }

      res.json({ ok: true, created, skipped, errors });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Delete lead ──────────────────────────────────────────────────────────────
  app.delete("/api/crm/leads/:id", requireCRM, async (req, res) => {
    try {
      if (!["admin", "manager", "sales_manager"].includes((req.user as any).role)) {
        return res.sendStatus(403);
      }
      await CrmLeadModel.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Add activity ─────────────────────────────────────────────────────────────
  app.post("/api/crm/leads/:id/activity", requireCRM, async (req, res) => {
    try {
      const user = req.user as any;
      const { type, content } = req.body;
      if (!content) return res.status(400).json({ error: "المحتوى مطلوب" });
      const update: any = {
        $push: { activities: { type: type || "note", content, createdBy: user.fullName || user.username } },
        $set: { lastContactedAt: new Date() },
      };
      const lead = await CrmLeadModel.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!lead) return res.status(404).json({ error: "العميل غير موجود" });
      res.json(lead);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
