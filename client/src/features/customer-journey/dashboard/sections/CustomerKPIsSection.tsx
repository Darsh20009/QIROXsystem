// ── CustomerKPIsSection ───────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. New section. Live data.
// Behind FEATURE_DASHBOARD_V2.

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Layers, CheckCircle2, Receipt } from "lucide-react";

interface CustomerKPIsSectionProps {
  lang?: "ar" | "en";
}

function KpiCard({
  icon: Icon,
  labelAr,
  labelEn,
  value,
  subAr,
  subEn,
  isLoading,
  lang,
}: {
  icon: any;
  labelAr: string;
  labelEn: string;
  value: number | string;
  subAr?: string;
  subEn?: string;
  isLoading: boolean;
  lang: "ar" | "en";
}) {
  const isAr = lang === "ar";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex-1 min-w-0 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </div>
        <span className="text-[11px] text-gray-400 leading-tight">{isAr ? labelAr : labelEn}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <p className="text-2xl font-bold text-black dark:text-white">{value}</p>
      )}
      {(subAr || subEn) && (
        <p className="text-[10px] text-gray-400 mt-0.5">{isAr ? subAr : subEn}</p>
      )}
    </motion.div>
  );
}

export function CustomerKPIsSection({ lang = "ar" }: CustomerKPIsSectionProps) {
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

  const kpis = dash?.kpis;

  return (
    <section dir={isAr ? "rtl" : "ltr"}>
      <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
        {isAr ? "مؤشرات الأداء" : "Customer KPIs"}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          icon={ShoppingCart}
          labelAr="إجمالي الطلبات"
          labelEn="Total Orders"
          value={kpis?.totalOrders ?? 0}
          subAr={`${kpis?.pendingOrders ?? 0} معلق`}
          subEn={`${kpis?.pendingOrders ?? 0} pending`}
          isLoading={isLoading}
          lang={lang}
        />
        <KpiCard
          icon={Layers}
          labelAr="إجمالي المشاريع"
          labelEn="Total Projects"
          value={kpis?.totalProjects ?? 0}
          subAr={`${kpis?.activeProjects ?? 0} نشط`}
          subEn={`${kpis?.activeProjects ?? 0} active`}
          isLoading={isLoading}
          lang={lang}
        />
        <KpiCard
          icon={CheckCircle2}
          labelAr="مشاريع مكتملة"
          labelEn="Completed"
          value={kpis?.completedProjects ?? 0}
          isLoading={isLoading}
          lang={lang}
        />
        <KpiCard
          icon={Receipt}
          labelAr="فواتير مدفوعة"
          labelEn="Paid Invoices"
          value={kpis?.paidInvoices ?? 0}
          subAr={`من ${kpis?.totalInvoices ?? 0}`}
          subEn={`of ${kpis?.totalInvoices ?? 0}`}
          isLoading={isLoading}
          lang={lang}
        />
      </div>
    </section>
  );
}
