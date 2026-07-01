import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  Search, MessageCircle, Phone, User2, Copy, Star,
  CheckCircle2, Clock, Filter, Pencil, X, Send,
  Smartphone, AlertCircle, ChevronDown, ChevronUp,
  LayoutGrid, List, ExternalLink, Sparkles,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Helpers ─────────────────────────────────────────────────── */
function normalizeWA(phone: string): string {
  // Remove all non-digit characters except leading +
  let p = phone.replace(/[\s\-().]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  // Saudi local → international
  if (p.startsWith("05") && p.length === 10) p = "966" + p.slice(1);
  if (p.startsWith("5") && p.length === 9) p = "966" + p;
  // Egypt local → international
  if (p.startsWith("01") && p.length === 11) p = "20" + p.slice(1);
  return p;
}

function buildWALink(phone: string, text: string): string {
  const num = normalizeWA(phone);
  if (!num) return "#";
  const encoded = encodeURIComponent(text.trim());
  return `https://wa.me/${num}${encoded ? `?text=${encoded}` : ""}`;
}

function hasValidPhone(client: any): boolean {
  const p = client.whatsappNumber || client.phone || "";
  return p.replace(/\D/g, "").length >= 9;
}

/* ─── Default Templates ───────────────────────────────────────── */
const DEFAULT_TEMPLATES = [
  {
    id: "greeting",
    icon: "👋",
    label: "ترحيب",
    color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-300",
    text: "مرحباً {name} 😊\nتواصلت معك من فريق كيروكس Studio، نسعد بخدمتك في أي وقت 🌟",
  },
  {
    id: "order_confirm",
    icon: "✅",
    label: "تأكيد طلب",
    color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-700/30 text-blue-700 dark:text-blue-300",
    text: "مرحباً {name} ✅\nتم استلام طلبك بنجاح وهو الآن قيد المراجعة من فريقنا.\nسنتواصل معك قريباً بكل التفاصيل 🙏",
  },
  {
    id: "payment_remind",
    icon: "💳",
    label: "تذكير دفع",
    color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-700/30 text-amber-700 dark:text-amber-300",
    text: "مرحباً {name} 👋\nنذكّرك بإتمام الدفعة المستحقة لاستمرار مشروعك.\nللاستفسار أو ترتيب الدفع، نحن هنا 📩",
  },
  {
    id: "project_update",
    icon: "🚀",
    label: "تحديث مشروع",
    color: "bg-violet-50 dark:bg-violet-900/20 border-violet-200/60 dark:border-violet-700/30 text-violet-700 dark:text-violet-300",
    text: "مرحباً {name} 🚀\nلدينا تحديث جديد بخصوص مشروعك!\nيسعدنا مشاركتك التفاصيل، متى يناسبك التواصل؟",
  },
  {
    id: "followup",
    icon: "📞",
    label: "متابعة",
    color: "bg-rose-50 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-700/30 text-rose-700 dark:text-rose-300",
    text: "مرحباً {name} 😊\nأردنا متابعتك والتأكد من رضاك عن خدماتنا.\nهل هناك أي شيء يمكننا مساعدتك به؟ 🌟",
  },
  {
    id: "offer",
    icon: "🎁",
    label: "عرض خاص",
    color: "bg-pink-50 dark:bg-pink-900/20 border-pink-200/60 dark:border-pink-700/30 text-pink-700 dark:text-pink-300",
    text: "مرحباً {name} 🎁\nلدينا عرض خاص مخصص لك!\nتواصل معنا الآن لمعرفة التفاصيل والاستفادة منه 🔥",
  },
];

/* ─── Component ───────────────────────────────────────────────── */
export default function EmployeeWhatsappCRM() {
  const { lang } = useI18n();
  const { toast } = useToast();
  const L = lang === "ar";

  // ── State
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "hasWA" | "noWA">("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATES[0]);
  const [customMsg, setCustomMsg] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showTemplatePanel, setShowTemplatePanel] = useState(true);
  const [sentLog, setSentLog] = useState<Record<string, string>>({});

  // ── Fetch clients
  const { data: users = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const clients = users.filter(u => u.role === "client");

  // ── Filtered list
  const filtered = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = !search ||
        (c.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || "").includes(search) ||
        (c.whatsappNumber || "").includes(search) ||
        (c.email || "").toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ? true :
        filter === "hasWA" ? hasValidPhone(c) :
        !hasValidPhone(c);
      return matchSearch && matchFilter;
    });
  }, [clients, search, filter]);

  const withWA = clients.filter(hasValidPhone).length;
  const withoutWA = clients.length - withWA;

  // ── Build final message
  function getFinalMsg(client: any) {
    const base = useCustom ? customMsg : selectedTemplate.text;
    return base.replace(/\{name\}/g, client.fullName || client.username || "");
  }

  // ── Open WhatsApp
  function openChat(client: any, e?: React.MouseEvent) {
    e?.stopPropagation();
    const phone = client.whatsappNumber || client.phone || "";
    if (!hasValidPhone(client)) {
      toast({ title: "لا يوجد رقم واتساب لهذا العميل", variant: "destructive" });
      return;
    }
    const msg = getFinalMsg(client);
    const link = buildWALink(phone, msg);
    window.open(link, "_blank", "noopener,noreferrer");
    setSentLog(prev => ({ ...prev, [client.id]: new Date().toLocaleTimeString("ar-SA") }));
    toast({ title: `✅ تم فتح محادثة ${client.fullName}` });
  }

  function copyMsg(client: any) {
    navigator.clipboard.writeText(getFinalMsg(client));
    toast({ title: "✅ تم نسخ الرسالة" });
  }

  function startEditTemplate(t: typeof DEFAULT_TEMPLATES[0]) {
    setEditingTemplate(t.id);
    setEditText(t.text);
  }

  function saveEditTemplate() {
    setTemplates(prev => prev.map(t => t.id === editingTemplate ? { ...t, text: editText } : t));
    setEditingTemplate(null);
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="relative overflow-hidden p-4 md:p-6 max-w-[1400px] mx-auto space-y-5" dir="rtl">
      <PageGraphics variant="dashboard" />

      {/* ── Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            لوحة واتساب CRM
          </h1>
          <p className="text-xs text-black/40 dark:text-white/40 mt-1 mr-11">
            تواصل مع عملائك عبر واتساب بسرعة وقوالب جاهزة
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/30 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">{withWA} لديهم واتساب</span>
          </div>
          {withoutWA > 0 && (
            <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
              <span className="text-xs font-bold text-black/40 dark:text-white/40">{withoutWA} بدون رقم</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">

        {/* ── Left: Clients */}
        <div className="space-y-4">
          {/* Search + Filter bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/25 dark:text-white/25" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث باسم العميل أو الرقم..."
                className="h-9 text-sm border-black/[0.08] dark:border-white/[0.08] pr-9 bg-white dark:bg-gray-900"
              />
            </div>
            {/* Filter */}
            <div className="flex border border-black/[0.08] dark:border-white/[0.08] rounded-lg overflow-hidden h-9 shrink-0">
              {(["all","hasWA","noWA"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 text-[11px] font-bold transition-colors ${filter === f ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/40 dark:text-white/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}`}>
                  {f === "all" ? "الكل" : f === "hasWA" ? "✅ لديه واتساب" : "❌ بلا رقم"}
                </button>
              ))}
            </div>
            {/* View toggle */}
            <div className="flex border border-black/[0.08] dark:border-white/[0.08] rounded-lg overflow-hidden h-9 shrink-0">
              <button onClick={() => setViewMode("cards")} className={`px-3 flex items-center transition-colors ${viewMode === "cards" ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/40 dark:text-white/40 hover:bg-black/[0.04]"}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewMode("list")} className={`px-3 flex items-center border-r border-black/[0.08] dark:border-white/[0.08] transition-colors ${viewMode === "list" ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/40 dark:text-white/40 hover:bg-black/[0.04]"}`}><List className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Client count */}
          <p className="text-[11px] text-black/30 dark:text-white/30 font-bold">
            {filtered.length} عميل{filtered.length !== clients.length ? ` من أصل ${clients.length}` : ""}
          </p>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-black/30 dark:text-white/30">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16">
              <MessageCircle className="w-10 h-10 text-black/10 dark:text-white/10 mx-auto mb-3" />
              <p className="text-sm text-black/30 dark:text-white/30 font-bold">لا يوجد عملاء مطابقون</p>
            </div>
          )}

          {/* Cards view */}
          {!isLoading && viewMode === "cards" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence>
                {filtered.map(client => {
                  const phone = client.whatsappNumber || client.phone || "";
                  const hasWA = hasValidPhone(client);
                  const isSelected = selectedClient?.id === client.id;
                  const wasSent = sentLog[client.id];

                  return (
                    <motion.div
                      key={client.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      onClick={() => setSelectedClient(isSelected ? null : client)}
                      className={`group rounded-2xl border bg-white dark:bg-gray-900 p-4 cursor-pointer transition-all hover:shadow-sm ${
                        isSelected
                          ? "border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-800"
                          : "border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <UserAvatar user={client} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black text-black dark:text-white truncate">{client.fullName}</p>
                            {wasSent && (
                              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                                أُرسل {wasSent}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-black/40 dark:text-white/40 truncate mt-0.5">{client.email}</p>
                          {phone ? (
                            <p className="text-[11px] font-mono text-black/50 dark:text-white/50 mt-1 flex items-center gap-1">
                              <Smartphone className="w-3 h-3 opacity-60" />
                              {phone}
                            </p>
                          ) : (
                            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> لا يوجد رقم
                            </p>
                          )}
                          {client.businessType && (
                            <p className="text-[10px] text-black/30 dark:text-white/30 mt-0.5">{client.businessType}</p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => openChat(client, e)}
                          disabled={!hasWA}
                          className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[11px] font-bold transition-all ${
                            hasWA
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                              : "bg-black/[0.04] dark:bg-white/[0.04] text-black/25 dark:text-white/25 cursor-not-allowed"
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {hasWA ? "فتح محادثة" : "بدون رقم"}
                        </button>
                        {hasWA && (
                          <button
                            onClick={() => copyMsg(client)}
                            className="h-8 w-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                            title="نسخ الرسالة"
                          >
                            <Copy className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
                          </button>
                        )}
                      </div>

                      {/* Expanded: preview message */}
                      <AnimatePresence>
                        {isSelected && hasWA && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] overflow-hidden"
                          >
                            <p className="text-[10px] text-black/30 dark:text-white/30 mb-1.5 font-bold">معاينة الرسالة:</p>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-[11px] text-black/70 dark:text-white/70 whitespace-pre-wrap leading-relaxed font-medium border border-emerald-100 dark:border-emerald-800/30">
                              {getFinalMsg(client)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* List view */}
          {!isLoading && viewMode === "list" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-center py-10 text-sm text-black/30 dark:text-white/30">لا يوجد نتائج</p>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {filtered.map((client, idx) => {
                    const phone = client.whatsappNumber || client.phone || "";
                    const hasWA = hasValidPhone(client);
                    const wasSent = sentLog[client.id];
                    return (
                      <div key={client.id} className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <span className="text-[10px] text-black/20 dark:text-white/20 w-5 shrink-0 text-center font-mono">{idx + 1}</span>
                        <UserAvatar user={client} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-black dark:text-white truncate">{client.fullName}</p>
                          <p className="text-[11px] text-black/35 dark:text-white/35 truncate">{phone || "—"}</p>
                        </div>
                        {wasSent && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold shrink-0">{wasSent}</span>}
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => openChat(client)}
                            disabled={!hasWA}
                            className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-bold transition-all ${
                              hasWA ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-black/[0.04] text-black/20 cursor-not-allowed"
                            }`}
                          >
                            <MessageCircle className="w-3 h-3" />
                            {hasWA ? "واتساب" : "بلا رقم"}
                          </button>
                          {hasWA && (
                            <button onClick={() => copyMsg(client)} className="h-7 w-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] flex items-center justify-center transition-colors">
                              <Copy className="w-3 h-3 text-black/35 dark:text-white/35" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Templates Panel */}
        <div className="space-y-4 sticky top-4">
          {/* Toggle panel */}
          <button
            onClick={() => setShowTemplatePanel(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl hover:border-black/[0.12] dark:hover:border-white/[0.12] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <span className="text-sm font-black text-black dark:text-white">قوالب الرسائل</span>
              <Badge className="text-[10px] font-bold bg-black/[0.05] dark:bg-white/[0.05] text-black/50 dark:text-white/50 border-0">
                {templates.length} قوالب
              </Badge>
            </div>
            {showTemplatePanel ? <ChevronUp className="w-4 h-4 text-black/30 dark:text-white/30" /> : <ChevronDown className="w-4 h-4 text-black/30 dark:text-white/30" />}
          </button>

          <AnimatePresence>
            {showTemplatePanel && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden"
              >
                {/* Mode toggle */}
                <div className="flex border-b border-black/[0.05] dark:border-white/[0.05]">
                  <button
                    onClick={() => setUseCustom(false)}
                    className={`flex-1 py-2.5 text-[11px] font-bold transition-colors ${!useCustom ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/40 dark:text-white/40 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"}`}
                  >
                    قوالب جاهزة
                  </button>
                  <button
                    onClick={() => setUseCustom(true)}
                    className={`flex-1 py-2.5 text-[11px] font-bold transition-colors border-r border-black/[0.05] dark:border-white/[0.05] ${useCustom ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/40 dark:text-white/40 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"}`}
                  >
                    ✏️ رسالة مخصصة
                  </button>
                </div>

                {/* Templates list */}
                {!useCustom && (
                  <div className="p-3 space-y-2">
                    {templates.map(t => (
                      <div key={t.id}>
                        {editingTemplate === t.id ? (
                          <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] p-3 space-y-2">
                            <textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              rows={4}
                              className="w-full text-xs rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-transparent p-2 resize-none focus:outline-none focus:border-black/25 dark:focus:border-white/25 text-black dark:text-white"
                              dir="auto"
                            />
                            <p className="text-[10px] text-black/30 dark:text-white/30">استخدم <code className="bg-black/[0.05] dark:bg-white/[0.05] px-1 rounded">{"{name}"}</code> لاسم العميل</p>
                            <div className="flex gap-2">
                              <button onClick={saveEditTemplate} className="flex-1 h-7 rounded-lg bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold">حفظ</button>
                              <button onClick={() => setEditingTemplate(null)} className="h-7 w-7 rounded-lg bg-black/[0.05] dark:bg-white/[0.05] flex items-center justify-center">
                                <X className="w-3 h-3 text-black/50 dark:text-white/50" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedTemplate(t)}
                            className={`w-full text-right rounded-xl border p-3 transition-all group relative ${
                              selectedTemplate.id === t.id
                                ? t.color + " ring-2 ring-offset-1 ring-current/20"
                                : "border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12] bg-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base leading-none">{t.icon}</span>
                              <span className="text-[11px] font-black text-black dark:text-white">{t.label}</span>
                              {selectedTemplate.id === t.id && <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-auto" />}
                            </div>
                            <p className="text-[10px] text-black/40 dark:text-white/40 line-clamp-2 leading-relaxed">{t.text.replace(/\{name\}/g, "العميل")}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); startEditTemplate(t); }}
                              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded-md bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center"
                            >
                              <Pencil className="w-2.5 h-2.5 text-black/50 dark:text-white/50" />
                            </button>
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Tips */}
                    <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
                      <p className="text-[10px] text-black/30 dark:text-white/30 leading-relaxed">
                        💡 اضغط على أيقونة القلم لتعديل أي قالب · استخدم <code className="bg-black/[0.05] dark:bg-white/[0.05] px-1 rounded">{"{name}"}</code> ليُستبدل باسم العميل تلقائياً
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom message */}
                {useCustom && (
                  <div className="p-3">
                    <textarea
                      value={customMsg}
                      onChange={e => setCustomMsg(e.target.value)}
                      rows={6}
                      placeholder={`اكتب رسالتك هنا...\nيمكنك استخدام {name} لاسم العميل`}
                      className="w-full text-sm rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-3 resize-none focus:outline-none focus:border-black/25 dark:focus:border-white/25 text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25"
                      dir="auto"
                    />
                    <p className="text-[10px] text-black/30 dark:text-white/30 mt-2">
                      استخدم <code className="bg-black/[0.05] dark:bg-white/[0.05] px-1 rounded">{"{name}"}</code> ليُستبدل باسم العميل تلقائياً
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick actions tips */}
          <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] rounded-2xl p-4 space-y-2.5">
            <p className="text-[11px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">كيف تستخدم اللوحة</p>
            {[
              ["1.", "اختر القالب المناسب من اليمين"],
              ["2.", "اضغط على \"فتح محادثة\" لأي عميل"],
              ["3.", "سيفتح واتساب مع الرسالة الجاهزة"],
              ["4.", "أرسل الرسالة وسيُسجَّل التوقيت"],
            ].map(([num, text]) => (
              <div key={num} className="flex items-start gap-2">
                <span className="text-[11px] font-black text-emerald-500 shrink-0 mt-px">{num}</span>
                <p className="text-[11px] text-black/45 dark:text-white/45">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
