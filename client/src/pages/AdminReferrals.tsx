// @ts-nocheck
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { Gift, Loader2, TrendingUp, Clock, Award, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SARIcon from "@/components/SARIcon";

export default function AdminReferrals() {
  const { data: referrals = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/referrals"],
  });

  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const statusLabel: Record<string, string> = L
    ? { pending: "معلّق", rewarded: "تمت المكافأة", expired: "منتهي" }
    : { pending: "Pending", rewarded: "Rewarded", expired: "Expired" };
  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    rewarded: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    expired: "bg-black/[0.04] dark:bg-white/[0.04] text-black/40 dark:text-white/40",
  };

  const totalRewarded  = referrals.filter((r: any) => r.status === "rewarded").length;
  const totalPending   = referrals.filter((r: any) => r.status === "pending").length;
  const totalCredits   = referrals.filter((r: any) => r.status === "rewarded").reduce((a: number, r: any) => a + (r.creditAmount || 0), 0);
  const conversionRate = referrals.length > 0 ? Math.round((totalRewarded / referrals.length) * 100) : 0;

  // Top referrers by reward count
  const referrerMap: Record<string, { name: string; count: number; credits: number }> = {};
  referrals.filter((r: any) => r.status === "rewarded").forEach((r: any) => {
    const id = r.referrerId?._id || r.referrerId?.id || r.referrerId;
    const name = r.referrerId?.fullName || r.referrerId?.username || "—";
    if (!referrerMap[id]) referrerMap[id] = { name, count: 0, credits: 0 };
    referrerMap[id].count++;
    referrerMap[id].credits += r.creditAmount || 0;
  });
  const topReferrers = Object.values(referrerMap).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="p-4 space-y-5" dir={dir}>
      <div>
        <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
          <Gift className="w-5 h-5" />
          {L ? "تحليل الإحالات" : "Referrals Analytics"}
        </h1>
        <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{L ? "أداء برنامج الإحالات ومكافآته" : "Referral program performance and rewards"}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 p-4 text-center">
          <div className="w-8 h-8 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Gift className="w-4 h-4 text-black/40 dark:text-white/40" />
          </div>
          <p className="text-2xl font-black text-black dark:text-white">{referrals.length}</p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-1">{L ? "إجمالي الإحالات" : "Total Referrals"}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10 p-4 text-center">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalRewarded}</p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-1">{L ? "إحالات ناجحة" : "Rewarded"}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 p-4 text-center">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalPending}</p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-1">{L ? "معلّقة" : "Pending"}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10 p-4 text-center">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{conversionRate}%</p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-1">{L ? "معدل التحويل" : "Conversion Rate"}</p>
        </div>
      </div>

      {/* Credits distributed */}
      <div className="rounded-2xl border border-purple-200 dark:border-purple-800/40 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">{L ? "إجمالي المكافآت الموزّعة" : "Total Credits Distributed"}</p>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-3xl font-black text-purple-700 dark:text-purple-300">{totalCredits.toLocaleString()}</p>
              <SARIcon size={18} className="text-purple-600 dark:text-purple-400 mt-1" />
            </div>
          </div>
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        {totalRewarded > 0 && (
          <p className="text-xs text-purple-600/60 dark:text-purple-400/50 mt-2">
            {L
              ? `متوسط المكافأة: ${(totalCredits / totalRewarded).toFixed(1)} ريال لكل إحالة`
              : `Avg reward: ${(totalCredits / totalRewarded).toFixed(1)} SAR per referral`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Referrers */}
        {topReferrers.length > 0 && (
          <Card className="border-black/10 dark:border-white/10 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                {L ? "أفضل المُحيلين" : "Top Referrers"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topReferrers.map((ref, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-gray-100 text-gray-500" : "bg-black/5 text-black/40"
                    }`}>{i + 1}</div>
                    <span className="text-sm font-medium text-black dark:text-white">{ref.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{ref.count} {L ? "إحالة" : "refs"}</span>
                    <div className="flex items-center gap-0.5 text-xs text-black/40">
                      <span>{ref.credits}</span>
                      <SARIcon size={9} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Conversion funnel */}
        {referrals.length > 0 && (
          <Card className="border-black/10 dark:border-white/10 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                {L ? "قمع التحويل" : "Conversion Funnel"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: L ? "إجمالي" : "Total", count: referrals.length, color: "bg-black/10 dark:bg-white/10" },
                { label: L ? "معلّقة" : "Pending", count: totalPending, color: "bg-amber-200 dark:bg-amber-800/40" },
                { label: L ? "ناجحة" : "Rewarded", count: totalRewarded, color: "bg-emerald-200 dark:bg-emerald-800/40" },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-black/60 dark:text-white/50">{label}</span>
                    <span className="font-bold text-black dark:text-white">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all`}
                      style={{ width: `${referrals.length > 0 ? (count / referrals.length) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-12 text-sm text-black/30 dark:text-white/30">{L ? "لا توجد إحالات بعد" : "No referrals yet"}</div>
      ) : (
        <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.05] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.02]">
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">{L ? "المُحيل" : "Referrer"}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">{L ? "المُحال" : "Referred"}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">{L ? "الكود" : "Code"}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">{L ? "المكافأة" : "Reward"}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">{L ? "الحالة" : "Status"}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">{L ? "التاريخ" : "Date"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.03]">
                {referrals.map((r: any) => (
                  <tr key={r._id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015]" data-testid={`row-admin-referral-${r._id}`}>
                    <td className="px-4 py-3 text-black/80 dark:text-white/75">{r.referrerId?.fullName || r.referrerId?.username || "—"}</td>
                    <td className="px-4 py-3 text-black/80 dark:text-white/75">{r.referredId?.fullName || r.referredId?.username || "—"}</td>
                    <td className="px-4 py-3"><code className="text-xs font-mono text-black/60 dark:text-white/55 bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded">{r.code}</code></td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400"><span className="flex items-center gap-1">{r.creditAmount} <SARIcon size={11} /></span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor[r.status] || ""}`}>{statusLabel[r.status] || r.status}</span></td>
                    <td className="px-4 py-3 text-xs text-black/40 dark:text-white/40">{new Date(r.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
