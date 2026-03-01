import { useUser } from "@/hooks/use-auth";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Package, Truck, CheckCircle2, Clock, AlertCircle, Loader2,
  DollarSign, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle,
  Wrench, Code2, ShieldCheck, BarChart3, Palette, Upload, ExternalLink,
  FileText, Users, Activity, Wallet, Receipt, Banknote, Target,
  ChevronRight, Star, Zap, Globe
} from "lucide-react";
import { Link } from "wouter";

function fade(delay = 0) {
  return { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay } };
}

// ── DELIVERY DASHBOARD ────────────────────────────────────────────────────────
function DeliveryDashboard() {
  const { toast } = useToast();
  const { data: orders } = useQuery<any[]>({ queryKey: ["/api/admin/orders"] });

  const pending = orders?.filter(o => o.status === "pending") || [];
  const inProgress = orders?.filter(o => o.status === "in_progress") || [];
  const completed = orders?.filter(o => o.status === "completed") || [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "تم تحديث حالة الطلب" });
    },
  });

  const statusStyle: Record<string, string> = {
    pending: "bg-amber-50 border-amber-200 text-amber-700",
    in_progress: "bg-blue-50 border-blue-200 text-blue-700",
    completed: "bg-green-50 border-green-200 text-green-700",
  };

  return (
    <div className="space-y-6">
      <motion.div {...fade(0)} className="bg-black rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black font-heading">لوحة التوصيل والتسليم</h1>
              <p className="text-white/40 text-sm">إدارة طلبات الاستلام والتسليم</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "انتظار الاستلام", val: pending.length, color: "text-amber-400" },
              { label: "جاري التوصيل", val: inProgress.length, color: "text-blue-400" },
              { label: "مُسلّمة اليوم", val: completed.length, color: "text-green-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-3 text-center">
                <p className={`text-2xl font-black ${color}`}>{val}</p>
                <p className="text-white/40 text-[11px] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {[
        { title: "طلبات جديدة — بانتظار الاستلام", items: pending, nextStatus: "in_progress", nextLabel: "ابدأ التوصيل", icon: Package, iconColor: "text-amber-500" },
        { title: "طلبات جاري توصيلها", items: inProgress, nextStatus: "completed", nextLabel: "تم التسليم ✓", icon: Truck, iconColor: "text-blue-500" },
      ].map(({ title, items, nextStatus, nextLabel, icon: Icon, iconColor }, si) => (
        <motion.div key={si} {...fade(0.1 + si * 0.1)}>
          <h2 className="text-sm font-bold text-black/40 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            {title}
            {items.length > 0 && <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">{items.length}</span>}
          </h2>
          {items.length === 0 ? (
            <div className="border border-black/[0.06] rounded-2xl p-8 text-center text-black/30">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">لا توجد طلبات في هذه المرحلة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((order: any) => (
                <div key={order.id} className="border border-black/[0.06] bg-white rounded-2xl p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusStyle[order.status] || ""}`}>
                        {order.status === "pending" ? "انتظار" : "جاري التوصيل"}
                      </span>
                      <span className="text-xs text-black/30 font-mono">#{order.id?.toString().slice(-6)}</span>
                    </div>
                    <p className="font-bold text-black text-sm">{order.projectType || order.sector || "طلب"}</p>
                    {order.clientName && <p className="text-xs text-black/40 mt-0.5">العميل: {order.clientName}</p>}
                    {order.address && <p className="text-xs text-black/30 mt-0.5 flex items-center gap-1"><Globe className="w-3 h-3" />{order.address}</p>}
                  </div>
                  <Button
                    size="sm"
                    className={nextStatus === "completed" ? "bg-green-600 hover:bg-green-700 text-white gap-1.5" : "premium-btn gap-1.5"}
                    onClick={() => updateMutation.mutate({ id: order.id?.toString(), status: nextStatus })}
                    disabled={updateMutation.isPending}
                    data-testid={`button-delivery-${order.id}`}
                  >
                    {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    {nextLabel}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── DEVELOPER DASHBOARD ────────────────────────────────────────────────────────
function DeveloperDashboard() {
  const { data: modRequests } = useQuery<any[]>({ queryKey: ["/api/admin/mod-requests"] });
  const { data: checklist } = useQuery<any>({ queryKey: ["/api/employee/checklist"] });

  const pending = modRequests?.filter(m => m.status === "pending" || m.status === "in_review") || [];
  const inProgress = modRequests?.filter(m => m.status === "in_progress") || [];
  const done = modRequests?.filter(m => m.status === "completed") || [];

  const priorityColor: Record<string, string> = {
    urgent: "bg-red-100 text-red-700", high: "bg-amber-100 text-amber-700",
    medium: "bg-blue-100 text-blue-700", low: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      <motion.div {...fade(0)} className="bg-black rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black font-heading">لوحة المطور</h1>
              <p className="text-white/40 text-sm">مهامك وطلبات التعديل المُعيّنة لك</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "انتظار المراجعة", val: pending.length, color: "text-amber-400" },
              { label: "قيد التنفيذ", val: inProgress.length, color: "text-blue-400" },
              { label: "مكتملة", val: done.length, color: "text-green-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-3 text-center">
                <p className={`text-2xl font-black ${color}`}>{val}</p>
                <p className="text-white/40 text-[11px] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div {...fade(0.1)}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-black/40 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-500" />
            طلبات التعديل المطلوبة
          </h2>
          <Link href="/admin/mod-requests">
            <Button variant="ghost" size="sm" className="text-xs text-black/40 hover:text-black gap-1">
              عرض الكل <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
        {[...pending, ...inProgress].length === 0 ? (
          <div className="border border-black/[0.06] rounded-2xl p-8 text-center text-black/30">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">لا توجد طلبات تعديل معلّقة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...pending, ...inProgress].slice(0, 8).map((mod: any) => (
              <div key={mod.id} className="border border-black/[0.06] bg-white rounded-2xl p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityColor[mod.priority] || "bg-gray-100 text-gray-600"}`}>
                      {mod.priority === "urgent" ? "عاجل" : mod.priority === "high" ? "عالي" : mod.priority === "medium" ? "متوسط" : "منخفض"}
                    </span>
                    <span className="text-[10px] text-black/30 font-mono">#{mod.id?.toString().slice(-5)}</span>
                  </div>
                  <p className="font-semibold text-black text-sm">{mod.title || "طلب تعديل"}</p>
                  <p className="text-xs text-black/40 mt-0.5 line-clamp-2">{mod.description}</p>
                </div>
                <Link href="/admin/mod-requests">
                  <Button size="sm" variant="outline" className="shrink-0 text-xs gap-1 border-black/10">
                    فتح <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div {...fade(0.2)}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-black/40 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            قائمة مهامي اليومية
          </h2>
          <Link href="/employee/checklist">
            <Button variant="ghost" size="sm" className="text-xs text-black/40 hover:text-black gap-1">
              إدارة <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
        <div className="border border-black/[0.06] bg-white rounded-2xl p-4">
          <p className="text-sm text-black/40 text-center">
            <Link href="/employee/checklist" className="text-blue-600 hover:underline">افتح قائمة المهام</Link> لإدارة مهامك اليومية والتقنية
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── ACCOUNTANT / ERP DASHBOARD ────────────────────────────────────────────────
function AccountantDashboard() {
  const { data: finance } = useQuery<any>({ queryKey: ["/api/admin/finance"] });
  const { data: invoices } = useQuery<any[]>({ queryKey: ["/api/admin/invoices"] });
  const { data: receipts } = useQuery<any[]>({ queryKey: ["/api/admin/receipts"] });

  const totalRevenue = receipts?.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0) || 0;
  const totalPending = invoices?.filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + (Number(i.totalAmount) || 0), 0) || 0;
  const paidInvoices = invoices?.filter((i: any) => i.status === "paid").length || 0;
  const unpaidInvoices = invoices?.filter((i: any) => i.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <motion.div {...fade(0)} className="bg-black rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black font-heading">نظام ERP المالي</h1>
              <p className="text-white/40 text-sm">إدارة الإيرادات والمصروفات والتحصيل</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-2xl p-4">
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1"><ArrowDownCircle className="w-3 h-3 text-green-400" />إجمالي الإيرادات</p>
              <p className="text-2xl font-black text-green-400">{totalRevenue.toLocaleString("ar-SA")} <span className="text-sm font-normal text-white/40">ر.س</span></p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4">
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1"><ArrowUpCircle className="w-3 h-3 text-red-400" />مستحقات غير محصّلة</p>
              <p className="text-2xl font-black text-red-400">{totalPending.toLocaleString("ar-SA")} <span className="text-sm font-normal text-white/40">ر.س</span></p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: "فواتير مسددة", val: paidInvoices, color: "text-green-500", bg: "bg-green-50" },
          { icon: AlertCircle, label: "فواتير معلّقة", val: unpaidInvoices, color: "text-red-500", bg: "bg-red-50" },
          { icon: Receipt, label: "إجمالي الوصولات", val: receipts?.length || 0, color: "text-blue-500", bg: "bg-blue-50" },
          { icon: Wallet, label: "رصيد الخزينة", val: `${(totalRevenue - totalPending).toLocaleString("ar-SA")} ر.س`, color: "text-purple-500", bg: "bg-purple-50" },
        ].map(({ icon: Icon, label, val, color, bg }, i) => (
          <motion.div key={i} {...fade(0.1 + i * 0.05)}>
            <Card className="border border-black/[0.06] shadow-none">
              <CardContent className="p-4">
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${color}`} />
                </div>
                <p className="text-xl font-black text-black">{val}</p>
                <p className="text-xs text-black/40 mt-0.5">{label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div {...fade(0.25)}>
          <Card className="border border-black/[0.06] shadow-none">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                آخر الفواتير المعلّقة
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {invoices?.filter((i: any) => i.status === "pending").slice(0, 5).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-2.5 border-b border-black/[0.04] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-black">{inv.clientName || "عميل"}</p>
                    <p className="text-[11px] text-black/30">فاتورة #{inv.id?.toString().slice(-5)}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">{Number(inv.totalAmount || 0).toLocaleString("ar-SA")} ر.س</span>
                </div>
              ))}
              {(!invoices || invoices.filter((i: any) => i.status === "pending").length === 0) && (
                <p className="text-center text-black/30 text-sm py-4">لا توجد فواتير معلّقة</p>
              )}
              <Link href="/admin/invoices">
                <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-black/40 hover:text-black gap-1">
                  عرض كل الفواتير <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade(0.3)}>
          <Card className="border border-black/[0.06] shadow-none">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-black flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                آخر الوصولات المحصّلة
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {receipts?.slice(0, 5).map((rec: any) => (
                <div key={rec.id} className="flex items-center justify-between py-2.5 border-b border-black/[0.04] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-black">{rec.clientName || "عميل"}</p>
                    <p className="text-[11px] text-black/30">وصل #{rec.id?.toString().slice(-5)}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">+{Number(rec.amount || 0).toLocaleString("ar-SA")} ر.س</span>
                </div>
              ))}
              {(!receipts || receipts.length === 0) && (
                <p className="text-center text-black/30 text-sm py-4">لا توجد وصولات بعد</p>
              )}
              <Link href="/admin/receipts">
                <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-black/40 hover:text-black gap-1">
                  عرض كل الوصولات <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div {...fade(0.35)}>
        <div className="flex gap-3 flex-wrap">
          <Link href="/admin/finance"><Button className="premium-btn gap-2"><Wallet className="w-4 h-4" />لوحة المالية الكاملة</Button></Link>
          <Link href="/admin/payroll"><Button variant="outline" className="gap-2 border-black/10"><Banknote className="w-4 h-4" />كشف الرواتب</Button></Link>
          <Link href="/admin/invoices"><Button variant="outline" className="gap-2 border-black/10"><FileText className="w-4 h-4" />الفواتير</Button></Link>
        </div>
      </motion.div>
    </div>
  );
}

// ── SALES DASHBOARD ────────────────────────────────────────────────────────────
function SalesDashboard() {
  const { data: orders } = useQuery<any[]>({ queryKey: ["/api/admin/orders"] });
  const { data: customers } = useQuery<any[]>({ queryKey: ["/api/admin/customers"] });

  const newOrders = orders?.filter(o => o.status === "pending").length || 0;
  const thisMonthOrders = orders?.filter((o: any) => {
    const d = new Date(o.createdAt || o.appliedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length || 0;

  return (
    <div className="space-y-6">
      <motion.div {...fade(0)} className="bg-black rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black font-heading">لوحة المبيعات والتسويق</h1>
              <p className="text-white/40 text-sm">متابعة الطلبات والعملاء والمواد التسويقية</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "طلبات جديدة", val: newOrders, color: "text-amber-400" },
              { label: "طلبات الشهر", val: thisMonthOrders, color: "text-blue-400" },
              { label: "إجمالي العملاء", val: customers?.length || 0, color: "text-green-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white/5 rounded-2xl p-3 text-center">
                <p className={`text-2xl font-black ${color}`}>{val}</p>
                <p className="text-white/40 text-[11px] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div {...fade(0.1)}>
          <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <Link href="/sales/marketing">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Palette className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-black">أدوات التسويق والبوسترات</p>
                    <p className="text-xs text-black/40 mt-0.5">تصميم ورفع المواد التسويقية</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-black/20 mr-auto" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade(0.15)}>
          <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <Link href="/admin/customers">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-black">إدارة العملاء</p>
                    <p className="text-xs text-black/40 mt-0.5">قاعدة بيانات العملاء والمتابعة</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-black/20 mr-auto" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade(0.2)}>
          <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <Link href="/employee/new-order">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-black">إضافة عميل وطلب جديد</p>
                    <p className="text-xs text-black/40 mt-0.5">تسجيل عميل وإنشاء طلب مباشرة</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-black/20 mr-auto" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade(0.25)}>
          <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <Link href="/admin/orders">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-black">متابعة الطلبات</p>
                    <p className="text-xs text-black/40 mt-0.5">حالة الطلبات والمراحل</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-black/20 mr-auto" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function EmployeeRoleDashboard() {
  const { data: user } = useUser();

  if (!user) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin w-8 h-8 text-black/40" /></div>;
  }

  const roleToComponent: Record<string, JSX.Element> = {
    merchant: <DeliveryDashboard />,
    developer: <DeveloperDashboard />,
    designer: <DeveloperDashboard />,
    accountant: <AccountantDashboard />,
    sales: <SalesDashboard />,
    sales_manager: <SalesDashboard />,
  };

  const roleDashboard = roleToComponent[user.role];

  if (!roleDashboard) {
    return (
      <div className="text-center py-12 text-black/40">
        <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="font-medium">هذا الدور ليس له لوحة متخصصة بعد</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <PageGraphics variant="dashboard" />
      {roleDashboard}
    </div>
  );
}
