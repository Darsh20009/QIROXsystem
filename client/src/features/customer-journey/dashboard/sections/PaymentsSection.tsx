// ── PaymentsSection ────────────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. New section. Wallet & payment history.
// Behind FEATURE_DASHBOARD_V2.

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";

interface PaymentsSectionProps {
  lang?: "ar" | "en";
}

export function PaymentsSection({ lang = "ar" }: PaymentsSectionProps) {
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

  const balance: number = dash?.kpis?.walletBalance ?? 0;
  const txs = (dash?.walletTransactions ?? []).slice(0, 5);

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-black dark:text-white">
            {isAr ? "المدفوعات والمحفظة" : "Payments & Wallet"}
          </h3>
        </div>
        <Link href="/wallet">
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-gray-400 h-7">
            {isAr ? "عرض الكل" : "View All"}
            <ExternalLink className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 overflow-hidden">
        {/* Balance card */}
        <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04]">
          <p className="text-xs text-gray-400 mb-1">{isAr ? "الرصيد الحالي" : "Current Balance"}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-bold text-black dark:text-white">
              {balance.toLocaleString()}{" "}
              <span className="text-sm font-normal text-gray-400">{isAr ? "ر.س" : "SAR"}</span>
            </p>
          )}
        </div>

        {/* Transactions list */}
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2 text-center">
            <span className="text-2xl">💳</span>
            <p className="text-xs text-gray-400">
              {isAr ? "لا توجد معاملات بعد" : "No transactions yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {txs.map((tx: any, i: number) => {
              const isCredit = tx.type === "credit";
              const ts = tx.createdAt ? new Date(tx.createdAt) : null;
              const timeAgo = ts
                ? formatDistanceToNow(ts, { addSuffix: true, locale: isAr ? arLocale : enUS })
                : "";
              return (
                <motion.div
                  key={tx.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCredit
                      ? "bg-black/[0.04] dark:bg-white/[0.06]"
                      : "bg-black/[0.04] dark:bg-white/[0.06]"
                  }`}>
                    {isCredit
                      ? <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      : <TrendingDown className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-black dark:text-white truncate">
                      {tx.description || (isAr ? (isCredit ? "إيداع" : "سحب") : (isCredit ? "Credit" : "Debit"))}
                    </p>
                    {timeAgo && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo}</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 ${
                    isCredit ? "text-black dark:text-white" : "text-gray-400"
                  }`}>
                    {isCredit ? "+" : "−"}{Number(tx.amount ?? 0).toLocaleString()} {isAr ? "ر.س" : "SAR"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
