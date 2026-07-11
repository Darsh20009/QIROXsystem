// ── CRM V2 Scoring Engine ──────────────────────────────────────────────────────
// Sprint 008 — CRM V2 Foundation.
// Computes lead score, health score, and engagement score for any subject.
// Called on demand (not a background job yet — Sprint 009 will schedule it).

import type { Express } from "express";

interface ScoringInput {
  subjectId: string;
  subjectType: "lead" | "customer";
  // Raw data signals
  totalOrders: number;
  pendingOrders: number;
  activeProjects: number;
  completedProjects: number;
  paidInvoices: number;
  totalInvoices: number;
  totalRevenue: number;
  openOpportunities: number;
  interactionCount30d: number;
  daysSinceLastContact: number;
  unreadNotifications: number;
  totalInteractions: number;
}

interface ScoringResult {
  leadScore: number;
  healthScore: number;
  engagementScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  signals: {
    hasActiveProject: boolean;
    hasPaidInvoice: boolean;
    recentInteraction: boolean;
    openOpportunity: boolean;
    totalOrders: number;
    totalRevenue: number;
    daysSinceLastContact: number;
    interactionCount30d: number;
  };
}

/**
 * Pure scoring function — no side effects, no DB calls.
 * All DB calls are done by the caller; this just computes the numbers.
 */
export function computeScores(input: ScoringInput): ScoringResult {
  // ── Lead Score (0–100) ──────────────────────────────────────────────────────
  // Measures conversion probability / intent to buy.
  let leadScore = 0;

  if (input.totalOrders > 0)        leadScore += 20;
  if (input.activeProjects > 0)     leadScore += 20;
  if (input.totalRevenue > 0)       leadScore += 15;
  if (input.openOpportunities > 0)  leadScore += 10;
  if (input.totalOrders > 2)        leadScore += 10; // repeat buyer
  if (input.paidInvoices > 0)       leadScore += 10;
  if (input.totalInteractions > 5)  leadScore += 10;
  if (input.daysSinceLastContact <= 7)  leadScore += 5;
  if (input.completedProjects > 0)  leadScore += 5;
  // Deductions
  if (input.daysSinceLastContact > 30)  leadScore -= 10;
  if (input.daysSinceLastContact > 60)  leadScore -= 10;
  if (input.pendingOrders > 3)          leadScore -= 5;
  leadScore = Math.max(0, Math.min(100, leadScore));

  // ── Health Score (0–100) ────────────────────────────────────────────────────
  // Measures account health / risk of churn.
  let healthScore = 40; // baseline

  if (input.activeProjects > 0)    healthScore += 20;
  if (input.paidInvoices > 0)      healthScore += 15;
  if (input.unreadNotifications < 5) healthScore += 10;
  if (input.totalOrders > 0)       healthScore += 10;
  if (input.completedProjects > 0) healthScore += 5;
  if (input.daysSinceLastContact <= 14) healthScore += 5;
  // Deductions
  if (input.daysSinceLastContact > 45)  healthScore -= 15;
  if (input.pendingOrders > 2)          healthScore -= 5;
  if (input.totalInvoices > 0 && input.paidInvoices === 0) healthScore -= 10;
  healthScore = Math.max(0, Math.min(100, healthScore));

  // ── Engagement Score (0–100) ────────────────────────────────────────────────
  // Measures communication frequency and responsiveness.
  let engagementScore = 0;

  if (input.interactionCount30d >= 10) engagementScore = 100;
  else if (input.interactionCount30d >= 5) engagementScore = 75;
  else if (input.interactionCount30d >= 2) engagementScore = 50;
  else if (input.interactionCount30d >= 1) engagementScore = 25;
  else engagementScore = 0;

  if (input.daysSinceLastContact <= 3)  engagementScore = Math.min(100, engagementScore + 20);
  if (input.daysSinceLastContact > 30)  engagementScore = Math.max(0, engagementScore - 30);

  // ── Grade ───────────────────────────────────────────────────────────────────
  const composite = (leadScore + healthScore + engagementScore) / 3;
  const grade: "A" | "B" | "C" | "D" | "F" =
    composite >= 80 ? "A" :
    composite >= 65 ? "B" :
    composite >= 45 ? "C" :
    composite >= 25 ? "D" : "F";

  return {
    leadScore,
    healthScore,
    engagementScore,
    grade,
    signals: {
      hasActiveProject:     input.activeProjects > 0,
      hasPaidInvoice:       input.paidInvoices > 0,
      recentInteraction:    input.daysSinceLastContact <= 7,
      openOpportunity:      input.openOpportunities > 0,
      totalOrders:          input.totalOrders,
      totalRevenue:         input.totalRevenue,
      daysSinceLastContact: input.daysSinceLastContact,
      interactionCount30d:  input.interactionCount30d,
    },
  };
}

/**
 * Grade label map for display.
 */
export const GRADE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  A: { ar: "ممتاز",          en: "Excellent",      color: "#000000" },
  B: { ar: "جيد جداً",       en: "Very Good",      color: "#4B5563" },
  C: { ar: "متوسط",          en: "Average",         color: "#9CA3AF" },
  D: { ar: "ضعيف",           en: "Weak",            color: "#D1D5DB" },
  F: { ar: "يحتاج تدخلاً",   en: "Needs Attention", color: "#E5E7EB" },
};
