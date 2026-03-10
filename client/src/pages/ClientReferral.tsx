import SARIcon from "@/components/SARIcon";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift, Copy, Check, Loader2, Users, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ClientReferral() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");

  const { data, isLoading } = useQuery<{ code: string; creditsEarned: number; referrals: any[] }>({
    queryKey: ["/api/referral/my-code"],
  });

  const applyMutation = useMutation({
    mutationFn: (c: string) => apiRequest("POST", "/api/referral/apply", { code: c }),
    onSuccess: (d: any) => {
      toast({ title: "تم تطبيق الإحالة", description: d.message });
      setApplyCode("");
      qc.invalidateQueries({ queryKey: ["/api/referral/my-code"] });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const copyCode = () => {
    if (!data?.code) return;
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "تم نسخ كود الإحالة" });
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>;

  const statusLabel: Record<string, string> = { pending: "معلّق", rewarded: "تمت المكافأة", expired: "منتهي" };
  const statusColor: Record<string, string> = { pending: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20", rewarded: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20", expired: "text-black/40 dark:text-white/40 bg-black/[0.03] dark:bg-white/[0.03]" };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-black dark:text-white flex items-center gap-2">
          <Gift className="w-6 h-6" />
          برنامج الإحالات
        </h1>
        <p className="text-sm text-black/50 dark:text-white/45 mt-1">شارك كودك واكسب رصيداً لكل عميل ينضم عبرك</p>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/20 p-3 flex gap-2">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">عندما يسجّل شخص باستخدام كودك، تحصل على <strong>50 ريال</strong> رصيداً في محفظتك تلقائياً.</p>
      </div>

      {/* Your code */}
      <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-black dark:text-white">كود الإحالة الخاص بك</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xl font-black tracking-widest text-black dark:text-white bg-black/[0.04] dark:bg-white/[0.04] px-4 py-3 rounded-xl text-center" data-testid="text-referral-code">
            {data?.code || "جارٍ التوليد..."}
          </code>
          <Button size="icon" variant="outline" onClick={copyCode} data-testid="button-copy-referral-code">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-center rounded-xl bg-black/[0.03] dark:bg-white/[0.03] p-3">
            <p className="text-2xl font-black text-black dark:text-white">{data?.referrals?.length || 0}</p>
            <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">إجمالي الإحالات</p>
          </div>
          <div className="text-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{data?.creditsEarned || 0}</p>
            <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">ريال مكتسب</p>
          </div>
        </div>
      </div>

      {/* Apply code */}
      <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 p-5 space-y-3">
        <p className="text-sm font-bold text-black dark:text-white">هل لديك كود إحالة؟</p>
        <p className="text-xs text-black/50 dark:text-white/45">أدخل كود من أحد أصدقائك واحصل على مزايا خاصة.</p>
        <div className="flex gap-2">
          <Input
            value={applyCode}
            onChange={e => setApplyCode(e.target.value.toUpperCase())}
            placeholder="QRX-XXXXXX"
            className="font-mono tracking-widest"
            data-testid="input-apply-code"
          />
          <Button
            onClick={() => applyMutation.mutate(applyCode)}
            disabled={!applyCode.trim() || applyMutation.isPending}
            data-testid="button-apply-referral"
          >
            {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
          </Button>
        </div>
      </div>

      {/* Referral history */}
      {data?.referrals && data.referrals.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-black/40 dark:text-white/40" />
            <span className="text-sm font-bold text-black/60 dark:text-white/55">سجل الإحالات</span>
          </div>
          {data.referrals.map((r: any) => (
            <div key={r._id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]" data-testid={`row-referral-${r._id}`}>
              <div>
                <p className="text-xs font-medium text-black/70 dark:text-white/65">{r.code}</p>
                <p className="text-[10px] text-black/30 dark:text-white/30">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">{r.creditAmount} <SARIcon size={9} className="opacity-70" /></span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor[r.status] || ""}`}>{statusLabel[r.status] || r.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
