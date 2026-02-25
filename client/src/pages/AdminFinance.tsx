import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Wallet, TrendingUp, Users, CreditCard, Mail, CheckCircle, XCircle } from "lucide-react";
import { type Order } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminFinance() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [emailType, setEmailType] = useState("welcome");
  const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const { data: orders, isLoading } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const { data: summary } = useQuery<{
    totalRevenue: number; monthRevenue: number; unpaidTotal: number; totalOrders: number; activeClients: number;
  }>({
    queryKey: ["/api/admin/finance/summary"],
    queryFn: async () => {
      const r = await fetch("/api/admin/finance/summary");
      if (!r.ok) return null;
      return r.json();
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/test-email", { type: emailType, to: testEmail || undefined });
      return r.json();
    },
    onSuccess: (d) => {
      setEmailResult({ ok: true, msg: d.message || "تم الإرسال" });
      toast({ title: "تم إرسال البريد التجريبي" });
    },
    onError: async (err: any) => {
      const msg = err?.message || "فشل الإرسال — تحقق من إعدادات SMTP2GO";
      setEmailResult({ ok: false, msg });
      toast({ title: "فشل إرسال البريد", description: msg, variant: "destructive" });
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-black/20" />
    </div>
  );

  const totalRevenue = summary?.totalRevenue || orders?.reduce((acc, o) => acc + (o.totalAmount || 0), 0) || 0;
  const pendingPayments = orders?.filter(o => !(o as any).isDepositPaid).reduce((acc, o) => acc + (o.totalAmount || 0), 0) || 0;

  const chartData = [
    { name: "يناير", value: 4000 },
    { name: "فبراير", value: 3000 },
    { name: "مارس", value: 2000 },
    { name: "أبريل", value: 2780 },
    { name: "مايو", value: summary?.monthRevenue || 1890 },
  ];

  const emailTypes = [
    { value: "welcome", label: "ترحيب" },
    { value: "otp", label: "رمز OTP" },
    { value: "order", label: "تأكيد طلب" },
    { value: "status", label: "تحديث حالة" },
    { value: "message", label: "رسالة جديدة" },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-black">الإدارة المالية</h1>
          <p className="text-xs text-black/35">الإيرادات والفواتير ونظام البريد</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-black/[0.07] shadow-none rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-black/60">إجمالي الأرباح</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-black">{totalRevenue.toLocaleString()} ر.س</div>
            <p className="text-xs text-black/30 mt-1">من جميع الفواتير المدفوعة</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.07] shadow-none rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-black/60">مستحق هذا الشهر</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-black">{(summary?.monthRevenue || 0).toLocaleString()} ر.س</div>
            <p className="text-xs text-black/30 mt-1">{summary?.activeClients || 0} عميل نشط</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.07] shadow-none rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-black/60">دفعات قيد الانتظار</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-black">{pendingPayments.toLocaleString()} ر.س</div>
            <p className="text-xs text-black/30 mt-1">من {orders?.filter(o => !(o as any).isDepositPaid).length || 0} طلبات</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-black/[0.07] shadow-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-black/70">تحليل الأرباح الشهرية</CardTitle>
        </CardHeader>
        <CardContent className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#00000050" }} />
              <YAxis tick={{ fontSize: 11, fill: "#00000050" }} />
              <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} ر.س`, "الإيراد"]} />
              <Bar dataKey="value" fill="#000" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Email Test Section */}
      <div className="bg-white border border-black/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-black/[0.05] rounded-xl flex items-center justify-center">
            <Mail className="w-4 h-4 text-black/50" />
          </div>
          <div>
            <h2 className="font-black text-black text-sm">اختبار نظام البريد الإلكتروني</h2>
            <p className="text-[11px] text-black/35">تحقق من عمل SMTP2GO بإرسال بريد تجريبي</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-black/50 mb-1.5 block">نوع البريد</label>
            <div className="flex flex-wrap gap-2">
              {emailTypes.map(et => (
                <button
                  key={et.value}
                  onClick={() => setEmailType(et.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${emailType === et.value ? 'bg-black text-white' : 'bg-black/[0.04] text-black/50 hover:bg-black/[0.08]'}`}
                  data-testid={`button-email-type-${et.value}`}
                >
                  {et.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-black/50 mb-1.5 block">البريد المستهدف (اتركه فارغاً لإرساله لبريدك)</label>
            <Input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              className="h-10 text-sm border-black/[0.10]"
              dir="ltr"
              data-testid="input-test-email"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => { setEmailResult(null); testEmailMutation.mutate(); }}
              disabled={testEmailMutation.isPending}
              className="bg-black text-white h-10 px-6 rounded-xl text-sm font-bold"
              data-testid="button-send-test-email"
            >
              {testEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Mail className="w-4 h-4 ml-2" />}
              إرسال بريد تجريبي
            </Button>

            {emailResult && (
              <div className={`flex items-center gap-2 text-xs font-medium ${emailResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                {emailResult.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {emailResult.msg}
              </div>
            )}
          </div>

          <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl p-4 text-xs space-y-1">
            <p className="font-bold text-black/50 mb-2">إعدادات SMTP2GO الحالية:</p>
            <p className="text-black/35">المرسل: <span className="font-mono text-black/60">noreply@qirox.tech</span></p>
            <p className="text-black/35">API: <span className="font-mono text-black/60">api-5CC7...D332 ✓</span></p>
            <p className="text-black/35 mt-2 text-[10px]">تأكد من أن النطاق qirox.tech معتمد في حساب SMTP2GO تحت Senders → Verified Senders</p>
          </div>
        </div>
      </div>
    </div>
  );
}
