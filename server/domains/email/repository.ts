// ── Email Repository ───────────────────────────────────────────────────────────
// ALL database queries for the email domain live here and nowhere else.
//
// Purpose:
//   Isolate Mongoose from the rest of the domain so the database layer can be
//   tested or swapped without touching business logic.
//
// Responsibilities:
//   - Look up MailAccount documents by email address (used by sendEmailAs).
//   - Returns typed results; never applies business rules.
//   - Does NOT send emails, build templates, or format responses.
//
// Scope (Migration 009):
//   Read-only access to the MailAccount collection.
//   No writes. No access to CrmLead, User, or any other collection.
//
// Future migration role:
//   Will implement an IEmailRepository interface for dependency injection
//   once the DI container is wired (Migration 010+).

import { MailAccountModel } from "../../models";
import type { MailAccountRecord } from "./types";

// ── Read queries ───────────────────────────────────────────────────────────────

/**
 * Find a MailAccount by its email address.
 * Used by sendEmailAs() to resolve custom SMTP credentials.
 *
 * Returns null when no account is registered for the given address,
 * which causes the service to fall back to the default SMTP config.
 *
 * DB query: MailAccountModel.findOne({ emailAddress }).lean()
 */
export async function findMailAccountByEmail(
  emailAddress: string,
): Promise<MailAccountRecord | null> {
  const doc = await MailAccountModel.findOne({ emailAddress }).lean() as MailAccountRecord | null;
  return doc ?? null;
}
