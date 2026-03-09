import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Loader2, AlertTriangle, CheckCircle, Clock, XCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SARIcon from "@/components/SARIcon";

const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  active:    { label: "نشط",            icon: CheckCircle,   color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" },
  expired:   { label: "منتهي الصلاحية", icon: XCircle,       color: "text-red-500 bg-red-50 dark:bg-red-900/20" },
  exhausted: { label: "نفذت الحصة",     icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20" },
  cancelled: { label: "ملغي",           icon: XCircle,       color: "text-black/40 dark:text-white/40 bg-black/[0.03] dark:bg-white/[0.03]" },
};

export default function AdminAddonSubscriptions() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: subs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/addon-subscriptions", statusFilter],
    queryFn: async () => {
      const url = statusFilter !== "all" ? `/api/admin/addon-subscriptions?status=${statusFilter}` : "/api/admin/addon-subscriptions";
      const r = await fetch(url, { credentials: "include" });
      return r.json();
    },
  });

  const counts = {
    all: subs.length,
    active: subs.filter((s: any) => s.status === "active").length,
    expired: subs.filter((s: any) => s.status === "expired").length,
    exhausted: subs.filter((s: any) => s.status === "exhausted").length,
  };

  return (
    <div className="p-4 space-y-5" dir="rtl">
      <div>
        <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5" />
          اشتراكات الإضافات والخدمات
        </h1>
        <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">متابعة الاشتراكات والحصص وانتهاء الصلاحية</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries({ all: "الكل", active: "نشطة", expired: "منتهية", exhausted: "نفذت" }).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setStatusFilter(k)}
            className={`rounded-xl border p-3 text-center transition-all ${statusFilter === k ? "border-black dark:border-white bg-black dark:bg-white" : "border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 hover:bg-black/[0.02]"}`}
            data-testid={`filter-${k}`}
          >
            <p className={`text-lg font-black ${statusFilter === k ? "text-white dark:text-black" : "text-black dark:text-white"}`}>{(counts as any)[k]}</p>
            <p className={`text-xs mt-0.5 ${statusFilter === k ? "text-white/70 dark:text-black/70" : "text-black/40 dark:text-white/40"}`}>{label}</p>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : subs.length === 0 ? (
        <div className="text-center py-12 text-sm text-black/30 dark:text-white/30">لا توجد اشتراكات</div>
      ) : (
        <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.05] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.02]">
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">الخدمة</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">العميل</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">الحصة</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">الانتهاء</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">تجديد مطلوب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.03]">
                {subs.map((sub: any) => {
                  const st = STATUS_MAP[sub.status] || STATUS_MAP.active;
                  const Icon = st.icon;
                  const quotaPercent = sub.quotaTotal > 0 ? Math.min(100, Math.round((sub.quotaUsed / sub.quotaTotal) * 100)) : 0;
                  return (
                    <tr key={sub._id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015]" data-testid={`row-sub-${sub._id}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-black/80 dark:text-white/75">{sub.addonNameAr || sub.addonId?.nameAr || "—"}</p>
                        <p className="text-[10px] text-black/30 dark:text-white/30 capitalize">{sub.billingType}</p>
                      </td>
                      <td className="px-4 py-3 text-black/70 dark:text-white/65">
                        {sub.clientId?.fullName || sub.clientId?.username || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {sub.quotaTotal > 0 ? (
                          <div className="space-y-1">
                            <div className="text-xs text-black/50 dark:text-white/45">{sub.quotaUsed}/{sub.quotaTotal}</div>
                            <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden w-20">
                              <div className={`h-full rounded-full ${quotaPercent >= 90 ? "bg-red-500" : quotaPercent >= 70 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${quotaPercent}%` }} />
                            </div>
                          </div>
                        ) : <span className="text-xs text-black/25 dark:text-white/25">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-black/50 dark:text-white/45">
                        {sub.expiresAt ? (
                          <div>
                            <div className={new Date(sub.expiresAt) < new Date() ? "text-red-500 font-bold" : ""}>
                              {new Date(sub.expiresAt).toLocaleDateString("ar-SA")}
                            </div>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full w-fit ${st.color}`}>
                          <Icon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {sub.renewalRequestedAt ? (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(sub.renewalRequestedAt).toLocaleDateString("ar-SA")}
                          </span>
                        ) : <span className="text-xs text-black/20 dark:text-white/20">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
