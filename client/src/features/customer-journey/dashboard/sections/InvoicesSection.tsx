// ── InvoicesSection ───────────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. Fully implemented with live data.
// Behind FEATURE_DASHBOARD_V2. Existing /dashboard untouched.

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Receipt, ExternalLink, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { EmptyState } from "../../components/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";

interface InvoicesSectionProps {
  lang?: "ar" | "en";
}

const STATUS_MAP: Record<string, { ar: string; en: string }> = {
  paid:    { ar: "مدفوعة",  en: "Paid" },
  pending: { ar: "معلقة",   en: "Pending" },
  overdue: { ar: "متأخرة",  en: "Overdue" },
  draft:   { ar: "مسودة",   en: "Draft" },
};

export function InvoicesSection({ lang = "ar" }: InvoicesSectionProps) {
  const isAr = lang === "ar";

  const { data: dash, isLoading } = useQuery<any>({
    queryKey: ["/api/v2/client/dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/v2/client/dashboard");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 60_000,
  });

  const invoices = (dash?.invoices ?? []).slice(0, 5);

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-black dark:text-white">
            {isAr ? "الفواتير" : "Invoices"}
          </h3>
        </div>
        <Link href="/client/invoices">
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-gray-400 h-7">
            {isAr ? "عرض الكل" : "View All"}
            <ExternalLink className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon="🧾"
            titleAr="لا توجد فواتير"
            titleEn="No Invoices"
            subtitleAr="ستظهر فواتيرك هنا بعد الموافقة على العرض"
            subtitleEn="Your invoices will appear here after approving the proposal"
            lang={lang}
          />
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04] bg-white dark:bg-gray-900">
            {invoices.map((inv: any, i: number) => {
              const ts = inv.createdAt ? new Date(inv.createdAt) : null;
              const timeAgo = ts
                ? formatDistanceToNow(ts, { addSuffix: true, locale: isAr ? arLocale : enUS })
                : "";
              const statusLabel = STATUS_MAP[inv.status]?.[isAr ? "ar" : "en"] ?? inv.status;
              const isPaid = inv.status === "paid";
              return (
                <motion.div
                  key={inv.id || i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-black dark:text-white truncate">
                      {inv.invoiceNumber || (isAr ? "فاتورة" : "Invoice")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {inv.totalAmount != null && (
                        <span className="text-[10px] font-bold text-black dark:text-white">
                          {Number(inv.totalAmount).toLocaleString()} {isAr ? "ر.س" : "SAR"}
                        </span>
                      )}
                      {timeAgo && (
                        <span className="text-[10px] text-gray-400">{timeAgo}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 px-1.5 ${
                        isPaid
                          ? "border-black/20 dark:border-white/20 bg-black/[0.04] dark:bg-white/[0.06]"
                          : "border-black/10 dark:border-white/10"
                      }`}
                    >
                      {statusLabel}
                    </Badge>
                    <Link href={`/client/invoices`}>
                      <button className="text-gray-300 hover:text-black dark:hover:text-white">
                        <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? "" : "rotate-180"}`} />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
