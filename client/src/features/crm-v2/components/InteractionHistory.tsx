// ── InteractionHistory ────────────────────────────────────────────────────────
// Sprint 008 — CRM V2. Add and view standalone interaction log.
// Behind FEATURE_CRM_V2.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Phone, Mail, MessageSquare, Video, FileText, CheckSquare,
  Paperclip, Headphones, Plus, X, Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import { useAddCustomerInteraction, useAddLeadInteraction } from "../hooks/useCrmV2";

interface InteractionHistoryProps {
  interactions: any[];
  isLoading?: boolean;
  subjectType: "customer" | "lead";
  subjectId: string;
  lang?: "ar" | "en";
}

const TYPE_ICONS: Record<string, any> = {
  call: Phone, email: Mail, whatsapp: MessageSquare, meeting: Video,
  note: FileText, task: CheckSquare, attachment: Paperclip, support: Headphones,
};

const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  call:              { ar: "مكالمة",     en: "Call" },
  email:             { ar: "بريد",       en: "Email" },
  whatsapp:          { ar: "واتساب",     en: "WhatsApp" },
  meeting:           { ar: "اجتماع",     en: "Meeting" },
  note:              { ar: "ملاحظة",     en: "Note" },
  task:              { ar: "مهمة",       en: "Task" },
  attachment:        { ar: "مرفق",       en: "Attachment" },
  support:           { ar: "دعم",        en: "Support" },
  internal_comment:  { ar: "تعليق داخلي", en: "Internal" },
};

const DIRECTION_LABELS: Record<string, { ar: string; en: string }> = {
  inbound:  { ar: "وارد",  en: "Inbound" },
  outbound: { ar: "صادر",  en: "Outbound" },
  internal: { ar: "داخلي", en: "Internal" },
};

export function InteractionHistory({
  interactions, isLoading, subjectType, subjectId, lang = "ar",
}: InteractionHistoryProps) {
  const isAr = lang === "ar";
  const locale = isAr ? arLocale : enUS;
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("note");
  const [direction, setDirection] = useState("outbound");
  const [content, setContent] = useState("");
  const [outcome, setOutcome] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");

  const addCustomer = useAddCustomerInteraction(subjectId);
  const addLead     = useAddLeadInteraction(subjectId);
  const addMut      = subjectType === "customer" ? addCustomer : addLead;

  async function handleSubmit() {
    if (!content.trim()) return;
    await addMut.mutateAsync({ type, direction, content: content.trim(), outcome, followUpAt: followUpAt || undefined });
    setContent(""); setOutcome(""); setFollowUpAt(""); setType("note"); setShowForm(false);
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-black dark:text-white">
          {isAr ? "سجل التفاعلات" : "Interaction History"}
        </h4>
        <Button
          variant={showForm ? "outline" : "default"}
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? <><X className="w-3 h-3" />{isAr ? "إلغاء" : "Cancel"}</> : <><Plus className="w-3 h-3" />{isAr ? "إضافة" : "Add"}</>}
        </Button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">{isAr ? "النوع" : "Type"}</p>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">{isAr ? "الاتجاه" : "Direction"}</p>
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DIRECTION_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 mb-1">{isAr ? "المحتوى *" : "Content *"}</p>
                <Textarea
                  rows={3}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={isAr ? "أضف ملاحظاتك هنا..." : "Add your notes here..."}
                  className="text-xs resize-none"
                />
              </div>

              {(type === "call" || type === "meeting") && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">{isAr ? "النتيجة" : "Outcome"}</p>
                  <input
                    type="text"
                    value={outcome}
                    onChange={e => setOutcome(e.target.value)}
                    placeholder={isAr ? "أُجيب / لم يُجب / مشغول..." : "Answered / No answer / Busy..."}
                    className="w-full h-8 px-3 text-xs rounded-md border border-input bg-background"
                  />
                </div>
              )}

              <div>
                <p className="text-[11px] text-gray-400 mb-1">{isAr ? "متابعة بتاريخ (اختياري)" : "Follow-up date (optional)"}</p>
                <input
                  type="datetime-local"
                  value={followUpAt}
                  onChange={e => setFollowUpAt(e.target.value)}
                  className="w-full h-8 px-3 text-xs rounded-md border border-input bg-background"
                />
              </div>

              <Button
                className="w-full h-8 text-xs gap-2"
                onClick={handleSubmit}
                disabled={!content.trim() || addMut.isPending}
              >
                <Send className="w-3 h-3" />
                {addMut.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التفاعل" : "Save Interaction")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden bg-white dark:bg-gray-900">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : interactions.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2 text-center">
            <span className="text-2xl">💬</span>
            <p className="text-xs text-gray-400">
              {isAr ? "لا توجد تفاعلات مسجلة بعد" : "No interactions recorded yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {interactions.map((item: any, i: number) => {
              const Icon = TYPE_ICONS[item.type] || FileText;
              const ts = item.createdAt ? new Date(item.createdAt) : null;
              const timeAgo = ts ? formatDistanceToNow(ts, { addSuffix: true, locale }) : "";
              const typeLabel = TYPE_LABELS[item.type]?.[isAr ? "ar" : "en"] ?? item.type;
              const dirLabel  = DIRECTION_LABELS[item.direction]?.[isAr ? "ar" : "en"] ?? "";
              return (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="flex gap-3 p-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[11px] font-medium text-black dark:text-white">{typeLabel}</span>
                      {dirLabel && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 border-black/10 dark:border-white/10">{dirLabel}</Badge>
                      )}
                      {item.outcome && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 border-black/10 dark:border-white/10">{item.outcome}</Badge>
                      )}
                      {item.sentiment && item.sentiment !== "" && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 border-black/10 dark:border-white/10">{item.sentiment}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.createdByName && (
                        <span className="text-[10px] text-gray-400">{item.createdByName}</span>
                      )}
                      {timeAgo && (
                        <span className="text-[10px] text-gray-300 dark:text-gray-600">{timeAgo}</span>
                      )}
                      {item.followUpAt && !item.followUpDone && (
                        <span className="text-[10px] text-gray-500">
                          🔔 {isAr ? "متابعة:" : "Follow-up:"} {new Date(item.followUpAt).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
