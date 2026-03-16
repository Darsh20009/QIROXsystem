// @ts-nocheck
import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ClipboardList, Upload, FileText, Link2, Type, Image as ImageIcon,
  CheckCircle2, Clock3, AlertCircle, RotateCcw, X, ChevronLeft,
  Paperclip, Send, Eye, Loader2, Info, Calendar, User2
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────── */
const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:          { label: "في الانتظار",    color: "text-amber-700",  bg: "bg-amber-50",    border: "border-amber-200", icon: Clock3 },
  submitted:        { label: "تم الإرسال",     color: "text-blue-700",   bg: "bg-blue-50",     border: "border-blue-200",  icon: CheckCircle2 },
  approved:         { label: "مقبول ✓",        color: "text-emerald-700",bg: "bg-emerald-50",  border: "border-emerald-200",icon: CheckCircle2 },
  revision_needed:  { label: "تحتاج مراجعة",  color: "text-red-700",    bg: "bg-red-50",      border: "border-red-200",   icon: RotateCcw },
};
const PRIORITY_META: Record<string, { label: string; color: string }> = {
  low:    { label: "منخفضة",    color: "text-slate-500" },
  normal: { label: "عادية",     color: "text-blue-600" },
  high:   { label: "عالية ⚠️", color: "text-amber-600" },
  urgent: { label: "عاجل 🔴",  color: "text-red-600" },
};
const TYPE_ICONS: Record<string, any> = { file: Paperclip, image: ImageIcon, text: Type, link: Link2 };

function fmt(date: string, ar = true) {
  return new Date(date).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ── Main Component ──────────────────────────────────── */
  export default function ClientDataRequests() {
    const { toast } = useToast();
    const { lang, dir } = useI18n();
    const L = lang === "ar";
    const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
      pending:         { label: L ? "في الانتظار" : "Pending",          color: "text-amber-700",  bg: "bg-amber-50",    border: "border-amber-200", icon: Clock3 },
      submitted:       { label: L ? "تم الإرسال" : "Submitted",         color: "text-blue-700",   bg: "bg-blue-50",     border: "border-blue-200",  icon: CheckCircle2 },
      approved:        { label: L ? "مقبول ✓" : "Approved ✓",           color: "text-emerald-700",bg: "bg-emerald-50",  border: "border-emerald-200",icon: CheckCircle2 },
      revision_needed: { label: L ? "تحتاج مراجعة" : "Revision Needed", color: "text-red-700",    bg: "bg-red-50",      border: "border-red-200",   icon: RotateCcw },
    };
    const PRIORITY_META: Record<string, { label: string; color: string }> = {
      low:    { label: L ? "منخفضة" : "Low",        color: "text-slate-500" },
      normal: { label: L ? "عادية" : "Normal",       color: "text-blue-600" },
      high:   { label: L ? "عالية ⚠️" : "High ⚠️",  color: "text-amber-600" },
      urgent: { label: L ? "عاجل 🔴" : "Urgent 🔴", color: "text-red-600" },
    };
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "submitted" | "all">("pending");

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/data-requests/mine"],
  });

  const filtered = requests.filter(r => {
    if (tab === "pending") return r.status === "pending" || r.status === "revision_needed";
    if (tab === "submitted") return r.status === "submitted" || r.status === "approved";
    return true;
  });

  const active = requests.find(r => r.id === activeId);
  const pendingCount = requests.filter(r => r.status === "pending" || r.status === "revision_needed").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950" dir={dir}>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{L ? "طلبات البيانات" : "Data Requests"}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{L ? "ملفات ومعلومات يحتاجها فريق العمل منك" : "Files and information the team needs from you"}</p>
            </div>
            {pendingCount > 0 && (
              <div className="mr-auto bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full animate-pulse">
                {pendingCount} {L ? "بانتظارك" : "pending"}
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-1.5">
          {([
            { key: "pending",   label: L ? "بانتظار ردك" : "Awaiting Reply", badge: pendingCount },
            { key: "submitted", label: L ? "تم الإرسال" : "Submitted",  badge: 0 },
            { key: "all",       label: L ? "الكل" : "All",         badge: 0 },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.key
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
              data-testid={`tab-${t.key}`}>
              {t.label}
              {t.badge > 0 && <span className="bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
            <ClipboardList className="w-14 h-14 mx-auto mb-4 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-400 dark:text-gray-500 font-medium">{L ? "لا توجد طلبات في هذا القسم" : "No requests in this section"}</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((req, i) => (
                <RequestCard key={req.id} req={req} index={i} onOpen={() => setActiveId(req.id)} statusMeta={STATUS_META} priorityMeta={PRIORITY_META} L={L} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail / Submit Dialog */}
      <AnimatePresence>
        {active && (
          <RequestDialog
            req={active}
            onClose={() => setActiveId(null)}
            onSubmitted={() => { setActiveId(null); queryClient.invalidateQueries({ queryKey: ["/api/data-requests/mine"] }); }}
            statusMeta={STATUS_META}
            L={L}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Request Card ──────────────────────────────────────── */
function RequestCard({ req, index, onOpen, statusMeta, priorityMeta, L }: { req: any; index: number; onOpen: () => void; statusMeta: any; priorityMeta: any; L: boolean }) {
  const meta = statusMeta[req.status] || statusMeta.pending;
  const pri  = priorityMeta[req.priority] || priorityMeta.normal;
  const StatusIcon = meta.icon;
  const isPending = req.status === "pending" || req.status === "revision_needed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white dark:bg-gray-900 border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group ${isPending ? "border-amber-200 dark:border-amber-800/50" : "border-gray-200 dark:border-gray-800"}`}
      onClick={onOpen}
      data-testid={`card-data-request-${req.id}`}>

      {isPending && <div className="h-1 bg-gradient-to-l from-amber-400 to-orange-400" />}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.border} border`}>
            <StatusIcon className={`w-5 h-5 ${meta.color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-black text-gray-900 dark:text-white text-sm truncate">{req.title}</h3>
              <span className={`text-[10px] font-bold ${pri.color}`}>{pri.label}</span>
            </div>
            {req.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{req.description}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
                {meta.label}
              </span>
              {req.requestedBy?.fullName && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <User2 className="w-3 h-3" /> {req.requestedBy.fullName}
                </span>
              )}
              {req.createdAt && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {fmt(req.createdAt)}
                </span>
              )}
              {req.requestItems?.length > 0 && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> {req.requestItems.length} {L ? "عنصر" : "items"}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Request Dialog ─────────────────────────────────────── */
function RequestDialog({ req, onClose, onSubmitted, statusMeta, L }: { req: any; onClose: () => void; onSubmitted: () => void; statusMeta: any; L: boolean }) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    (req.requestItems || []).forEach((item: any) => { init[item._id || item.label] = ""; });
    return init;
  });
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const meta = statusMeta[req.status] || statusMeta.pending;
  const isReadonly = req.status === "submitted" || req.status === "approved";

  const submitMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/data-requests/${req.id}/submit`, {
      items: (req.requestItems || []).map((item: any) => ({
        label: item.label,
        type: item.type,
        value: responses[item._id || item.label] || "",
      })),
      notes,
    }),
    onSuccess: () => {
      toast({ title: L ? "تم الإرسال بنجاح" : "Submitted Successfully", description: L ? "سيراجع الفريق ردك قريباً" : "The team will review your response shortly" });
      onSubmitted();
    },
    onError: () => toast({ title: L ? "خطأ" : "Error", description: L ? "لم يتم الإرسال، حاول مجدداً" : "Submission failed, please try again", variant: "destructive" }),
  });

  async function handleFileUpload(itemKey: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(itemKey);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      setResponses(prev => ({ ...prev, [itemKey]: data.url }));
    } catch {
      toast({ title: L ? "خطأ في الرفع" : "Upload Error", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  }

  const canSubmit = !isReadonly && (req.requestItems || []).every((item: any) => {
    if (!item.required) return true;
    return !!(responses[item._id || item.label]?.trim());
  });

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[92vh]" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg} ${meta.border} border`}>
              <ClipboardList className={`w-5 h-5 ${meta.color}`} />
            </div>
            <div>
              <p className="font-black text-gray-900 dark:text-white text-base leading-tight">{req.title}</p>
              <span className={`text-[11px] font-bold ${meta.color}`}>{meta.label}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="space-y-5 px-1 pb-2">

            {/* Description */}
            {req.description && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex gap-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{req.description}</p>
              </div>
            )}

            {/* Admin note (for revision_needed) */}
            {req.status === "revision_needed" && req.adminNote && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">{L ? "ملاحظة الفريق" : "Team Note"}</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{req.adminNote}</p>
                </div>
              </div>
            )}

            {/* Request Items */}
            {req.requestItems?.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{L ? "العناصر المطلوبة" : "Required Items"}</p>
                {req.requestItems.map((item: any) => {
                  const key = item._id || item.label;
                  const TypeIcon = TYPE_ICONS[item.type] || Paperclip;
                  const val = responses[key] || "";
                  const existingVal = req.response?.items?.find((x: any) => x.label === item.label)?.value;

                  return (
                    <div key={key} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center">
                          <TypeIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.label}</p>
                        {item.required && <span className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-md">{L ? "مطلوب" : "Required"}</span>}
                      </div>

                      {item.hint && <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{item.hint}</p>}

                      {isReadonly ? (
                        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3">
                          {existingVal ? (
                            existingVal.startsWith("/uploads/") || existingVal.startsWith("http") ? (
                              <a href={existingVal} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-sm font-medium hover:underline">
                                <Paperclip className="w-4 h-4" /> {L ? "عرض الملف المرفق" : "View Attached File"}
                              </a>
                            ) : (
                              <p className="text-sm text-gray-700 dark:text-gray-300">{existingVal}</p>
                            )
                          ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic">{L ? "لم يتم الرد على هذا العنصر" : "No response for this item"}</p>
                          )}
                        </div>
                      ) : item.type === "text" ? (
                        <Textarea value={val} onChange={e => setResponses(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={item.hint || `اكتب ${item.label} هنا...`}
                          className="resize-none rounded-xl text-sm h-24"
                          data-testid={`input-dr-text-${key}`} />
                      ) : item.type === "link" ? (
                        <Input value={val} onChange={e => setResponses(p => ({ ...p, [key]: e.target.value }))}
                          placeholder="https://..." className="rounded-xl text-sm h-11"
                          data-testid={`input-dr-link-${key}`} />
                      ) : (
                        <div>
                          {val ? (
                            <div className="flex items-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <a href={val} target="_blank" rel="noopener noreferrer"
                                className="text-cyan-600 dark:text-cyan-400 text-sm font-medium hover:underline flex-1 truncate">
                                {L ? "تم الرفع — عرض الملف" : "Uploaded — View File"}
                              </a>
                              <button onClick={() => setResponses(p => ({ ...p, [key]: "" }))}
                                className="w-6 h-6 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setUploadingFor(key); fileInputRef.current?.click(); }}
                              disabled={!!uploading}
                              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-5 text-center hover:border-cyan-400 dark:hover:border-cyan-600 transition-all group"
                              data-testid={`button-dr-upload-${key}`}>
                              {uploading === key ? (
                                <Loader2 className="w-6 h-6 mx-auto text-cyan-500 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 mx-auto mb-1.5 text-gray-300 dark:text-gray-600 group-hover:text-cyan-500 transition-colors" />
                                  <p className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-cyan-500 transition-colors">
                                    {item.accept ? (L ? `يُقبل: ${item.accept}` : `Accepts: ${item.accept}`) : (L ? "اضغط لرفع الملف" : "Click to upload file")}
                                  </p>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes */}
            {!isReadonly && (
              <div>
                <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{L ? "ملاحظات إضافية" : "Additional Notes"} <span className="font-normal text-gray-300">{L ? "(اختياري)" : "(optional)"}</span></p>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder={L ? "أي ملاحظات أو تعليقات إضافية للفريق..." : "Any additional notes or comments for the team..."}
                  className="resize-none rounded-xl text-sm h-20"
                  data-testid="textarea-dr-notes" />
              </div>
            )}

            {/* Submitted response summary */}
            {isReadonly && req.response?.notes && (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1">{L ? "ملاحظاتك" : "Your Notes"}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{req.response.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" className="hidden"
          onChange={e => { if (uploadingFor) handleFileUpload(uploadingFor, e); }} />

        {/* Footer */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="rounded-xl h-11" onClick={onClose} data-testid="button-dr-close">
            {L ? "إغلاق" : "Close"}
          </Button>
          {!isReadonly && (
            <Button
              className="flex-1 bg-gradient-to-l from-cyan-500 to-blue-600 text-white font-black h-11 rounded-xl gap-2 shadow-lg shadow-cyan-500/25"
              onClick={() => submitMutation.mutate()}
              disabled={!canSubmit || submitMutation.isPending}
              data-testid="button-dr-submit">
              {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitMutation.isPending ? (L ? "جاري الإرسال..." : "Sending...") : (L ? "إرسال الرد" : "Submit Response")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
