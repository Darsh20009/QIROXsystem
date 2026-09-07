// ── CRM V2 Page ───────────────────────────────────────────────────────────────
// Sprint 008 — CRM V2 Foundation.
// Route: /employee/crm-v2
// Gate: FEATURE_CRM_V2 (default false). Existing /employee/crm is untouched.
//
// Tabs:
//   1. Overview       — CRM V2 stats + activity feed
//   2. Pipeline       — Sales Pipeline V2 (Opportunities Kanban)
//   3. Customer       — Customer timeline + interactions (select by ID)
//   4. Lead           — Lead timeline + interactions (select by ID)
//   5. Follow-Up      — Follow-up engine architecture + rules
//   6. Segments       — Segment management
//   7. Tags           — Tag taxonomy management

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmployeeLayout from "@/components/EmployeeLayout";
import { CustomerTimeline } from "./components/CustomerTimeline";
import { InteractionHistory } from "./components/InteractionHistory";
import { LeadScoreCard } from "./components/LeadScoreCard";
import { FollowUpPanel } from "./components/FollowUpPanel";
import { OpportunitiesBoard } from "./components/OpportunitiesBoard";
import { ActivityFeed } from "./components/ActivityFeed";
import { useI18n } from "@/lib/i18n";
import {
  useCustomerTimeline,
  useLeadTimeline,
  useCustomerInteractions,
  useLeadInteractions,
  useSegments, useCreateSegment,
  useTags, useCreateTag,
  useMyReminders, useUpdateReminder,
} from "./hooks/useCrmV2";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, Target, User, UserCheck, Zap, Layers, Tag,
  Clock, CheckCircle2, ChevronRight,
} from "lucide-react";

const TABS = [
  { id: "overview",  iconEl: Activity,   ar: "نظرة عامة",   en: "Overview" },
  { id: "pipeline",  iconEl: Target,     ar: "خط المبيعات", en: "Pipeline" },
  { id: "customer",  iconEl: User,       ar: "العملاء",      en: "Customers" },
  { id: "lead",      iconEl: UserCheck,  ar: "العملاء المحتملون", en: "Leads" },
  { id: "followup",  iconEl: Zap,        ar: "المتابعة",     en: "Follow-Up" },
  { id: "segments",  iconEl: Layers,     ar: "الشرائح",      en: "Segments" },
  { id: "tags",      iconEl: Tag,        ar: "التاغات",      en: "Tags" },
] as const;
type TabId = typeof TABS[number]["id"];

// ── Customer Tab ──────────────────────────────────────────────────────────────

function CustomerTab({ lang }: { lang: "ar" | "en" }) {
  const isAr = lang === "ar";
  const [customerId, setCustomerId] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data: tlData, isLoading: tlLoading } = useCustomerTimeline(submitted || null);
  const { data: intData, isLoading: intLoading } = useCustomerInteractions(submitted || null);

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      {/* ID input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customerId}
          onChange={e => setCustomerId(e.target.value)}
          placeholder={isAr ? "أدخل معرّف العميل (User ID)..." : "Enter customer ID..."}
          className="flex-1 h-9 px-3 text-xs rounded-md border border-input bg-background"
          onKeyDown={e => e.key === "Enter" && setSubmitted(customerId.trim())}
        />
        <Button size="sm" className="h-9 text-xs" onClick={() => setSubmitted(customerId.trim())} disabled={!customerId.trim()}>
          {isAr ? "بحث" : "Search"}
        </Button>
      </div>

      {submitted && (
        <>
          {/* Score Card */}
          <LeadScoreCard customerId={submitted} lang={lang} />

          {/* Interaction History */}
          <InteractionHistory
            interactions={intData?.interactions ?? []}
            isLoading={intLoading}
            subjectType="customer"
            subjectId={submitted}
            lang={lang}
          />

          {/* Unified Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-black dark:text-white mb-3">
              {isAr ? "الجدول الزمني الموحّد" : "Unified Timeline"}
              {!tlLoading && tlData && (
                <span className="text-[10px] font-normal text-gray-400 ms-2">({tlData.total} {isAr ? "حدث" : "events"})</span>
              )}
            </h4>
            <CustomerTimeline events={tlData?.timeline ?? []} isLoading={tlLoading} lang={lang} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Lead Tab ──────────────────────────────────────────────────────────────────

function LeadTab({ lang }: { lang: "ar" | "en" }) {
  const isAr = lang === "ar";
  const [leadId, setLeadId] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data: tlData, isLoading: tlLoading } = useLeadTimeline(submitted || null);
  const { data: intData, isLoading: intLoading } = useLeadInteractions(submitted || null);

  const lead = tlData?.lead;

  return (
    <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex gap-2">
        <input
          type="text"
          value={leadId}
          onChange={e => setLeadId(e.target.value)}
          placeholder={isAr ? "أدخل معرّف العميل المحتمل..." : "Enter lead ID..."}
          className="flex-1 h-9 px-3 text-xs rounded-md border border-input bg-background"
          onKeyDown={e => e.key === "Enter" && setSubmitted(leadId.trim())}
        />
        <Button size="sm" className="h-9 text-xs" onClick={() => setSubmitted(leadId.trim())} disabled={!leadId.trim()}>
          {isAr ? "بحث" : "Search"}
        </Button>
      </div>

      {submitted && (
        <>
          {/* Lead Summary */}
          {lead && (
            <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-black dark:text-white">{lead.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{lead.company || lead.email || lead.phone}</p>
                </div>
                <Badge variant="outline" className="text-[10px] border-black/10 dark:border-white/10">
                  {lead.stage}
                </Badge>
              </div>
              {lead.value > 0 && (
                <p className="text-sm font-bold mt-2 text-black dark:text-white">
                  {Number(lead.value).toLocaleString()} {lead.currency || "SAR"}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {(lead.tags || []).map((t: string) => (
                  <Badge key={t} variant="outline" className="text-[10px] border-black/10 dark:border-white/10">{t}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Interaction History */}
          <InteractionHistory
            interactions={intData?.interactions ?? []}
            isLoading={intLoading}
            subjectType="lead"
            subjectId={submitted}
            lang={lang}
          />

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-black dark:text-white mb-3">
              {isAr ? "الجدول الزمني" : "Timeline"}
              {!tlLoading && tlData && (
                <span className="text-[10px] font-normal text-gray-400 ms-2">({tlData.total} {isAr ? "حدث" : "events"})</span>
              )}
            </h4>
            <CustomerTimeline events={tlData?.timeline ?? []} isLoading={tlLoading} lang={lang} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Segments Tab ──────────────────────────────────────────────────────────────

function SegmentsTab({ lang }: { lang: "ar" | "en" }) {
  const isAr = lang === "ar";
  const { data, isLoading } = useSegments();
  const create = useCreateSegment();
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    await create.mutateAsync({ name: name.trim(), nameAr: nameAr.trim() });
    setName(""); setNameAr("");
  }

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      {/* Create form */}
      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-4 space-y-3">
        <h4 className="text-xs font-semibold text-black dark:text-white">
          {isAr ? "إنشاء شريحة جديدة" : "Create New Segment"}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder={isAr ? "الاسم (إنجليزي)" : "Name (English)"}
            className="h-8 px-3 text-xs rounded-md border border-input bg-background" />
          <input type="text" value={nameAr} onChange={e => setNameAr(e.target.value)}
            placeholder={isAr ? "الاسم (عربي)" : "Name (Arabic)"}
            className="h-8 px-3 text-xs rounded-md border border-input bg-background" dir="rtl" />
        </div>
        <Button size="sm" className="w-full h-8 text-xs" onClick={handleCreate} disabled={!name.trim() || create.isPending}>
          {create.isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء الشريحة" : "Create Segment")}
        </Button>
      </div>

      {/* Segment list */}
      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden bg-white dark:bg-gray-900 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {isLoading ? (
          <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
        ) : (data?.segments ?? []).length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2 text-center">
            <span className="text-2xl">🗂️</span>
            <p className="text-xs text-gray-400">{isAr ? "لا توجد شرائح بعد" : "No segments yet"}</p>
          </div>
        ) : (
          (data?.segments ?? []).map((seg: any, i: number) => (
            <motion.div key={seg.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color || "#000" }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black dark:text-white">{isAr ? (seg.nameAr || seg.name) : seg.name}</p>
                {seg.description && <p className="text-[10px] text-gray-400">{seg.description}</p>}
              </div>
              <span className="text-[10px] text-gray-400">{seg.memberCount || 0} {isAr ? "عضو" : "members"}</span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Tags Tab ──────────────────────────────────────────────────────────────────

function TagsTab({ lang }: { lang: "ar" | "en" }) {
  const isAr = lang === "ar";
  const { data, isLoading } = useTags();
  const create = useCreateTag();
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [color, setColor] = useState("#000000");
  const [category, setCategory] = useState("general");

  async function handleCreate() {
    if (!name.trim()) return;
    await create.mutateAsync({ name: name.trim(), nameAr: nameAr.trim(), color, category });
    setName(""); setNameAr("");
  }

  return (
    <div className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-4 space-y-3">
        <h4 className="text-xs font-semibold text-black dark:text-white">
          {isAr ? "إنشاء تاغ جديد" : "Create New Tag"}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Name (EN)" className="h-8 px-3 text-xs rounded-md border border-input bg-background" />
          <input type="text" value={nameAr} onChange={e => setNameAr(e.target.value)}
            placeholder="الاسم (AR)" className="h-8 px-3 text-xs rounded-md border border-input bg-background" dir="rtl" />
        </div>
        <div className="flex gap-2 items-center">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-input" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="flex-1 h-8 px-2 text-xs rounded-md border border-input bg-background">
            {["lead", "customer", "opportunity", "general"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <Button size="sm" className="w-full h-8 text-xs" onClick={handleCreate} disabled={!name.trim() || create.isPending}>
          {create.isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء التاغ" : "Create Tag")}
        </Button>
      </div>

      {/* Tag list */}
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-7 w-20 rounded-full" />)
        ) : (data?.tags ?? []).length === 0 ? (
          <p className="text-xs text-gray-400 w-full text-center py-4">
            {isAr ? "لا توجد تاغات بعد" : "No tags yet"}
          </p>
        ) : (
          (data?.tags ?? []).map((tag: any) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs px-3 py-1 border-black/10 dark:border-white/10"
              style={{ borderLeftColor: tag.color, borderLeftWidth: 3 }}
            >
              {isAr ? (tag.nameAr || tag.name) : tag.name}
              <span className="text-gray-400 ms-1.5">({tag.usageCount})</span>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

// ── Reminders Widget ──────────────────────────────────────────────────────────

function RemindersWidget({ lang }: { lang: "ar" | "en" }) {
  const isAr = lang === "ar";
  const { data, isLoading } = useMyReminders();
  const update = useUpdateReminder();

  const reminders = data?.reminders ?? [];

  if (!isLoading && reminders.length === 0) return null;

  return (
    <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.04]">
        <Clock className="w-4 h-4 text-gray-400" />
        <h4 className="text-xs font-semibold text-black dark:text-white">
          {isAr ? "تذكيراتي" : "My Reminders"}
        </h4>
        <span className="text-[10px] font-bold bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded-full">
          {reminders.length}
        </span>
      </div>
      <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {isLoading ? (
          <div className="p-4 space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          reminders.slice(0, 3).map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black dark:text-white truncate">{r.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(r.dueAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")} · {r.priority}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] gap-1"
                onClick={() => update.mutate({ id: r.id, status: "done" })}
                disabled={update.isPending}
              >
                <CheckCircle2 className="w-3 h-3" />
                {isAr ? "تم" : "Done"}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CrmV2Page() {
  const { lang } = useI18n();
  const l = (lang as string) === "en" ? "en" : "ar";
  const isAr = l === "ar";
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <EmployeeLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16" dir={isAr ? "rtl" : "ltr"}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-black/[0.04] dark:border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-black dark:text-white">
                {isAr ? "نظام إدارة علاقات العملاء V2" : "CRM V2"}
              </h1>
              <p className="text-[11px] text-gray-400">
                {isAr ? "إطار معماري — Sprint 008" : "Foundation — Sprint 008"}
              </p>
            </div>
            <span className="text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.06] text-gray-400 px-2 py-0.5 rounded-full border border-black/[0.06] dark:border-white/[0.06]">
              V2 · FOUNDATION
            </span>
          </div>

          {/* Tab bar */}
          <div className="max-w-5xl mx-auto px-4 pb-0">
            <div className="flex overflow-x-auto gap-1 pb-0 no-scrollbar">
              {TABS.map(tab => {
                const Icon = tab.iconEl;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                      isActive
                        ? "border-black dark:border-white text-black dark:text-white"
                        : "border-transparent text-gray-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {isAr ? tab.ar : tab.en}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">

          {/* Reminders widget (shown on all tabs) */}
          <RemindersWidget lang={l} />

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview"  && <ActivityFeed lang={l} />}
              {activeTab === "pipeline"  && <OpportunitiesBoard lang={l} />}
              {activeTab === "customer"  && <CustomerTab lang={l} />}
              {activeTab === "lead"      && <LeadTab lang={l} />}
              {activeTab === "followup"  && <FollowUpPanel lang={l} />}
              {activeTab === "segments"  && <SegmentsTab lang={l} />}
              {activeTab === "tags"      && <TagsTab lang={l} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </EmployeeLayout>
  );
}
