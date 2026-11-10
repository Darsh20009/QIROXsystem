import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProjectInternalForms } from "./project-internal-forms";

test("normalizes named forms and keeps each form's values independent", () => {
  const result = normalizeProjectInternalForms([
    {
      id: "website",
      name: "  الموقع  ",
      fields: [
        { id: "domain", label: " الدومين ", value: "example.test" },
        { id: "blank", label: "", value: "" },
      ],
    },
    {
      id: "app",
      name: "التطبيق",
      fields: [{ id: "domain", label: "رابط التطبيق", value: "app.example.test" }],
    },
  ]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.forms.length, 2);
  assert.equal(result.forms[0].name, "الموقع");
  assert.deepEqual(result.forms[0].fields.map(({ label, value }) => ({ label, value })), [
    { label: "الدومين", value: "example.test" },
  ]);
  assert.notEqual(result.forms[0].fields[0].id, result.forms[1].fields[0].id);
});

test("rejects missing names, unnamed populated fields, and oversized form lists", () => {
  assert.equal(normalizeProjectInternalForms([{ name: " ", fields: [] }]).ok, false);
  assert.equal(
    normalizeProjectInternalForms([{ name: "التقنية", fields: [{ label: "", value: "معلومة" }] }]).ok,
    false,
  );
  assert.equal(normalizeProjectInternalForms(Array.from({ length: 21 }, (_, i) => ({
    name: `نموذج ${i}`,
    fields: [],
  }))).ok, false);
});