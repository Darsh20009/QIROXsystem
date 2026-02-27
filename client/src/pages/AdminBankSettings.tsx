import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Building2, Save, RefreshCw, CreditCard, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BankSettings {
  bankName: string;
  beneficiaryName: string;
  iban: string;
  accountNumber: string;
  swiftCode: string;
  currency: string;
  notes: string;
}

const DEFAULT: BankSettings = {
  bankName: "بنك الراجحي",
  beneficiaryName: "QIROX Studio",
  iban: "SA0380205098017222121010",
  accountNumber: "",
  swiftCode: "",
  currency: "SAR",
  notes: "",
};

export default function AdminBankSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<BankSettings>({ queryKey: ["/api/bank-settings"] });

  const [form, setForm] = useState<BankSettings>(DEFAULT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data as BankSettings);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: BankSettings) =>
      apiRequest("PUT", "/api/admin/bank-settings", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: "تم الحفظ بنجاح", description: "تم تحديث إعدادات البنك." });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل تحديث إعدادات البنك.", variant: "destructive" });
    },
  });

  const handleChange = (field: keyof BankSettings, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] p-6 md:p-10" dir="rtl">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight">إعدادات البنك</h1>
            <p className="text-sm text-black/40 mt-0.5">بيانات التحويل البنكي التي تظهر للعملاء عند الدفع</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            هذه البيانات تظهر للعميل في خطوة الدفع عند إتمام الطلب. تأكد من صحة رقم IBAN واسم المستفيد قبل الحفظ.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="w-6 h-6 animate-spin text-black/30" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Card preview */}
            <div className="rounded-2xl overflow-hidden border border-black/[0.07] shadow-sm mb-2">
              <div className="bg-black px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">معاينة بطاقة الدفع</p>
                    <p className="text-white text-xl font-black">{form.bankName || "—"}</p>
                  </div>
                  <CreditCard className="w-7 h-7 text-white/30" />
                </div>
              </div>
              <div className="bg-white px-6 py-4 space-y-2">
                {[
                  { label: "اسم المستفيد", value: form.beneficiaryName },
                  { label: "رقم IBAN", value: form.iban },
                  { label: "العملة", value: form.currency },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5 border-b border-black/[0.04] last:border-0">
                    <span className="text-xs text-black/40">{r.label}</span>
                    <span className="text-xs font-semibold text-black font-mono" dir={r.label === "رقم IBAN" ? "ltr" : undefined}>{r.value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form fields */}
            <div className="bg-white rounded-2xl border border-black/[0.07] p-6 space-y-5">
              <h2 className="text-sm font-black text-black/70 uppercase tracking-widest border-b border-black/[0.06] pb-3">تفاصيل الحساب البنكي</h2>

              {[
                { label: "اسم البنك", field: "bankName" as const, placeholder: "مثال: بنك الراجحي", dir: "rtl" },
                { label: "اسم المستفيد", field: "beneficiaryName" as const, placeholder: "مثال: QIROX Studio", dir: "rtl" },
                { label: "رقم IBAN", field: "iban" as const, placeholder: "SA00 0000 0000 0000 0000 0000", dir: "ltr" },
                { label: "رقم الحساب (اختياري)", field: "accountNumber" as const, placeholder: "رقم الحساب البنكي", dir: "ltr" },
                { label: "SWIFT / BIC (اختياري)", field: "swiftCode" as const, placeholder: "RJHISARI", dir: "ltr" },
                { label: "العملة", field: "currency" as const, placeholder: "SAR", dir: "ltr" },
              ].map(({ label, field, placeholder, dir }) => (
                <div key={field}>
                  <label className="block text-[11px] font-bold text-black/50 uppercase tracking-widest mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={e => handleChange(field, e.target.value)}
                    placeholder={placeholder}
                    dir={dir}
                    data-testid={`input-bank-${field}`}
                    className="w-full h-11 bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 text-sm font-medium text-black placeholder:text-black/25 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 transition-all font-mono"
                  />
                </div>
              ))}

              <div>
                <label className="block text-[11px] font-bold text-black/50 uppercase tracking-widest mb-1.5">ملاحظات إضافية (اختياري)</label>
                <textarea
                  value={form.notes}
                  onChange={e => handleChange("notes", e.target.value)}
                  placeholder="أي تعليمات إضافية تريد إظهارها للعميل..."
                  rows={3}
                  data-testid="input-bank-notes"
                  className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-black/25 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 transition-all resize-none"
                />
              </div>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              data-testid="button-save-bank-settings"
              className={`w-full h-12 rounded-2xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                saved
                  ? "bg-green-600 text-white"
                  : "bg-black text-white hover:bg-black/85 active:scale-[0.98]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {mutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
