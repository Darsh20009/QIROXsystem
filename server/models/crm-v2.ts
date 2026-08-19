// ── CRM V2 Models ─────────────────────────────────────────────────────────────
// Sprint 008 — CRM V2 Foundation.
// ADDITIVE ONLY. New collections. Zero downtime.
// Existing collections (crmleads, leaddatas) are NEVER touched.
//
// New collections:
//   crmv2interactions     — unified standalone interaction log
//   crmv2leadscores       — computed lead/health scores
//   crmv2tags             — customer/lead tag taxonomy
//   crmv2segments         — customer segments with filter criteria
//   crmv2followuprules    — follow-up engine rules (architecture)
//   crmv2reminders        — reminder engine entries
//   crmv2opportunities    — opportunity / deal management
//   crmv2pipelinestages   — pipeline stage definitions

import mongoose from "mongoose";

// ── Interaction ────────────────────────────────────────────────────────────────
// A single touchpoint in any channel. Linked to a lead OR a user (customer).

export const INTERACTION_TYPES = [
  "call", "email", "whatsapp", "meeting", "note",
  "task", "attachment", "internal_comment", "support",
  "proposal", "contract", "invoice", "order", "project_update",
] as const;
export type InteractionType = typeof INTERACTION_TYPES[number];

export const INTERACTION_DIRECTIONS = ["inbound", "outbound", "internal"] as const;

const crmV2InteractionSchema = new mongoose.Schema({
  // Subject — link to either a lead or a customer (user)
  subjectType:   { type: String, enum: ["lead", "customer"], required: true },
  subjectId:     { type: String, required: true, index: true },

  type:          { type: String, enum: INTERACTION_TYPES, required: true },
  direction:     { type: String, enum: INTERACTION_DIRECTIONS, default: "outbound" },
  channel:       { type: String, default: "" }, // e.g. "whatsapp", "gmail", "phone"

  content:       { type: String, required: true },
  summary:       { type: String, default: "" },

  // Metadata
  durationSeconds: { type: Number, default: 0 }, // for calls
  outcome:         { type: String, default: "" }, // "answered", "no_answer", "busy", etc.
  sentiment:       { type: String, enum: ["positive", "neutral", "negative", ""], default: "" },

  // References to other domain objects
  refOrderId:       { type: String, default: null },
  refProjectId:     { type: String, default: null },
  refInvoiceId:     { type: String, default: null },
  refQuotationId:   { type: String, default: null },
  refMeetingId:     { type: String, default: null },

  // Attachment
  attachmentUrl:    { type: String, default: "" },
  attachmentName:   { type: String, default: "" },

  // People
  createdBy:        { type: String, required: true }, // employee id
  createdByName:    { type: String, default: "" },

  // Follow-up
  followUpAt:       { type: Date, default: null },
  followUpDone:     { type: Boolean, default: false },

  isPrivate:        { type: Boolean, default: false }, // internal-only
}, { timestamps: true });

crmV2InteractionSchema.index({ subjectId: 1, createdAt: -1 });
crmV2InteractionSchema.index({ subjectId: 1, type: 1 });

export const CrmV2InteractionModel =
  mongoose.models.CrmV2Interaction ||
  mongoose.model("CrmV2Interaction", crmV2InteractionSchema);

// ── Lead Score ────────────────────────────────────────────────────────────────
// Computed score snapshot for a lead or customer. Re-computed on trigger.

const crmV2LeadScoreSchema = new mongoose.Schema({
  subjectType:    { type: String, enum: ["lead", "customer"], required: true },
  subjectId:      { type: String, required: true, index: true },

  // Composite scores (0–100)
  leadScore:      { type: Number, default: 0, min: 0, max: 100 },
  healthScore:    { type: Number, default: 0, min: 0, max: 100 },
  engagementScore:{ type: Number, default: 0, min: 0, max: 100 },

  // Signal breakdown
  signals: {
    hasActiveProject:    { type: Boolean, default: false },
    hasPaidInvoice:      { type: Boolean, default: false },
    recentInteraction:   { type: Boolean, default: false }, // last 7 days
    openOpportunity:     { type: Boolean, default: false },
    totalOrders:         { type: Number, default: 0 },
    totalRevenue:        { type: Number, default: 0 },
    daysSinceLastContact:{ type: Number, default: 999 },
    interactionCount30d: { type: Number, default: 0 },
  },

  grade:          { type: String, enum: ["A", "B", "C", "D", "F"], default: "C" },
  computedAt:     { type: Date, default: Date.now },
  computedBy:     { type: String, default: "system" }, // "system" | employee id
}, { timestamps: true });

crmV2LeadScoreSchema.index({ subjectId: 1 }, { unique: true });

export const CrmV2LeadScoreModel =
  mongoose.models.CrmV2LeadScore ||
  mongoose.model("CrmV2LeadScore", crmV2LeadScoreSchema);

// ── Tag ───────────────────────────────────────────────────────────────────────

const crmV2TagSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  nameAr:   { type: String, default: "" },
  color:    { type: String, default: "#000000" },
  category: { type: String, enum: ["lead", "customer", "opportunity", "general"], default: "general" },
  createdBy:{ type: String, required: true },
  usageCount:{ type: Number, default: 0 },
}, { timestamps: true });

crmV2TagSchema.index({ name: 1, category: 1 }, { unique: true });

export const CrmV2TagModel =
  mongoose.models.CrmV2Tag ||
  mongoose.model("CrmV2Tag", crmV2TagSchema);

// ── Segment ───────────────────────────────────────────────────────────────────

const crmV2SegmentSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  nameAr:   { type: String, default: "" },
  description:{ type: String, default: "" },
  color:    { type: String, default: "#000000" },

  // Filter criteria (serialised as JSON for flexibility)
  filters: {
    minLeadScore:    { type: Number, default: null },
    maxLeadScore:    { type: Number, default: null },
    stages:          { type: [String], default: [] },
    sources:         { type: [String], default: [] },
    tags:            { type: [String], default: [] },
    minRevenue:      { type: Number, default: null },
    maxDaysSinceContact: { type: Number, default: null },
    hasActiveProject:{ type: Boolean, default: null },
  },

  memberCount:{ type: Number, default: 0 },
  lastSyncAt: { type: Date, default: null },
  createdBy:  { type: String, required: true },
  isSystem:   { type: Boolean, default: false }, // platform-managed
}, { timestamps: true });

export const CrmV2SegmentModel =
  mongoose.models.CrmV2Segment ||
  mongoose.model("CrmV2Segment", crmV2SegmentSchema);

// ── Follow-Up Rule (Architecture) ─────────────────────────────────────────────
// Rules that drive the Follow-Up Engine. No automation implemented yet.
// This is the data architecture for Sprint 008. Engine executes in Sprint 009+.

export const FOLLOWUP_TRIGGERS = [
  "no_contact_7d",
  "no_contact_14d",
  "no_contact_30d",
  "stage_stale",
  "proposal_sent_no_response",
  "invoice_overdue",
  "project_at_risk",
  "lead_score_dropped",
  "new_lead_assigned",
  "meeting_completed",
  "contract_expiring",
  "subscription_expiring",
] as const;

export const FOLLOWUP_ACTIONS = [
  "create_reminder",
  "send_whatsapp",
  "send_email",
  "assign_task",
  "escalate_to_manager",
  "move_to_segment",
  "add_tag",
  "notify_employee",
] as const;

export const PRIORITY_LEVELS = ["low", "medium", "high", "urgent", "critical"] as const;

const crmV2FollowUpRuleSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  nameAr:     { type: String, default: "" },
  description:{ type: String, default: "" },
  isActive:   { type: Boolean, default: false }, // stays false until engine is built

  // Trigger definition
  trigger:    { type: String, enum: FOLLOWUP_TRIGGERS, required: true },
  triggerConfig: {
    daysThreshold:  { type: Number, default: null },
    scoreThreshold: { type: Number, default: null },
    stageId:        { type: String, default: null },
    customCondition:{ type: String, default: "" },
  },

  // Actions to execute when triggered
  actions: [{
    action:   { type: String, enum: FOLLOWUP_ACTIONS, required: true },
    params:   { type: mongoose.Schema.Types.Mixed, default: {} },
    delayHours:{ type: Number, default: 0 },
  }],

  // Conditions: which segments/stages/tags this rule applies to
  appliesTo: {
    subjectTypes: { type: [String], default: ["lead", "customer"] },
    stages:       { type: [String], default: [] },
    segments:     { type: [String], default: [] },
    tags:         { type: [String], default: [] },
    minScore:     { type: Number, default: null },
    maxScore:     { type: Number, default: null },
  },

  priority:   { type: String, enum: PRIORITY_LEVELS, default: "medium" },

  // Escalation: if action not completed in N hours, escalate
  escalation: {
    enabled:          { type: Boolean, default: false },
    afterHours:       { type: Number, default: 24 },
    escalateTo:       { type: String, default: "" }, // employee id or role
    escalateAction:   { type: String, enum: FOLLOWUP_ACTIONS, default: "notify_employee" },
  },

  // Execution history (architecture, not live)
  stats: {
    timesTriggered: { type: Number, default: 0 },
    lastTriggeredAt:{ type: Date, default: null },
    successRate:    { type: Number, default: 0 },
  },

  createdBy: { type: String, required: true },
  sortOrder:  { type: Number, default: 0 },
}, { timestamps: true });

export const CrmV2FollowUpRuleModel =
  mongoose.models.CrmV2FollowUpRule ||
  mongoose.model("CrmV2FollowUpRule", crmV2FollowUpRuleSchema);

// ── Reminder ──────────────────────────────────────────────────────────────────

const crmV2ReminderSchema = new mongoose.Schema({
  subjectType: { type: String, enum: ["lead", "customer"], required: true },
  subjectId:   { type: String, required: true, index: true },

  title:       { type: String, required: true },
  titleAr:     { type: String, default: "" },
  body:        { type: String, default: "" },

  dueAt:       { type: Date, required: true, index: true },
  priority:    { type: String, enum: PRIORITY_LEVELS, default: "medium" },

  assignedTo:  { type: String, required: true }, // employee id
  assignedToName: { type: String, default: "" },

  status:      { type: String, enum: ["pending", "done", "snoozed", "cancelled"], default: "pending" },
  snoozedUntil:{ type: Date, default: null },

  triggeredByRule: { type: String, default: null }, // CrmV2FollowUpRule id
  relatedInteractionId: { type: String, default: null },

  completedAt:   { type: Date, default: null },
  completedBy:   { type: String, default: null },
  completionNote:{ type: String, default: "" },
}, { timestamps: true });

crmV2ReminderSchema.index({ assignedTo: 1, dueAt: 1, status: 1 });

export const CrmV2ReminderModel =
  mongoose.models.CrmV2Reminder ||
  mongoose.model("CrmV2Reminder", crmV2ReminderSchema);

// ── Pipeline Stage ─────────────────────────────────────────────────────────────

const crmV2PipelineStageSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  nameAr:    { type: String, default: "" },
  slug:      { type: String, required: true, unique: true },
  color:     { type: String, default: "#000000" },
  sortOrder: { type: Number, default: 0 },
  isTerminal:{ type: Boolean, default: false }, // won/lost — no further movement
  isWon:     { type: Boolean, default: false },
  isLost:    { type: Boolean, default: false },
  probability: { type: Number, default: 0, min: 0, max: 100 }, // default win probability %
  createdBy: { type: String, required: true },
}, { timestamps: true });

export const CrmV2PipelineStageModel =
  mongoose.models.CrmV2PipelineStage ||
  mongoose.model("CrmV2PipelineStage", crmV2PipelineStageSchema);

// ── Opportunity ────────────────────────────────────────────────────────────────

const crmV2OpportunitySchema = new mongoose.Schema({
  title:      { type: String, required: true },
  titleAr:    { type: String, default: "" },

  // Subject
  subjectType:{ type: String, enum: ["lead", "customer"], required: true },
  subjectId:  { type: String, required: true, index: true },
  subjectName:{ type: String, default: "" },

  // Pipeline
  stageId:    { type: String, required: true }, // CrmV2PipelineStage id
  stageName:  { type: String, default: "" },

  // Value
  value:      { type: Number, default: 0 },
  currency:   { type: String, default: "SAR" },
  probability:{ type: Number, default: 0, min: 0, max: 100 },
  weightedValue: { type: Number, default: 0 }, // value * probability / 100

  // Dates
  expectedCloseAt: { type: Date, default: null },
  closedAt:        { type: Date, default: null },

  // Outcome
  isWon:      { type: Boolean, default: false },
  isLost:     { type: Boolean, default: false },
  lostReason: { type: String, default: "" },

  // References
  refLeadId:        { type: String, default: null },
  refOrderId:       { type: String, default: null },
  refQuotationId:   { type: String, default: null },
  refContractId:    { type: String, default: null },
  refProjectId:     { type: String, default: null },
  refInvoiceId:     { type: String, default: null },

  // People
  assignedTo:    { type: String, default: "" },
  assignedToName:{ type: String, default: "" },
  createdBy:     { type: String, required: true },

  // Tracking
  tags:         { type: [String], default: [] },
  notes:        { type: String, default: "" },

  // Stage history
  stageHistory: [{
    stageId:   { type: String },
    stageName: { type: String },
    enteredAt: { type: Date, default: Date.now },
    exitedAt:  { type: Date, default: null },
    movedBy:   { type: String, default: "" },
    note:      { type: String, default: "" },
  }],
}, { timestamps: true });

crmV2OpportunitySchema.index({ subjectId: 1, stageId: 1 });
crmV2OpportunitySchema.index({ assignedTo: 1, isWon: 1, isLost: 1 });

export const CrmV2OpportunityModel =
  mongoose.models.CrmV2Opportunity ||
  mongoose.model("CrmV2Opportunity", crmV2OpportunitySchema);
