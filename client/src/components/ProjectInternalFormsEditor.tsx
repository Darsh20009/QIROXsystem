import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type FormField = { id: string; label: string; value: string };
type InternalForm = { id: string; name: string; fields: FormField[] };

function newId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toEditorForms(value: unknown): InternalForm[] {
  if (!Array.isArray(value)) return [];
  return value.map((form: any, formIndex) => ({
    id: typeof form?.id === "string" ? form.id : `form-${formIndex}-${newId()}`,
    name: typeof form?.name === "string" ? form.name : "",
    fields: Array.isArray(form?.fields)
      ? form.fields.map((field: any, fieldIndex: number) => ({
          id: typeof field?.id === "string" ? field.id : `field-${formIndex}-${fieldIndex}-${newId()}`,
          label: typeof field?.label === "string" ? field.label : "",
          value: typeof field?.value === "string" ? field.value : "",
        }))
      : [],
  }));
}

export default function ProjectInternalFormsEditor({
  orderId,
  initialForms,
}: {
  orderId: string;
  initialForms: unknown;
}) {
  const [forms, setForms] = useState(() => toEditorForms(initialForms));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/admin/orders/${orderId}/specs/internal-forms`, {
        internalForms: forms,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر حفظ النماذج الداخلية");
      return data;
    },
    onSuccess: (data) => {
      setForms(toEditorForms(data.internalForms));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId, "specs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "تم حفظ النماذج الداخلية" });
    },
    onError: (error: any) => {
      toast({
        title: error?.message || "تعذر حفظ النماذج الداخلية",
        variant: "destructive",
      });
    },
  });

  const addForm = () => {
    if (forms.length >= 20) return;
    setForms((current) => [...current, {
      id: newId(),
      name: "",
      fields: [{ id: newId(), label: "", value: "" }],
    }]);
  };

  const duplicateForm = (form: InternalForm) => {
    if (forms.length >= 20) return;
    setForms((current) => [...current, {
      id: newId(),
      name: form.name ? `${form.name} - نسخة` : "",
      fields: form.fields.map((field) => ({
        id: newId(),
        label: field.label,
        value: "",
      })),
    }]);
  };

  const updateForm = (formId: string, update: Partial<InternalForm>) => {
    setForms((current) => current.map((form) =>
      form.id === formId ? { ...form, ...update } : form,
    ));
  };

  const updateField = (formId: string, fieldId: string, update: Partial<FormField>) => {
    setForms((current) => current.map((form) => form.id !== formId
      ? form
      : {
          ...form,
          fields: form.fields.map((field) =>
            field.id === fieldId ? { ...field, ...update } : field,
          ),
        },
    ));
  };

  return (
    <section className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/10 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white">نماذج مشاريع داخلية إضافية</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-slate-400">
            أنشئ نموذجاً باسم داخلي وخانات مستقلة لتسجيل بيانات مشروع آخر ضمن هذا الطلب.
          </p>
          <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
            لا تضع كلمات المرور أو مفاتيح API هنا؛ استخدم حقول بيانات النشر المخصصة لها.
          </p>
        </div>
        <button
          type="button"
          onClick={addForm}
          disabled={forms.length >= 20}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 px-3 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50"
          data-testid="button-add-project-internal-form"
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة نموذج
        </button>
      </div>

      {forms.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-4 text-center text-xs text-gray-400 dark:text-slate-500">
          لا توجد نماذج داخلية إضافية لهذا الطلب.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {forms.map((form, formIndex) => (
            <div key={form.id} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={form.name}
                  onChange={(event) => updateForm(form.id, { name: event.target.value })}
                  maxLength={120}
                  placeholder={`الاسم الداخلي للنموذج ${formIndex + 1}`}
                  aria-label={`الاسم الداخلي للنموذج ${formIndex + 1}`}
                  className="h-10 min-w-[180px] flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-950 px-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-400"
                  data-testid={`input-project-internal-form-name-${formIndex}`}
                />
                <button
                  type="button"
                  onClick={() => duplicateForm(form)}
                  disabled={forms.length >= 20}
                  title="نسخ أسماء الخانات إلى نموذج جديد دون نسخ البيانات"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  نسخ الخانات
                </button>
                <button
                  type="button"
                  onClick={() => setForms((current) => current.filter((item) => item.id !== form.id))}
                  title="حذف النموذج"
                  aria-label="حذف النموذج"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {form.fields.map((field) => (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[minmax(140px,0.8fr)_minmax(180px,1.2fr)_36px] gap-2">
                    <input
                      value={field.label}
                      onChange={(event) => updateField(form.id, field.id, { label: event.target.value })}
                      maxLength={100}
                      placeholder="اسم الخانة"
                      aria-label="اسم الخانة"
                      className="h-10 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-950 px-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400"
                    />
                    <textarea
                      value={field.value}
                      onChange={(event) => updateField(form.id, field.id, { value: event.target.value })}
                      maxLength={5000}
                      rows={1}
                      placeholder="المعلومة"
                      aria-label="المعلومة"
                      className="min-h-10 resize-y rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => updateForm(form.id, {
                        fields: form.fields.filter((item) => item.id !== field.id),
                      })}
                      title="حذف الخانة"
                      aria-label="حذف الخانة"
                      className="h-10 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="mx-auto h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateForm(form.id, {
                    fields: [...form.fields, { id: newId(), label: "", value: "" }],
                  })}
                  disabled={form.fields.length >= 40}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  إضافة خانة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          data-testid="button-save-project-internal-forms"
        >
          {saveMutation.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Save className="h-4 w-4" />}
          حفظ النماذج
        </button>
      </div>
    </section>
  );
}