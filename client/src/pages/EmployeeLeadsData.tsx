import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Plus, Search, Phone, Mail, Building2, User, Tag,
  CheckCircle2, Calendar, Bell, XCircle, HelpCircle, UserCheck,
  ChevronRight, ChevronLeft, Loader2, X, RefreshCw, Star, Clock,
  FileSpreadsheet, TrendingUp, MapPin, Pencil, Save,
} from "lucide-react";
import * as XLSX from "xlsx";

type LeadStatus =
  | "new" | "contacted" | "interested" | "appointment_needed"
  | "reminder_needed" | "not_interested" | "needs_something" | "converted";

interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  sector: string;
  source: string;
  status: LeadStatus;
  notes: string;
  assignedToName: string;
  lastContactedAt: string | null;
  reminderAt: string | null;
  addedToMarketing: boolean;
  createdAt: string;
  statusHistory: Array<{ status: string; changedAt: string; changedBy: string; note: string }>;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; icon: React.ElementType }> = {
  new:                { label: "جديد",          color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",     icon: Star },
  contacted:          { label: "تم التواصل",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",         icon: CheckCircle2 },
  interested:         { label: "مهتم",          color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",     icon: TrendingUp },
  appointment_needed: { label: "يريد موعد",     color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: Calendar },
  reminder_needed:    { label: "يحتاج تذكير",   color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", icon: Bell },
  not_interested:     { label: "غير مهتم",      color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",             icon: XCircle },
  needs_something:    { label: "يحتاج شيء",     color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", icon: HelpCircle },
  converted:          { label: "تحوّل لعميل",   color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300", icon: UserCheck },
};

const STATUS_ACTIONS: Array<{ status: LeadStatus; label: string; icon: React.ElementType; color: string }> = [
  { status: "contacted",          label: "تم التواصل",       icon: CheckCircle2, color: "border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950" },
  { status: "interested",         label: "مهتم",             icon: TrendingUp,   color: "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950" },
  { status: "appointment_needed", label: "يريد موعد",        icon: Calendar,     color: "border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950" },
  { status: "reminder_needed",    label: "يحتاج تذكير",      icon: Bell,         color: "border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950" },
  { status: "needs_something",    label: "يحتاج شيء",        icon: HelpCircle,   color: "border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950" },
  { status: "not_interested",     label: "غير مهتم",         icon: XCircle,      color: "border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950" },
  { status: "converted",          label: "تحويل لعميل حقيقي",icon: UserCheck,    color: "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" },
];

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

/** Extract city from notes like "المدينة: Jeddah | العنوان: ..." */
function extractCity(notes: string): string {
  const m = notes?.match(/المدينة:\s*([^|]+)/);
  return m ? m[1].trim() : "";
}

/** Smart column mapping for any Excel format */
function smartMapRow(row: Record<string, any>) {
  const keys = Object.keys(row);
  function find(...candidates: string[]) {
    for (const c of candidates) {
      const k = keys.find(k => k.toLowerCase().replace(/\s/g, "").includes(c.toLowerCase().replace(/\s/g, "")));
      if (k && row[k]) return String(row[k]).trim();
    }
    return "";
  }
  return {
    companyName:  find("اسمالمؤسسة", "companyname", "company", "شركة", "مؤسسة", "اسم", "name"),
    contactName:  find("اسمالمسؤول", "contactname", "contact", "مسؤول", "شخص"),
    phone:        find("الهاتف", "phone", "mobile", "جوال", "هاتف", "tel"),
    email:        find("البريد", "email", "mail", "إيميل", "بريد"),
    sector:       find("القطاع", "sector", "industry", "قطاع", "مجال"),
    city:         find("المدينة", "city", "مدينة", "location"),
    notes:        find("ملاحظات", "notes", "note", "description"),
  };
}

const LIMIT = 50;

const EMPTY_FORM = { companyName: "", contactName: "", phone: "", email: "", sector: "", source: "manual", notes: "" };

export default function EmployeeLeadsData() {
  const { lang } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isRtl = lang === "ar";

  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [page, setPage]               = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusNote, setStatusNote]   = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<LeadStatus | null>(null);
  const [isEditing, setIsEditing]     = useState(false);
  const [editForm, setEditForm]       = useState(EMPTY_FORM);
  const [form, setForm]               = useState(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = useQuery<{
    leads: Lead[];
    total: number;
    stats: Record<string, number>;
  }>({
    queryKey: ["/api/leads-data", activeStatus, search, page],
    queryFn: () => {
      const p = new URLSearchParams();
      if (activeStatus !== "all") p.set("status", activeStatus);
      if (search) p.set("search", search);
      p.set("page", String(page));
      p.set("limit", String(LIMIT));
      return fetch(`/api/leads-data?${p}`).then(r => r.json());
    },
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: (body: typeof EMPTY_FORM) => apiRequest("POST", "/api/leads-data", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leads-data"] });
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      toast({ title: "✅ تم إضافة المؤسسة" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; [k: string]: any }) =>
      apiRequest("PATCH", `/api/leads-data/${id}`, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/leads-data"] });
      setSelectedLead(prev => prev ? { ...prev, ...vars } : null);
      setStatusNote("");
      setUpdatingStatus(null);
      setIsEditing(false);
      toast({ title: "✅ تم التحديث" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/leads-data/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leads-data"] });
      setSelectedLead(null);
      toast({ title: "تم الحذف" });
    },
  });

  function handleStatusChange(lead: Lead, status: LeadStatus) {
    setUpdatingStatus(status);
    updateMutation.mutate({ id: lead.id, status, notes: statusNote || undefined });
  }

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setIsEditing(false);
    setStatusNote("");
    setUpdatingStatus(null);
    setEditForm({
      companyName: lead.companyName,
      contactName: lead.contactName,
      phone: lead.phone,
      email: lead.email,
      sector: lead.sector,
      source: lead.source,
      notes: lead.notes,
    });
  }

  function handleSaveEdit() {
    if (!selectedLead) return;
    updateMutation.mutate({ id: selectedLead.id, ...editForm });
  }

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function handleTabChange(status: string) {
    setActiveStatus(status);
    setPage(1);
  }

  async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as Record<string, any>[];

        if (rows.length === 0) {
          toast({ title: "الملف فارغ أو لا يحتوي على بيانات", variant: "destructive" });
          return;
        }

        const leads = rows
          .map(smartMapRow)
          .map(r => ({
            companyName: r.companyName,
            contactName: r.contactName,
            phone: r.phone,
            email: r.email,
            sector: r.sector,
            notes: [r.city ? `المدينة: ${r.city}` : "", r.notes].filter(Boolean).join(" | "),
          }))
          .filter(r => r.companyName);

        if (leads.length === 0) {
          toast({
            title: "لم يتم التعرف على الأعمدة",
            description: "تأكد أن الملف يحتوي على عمود باسم الشركة",
            variant: "destructive",
          });
          return;
        }

        toast({ title: `⏳ جارٍ استيراد ${leads.length} مؤسسة...` });

        const res = await fetch("/api/leads-data/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leads }),
          credentials: "include",
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "فشل الاستيراد");
        qc.invalidateQueries({ queryKey: ["/api/leads-data"] });
        toast({
          title: `✅ تم الاستيراد: ${result.added} مؤسسة`,
          description: result.skipped ? `تم تخطي ${result.skipped} (مكررة أو بدون اسم)` : undefined,
        });
      } catch (err: any) {
        toast({ title: "خطأ في الاستيراد", description: err.message, variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const stats  = data?.stats  ?? {};
  const leads  = data?.leads  ?? [];
  const total  = data?.total  ?? 0;
  const pages  = Math.ceil(total / LIMIT);
  const totalAll = Object.values(stats).reduce((a, b) => a + b, 0);

  const TABS = [
    { key: "all",                label: "الكل",           count: totalAll },
    { key: "new",                label: "جديد",           count: stats.new ?? 0 },
    { key: "contacted",          label: "تم التواصل",     count: stats.contacted ?? 0 },
    { key: "interested",         label: "مهتم",           count: stats.interested ?? 0 },
    { key: "appointment_needed", label: "يريد موعد",      count: stats.appointment_needed ?? 0 },
    { key: "reminder_needed",    label: "تذكير",          count: stats.reminder_needed ?? 0 },
    { key: "needs_something",    label: "يحتاج شيء",      count: stats.needs_something ?? 0 },
    { key: "not_interested",     label: "غير مهتم",       count: stats.not_interested ?? 0 },
    { key: "converted",          label: "تحوّل لعميل",    count: stats.converted ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              داتا العملاء المحتملين
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {totalAll.toLocaleString("ar-SA")} مؤسسة — إدارة وتتبع التواصل
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => refetch()} title="تحديث">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileSpreadsheet className="w-4 h-4 ml-1" />
              استيراد Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImportExcel}
            />
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 ml-1" />
              إضافة مؤسسة
            </Button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-5">
          {TABS.slice(1).map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`rounded-xl p-3 text-center transition-all border ${
                activeStatus === t.key
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="text-lg font-bold">{t.count}</div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t.label}</div>
            </button>
          ))}
        </div>

        {/* ── Search + Filter ── */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="ابحث بالاسم، الهاتف، البريد، القطاع..."
              className="pr-10"
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>بحث</Button>
          {(search || activeStatus !== "all") && (
            <Button variant="ghost" onClick={() => {
              setSearch(""); setSearchInput(""); setActiveStatus("all"); setPage(1);
            }}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* ── Status Tabs (pills) ── */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeStatus === t.key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background border-border text-muted-foreground hover:border-foreground/50"
              }`}
            >
              {t.label}
              {t.count > 0 && <span className="mr-1 opacity-60">({t.count})</span>}
            </button>
          ))}
        </div>

        {/* ── Lead Grid ── */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Building2 className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="font-medium">لا توجد نتائج</p>
            {search && <p className="text-sm mt-1">جرّب بحثاً مختلفاً</p>}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mb-6">
              {leads.map(lead => (
                <LeadCard key={lead.id} lead={lead} onClick={() => openLead(lead)} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </Button>
                <span className="text-sm text-muted-foreground">
                  صفحة {page} من {pages} ({total.toLocaleString("ar-SA")} مؤسسة)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add Modal ── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>إضافة مؤسسة / عميل محتمل</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>اسم المؤسسة *</Label>
              <Input
                value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                placeholder="اسم الشركة أو المؤسسة"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>اسم المسؤول</Label>
                <Input
                  value={form.contactName}
                  onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                  placeholder="الاسم"
                />
              </div>
              <div>
                <Label>القطاع</Label>
                <Input
                  value={form.sector}
                  onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                  placeholder="مطاعم، تجزئة..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>رقم الهاتف</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@domain.com"
                  dir="ltr"
                  type="email"
                />
              </div>
            </div>
            <div>
              <Label>المصدر</Label>
              <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي</SelectItem>
                  <SelectItem value="instagram">إنستقرام</SelectItem>
                  <SelectItem value="twitter">تويتر/إكس</SelectItem>
                  <SelectItem value="tiktok">تيك توك</SelectItem>
                  <SelectItem value="referral">إحالة</SelectItem>
                  <SelectItem value="cold_call">اتصال مبادر</SelectItem>
                  <SelectItem value="exhibition">معرض</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="أي تفاصيل إضافية..."
                rows={2}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => addMutation.mutate(form)}
              disabled={!form.companyName || addMutation.isPending}
            >
              {addMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin ml-2" />
                : <Plus className="w-4 h-4 ml-2" />}
              إضافة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Lead Detail Sheet ── */}
      <Sheet open={!!selectedLead} onOpenChange={v => !v && setSelectedLead(null)}>
        <SheetContent
          side={isRtl ? "right" : "left"}
          className="w-full sm:max-w-lg overflow-y-auto"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {selectedLead && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-center justify-between gap-2">
                  <SheetTitle className="flex items-center gap-2 text-lg truncate">
                    <Building2 className="w-5 h-5 shrink-0" />
                    <span className="truncate">{selectedLead.companyName}</span>
                  </SheetTitle>
                  <button
                    onClick={() => setIsEditing(e => !e)}
                    className={`p-1.5 rounded-lg border transition-colors ${isEditing ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    title="تعديل البيانات"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                <StatusBadge status={selectedLead.status} />
              </SheetHeader>

              {/* ── Edit Form ── */}
              {isEditing ? (
                <div className="space-y-3 mb-5 p-4 bg-muted/50 rounded-xl border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">تعديل البيانات</p>
                  <div>
                    <Label className="text-xs">اسم المؤسسة</Label>
                    <Input
                      value={editForm.companyName}
                      onChange={e => setEditForm(f => ({ ...f, companyName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">اسم المسؤول</Label>
                      <Input
                        value={editForm.contactName}
                        onChange={e => setEditForm(f => ({ ...f, contactName: e.target.value }))}
                        className="mt-1"
                        placeholder="الاسم"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">القطاع</Label>
                      <Input
                        value={editForm.sector}
                        onChange={e => setEditForm(f => ({ ...f, sector: e.target.value }))}
                        className="mt-1"
                        placeholder="القطاع"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">الهاتف</Label>
                      <Input
                        value={editForm.phone}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        className="mt-1"
                        dir="ltr"
                        placeholder="05xxxxxxxx"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">البريد</Label>
                      <Input
                        value={editForm.email}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        className="mt-1"
                        dir="ltr"
                        type="email"
                        placeholder="email@domain.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">ملاحظات / موقع</Label>
                    <Textarea
                      value={editForm.notes}
                      onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                      className="mt-1"
                      rows={3}
                      placeholder="ملاحظات أو عنوان..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin ml-1" />
                        : <Save className="w-4 h-4 ml-1" />}
                      حفظ التعديلات
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>إلغاء</Button>
                  </div>
                </div>
              ) : (
                /* ── View Info ── */
                <div className="space-y-2 mb-5 p-4 bg-muted/50 rounded-xl">
                  {selectedLead.contactName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{selectedLead.contactName}</span>
                    </div>
                  )}
                  {selectedLead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <a href={`tel:${selectedLead.phone}`} className="text-primary hover:underline" dir="ltr">
                        {selectedLead.phone}
                      </a>
                      <a
                        href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-600 text-xs border border-green-300 rounded px-1.5 py-0.5 hover:bg-green-50 dark:hover:bg-green-950"
                      >
                        واتساب
                      </a>
                    </div>
                  )}
                  {selectedLead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline truncate" dir="ltr">
                        {selectedLead.email}
                      </a>
                    </div>
                  )}
                  {selectedLead.sector && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{selectedLead.sector}</span>
                    </div>
                  )}
                  {extractCity(selectedLead.notes) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{extractCity(selectedLead.notes)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Notes (if not editing) ── */}
              {!isEditing && selectedLead.notes && (
                <div className="mb-5 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">ملاحظات</p>
                  <p className="text-sm whitespace-pre-line">{selectedLead.notes}</p>
                </div>
              )}

              {/* ── Status Change ── */}
              {!isEditing && (
                <>
                  <div className="mb-3">
                    <Label className="text-xs text-muted-foreground mb-1 block">ملاحظة للتحديث (اختياري)</Label>
                    <Textarea
                      value={statusNote}
                      onChange={e => setStatusNote(e.target.value)}
                      placeholder="أضف ملاحظة..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  <div className="mb-5">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">تغيير الحالة</p>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_ACTIONS.map(action => {
                        const Icon = action.icon;
                        const isActive  = selectedLead.status === action.status;
                        const isPending = updatingStatus === action.status && updateMutation.isPending;
                        return (
                          <button
                            key={action.status}
                            onClick={() => !isActive && handleStatusChange(selectedLead, action.status)}
                            disabled={isActive || updateMutation.isPending}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                              ${isActive
                                ? "bg-primary text-primary-foreground border-primary cursor-default"
                                : `bg-background ${action.color} cursor-pointer`}
                              disabled:opacity-60`}
                          >
                            {isPending
                              ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                              : <Icon className="w-4 h-4 shrink-0" />}
                            <span className="text-xs">{action.label}</span>
                            {isActive && <CheckCircle2 className="w-3 h-3 mr-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ── Status History ── */}
              {selectedLead.statusHistory?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">سجل التواصل</p>
                  <div className="space-y-2">
                    {[...selectedLead.statusHistory].reverse().slice(0, 8).map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <Clock className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium">
                            {STATUS_CONFIG[h.status as LeadStatus]?.label ?? h.status}
                          </span>
                          {h.note && <span className="text-muted-foreground"> — {h.note}</span>}
                          <div className="text-muted-foreground">
                            {h.changedBy} · {new Date(h.changedAt).toLocaleDateString("ar-SA")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Delete ── */}
              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (confirm("هل تريد حذف هذا العميل نهائياً؟")) {
                      deleteMutation.mutate(selectedLead.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    : <X className="w-4 h-4 ml-2" />}
                  حذف المؤسسة
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const city = extractCity(lead.notes);
  return (
    <button
      onClick={onClick}
      className="w-full text-right bg-card border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all group"
      data-testid={`lead-card-${lead.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {lead.companyName}
          </h3>
          {lead.contactName && (
            <p className="text-xs text-muted-foreground truncate">{lead.contactName}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary rtl:rotate-180" />
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        <StatusBadge status={lead.status} />
        {lead.sector && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
            <Tag className="w-3 h-3" />{lead.sector}
          </span>
        )}
        {city && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
            <MapPin className="w-3 h-3" />{city}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        {lead.phone && (
          <span className="flex items-center gap-1" dir="ltr">
            <Phone className="w-3 h-3" /> {lead.phone}
          </span>
        )}
        {lead.email && (
          <span className="flex items-center gap-1 min-w-0">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[140px]">{lead.email}</span>
          </span>
        )}
      </div>
    </button>
  );
}
