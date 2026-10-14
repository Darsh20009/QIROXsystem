import { randomUUID } from "node:crypto";

export type ProjectInternalFormField = {
  id: string;
  label: string;
  value: string;
};

export type ProjectInternalForm = {
  id: string;
  name: string;
  fields: ProjectInternalFormField[];
};

export type ProjectInternalFormsResult =
  | { ok: true; forms: ProjectInternalForm[] }
  | { ok: false; error: string };

const MAX_FORMS = 20;
const MAX_FIELDS_PER_FORM = 40;
const MAX_NAME_LENGTH = 120;
const MAX_LABEL_LENGTH = 100;
const MAX_VALUE_LENGTH = 5_000;
const SAFE_ID = /^[a-zA-Z0-9_-]{1,80}$/;

export function normalizeProjectInternalForms(input: unknown): ProjectInternalFormsResult {
  if (!Array.isArray(input)) {
    return { ok: false, error: "قائمة النماذج غير صالحة" };
  }
  if (input.length > MAX_FORMS) {
    return { ok: false, error: `الحد الأقصى ${MAX_FORMS} نموذجاً لكل مشروع` };
  }

  const usedIds = new Set<string>();
  const nextId = (candidate: unknown): string => {
    const requested = typeof candidate === "string" && SAFE_ID.test(candidate) ? candidate : "";
    const id = requested && !usedIds.has(requested) ? requested : randomUUID();
    usedIds.add(id);
    return id;
  };

  const forms: ProjectInternalForm[] = [];
  for (const rawForm of input) {
    if (!rawForm || typeof rawForm !== "object" || Array.isArray(rawForm)) {
      return { ok: false, error: "أحد النماذج غير صالح" };
    }

    const form = rawForm as Record<string, unknown>;
    const name = typeof form.name === "string" ? form.name.trim() : "";
    if (!name || name.length > MAX_NAME_LENGTH) {
      return { ok: false, error: `اسم النموذج مطلوب وبحد أقصى ${MAX_NAME_LENGTH} حرفاً` };
    }

    const rawFields = form.fields === undefined ? [] : form.fields;
    if (!Array.isArray(rawFields) || rawFields.length > MAX_FIELDS_PER_FORM) {
      return { ok: false, error: `كل نموذج يسمح بحد أقصى ${MAX_FIELDS_PER_FORM} خانة` };
    }

    const fields: ProjectInternalFormField[] = [];
    for (const rawField of rawFields) {
      if (!rawField || typeof rawField !== "object" || Array.isArray(rawField)) {
        return { ok: false, error: "إحدى الخانات غير صالحة" };
      }

      const field = rawField as Record<string, unknown>;
      const label = typeof field.label === "string" ? field.label.trim() : "";
      const value = typeof field.value === "string" ? field.value : "";

      if (!label && !value.trim()) continue;
      if (!label || label.length > MAX_LABEL_LENGTH || value.length > MAX_VALUE_LENGTH) {
        return {
          ok: false,
          error: `اسم الخانة مطلوب وبحد أقصى ${MAX_LABEL_LENGTH} حرفاً، والمعلومة بحد أقصى ${MAX_VALUE_LENGTH} حرف`,
        };
      }

      fields.push({ id: nextId(field.id), label, value });
    }

    forms.push({ id: nextId(form.id), name, fields });
  }

  return { ok: true, forms };
}