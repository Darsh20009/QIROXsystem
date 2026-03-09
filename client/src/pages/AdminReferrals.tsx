import { useQuery } from "@tanstack/react-query";
import { Gift, Loader2, Users } from "lucide-react";
import SARIcon from "@/components/SARIcon";

export default function AdminReferrals() {
  const { data: referrals = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/referrals"],
  });

  const statusLabel: Record<string, string> = { pending: "معلّق", rewarded: "تمت المكافأة", expired: "منتهي" };
  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    rewarded: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    expired: "bg-black/[0.04] dark:bg-white/[0.04] text-black/40 dark:text-white/40",
  };

  const totalRewarded = referrals.filter((r: any) => r.status === "rewarded").length;
  const totalCredits = referrals.filter((r: any) => r.status === "rewarded").reduce((a: number, r: any) => a + (r.creditAmount || 0), 0);

  return (
    <div className="p-4 space-y-5" dir="rtl">
      <div>
        <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
          <Gift className="w-5 h-5" />
          سجل الإحالات
        </h1>
        <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">إجمالي الإحالات والمكافآت في النظام</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 p-4 text-center">
          <p className="text-2xl font-black text-black dark:text-white">{referrals.length}</p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-1">إجمالي الإحالات</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10 p-4 text-center">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalRewarded}</p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-1">إحالات ناجحة</p>
        </div>
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 p-4 text-center">
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalCredits}</p>
          <p className="text-xs text-black/40 dark:text-white/40 mt-1 flex items-center justify-center gap-1"><SARIcon size={11} /> وُزّعت</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-12 text-sm text-black/30 dark:text-white/30">لا توجد إحالات بعد</div>
      ) : (
        <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.05] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.02]">
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">المُحيل</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">المُحال</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">الكود</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">المكافأة</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-black/50 dark:text-white/45">التاريخ</th>
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
                    <td className="px-4 py-3 text-xs text-black/40 dark:text-white/40">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</td>
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
