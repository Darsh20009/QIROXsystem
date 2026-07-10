// ── CRM Repository ────────────────────────────────────────────────────────────
// ALL database queries for the CRM module live here and nowhere else.
//
// Purpose:
//   Isolate Mongoose from the rest of the domain so the database layer can be
//   tested or swapped without touching business logic.
//
// Responsibilities:
//   - Every CrmLeadModel query the domain needs.
//   - Returns raw Mongoose documents or lean objects exactly as the model does.
//   - Does NOT apply business rules.
//   - Does NOT format responses.
//
// Future migration role:
//   Will implement an ICrmRepository interface for dependency injection
//   once the DI container is wired (Migration 008+).

import { CrmLeadModel } from "../../models";
import type { LeadFilters, CreateLeadInput, AddActivityInput } from "./types";

// ── Read queries ───────────────────────────────────────────────────────────────

/**
 * Return all leads matching the given filters, sorted by updatedAt DESC.
 * Uses `.lean()` for performance — returns plain objects.
 *
 * DB query: CrmLeadModel.find(query).sort({ updatedAt: -1 }).lean()
 */
export async function findLeads(filters: LeadFilters): Promise<unknown[]> {
  const query: Record<string, unknown> = {};

  if (filters.stage && filters.stage !== "all") {
    query.stage = filters.stage;
  }
  if (filters.assignedTo) {
    query.assignedTo = filters.assignedTo;
  }
  if (filters.search) {
    query.$or = [
      { name:    { $regex: filters.search, $options: "i" } },
      { company: { $regex: filters.search, $options: "i" } },
      { phone:   { $regex: filters.search, $options: "i" } },
      { email:   { $regex: filters.search, $options: "i" } },
    ];
  }

  return CrmLeadModel.find(query).sort({ updatedAt: -1 }).lean();
}

/**
 * Count total lead documents in the collection.
 *
 * DB query: CrmLeadModel.countDocuments()
 */
export async function countLeads(): Promise<number> {
  return CrmLeadModel.countDocuments();
}

/**
 * Aggregate leads grouped by stage with count and sum of value.
 *
 * DB query: CrmLeadModel.aggregate([{ $group: { _id: "$stage", count, value } }])
 */
export async function aggregateByStage(): Promise<Array<{ _id: string; count: number; value: number }>> {
  return CrmLeadModel.aggregate([
    { $group: { _id: "$stage", count: { $sum: 1 }, value: { $sum: "$value" } } },
  ]);
}

/**
 * Sum the value field across all leads.
 *
 * DB query: CrmLeadModel.aggregate([{ $group: { _id: null, total: { $sum: "$value" } } }])
 */
export async function aggregateTotalValue(): Promise<number> {
  const result = await CrmLeadModel.aggregate([
    { $group: { _id: null, total: { $sum: "$value" } } },
  ]);
  return result[0]?.total || 0;
}

/**
 * Find one lead by phone number (used for duplicate detection on import).
 *
 * DB query: CrmLeadModel.findOne({ phone }).lean()
 */
export async function findLeadByPhone(phone: string): Promise<unknown | null> {
  return CrmLeadModel.findOne({ phone }).lean();
}

// ── Write queries ─────────────────────────────────────────────────────────────

/**
 * Create and persist a new lead document.
 * Returns the full Mongoose document (toJSON transform applied on serialisation).
 *
 * DB query: CrmLeadModel.create(input)
 */
export async function createLead(input: CreateLeadInput): Promise<unknown> {
  return CrmLeadModel.create(input);
}

/**
 * Apply a partial update to a lead by its ID.
 * Sets `updatedAt` explicitly to match the legacy behaviour.
 * Returns the updated document (new: true) or null when not found.
 *
 * DB query: CrmLeadModel.findByIdAndUpdate(id, { ...body, updatedAt }, { new: true })
 */
export async function updateLead(
  id:   string,
  body: Record<string, unknown>,
): Promise<unknown | null> {
  return CrmLeadModel.findByIdAndUpdate(
    id,
    { ...body, updatedAt: new Date() },
    { new: true },
  );
}

/**
 * Delete a lead by its ID.
 *
 * DB query: CrmLeadModel.findByIdAndDelete(id)
 */
export async function deleteLead(id: string): Promise<void> {
  await CrmLeadModel.findByIdAndDelete(id);
}

/**
 * Push a new activity onto a lead's `activities` array and update `lastContactedAt`.
 * Returns the updated document (new: true) or null when not found.
 *
 * DB query: CrmLeadModel.findByIdAndUpdate(id, { $push: { activities }, $set: { lastContactedAt } }, { new: true })
 */
export async function addActivityToLead(
  id:    string,
  input: AddActivityInput,
): Promise<unknown | null> {
  return CrmLeadModel.findByIdAndUpdate(
    id,
    {
      $push: {
        activities: {
          type:      input.type,
          content:   input.content,
          createdBy: input.createdBy,
        },
      },
      $set: { lastContactedAt: new Date() },
    },
    { new: true },
  );
}
