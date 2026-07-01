import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  TrendingUp, Plus, Search, Phone, Mail, Building2, User2,
  ChevronRight, X, MessageCircle, Calendar, Edit2, Trash2,
  PhoneCall, Send, Video, StickyNote, CheckSquare,
  DollarSign, Tag, Clock, MoreVertical, Filter,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download,
} from "lucide-react";

const STAGES = [
  { id: "new",       labelAr: "جديد",         labelEn: "New",       color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",   dot: "bg-blue-500" },
  { id: "contacted", labelAr: "تم التواصل",   labelEn: "Contacted", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", dot: "bg-purple-500" },
  { id: "qualified", labelAr: "مؤهَّل",        labelEn: "Qualified", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",   dot: "bg-amber-500" },
  { id: "proposal",  labelAr: "عرض سعر",      labelEn: "Proposal",  color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", dot: "bg-orange-500" },
  { id: "won",       labelAr: "تم الإغلاق ✓", labelEn: "Won ✓",    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", dot: "bg-emerald-500" },
  { id: "lost",      labelAr: "خسارة",        labelEn: "Lost",      color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",         dot: "bg-red-500" },
];

const SOURCES = [
  { id: "website",    labelAr: "الموقع" },   { id: "instagram", labelAr: "إنستغرام" },
  { id: "twitter",    labelAr: "تويتر" },    { id: "tiktok",    labelAr: "تيك توك" },
  { id: "referral",   labelAr: "إحالة" },    { id: "cold_call", labelAr: "اتصال بارد" },
  { id: "exhibition", labelAr: "معرض" },     { id: "other",     labelAr: "أخرى" },
];

const ACTIVITY_TYPES = [
  { id: "call",     icon: PhoneCall,    labelAr: "مكالمة" },
  { id: "whatsapp", icon: MessageCircle, labelAr: "واتساب" },
  { id: "email",    icon: Send,         labelAr: "بريد" },
  { id: "meeting",  icon: Video,        labelAr: "اجتماع" },
  { id: "note",     icon: StickyNote,   labelAr: "ملاحظة" },
  { id: "task",     icon: CheckSquare,  labelAr: "مهمة" },
];

function stageInfo(id: string) { return STAGES.find(s => s.id === id) || STAGES[0]; }

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

function dateLabel(d: string) {
  const now = Date.now();
  const diff = now - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  const days = Math.floor(h / 24);
  return `منذ ${days} يوم`;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <TrendingUp className="w-14 h-14 text-black/10 dark:text-white/10 mb-4" />
      <p className="text-black/40 dark:text-white/40 text-base mb-4">لا يوجد عملاء محتملون بعد</p>
      <Button onClick={onAdd} className="bg-black text-white dark:bg-white dark:text-black hover:opacity-80">
        <Plus className="w-4 h-4 ml-1" /> أضف أول عميل
      </Button>
    </div>
  );
}

interface Lead {
  id: string; name: string; phone: string; email: string;
  company: string; source: string; stage: string; value: number;
  currency: string; assignedToName: string; notes: string;
  lostReason: string; tags: string[]; nextFollowUpAt: string | null;
  lastContactedAt: string | null; activities: Activity[]; createdAt: string; updatedAt: string;
}
interface Activity { id: string; type: string; content: string; createdBy: string; createdAt: string; }

export default function EmployeeCRM() {
  const { lang } = useI18n();
  const L = lang === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();

  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activityType, setActivityType] = useState("note");
  const [activityContent, setActivityContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [importFileName, setImportFileName] = useState("");

  const [form, setForm] = useState({
    name: "", phone: "", email: "", company: "", source: "other",
    stage: "new", value: "", currency: "SAR", notes: "",
    assignedToName: "", nextFollowUpAt: "",
  });

  const { data: stats } = useQuery<any>({ queryKey: ["/api/crm/stats"] });
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/crm/leads", filterStage, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStage !== "all") params.set("stage", filterStage);
      if (search) params.set("search", search);
      const r = await fetch(`/api/crm/leads?${params}`);
      return r.json();
    },
  });

  const createLead = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/crm/leads", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/crm/leads"] }); qc.invalidateQueries({ queryKey: ["/api/crm/stats"] }); setShowForm(false); toast({ title: "تم إضافة العميل" }); resetForm(); },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  const updateLead = useMutation({
    mutationFn: ({ id, ...body }: any) => apiRequest("PATCH", `/api/crm/leads/${id}`, body),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["/api/crm/leads"] }); qc.invalidateQueries({ queryKey: ["/api/crm/stats"] });
      setSelectedLead(data); setEditMode(false); toast({ title: "تم التحديث" });
    },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  const deleteLead = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/crm/leads/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/crm/leads"] }); qc.invalidateQueries({ queryKey: ["/api/crm/stats"] }); setSelectedLead(null); setShowDeleteConfirm(false); toast({ title: "تم الحذف" }); },
    onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
  });

  const importLeads = useMutation({
    mutationFn: (rows: Record<string, string>[]) => apiRequest("POST", "/api/crm/leads/import", { rows }).then(r => r.json()),
    onSuccess: (d: any) => {
      setImportResult(d);
      qc.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      qc.invalidateQueries({ queryKey: ["/api/crm/stats"] });
    },
    onError: () => toast({ title: "خطأ في الاستيراد", variant: "destructive" }),
  });

  function parseCSV(text: string): Record<string, string>[] {
    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
    return lines.slice(1).map(line => {
      const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || line.split(",");
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = (cols[i] || "").replace(/^"|"$/g, "").trim(); });
      return row;
    }).filter(r => Object.values(r).some(v => v));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setImportRows(rows);
    };
    reader.readAsText(file, "UTF-8");
  }

  function downloadTemplate() {
    const csv = "الاسم,الهاتف,الشركة,البريد,ملاحظات\nمطعم الريم,0501234567,مطعم الريم للمأكولات,info@reem.com,الرياض - حي النزهة\n";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "قالب_عملاء_qirox.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const addActivity = useMutation({
    mutationFn: ({ id, type, content }: any) => apiRequest("POST", `/api/crm/leads/${id}/activity`, { type, content }),
    onSuccess: (data: any) => { qc.invalidateQueries({ queryKey: ["/api/crm/leads"] }); setSelectedLead(data); setActivityContent(""); toast({ title: "تمت الإضافة" }); },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  function resetForm() {
    setForm({ name: "", phone: "", email: "", company: "", source: "other", stage: "new", value: "", currency: "SAR", notes: "", assignedToName: "", nextFollowUpAt: "" });
  }

  function openEdit(lead: Lead) {
    setForm({
      name: lead.name, phone: lead.phone, email: lead.email, company: lead.company,
      source: lead.source, stage: lead.stage, value: String(lead.value || ""),
      currency: lead.currency, notes: lead.notes, assignedToName: lead.assignedToName,
      nextFollowUpAt: lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 10) : "",
    });
    setEditMode(true);
  }

  const pipelineLeads = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of STAGES) map[s.id] = [];
    for (const l of leads) { if (map[l.stage]) map[l.stage].push(l); }
    return map;
  }, [leads]);

  const stageValue = (stageId: string) => (stats?.stages?.[stageId]?.value || 0);

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-black/20 p-4 md:p-6" dir="rtl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black text-black dark:text-white">CRM</h1>
              <p className="text-xs text-black/40 dark:text-white/40">إدارة العملاء المحتملين</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === "pipeline" ? "list" : "pipeline")}
              className="border-black/10 dark:border-white/10 text-xs">
              {view === "pipeline" ? "قائمة" : "Kanban"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowImport(true); setImportRows([]); setImportResult(null); setImportFileName(""); }}
              className="border-black/10 dark:border-white/10 text-xs gap-1" data-testid="button-import-leads">
              <Upload className="w-3.5 h-3.5" /> استيراد CSV
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-black text-white dark:bg-white dark:text-black hover:opacity-80 text-xs">
              <Plus className="w-3.5 h-3.5 ml-1" /> عميل جديد
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "إجمالي العملاء", value: stats?.total || 0, icon: User2, color: "text-blue-600" },
            { label: "إغلاقات", value: stats?.stages?.won?.count || 0, icon: CheckSquare, color: "text-emerald-600" },
            { label: "قيد المتابعة", value: (stats?.stages?.contacted?.count || 0) + (stats?.stages?.qualified?.count || 0), icon: Clock, color: "text-amber-600" },
            { label: "القيمة المتوقعة", value: `${fmt(stats?.totalValue || 0)} ${L ? "ر.س" : "SAR"}`, icon: DollarSign, color: "text-purple-600" },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-black/40 dark:text-white/40">{s.label}</span>
              </div>
              <p className="text-xl font-black text-black dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث باسم، شركة، هاتف..."
              className="pr-9 h-9 text-sm bg-white dark:bg-white/5 border-black/10 dark:border-white/10 text-right" />
          </div>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-36 h-9 text-xs border-black/10 dark:border-white/10 bg-white dark:bg-white/5">
              <SelectValue placeholder="كل المراحل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المراحل</SelectItem>
              {STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.labelAr}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* ── Views ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState onAdd={() => { resetForm(); setShowForm(true); }} />
        ) : view === "pipeline" ? (
          /* ── Kanban Pipeline ── */
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
            {STAGES.map(stage => {
              const cols = pipelineLeads[stage.id] || [];
              return (
                <div key={stage.id} className="snap-start flex-shrink-0 w-64 md:w-72">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                    <span className="text-xs font-bold text-black dark:text-white">{stage.labelAr}</span>
                    <span className="text-xs text-black/30 dark:text-white/30 ml-auto">{cols.length}</span>
                    {stageValue(stage.id) > 0 && (
                      <span className="text-xs text-black/40 dark:text-white/40">{fmt(stageValue(stage.id))} ر.س</span>
                    )}
                  </div>
                  <div className="space-y-2 min-h-24">
                    <AnimatePresence>
                      {cols.map(lead => (
                        <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          onClick={() => setSelectedLead(lead)}
                          className="bg-white dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-3 cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all">
                          <p className="font-bold text-sm text-black dark:text-white mb-1 truncate">{lead.name}</p>
                          {lead.company && <p className="text-xs text-black/40 dark:text-white/40 mb-2 truncate">{lead.company}</p>}
                          <div className="flex items-center gap-2 flex-wrap">
                            {lead.phone && (
                              <span className="flex items-center gap-1 text-xs text-black/40 dark:text-white/40">
                                <Phone className="w-3 h-3" />{lead.phone}
                              </span>
                            )}
                            {lead.value > 0 && (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mr-auto">{fmt(lead.value)} ر.س</span>
                            )}
                          </div>
                          {lead.activities.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-black/20 dark:text-white/20" />
                              <span className="text-xs text-black/30 dark:text-white/30">{lead.activities.length} نشاط</span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {cols.length === 0 && (
                      <div className="border-2 border-dashed border-black/5 dark:border-white/5 rounded-xl h-20 flex items-center justify-center">
                        <span className="text-xs text-black/20 dark:text-white/20">فارغ</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── List View ── */
          <div className="bg-white dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {leads.map(lead => {
                const si = stageInfo(lead.stage);
                return (
                  <div key={lead.id} onClick={() => setSelectedLead(lead)}
                    className="flex items-center gap-4 p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-colors">
                    <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-black dark:text-white">{lead.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-black dark:text-white truncate">{lead.name}</p>
                      <p className="text-xs text-black/40 dark:text-white/40 truncate">{lead.company || lead.phone || lead.email}</p>
                    </div>
                    <Badge className={`text-xs ${si.color} border-0`}>{si.labelAr}</Badge>
                    {lead.value > 0 && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hidden sm:block">{fmt(lead.value)} ر.س</span>}
                    <span className="text-xs text-black/30 dark:text-white/30 hidden md:block">{dateLabel(lead.updatedAt)}</span>
                    <ChevronRight className="w-4 h-4 text-black/20 dark:text-white/20 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Create Lead Dialog ── */}
        <Dialog open={showForm} onOpenChange={v => { if (!v) { setShowForm(false); resetForm(); } }}>
          <DialogContent className="max-w-lg w-full" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-black text-right">إضافة عميل محتمل</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">الاسم *</label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="اسم العميل" className="text-sm text-right" data-testid="input-crm-name" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">الشركة</label>
                  <Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="اسم الشركة" className="text-sm text-right" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">الهاتف</label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="05xxxxxxxx" className="text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">البريد</label>
                  <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com" className="text-sm" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">المرحلة</label>
                  <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.labelAr}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">المصدر</label>
                  <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{SOURCES.map(s => <SelectItem key={s.id} value={s.id}>{s.labelAr}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">القيمة (ر.س)</label>
                  <Input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                    placeholder="0" className="text-sm" type="number" min="0" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">ملاحظات</label>
                <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="أي معلومات إضافية..." rows={3} className="text-sm text-right resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">المسؤول</label>
                  <Input value={form.assignedToName} onChange={e => setForm(p => ({ ...p, assignedToName: e.target.value }))}
                    placeholder="اسم الموظف" className="text-sm text-right" />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">موعد المتابعة</label>
                  <Input value={form.nextFollowUpAt} onChange={e => setForm(p => ({ ...p, nextFollowUpAt: e.target.value }))}
                    type="date" className="text-sm" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => createLead.mutate({ ...form, value: Number(form.value) || 0 })}
                  disabled={!form.name || createLead.isPending}
                  className="flex-1 bg-black text-white dark:bg-white dark:text-black hover:opacity-80" data-testid="button-create-lead">
                  {createLead.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}
                  className="border-black/10 dark:border-white/10">إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Lead Detail Dialog ── */}
        <AnimatePresence>
          {selectedLead && (
            <Dialog open={!!selectedLead} onOpenChange={v => { if (!v) { setSelectedLead(null); setEditMode(false); } }}>
              <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="font-black text-right">{selectedLead.name}</DialogTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(selectedLead)} className="w-8 h-8">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)}
                        className="w-8 h-8 text-red-500 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                {!editMode ? (
                  <div className="space-y-5 mt-2">
                    {/* Info row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { icon: Building2, label: selectedLead.company || "—" },
                        { icon: Phone,     label: selectedLead.phone || "—" },
                        { icon: Mail,      label: selectedLead.email || "—" },
                        { icon: User2,     label: selectedLead.assignedToName || "—" },
                        { icon: DollarSign, label: selectedLead.value ? `${fmt(selectedLead.value)} ${selectedLead.currency}` : "—" },
                        { icon: Calendar,  label: selectedLead.nextFollowUpAt ? new Date(selectedLead.nextFollowUpAt).toLocaleDateString("ar") : "—" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.03] rounded-lg px-3 py-2">
                          <item.icon className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                          <span className="text-xs text-black dark:text-white truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stage changer */}
                    <div>
                      <p className="text-xs font-bold text-black/40 dark:text-white/40 mb-2">تغيير المرحلة</p>
                      <div className="flex flex-wrap gap-2">
                        {STAGES.map(s => (
                          <button key={s.id} onClick={() => updateLead.mutate({ id: selectedLead.id, stage: s.id })}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${selectedLead.stage === s.id ? `${s.color} ring-2 ring-offset-1 ring-black/10 dark:ring-white/10` : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"}`}>
                            {s.labelAr}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedLead.notes && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 rounded-xl p-3">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">ملاحظات</p>
                        <p className="text-sm text-black/60 dark:text-white/60">{selectedLead.notes}</p>
                      </div>
                    )}

                    {/* Add activity */}
                    <div className="border border-black/10 dark:border-white/10 rounded-xl p-4">
                      <p className="text-xs font-bold text-black/40 dark:text-white/40 mb-3">إضافة نشاط</p>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {ACTIVITY_TYPES.map(at => (
                          <button key={at.id} onClick={() => setActivityType(at.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${activityType === at.id ? "bg-black text-white dark:bg-white dark:text-black" : "bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 hover:bg-black/10"}`}>
                            <at.icon className="w-3 h-3" />{at.labelAr}
                          </button>
                        ))}
                      </div>
                      <Textarea value={activityContent} onChange={e => setActivityContent(e.target.value)}
                        placeholder="تفاصيل النشاط..." rows={2} className="text-sm text-right resize-none mb-2" />
                      <Button size="sm" onClick={() => addActivity.mutate({ id: selectedLead.id, type: activityType, content: activityContent })}
                        disabled={!activityContent || addActivity.isPending}
                        className="bg-black text-white dark:bg-white dark:text-black hover:opacity-80 text-xs" data-testid="button-add-activity">
                        {addActivity.isPending ? "..." : "إضافة"}
                      </Button>
                    </div>

                    {/* Activity feed */}
                    {selectedLead.activities.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-black/40 dark:text-white/40 mb-2">سجل النشاط</p>
                        <div className="space-y-2">
                          {[...selectedLead.activities].reverse().map(act => {
                            const at = ACTIVITY_TYPES.find(t => t.id === act.type) || ACTIVITY_TYPES[4];
                            return (
                              <div key={act.id} className="flex gap-3 items-start">
                                <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <at.icon className="w-3 h-3 text-black/40 dark:text-white/40" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-black dark:text-white">{act.createdBy}</span>
                                    <span className="text-xs text-black/30 dark:text-white/30">{dateLabel(act.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-black/70 dark:text-white/70 mt-0.5">{act.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Edit form */
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">الاسم</label>
                        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="text-sm text-right" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">الشركة</label>
                        <Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="text-sm text-right" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">الهاتف</label>
                        <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="text-sm" dir="ltr" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">البريد</label>
                        <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="text-sm" dir="ltr" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">المرحلة</label>
                        <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v }))}>
                          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.labelAr}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">المصدر</label>
                        <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                          <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{SOURCES.map(s => <SelectItem key={s.id} value={s.id}>{s.labelAr}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">القيمة</label>
                        <Input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} type="number" min="0" className="text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-black/60 dark:text-white/60 block mb-1">ملاحظات</label>
                      <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="text-sm text-right resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateLead.mutate({ id: selectedLead.id, ...form, value: Number(form.value) || 0 })}
                        disabled={!form.name || updateLead.isPending}
                        className="flex-1 bg-black text-white dark:bg-white dark:text-black hover:opacity-80" data-testid="button-save-lead">
                        {updateLead.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)} className="border-black/10 dark:border-white/10">إلغاء</Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* ── Import Dialog ── */}
        <Dialog open={showImport} onOpenChange={o => { setShowImport(o); if (!o) { setImportRows([]); setImportResult(null); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right font-black flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" /> استيراد عملاء من CSV
              </DialogTitle>
            </DialogHeader>

            {!importResult ? (
              <div className="space-y-4">
                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs space-y-1.5">
                  <p className="font-bold text-blue-700 dark:text-blue-300">📋 تعليمات الاستيراد:</p>
                  <p className="text-blue-600 dark:text-blue-400">• الملف يجب أن يكون بصيغة <strong>CSV</strong> (يمكن تصدير Excel كـ CSV)</p>
                  <p className="text-blue-600 dark:text-blue-400">• الأعمدة المدعومة: <strong>الاسم، الهاتف، الشركة، البريد، ملاحظات</strong></p>
                  <p className="text-blue-600 dark:text-blue-400">• العملاء المكررين (نفس الهاتف) سيتم تخطيهم تلقائياً</p>
                  <p className="text-blue-600 dark:text-blue-400">• تأكد أن الملف محفوظ بترميز <strong>UTF-8</strong> لدعم العربية</p>
                </div>

                {/* Download Template */}
                <button onClick={downloadTemplate}
                  className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white border border-dashed border-black/20 dark:border-white/20 rounded-lg px-3 py-2 w-full justify-center transition-colors"
                  data-testid="button-download-template">
                  <Download className="w-3.5 h-3.5" /> تحميل قالب CSV جاهز
                </button>

                {/* File Upload */}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-black/20 dark:border-white/20 rounded-xl p-8 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  data-testid="label-file-upload">
                  <Upload className="w-8 h-8 text-black/30 dark:text-white/30 mb-2" />
                  <p className="text-sm font-semibold text-black/60 dark:text-white/60">
                    {importFileName || "اضغط لرفع ملف CSV"}
                  </p>
                  {importFileName && (
                    <p className="text-xs text-black/40 dark:text-white/40 mt-1">{importRows.length} سطر تم قراءتها</p>
                  )}
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileSelect} data-testid="input-csv-file" />
                </label>

                {/* Preview */}
                {importRows.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-2 text-black/60 dark:text-white/60">معاينة أول 5 سجلات:</p>
                    <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
                      <table className="text-xs w-full">
                        <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
                          <tr>
                            {Object.keys(importRows[0]).map(h => (
                              <th key={h} className="px-3 py-2 text-right font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t border-black/5 dark:border-white/5">
                              {Object.values(row).map((v, j) => (
                                <td key={j} className="px-3 py-1.5 max-w-[120px] truncate">{v}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importRows.length > 5 && (
                      <p className="text-xs text-black/40 dark:text-white/40 mt-1 text-center">... و{importRows.length - 5} سجل آخر</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => importLeads.mutate(importRows)}
                    disabled={importRows.length === 0 || importLeads.isPending}
                    className="flex-1 bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
                    data-testid="button-confirm-import">
                    {importLeads.isPending
                      ? `جارٍ الاستيراد...`
                      : `استيراد ${importRows.length} سجل`}
                  </Button>
                  <Button variant="outline" onClick={() => setShowImport(false)} className="border-black/10 dark:border-white/10">إلغاء</Button>
                </div>
              </div>
            ) : (
              /* Result Screen */
              <div className="space-y-4">
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-black">اكتمل الاستيراد!</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                    <p className="text-3xl font-black text-green-600 dark:text-green-400">{importResult.created}</p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">تم إنشاؤه</p>
                  </div>
                  <div className="bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl p-4 text-center">
                    <p className="text-3xl font-black text-black/40 dark:text-white/40">{importResult.skipped}</p>
                    <p className="text-xs text-black/40 dark:text-white/40 mt-1">تم تخطيه (مكرر أو فارغ)</p>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="border border-red-200 dark:border-red-800 rounded-xl p-3">
                    <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {importResult.errors.length} خطأ</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((e, i) => <p key={i} className="text-xs text-red-500">{e}</p>)}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => { setShowImport(false); setImportResult(null); setImportRows([]); }}
                    className="flex-1 bg-black text-white dark:bg-white dark:text-black hover:opacity-80">
                    إغلاق وعرض العملاء
                  </Button>
                  <Button variant="outline" onClick={() => { setImportResult(null); setImportRows([]); setImportFileName(""); }}
                    className="border-black/10 dark:border-white/10">
                    استيراد ملف آخر
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirm ── */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-sm" dir="rtl">
            <DialogHeader><DialogTitle className="text-right font-black">تأكيد الحذف</DialogTitle></DialogHeader>
            <p className="text-sm text-black/60 dark:text-white/60 text-right">هل أنت متأكد من حذف "{selectedLead?.name}"؟ لا يمكن التراجع.</p>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => selectedLead && deleteLead.mutate(selectedLead.id)}
                disabled={deleteLead.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white" data-testid="button-confirm-delete">
                {deleteLead.isPending ? "جاري الحذف..." : "حذف"}
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">إلغاء</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
  );
}
