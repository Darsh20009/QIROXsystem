// ── EmptyState ────────────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// Reusable empty-state components for every Dashboard V2 section.

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// ── Base empty state ──────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: ReactNode;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  ctaLabelAr?: string;
  ctaLabelEn?: string;
  ctaHref?: string;
  onCtaClick?(): void;
  lang?: "ar" | "en";
}

export function EmptyState({
  icon,
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  ctaLabelAr,
  ctaLabelEn,
  ctaHref,
  onCtaClick,
  lang = "ar",
}: EmptyStateProps) {
  const isAr   = lang === "ar";
  const title  = isAr ? titleAr   : titleEn;
  const sub    = isAr ? subtitleAr : subtitleEn;
  const cta    = isAr ? ctaLabelAr : ctaLabelEn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center text-center py-10 px-4 gap-4"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-black dark:text-white">{title}</p>
        {sub && <p className="text-xs text-gray-400 leading-relaxed">{sub}</p>}
      </div>
      {cta && (ctaHref || onCtaClick) && (
        <Button
          size="sm"
          variant="outline"
          onClick={onCtaClick ?? (() => { if (ctaHref) window.location.href = ctaHref; })}
          className="text-xs"
        >
          {cta}
        </Button>
      )}
    </motion.div>
  );
}

// ── Preset empty states ───────────────────────────────────────────────────────

export const EMPTY_STATES = {
  projects: (lang: "ar" | "en" = "ar") => (
    <EmptyState
      icon="🗂️"
      titleAr="لا توجد مشاريع نشطة"
      titleEn="No Active Projects"
      subtitleAr="ابدأ طلبك الأول ليظهر مشروعك هنا"
      subtitleEn="Start your first order to see your project here"
      ctaLabelAr="ابدأ طلبك"
      ctaLabelEn="Start an Order"
      ctaHref="/order"
      lang={lang}
    />
  ),
  tasks: (lang: "ar" | "en" = "ar") => (
    <EmptyState
      icon="✅"
      titleAr="لا توجد مهام معلقة"
      titleEn="No Pending Tasks"
      subtitleAr="ستظهر مهامك هنا عند بدء المشروع"
      subtitleEn="Your tasks will appear here once a project starts"
      lang={lang}
    />
  ),
  files: (lang: "ar" | "en" = "ar") => (
    <EmptyState
      icon="📁"
      titleAr="لا توجد ملفات بعد"
      titleEn="No Files Yet"
      subtitleAr="سيتم رفع ملفات مشروعك هنا"
      subtitleEn="Your project files will be uploaded here"
      lang={lang}
    />
  ),
  quotations: (lang: "ar" | "en" = "ar") => (
    <EmptyState
      icon="📋"
      titleAr="لا توجد عروض أسعار"
      titleEn="No Quotations"
      subtitleAr="سيرسل فريقنا عرض سعر بعد مراجعة طلبك"
      subtitleEn="Our team will send a quotation after reviewing your request"
      lang={lang}
    />
  ),
  invoices: (lang: "ar" | "en" = "ar") => (
    <EmptyState
      icon="🧾"
      titleAr="لا توجد فواتير"
      titleEn="No Invoices"
      subtitleAr="ستظهر فواتيرك هنا بعد الموافقة على العرض"
      subtitleEn="Your invoices will appear here after approving the proposal"
      lang={lang}
    />
  ),
  meetings: (lang: "ar" | "en" = "ar") => (
    <EmptyState
      icon="🎥"
      titleAr="لا توجد اجتماعات مجدولة"
      titleEn="No Scheduled Meetings"
      subtitleAr="يمكنك جدولة اجتماع مع فريقنا في أي وقت"
      subtitleEn="You can schedule a meeting with our team at any time"
      ctaLabelAr="جدول اجتماعاً"
      ctaLabelEn="Schedule Meeting"
      ctaHref="/meetings"
      lang={lang}
    />
  ),
  notifications: (lang: "ar" | "en" = "ar") => (
    <EmptyState
      icon="🔔"
      titleAr="لا توجد إشعارات جديدة"
      titleEn="No New Notifications"
      subtitleAr="ستظهر تحديثات مشروعك هنا"
      subtitleEn="Your project updates will appear here"
      lang={lang}
    />
  ),
  support: (lang: "ar" | "en" = "ar") => (
    <EmptyState
      icon="🎧"
      titleAr="لا توجد تذاكر دعم"
      titleEn="No Support Tickets"
      subtitleAr="هل تحتاج مساعدة؟ افتح تذكرة دعم"
      subtitleEn="Need help? Open a support ticket"
      ctaLabelAr="فتح تذكرة"
      ctaLabelEn="Open Ticket"
      ctaHref="/support"
      lang={lang}
    />
  ),
} as const;
