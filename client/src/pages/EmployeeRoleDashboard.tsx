import SARIcon from "@/components/SARIcon";
import { useUser } from "@/hooks/use-auth";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { AIPanel } from "@/components/QiroxAI";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
  ChevronRight, Star, Zap, Globe, Wand2, Video, Calendar, KeyRound,
  ShoppingCart, Phone, MessageCircle, ChevronDown, ChevronUp
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
            <div className="flex-1">
              <h1 className="text-xl font-black font-heading">لوحة التوصيل والتسليم</h1>
              <p className="text-white/40 text-sm">إدارة طلبات الاستلام والتسليم</p>
            </div>
            <Link href="/employee/new-order">
              <button className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors" data-testid="btn-delivery-new-order">
                <Package className="w-3.5 h-3.5" />
                طلب جديد
              </button>
            </Link>
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
  const { data: modRequests } = useQuery<any[]>({ queryKey: ["/api/modification-requests"] });
  const { data: checklist } = useQuery<any>({ queryKey: ["/api/checklist"] });

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
  const { data: finance } = useQuery<any>({ queryKey: ["/api/admin/finance/summary"] });
  const { data: invoices } = useQuery<any[]>({ queryKey: ["/api/invoices"] });
  const { data: receipts } = useQuery<any[]>({ queryKey: ["/api/receipts"] });

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
              <p className="text-2xl font-black text-green-400 flex items-center gap-1">{totalRevenue.toLocaleString("ar-SA")} <SARIcon size={14} className="opacity-40" /></p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4">
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1"><ArrowUpCircle className="w-3 h-3 text-red-400" />مستحقات غير محصّلة</p>
              <p className="text-2xl font-black text-red-400 flex items-center gap-1">{totalPending.toLocaleString("ar-SA")} <SARIcon size={14} className="opacity-40" /></p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: "فواتير مسددة", val: paidInvoices, color: "text-green-500", bg: "bg-green-50" },
          { icon: AlertCircle, label: "فواتير معلّقة", val: unpaidInvoices, color: "text-red-500", bg: "bg-red-50" },
          { icon: Receipt, label: "إجمالي الوصولات", val: receipts?.length || 0, color: "text-blue-500", bg: "bg-blue-50" },
          { icon: Wallet, label: "رصيد الخزينة", val: (totalRevenue - totalPending).toLocaleString("ar-SA"), sarVal: true, color: "text-purple-500", bg: "bg-purple-50" },
        ].map(({ icon: Icon, label, val, sarVal, color, bg }, i) => (
          <motion.div key={i} {...fade(0.1 + i * 0.05)}>
            <Card className="border border-black/[0.06] shadow-none">
              <CardContent className="p-4">
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${color}`} />
                </div>
                <p className="text-xl font-black text-black flex items-center gap-1">{val}{sarVal && <SARIcon size={12} className="opacity-50" />}</p>
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
                  <span className="text-sm font-bold text-red-600 flex items-center gap-0.5">{Number(inv.totalAmount || 0).toLocaleString("ar-SA")} <SARIcon size={9} className="opacity-60" /></span>
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
                  <span className="text-sm font-bold text-green-600 flex items-center gap-0.5">+{Number(rec.amount || 0).toLocaleString("ar-SA")} <SARIcon size={9} className="opacity-60" /></span>
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
    if (o.status === "cancelled" || o.status === "rejected") return false;
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

        <motion.div {...fade(0.3)}>
          <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <Link href="/employee/subscriptions">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-bold text-black">اشتراكات العملاء</p>
                    <p className="text-xs text-black/40 mt-0.5">تفعيل وإدارة اشتراكات العملاء</p>
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

// ── UPCOMING MEETINGS WIDGET ───────────────────────────────────────────────────
function UpcomingMeetingsWidget() {
  const { data: meetings = [] } = useQuery<any[]>({
    queryKey: ["/api/qmeet/upcoming"],
    refetchInterval: 60000,
  });

  if (meetings.length === 0) return null;

  return (
    <motion.div {...fade(0.15)} className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-xl flex items-center justify-center">
            <Video className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-black dark:text-white">اجتماعاتك القادمة</h2>
          <span className="text-[11px] text-black/30 dark:text-white/30 font-medium">{meetings.length} اجتماع</span>
        </div>
        <a href="/meet/join" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 border border-violet-200 dark:border-violet-700/50 px-3 py-1.5 rounded-xl transition-colors" data-testid="employee-join-meeting-btn">
          <KeyRound className="w-3.5 h-3.5" />
          انضم بكود
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {meetings.map((m: any) => {
          const scheduledDate = new Date(m.scheduledAt);
          const isLive = m.status === "live";
          const dateStr = scheduledDate.toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" });
          const timeStr = scheduledDate.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={m._id} data-testid={`employee-card-meeting-${m._id}`} className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:shadow-md ${isLive ? "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-700" : "bg-white dark:bg-gray-900 border-black/[0.06] dark:border-white/[0.08]"}`}>
              {isLive && (
                <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-100 dark:bg-violet-900/60 dark:text-violet-300 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                  مباشر الآن
                </span>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isLive ? "bg-violet-600" : "bg-black/[0.06] dark:bg-white/[0.08]"}`}>
                  <Video className={`w-4 h-4 ${isLive ? "text-white" : "text-black/50 dark:text-white/50"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-black dark:text-white truncate">{m.title}</p>
                  <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{m.hostName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-3 h-3 text-black/30 dark:text-white/30 flex-shrink-0" />
                <span className="text-[11px] text-black/50 dark:text-white/50">{dateStr} — {timeStr}</span>
              </div>
              <button onClick={() => window.open(m.meetingLink, "_blank")} className={`w-full flex items-center justify-center gap-1.5 rounded-xl h-8 text-xs font-bold transition-colors ${isLive ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-black hover:bg-black/80 text-white"}`} data-testid={`employee-join-meeting-btn-${m._id}`}>
                <Video className="w-3 h-3" />
                {isLive ? "انضم الآن" : "انضم للاجتماع"}
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── ABANDONED CARTS WIDGET ──────────────────────────────────────────────────────
function AbandonedCartsWidget() {
  const { data: carts, isLoading } = useQuery<any[]>({ queryKey: ["/api/employee/abandoned-carts"] });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const typeLabel: Record<string, string> = {
    service: "خدمة", product: "منتج", domain: "دومين",
    email: "بريد", hosting: "استضافة", gift: "هدية", plan: "باقة",
  };

  if (isLoading) {
    return (
      <motion.div {...fade(0.2)} className="mt-6">
        <Card className="border border-black/[0.06] shadow-none">
          <CardContent className="p-5 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-black/30" />
            <span className="text-sm text-black/40">جارٍ تحميل العربات...</span>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!carts || carts.length === 0) return null;

  return (
    <motion.div {...fade(0.2)} className="mt-6">
      <Card className="border border-black/[0.06] shadow-none">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-black dark:text-white">عربات التسوق المهجورة</CardTitle>
              <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{carts.length} عميل لديه منتجات في العربة</p>
            </div>
            <Badge className="mr-auto bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0">
              {carts.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          {carts.map((cart: any) => {
            const isExpanded = expandedId === cart.cartId;
            const phone = cart.client.whatsapp || cart.client.phone;
            const phoneClean = phone?.replace(/\D/g, "");
            const waLink = phoneClean ? `https://wa.me/${phoneClean.startsWith("0") ? "966" + phoneClean.slice(1) : phoneClean}` : null;
            const telLink = phoneClean ? `tel:${phone}` : null;
            const timeAgo = (() => {
              const diff = Date.now() - new Date(cart.updatedAt).getTime();
              const hrs = Math.floor(diff / 3600000);
              const days = Math.floor(hrs / 24);
              if (days > 0) return `منذ ${days} يوم`;
              if (hrs > 0) return `منذ ${hrs} ساعة`;
              return "منذ قليل";
            })();
            return (
              <div key={cart.cartId} data-testid={`abandoned-cart-${cart.cartId}`} className="border border-black/[0.06] dark:border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-black/40 dark:text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-black dark:text-white truncate">{cart.client.name}</p>
                    <p className="text-[11px] text-black/40 dark:text-white/40">{cart.itemsCount} منتج · {cart.total.toFixed(0)} ر.س · {timeAgo}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" data-testid={`wa-btn-${cart.cartId}`}
                        className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center hover:bg-green-200 transition-colors" title="واتساب">
                        <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </a>
                    )}
                    {telLink && (
                      <a href={telLink} data-testid={`tel-btn-${cart.cartId}`}
                        className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors" title="اتصل">
                        <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </a>
                    )}
                    {!phone && (
                      <span className="text-[11px] text-black/30 dark:text-white/30 px-1">لا يوجد رقم</span>
                    )}
                    <button onClick={() => setExpandedId(isExpanded ? null : cart.cartId)} data-testid={`expand-cart-${cart.cartId}`}
                      className="w-8 h-8 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl flex items-center justify-center hover:bg-black/[0.08] transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-black/40 dark:text-white/40" /> : <ChevronDown className="w-4 h-4 text-black/40 dark:text-white/40" />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] px-4 py-3 space-y-2">
                    {cart.client.email && (
                      <p className="text-[11px] text-black/40 dark:text-white/40">📧 {cart.client.email}</p>
                    )}
                    {cart.client.phone && (
                      <p className="text-[11px] text-black/40 dark:text-white/40">📞 {cart.client.phone}</p>
                    )}
                    <div className="mt-2 space-y-1.5">
                      {cart.items.map((item: any) => (
                        <div key={item._id} className="flex items-center gap-2">
                          {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-black dark:text-white truncate">{item.name}</p>
                          </div>
                          <span className="text-[11px] text-black/40 dark:text-white/40 flex-shrink-0">{(item.price * item.qty).toFixed(0)} ر.س</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 flex-shrink-0">{typeLabel[item.type] || item.type}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.06]">
                      <span className="text-xs text-black/40 dark:text-white/40">الإجمالي</span>
                      <span className="text-sm font-bold text-black dark:text-white flex items-center gap-1">
                        {cart.total.toFixed(2)} <SARIcon className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
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
      <AbandonedCartsWidget />
      <UpcomingMeetingsWidget />
      <motion.div {...fade(0.3)} className="mt-4">
        <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all cursor-pointer group">
          <CardContent className="p-5">
            <Link href="/my-tools">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wand2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-bold text-black dark:text-white">أدواتي ومميزاتي ⚡</p>
                  <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">أدوات PDF والتقنية والاختصارات المتاحة لك</p>
                </div>
                <ChevronRight className="w-4 h-4 text-black/20 dark:text-white/20 mr-auto" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── QIROX AI Assistant ── */}
      <motion.div {...fade(0.4)} className="mt-4">
        <AIPanel className="h-[460px]" />
      </motion.div>
    </div>
  );
}
