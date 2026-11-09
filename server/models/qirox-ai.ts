import mongoose, { Schema, Document } from "mongoose";

/* ── Knowledge document ──────────────────────────────────────────────────── */
export interface IKnowledgeDoc extends Document {
  title: string;
  content: string;
  category: string;          // "services" | "pricing" | "policies" | "faq" | "team" | "custom"
  tags: string[];
  source: string;            // "manual" | "url" | "auto"
  active: boolean;
  /** TF-IDF tokens (pre-computed for speed) */
  tokens: string[];
  /** Token frequency map as JSON string (for BM25) */
  termFreqJson: string;
  docLength: number;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocSchema = new Schema<IKnowledgeDoc>({
  title:       { type: String, required: true },
  content:     { type: String, required: true },
  category:    { type: String, default: "custom" },
  tags:        [String],
  source:      { type: String, default: "manual" },
  active:      { type: Boolean, default: true },
  tokens:      [String],
  termFreqJson:{ type: String, default: "{}" },
  docLength:   { type: Number, default: 0 },
  /** Semantic embedding vector (all-MiniLM-L6-v2, 384 dims) */
  embedding:   { type: [Number], default: undefined, select: false },
}, { timestamps: true });

export const KnowledgeDocModel = mongoose.model<IKnowledgeDoc>("QiroxAIKnowledge", KnowledgeDocSchema);

/* ── API Key ─────────────────────────────────────────────────────────────── */
export interface IQiroxAIKey extends Document {
  name: string;
  key: string;                // e.g. qai-xxxxx
  createdBy: string;          // userId or "system"
  permissions: string[];      // ["chat","embeddings","knowledge"]
  rateLimitPerDay: number;
  usedToday: number;
  usedDayReset: Date;
  totalRequests: number;
  totalTokens: number;
  active: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
}

const QiroxAIKeySchema = new Schema<IQiroxAIKey>({
  name:            { type: String, required: true },
  key:             { type: String, required: true, unique: true },
  createdBy:       { type: String, default: "system" },
  permissions:     { type: [String], default: ["chat"] },
  rateLimitPerDay: { type: Number, default: 1000 },
  usedToday:       { type: Number, default: 0 },
  usedDayReset:    { type: Date, default: () => new Date() },
  totalRequests:   { type: Number, default: 0 },
  totalTokens:     { type: Number, default: 0 },
  active:          { type: Boolean, default: true },
  lastUsedAt:      Date,
}, { timestamps: true });

export const QiroxAIKeyModel = mongoose.model<IQiroxAIKey>("QiroxAIKey", QiroxAIKeySchema);

/* ── Usage log ───────────────────────────────────────────────────────────── */
const QiroxAILogSchema = new Schema({
  keyId:         { type: String, default: "internal" },
  model:         String,
  promptTokens:  Number,
  completionTokens: Number,
  totalTokens:   Number,
  latencyMs:     Number,
  source:        String,  // "whatsapp" | "admin" | "api" | "internal"
  success:       Boolean,
}, { timestamps: true });

export const QiroxAILogModel = mongoose.model("QiroxAILog", QiroxAILogSchema);

/* ── Settings ────────────────────────────────────────────────────────────── */
const QiroxAISettingsSchema = new Schema({
  singleton:         { type: String, default: "main", unique: true },
  model:             { type: String, default: "qirox-local-qwen2.5-0.5b" },
  temperature:       { type: Number, default: 0.8 },
  maxTokens:         { type: Number, default: 700 },
  topK:              { type: Number, default: 5 },
  systemPrompt:      { type: String, default: "" },
  language:          { type: String, default: "ar" },
  ragEnabled:        { type: Boolean, default: true },
  /** Use local ONNX AI instead of external OpenAI-compatible provider */
  useLocalAI:        { type: Boolean, default: true },
  localAIRequests:   { type: Number, default: 0 },
  localAISavedCalls: { type: Number, default: 0 },
}, { timestamps: true });

export const QiroxAISettingsModel = mongoose.model("QiroxAISettings", QiroxAISettingsSchema);
