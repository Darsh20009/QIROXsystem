// ── Proposal V2 Page ──────────────────────────────────────────────────────────
// Sprint D — Proposal Builder V2 Architecture.
// Route: /employee/proposals-v2
// Gate: FEATURE_PROPOSAL_V2 (default false). The existing /employee/quotations
// flow (AdminQuotations.tsx) is completely untouched by this page.
//
// When the flag is off (default), this page renders an "architecture, not
// yet enabled" placeholder — the server-side API 404s regardless, so this
// is purely a friendlier UX for anyone who navigates here directly.

import { useState } from "react";
import EmployeeLayout from "@/components/EmployeeLayout";
import { useI18n } from "@/lib/i18n";
import { useFlag } from "@/features/customer-journey/hooks/use-feature-flags";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Plus, Trash2, Layers, DollarSign, Copy, ExternalLink, Sparkles,
} from "lucide-react";
import {
  useProposals, useProposalStats, useCreateProposal, useChangeProposalStatus,
  useDeleteProposal, usePrefillFromQuotation,
  type ProposalV2, type ProposalV2Section, type ProposalV2Item,
} from "./hooks/useProposalV2";

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  draft:    { ar: "مسودة",  en: "Draft" },
  sent:     { ar: "مُرسل",  en: "Sent" },
  viewed:   { ar: "تمت المشاهدة", en: "Viewed" },
  accepted: { ar: "مقبول",  en: "Accepted" },
  rejected: { ar: "مرفوض",  en: "Rejected" },
  expired:  { ar: "منتهي",  en: "Expired" },
};

// ── Not-enabled placeholder ───────────────────────────────────────────────────

function NotEnabledPlaceholder({ isAr }: { isAr: boolean }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center" dir={isAr ? "rtl" : "ltr"}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] mb-4">
        <Sparkles className="w-7 h-7 text-gray-400" />
      </div>
      <h1 className="text-lg font-bold text-black dark:text-white mb-2">
        {isAr ? "منشئ العروض V2 — إطار معماري" : "Proposal Builder V2 — Architecture"}
      </h1>
      <p className="text-sm text-gray-400 max-w-md mx-auto mb-4">
        {isAr
          ? "هذه الميزة قيد البناء ومغلقة خلف علم الميزات FEATURE_PROPOSAL_V2. نظام عروض الأسعار الحالي يعمل بدون أي تغيير."
          : "This feature is built but gated behind the FEATURE_PROPOSAL_V2 flag. The existing Quotations system is untouched and keeps working exactly as before."}
      </p>
      <span className="text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.06] text-gray-400 px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/[0.06]">
        FEATURE_PROPOSAL_V2 = false
      </span>
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ isAr }: { isAr: boolean }) {
  const { data, isLoading } = useProposalStats();
  const cards = [
    { key: "total",    label: isAr ? "إجمالي العروض" : "Total Proposals", value: data?.total ?? 0, icon: FileText },
    { key: "value",    label: isAr ? "القيمة الإجمالية" : "Total Value",  value: `${(data?.totalValue ?? 0).toLocaleString()} SAR`, icon: DollarSign },
    { key: "accepted", label: isAr ? "القيمة المقبولة" : "Accepted Value", value: `${(data?.acceptedValue ?? 0).toLocaleString()} SAR`, icon: Layers },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(c => (
        <div key={c.key} className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-3">
          <c.icon className="w-4 h-4 text-gray-400 mb-1.5" />
          {isLoading ? <Skeleton className="h-5 w-16" /> : (
            <p className="text-sm font-bold text-black dark:text-white">{c.value}</p>
          )}
          <p className="text-[10px] text-gray-400 mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Section editor (builder) ──────────────────────────────────────────────────

function SectionEditor({
  sections, setSections, isAr,
}: {
  sections: ProposalV2Section[];
  setSections: (s: ProposalV2Section[]) => void;
  isAr: boolean;
}) {
  function addSection(type: ProposalV2Section["type"]) {
    setSections([
      ...sections,
      { id: `s-${Date.now()}`, type, title: "", content: "", items: [], order: sections.length },
    ]);
  }

  function updateSection(idx: number, patch: Partial<ProposalV2Section>) {
    setSections(sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function removeSection(idx: number) {
    setSections(sections.filter((_, i) => i !== idx));
  }

  function addItem(idx: number) {
    const item: ProposalV2Item = { name: "", description: "", qty: 1, unitPrice: 0, total: 0 };
    updateSection(idx, { items: [...sections[idx].items, item] });
  }

  function updateItem(sIdx: number, iIdx: number, patch: Partial<ProposalV2Item>) {
    const items = sections[sIdx].items.map((it, i) => {
      if (i !== iIdx) return it;
      const next = { ...it, ...patch };
      next.total = (Number(next.qty) || 0) * (Number(next.unitPrice) || 0);
      return next;
    });
    updateSection(sIdx, { items });
  }

  function removeItem(sIdx: number, iIdx: number) {
    updateSection(sIdx, { items: sections[sIdx].items.filter((_, i) => i !== iIdx) });
  }

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => (
        <div key={section.id} className="rounded-lg border border-black/[0.08] dark:border-white/[0.08] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{section.type}</Badge>
            <Input
              placeholder={isAr ? "عنوان القسم" : "Section title"}
              value={section.title}
              onChange={e => updateSection(idx, { title: e.target.value })}
              className="h-8 text-xs flex-1"
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeSection(idx)}>
              <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          </div>

          {section.type === "items" ? (
            <div className="space-y-2">
              {section.items.map((item, iIdx) => (
                <div key={iIdx} className="grid grid-cols-12 gap-1.5 items-center">
                  <Input className="col-span-4 h-8 text-xs" placeholder={isAr ? "البند" : "Item"} value={item.name}
                    onChange={e => updateItem(idx, iIdx, { name: e.target.value })} />
                  <Input className="col-span-3 h-8 text-xs" placeholder={isAr ? "الوصف" : "Description"} value={item.description}
                    onChange={e => updateItem(idx, iIdx, { description: e.target.value })} />
                  <Input className="col-span-2 h-8 text-xs" type="number" placeholder="Qty" value={item.qty}
                    onChange={e => updateItem(idx, iIdx, { qty: Number(e.target.value) })} />
                  <Input className="col-span-2 h-8 text-xs" type="number" placeholder="Price" value={item.unitPrice}
                    onChange={e => updateItem(idx, iIdx, { unitPrice: Number(e.target.value) })} />
                  <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8" onClick={() => removeItem(idx, iIdx)}>
                    <Trash2 className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => addItem(idx)}>
                <Plus className="w-3 h-3 me-1" /> {isAr ? "إضافة بند" : "Add item"}
              </Button>
            </div>
          ) : (
            <Textarea
              placeholder={isAr ? "المحتوى..." : "Content..."}
              value={section.content}
              onChange={e => updateSection(idx, { content: e.target.value })}
              className="text-xs min-h-[70px]"
            />
          )}
        </div>
      ))}

      <div className="flex gap-2 flex-wrap">
        {(["text", "items", "pricing", "terms", "custom"] as const).map(t => (
          <Button key={t} size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => addSection(t)}>
            <Plus className="w-3 h-3 me-1" /> {t}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ── Create dialog ─────────────────────────────────────────────────────────────

function CreateProposalDialog({ open, onClose, isAr }: { open: boolean; onClose: () => void; isAr: boolean }) {
  const { toast } = useToast();
  const create = useCreateProposal();
  const prefill = usePrefillFromQuotation();
  const [title, setTitle] = useState("");
  const [externalName, setExternalName] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [quotationId, setQuotationId] = useState("");
  const [sections, setSections] = useState<ProposalV2Section[]>([]);

  async function handlePrefill() {
    if (!quotationId.trim()) return;
    try {
      const data = await prefill.mutateAsync(quotationId.trim());
      setTitle(data.title || "");
      setExternalName(data.externalName || "");
      setExternalEmail(data.externalEmail || "");
      setSections(data.sections || []);
      toast({ title: isAr ? "تم التعبئة من عرض السعر" : "Prefilled from quotation" });
    } catch {
      toast({ title: isAr ? "تعذر العثور على عرض السعر" : "Quotation not found", variant: "destructive" });
    }
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    try {
      await create.mutateAsync({
        title: title.trim(), externalName, externalEmail, sections,
        sourceQuotationId: quotationId.trim() || undefined,
      });
      toast({ title: isAr ? "تم إنشاء العرض" : "Proposal created" });
      setTitle(""); setExternalName(""); setExternalEmail(""); setQuotationId(""); setSections([]);
      onClose();
    } catch {
      toast({ title: isAr ? "فشل الإنشاء" : "Failed to create", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{isAr ? "عرض جديد" : "New Proposal"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder={isAr ? "معرّف عرض سعر (اختياري) للتعبئة" : "Quotation ID (optional) to prefill"}
              value={quotationId} onChange={e => setQuotationId(e.target.value)} className="h-9 text-xs flex-1" />
            <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handlePrefill} disabled={prefill.isPending}>
              <Copy className="w-3.5 h-3.5 me-1" /> {isAr ? "تعبئة" : "Prefill"}
            </Button>
          </div>
          <Input placeholder={isAr ? "عنوان العرض" : "Proposal title"} value={title} onChange={e => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder={isAr ? "اسم العميل" : "Client name"} value={externalName} onChange={e => setExternalName(e.target.value)} />
            <Input placeholder={isAr ? "بريد العميل" : "Client email"} value={externalEmail} onChange={e => setExternalEmail(e.target.value)} />
          </div>
          <SectionEditor sections={sections} setSections={setSections} isAr={isAr} />
          <Button className="w-full" onClick={handleSubmit} disabled={!title.trim() || create.isPending}>
            {create.isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء العرض" : "Create Proposal")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── List ──────────────────────────────────────────────────────────────────────

function ProposalList({ isAr }: { isAr: boolean }) {
  const [status, setStatus] = useState("all");
  const { data, isLoading } = useProposals({ status });
  const changeStatus = useChangeProposalStatus();
  const del = useDeleteProposal();
  const { toast } = useToast();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All statuses"}</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden bg-white dark:bg-gray-900 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {isLoading ? (
          <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
        ) : (data ?? []).length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-center">
            <FileText className="w-6 h-6 text-gray-300" />
            <p className="text-xs text-gray-400">{isAr ? "لا توجد عروض بعد" : "No proposals yet"}</p>
          </div>
        ) : (
          (data ?? []).map((p: ProposalV2) => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-black dark:text-white truncate">{p.title || p.proposalNumber}</p>
                  <Badge variant="outline" className="text-[10px] shrink-0">{p.proposalNumber}</Badge>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {p.externalName || p.externalCompany || "—"} · {p.totalAmount?.toLocaleString()} {p.currency}
                </p>
              </div>
              <Select value={p.status} onValueChange={v => changeStatus.mutate({ id: p.id, status: v })}>
                <SelectTrigger className="h-7 w-28 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon" variant="ghost" className="h-7 w-7"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/v2/proposals/public/${p.viewToken}`);
                  toast({ title: isAr ? "تم نسخ رابط المشاركة" : "Share link copied" });
                }}
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => del.mutate(p.id)}>
                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProposalV2Page() {
  const { lang } = useI18n();
  const isAr = (lang as string) !== "en";
  const isEnabled = useFlag("FEATURE_PROPOSAL_V2");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <EmployeeLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16" dir={isAr ? "rtl" : "ltr"}>
        {!isEnabled ? (
          <NotEnabledPlaceholder isAr={isAr} />
        ) : (
          <>
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-black/[0.04] dark:border-white/[0.04]">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                <div>
                  <h1 className="text-base font-bold text-black dark:text-white">
                    {isAr ? "منشئ العروض V2" : "Proposal Builder V2"}
                  </h1>
                  <p className="text-[11px] text-gray-400">
                    {isAr ? "إطار معماري إضافي — Sprint D" : "Additive architecture — Sprint D"}
                  </p>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-3.5 h-3.5 me-1" /> {isAr ? "عرض جديد" : "New Proposal"}
                </Button>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
              <StatsBar isAr={isAr} />
              <ProposalList isAr={isAr} />
            </div>

            <CreateProposalDialog open={createOpen} onClose={() => setCreateOpen(false)} isAr={isAr} />
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}
