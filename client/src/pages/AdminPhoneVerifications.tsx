import { useUser } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone, CheckCircle2, X, Loader2, User, Clock,
  ShieldCheck, ArrowRight, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function AdminPhoneVerifications() {
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/phone-verifications"],
    refetchInterval: 15000,
  });

  const resolveMutation = useMutation({
    mutationFn: (token: string) => apiRequest("POST", `/api/admin/phone-verifications/${token}/resolve`, {}).then(r => r.json()),
    onSuccess: () => {
      toast({ title: L ? "✅ تم توثيق رقم الجوال بنجاح!" : "✅ Phone number verified successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-verifications"] });
    },
    onError: (e: any) => toast({ title: e?.message || (L ? "فشل التوثيق" : "Verification failed"), variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: (token: string) => apiRequest("POST", `/api/admin/phone-verifications/${token}/cancel`, {}).then(r => r.json()),
    onSuccess: () => {
      toast({ title: L ? "تم إلغاء الطلب" : "Request cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-verifications"] });
    },
    onError: (e: any) => toast({ title: e?.message || (L ? "فشل الإلغاء" : "Cancellation failed"), variant: "destructive" }),
  });

  const role = (user as any)?.role;
  if (!["admin", "manager", "employee"].includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <div className="text-center"><p className="text-black/50">{L ? "غير مصرح لك" : "Unauthorized"}</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]" dir={dir}>
      {/* Header */}
      <div className="bg-white border-b border-black/[0.06] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="w-9 h-9 rounded-xl border border-black/[0.07] flex items-center justify-center hover:bg-gray-50">
            <ArrowRight className="w-4 h-4 text-black/50" />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-black text-lg">{L ? "طلبات توثيق الجوال" : "Phone Verification Requests"}</h1>
            <p className="text-black/40 text-xs">{L ? "توثيق أرقام جوال العملاء عبر الاتصال" : "Verify client phone numbers via call"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> {L ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-black/20" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/[0.06] p-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="font-black text-black text-lg mb-1">{L ? "لا يوجد طلبات معلقة" : "No pending requests"}</h2>
            <p className="text-black/40 text-sm">{L ? "جميع طلبات توثيق الجوال تمت معالجتها" : "All phone verification requests have been processed"}</p>
          </div>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 font-medium">
              {L ? `يوجد ${requests.length} طلب ${requests.length === 1 ? "معلق" : "معلقة"} — اتصل بالعميل وتحقق من هويته ثم اضغط "تأكيد التوثيق"` : `There are ${requests.length} pending request${requests.length === 1 ? "" : "s"} — call the client, verify identity, then click "Confirm Verification"`}
            </div>
            {requests.map((req: any, i: number) => (
              <motion.div key={req._id || req.token} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      {req.userId?.avatarUrl
                        ? <img src={req.userId.avatarUrl} className="w-11 h-11 rounded-xl object-cover" alt="" />
                        : <User className="w-5 h-5 text-emerald-700" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-black text-sm">{req.userId?.fullName || req.userId?.username || "—"}</p>
                      <p className="text-black/40 text-xs">{req.userId?.email || "—"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1">
                          <Phone className="w-3.5 h-3.5 text-black/40" />
                          <span className="font-mono font-bold text-sm text-black" dir="ltr">{req.phone}</span>
                        </div>
                        <Badge className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(req.createdAt).toLocaleTimeString(L ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-black/[0.04] px-4 py-3 bg-gray-50/50 flex items-center gap-2">
                  <div className="text-xs text-black/30 flex-1 font-mono">{req.token}</div>
                  <Button
                    size="sm"
                    onClick={() => cancelMutation.mutate(req.token)}
                    disabled={cancelMutation.isPending}
                    variant="outline"
                    className="rounded-xl h-9 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                    data-testid={`btn-cancel-${req.token}`}
                  >
                    <X className="w-3.5 h-3.5" /> {L ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => resolveMutation.mutate(req.token)}
                    disabled={resolveMutation.isPending}
                    className="rounded-xl h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                    data-testid={`btn-resolve-${req.token}`}
                  >
                    {resolveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> {L ? "تأكيد التوثيق" : "Confirm Verification"}</>}
                  </Button>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
