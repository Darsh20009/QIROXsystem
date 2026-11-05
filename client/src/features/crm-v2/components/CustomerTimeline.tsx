// ── CustomerTimeline ──────────────────────────────────────────────────────────
// Sprint 008 — CRM V2. Unified chronological timeline for a customer or lead.
// Behind FEATURE_CRM_V2.

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { ar as arLocale } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import {
  ShoppingCart, Layers, Receipt, FileText, Wallet, Video, Bell,
  Phone, Mail, MessageSquare, CheckSquare, Paperclip, Headphones,
  FileSignature, Clock, AlertCircle, Activity, Target,
} from "lucide-react";

interface CustomerTimelineProps {
  events: any[];
  isLoading?: boolean;
  lang?: "ar" | "en";
}

const TYPE_META: Record<string, { icon: any; color: string; arLabel: string; enLabel: string }> = {
  order:          { icon: ShoppingCart,   color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "طلب",           enLabel: "Order" },
  project:        { icon: Layers,         color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "مشروع",         enLabel: "Project" },
  project_update: { icon: Layers,         color: "bg-black/[0.04] dark:bg-white/[0.04]",  arLabel: "تحديث مشروع",   enLabel: "Project Update" },
  invoice:        { icon: Receipt,        color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "فاتورة",        enLabel: "Invoice" },
  quotation:      { icon: FileText,       color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "عرض سعر",       enLabel: "Quotation" },
  payment:        { icon: Wallet,         color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "دفعة",          enLabel: "Payment" },
  meeting:        { icon: Video,          color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "اجتماع",        enLabel: "Meeting" },
  notification:   { icon: Bell,           color: "bg-black/[0.04] dark:bg-white/[0.04]",  arLabel: "إشعار",         enLabel: "Notification" },
  crm_activity:   { icon: Activity,       color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "نشاط CRM",      enLabel: "CRM Activity" },
  interaction:    { icon: Activity,       color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "تفاعل",         enLabel: "Interaction" },
  call:           { icon: Phone,          color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "مكالمة",        enLabel: "Call" },
  email:          { icon: Mail,           color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "بريد",          enLabel: "Email" },
  whatsapp:       { icon: MessageSquare,  color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "واتساب",        enLabel: "WhatsApp" },
  task:           { icon: CheckSquare,    color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "مهمة",          enLabel: "Task" },
  note:           { icon: FileText,       color: "bg-black/[0.04] dark:bg-white/[0.04]",  arLabel: "ملاحظة",        enLabel: "Note" },
  attachment:     { icon: Paperclip,      color: "bg-black/[0.04] dark:bg-white/[0.04]",  arLabel: "مرفق",          enLabel: "Attachment" },
  support:        { icon: Headphones,     color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "دعم",           enLabel: "Support" },
  contract:       { icon: FileSignature,  color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "عقد",           enLabel: "Contract" },
  reminder:       { icon: Clock,          color: "bg-black/[0.04] dark:bg-white/[0.04]",  arLabel: "تذكير",         enLabel: "Reminder" },
  opportunity:    { icon: Target,         color: "bg-black/[0.06] dark:bg-white/[0.06]",  arLabel: "فرصة",          enLabel: "Opportunity" },
};

const DEFAULT_META = { icon: AlertCircle, color: "bg-black/[0.04] dark:bg-white/[0.04]", arLabel: "حدث", enLabel: "Event" };

export function CustomerTimeline({ events, isLoading, lang = "ar" }: CustomerTimelineProps) {
  const isAr = lang === "ar";
  const locale = isAr ? arLocale : enUS;

  if (isLoading) {
    return (
      <div className="space-y-0">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-3 pb-6">
            <div className="flex flex-col items-center">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="w-px h-full bg-gray-100 dark:bg-gray-800 mt-2" />
            </div>
            <div className="flex-1 pt-1 space-y-1.5 pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 gap-2 text-center">
        <span className="text-3xl">📋</span>
        <p className="text-sm font-medium text-black dark:text-white">
          {isAr ? "لا يوجد سجل بعد" : "No history yet"}
        </p>
        <p className="text-xs text-gray-400">
          {isAr ? "ستظهر جميع التفاعلات هنا" : "All interactions will appear here"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0" dir={isAr ? "rtl" : "ltr"}>
      {events.map((event, idx) => {
        const meta = TYPE_META[event.type] || DEFAULT_META;
        const Icon = meta.icon;
        const ts = event.timestamp ? new Date(event.timestamp) : null;
        const timeAgo = ts ? formatDistanceToNow(ts, { addSuffix: true, locale }) : "";
        const dateStr = ts ? format(ts, "d MMM yyyy, h:mm a", { locale }) : "";
        const isLast = idx === events.length - 1;

        return (
          <motion.div
            key={event.id || idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.25 }}
            className="flex gap-3"
          >
            {/* Spine */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full ${meta.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 mt-1 mb-1 min-h-[20px]" />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 min-w-0 ${!isLast ? "pb-5" : "pb-2"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-black/10 dark:border-white/10 flex-shrink-0">
                      {isAr ? meta.arLabel : meta.enLabel}
                    </Badge>
                    {event.status && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-black/10 dark:border-white/10 flex-shrink-0">
                        {event.status}
                      </Badge>
                    )}
                    {event.source === "crm_v2" && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-black/10 dark:border-white/10 flex-shrink-0 bg-black/[0.02] dark:bg-white/[0.02]">
                        CRM V2
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-medium text-black dark:text-white mt-1 leading-tight">
                    {isAr ? (event.titleAr || event.title) : (event.title || event.titleAr)}
                  </p>
                  {event.body && (
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{event.body}</p>
                  )}
                  {event.amount != null && event.amount > 0 && (
                    <p className="text-[11px] font-semibold text-black dark:text-white mt-0.5">
                      {Number(event.amount).toLocaleString()} {event.currency || "SAR"}
                    </p>
                  )}
                  {event.createdByName && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {isAr ? "بواسطة" : "by"} {event.createdByName}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400 whitespace-nowrap">{timeAgo}</p>
                  <p className="text-[9px] text-gray-300 dark:text-gray-600 mt-0.5 whitespace-nowrap">{dateStr}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
