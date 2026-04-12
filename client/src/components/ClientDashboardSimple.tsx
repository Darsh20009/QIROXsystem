import { useState, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import SARIcon from "@/components/SARIcon";
import {
  Clock, CheckCircle2, AlertCircle, Activity, Plus,
  MessageSquare, Upload, FileText, ChevronRight,
  Package, Sparkles, Phone, Loader2, ArrowUpRight,
  Building2, Headphones, Star, Check, CreditCard,
  RefreshCw, ShoppingBag
} from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 17) return "مساء الخير";
  return "مساء النور";
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:     { label: "قيد المراجعة",  color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200", icon: Clock },
  approved:    { label: "تمت الموافقة",  color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",  icon: CheckCircle2 },
  in_progress: { label: "قيد التنفيذ",  color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", icon: Activity },
  completed:   { label: "مكتمل ✓",       color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200", icon: CheckCircle2 },
  rejected:    { label: "مرفوض",         color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",   icon: AlertCircle },
  cancelled:   { label: "ملغي",          color: "text-gray-500",   bg: "bg-gray-50",   border: "border-gray-200",  icon: AlertCircle },
};

const PROJECT_PHASES = [
  { label: "التخطيط",  min: 0  },
  { label: "التصميم",  min: 25 },
  { label: "التطوير",  min: 50 },
  { label: "الاختبار", min: 75 },
  { label: "التسليم",  min: 100 },
];

function getPhaseLabel(progress: number) {
  if (progress >= 100) return PROJECT_PHASES[4].label;
  const phase = [...PROJECT_PHASES].reverse().find(p => progress >= p.min);
  return phase?.label || "التخطيط";
}

interface Props {
  user: any;
}

export default function ClientDashboardSimple({ user }: Props) {
  const { toast } = useToast();
  const proofRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "orders">("projects");

  const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });
  const { data: projects = [], isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });
  const { data: walletData } = useQuery<any>({ queryKey: ["/api/wallet"] });

  const uploadProof = useMutation({
    mutationFn: async ({ orderId, file }: { orderId: string; file: File }) => {
      const fd = new FormData(); fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (!up.ok) throw new Error("فشل رفع الملف");
      const { url } = await up.json();
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/proof`, { paymentProofUrl: url });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setUploadingFor(null);
      toast({ title: "✅ تم رفع سند التحويل — سيراجعه الفريق قريباً" });
    },
    onError: () => toast({ title: "فشل رفع السند، حاول مجدداً", variant: "destructive" }),
  });

  const activeProjects = (projects as any[]).filter((p: any) => p.status !== "completed" && p.status !== "closed");
  const pendingBankOrders = (orders as any[]).filter((o: any) =>
    (o.paymentMethod === "bank_transfer" || o.paymentMethod === "bank") &&
    !o.paymentProofUrl && o.status === "pending"
  );
  const walletBalance = walletData ? Math.max(0, (walletData.totalCredit || 0) - (walletData.totalDebit || 0)) : 0;
  const firstName = (user.fullName || user.username || "").split(" ")[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">

      {/* ── Hero Banner ── */}
      <div className="bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent" />

        <div className="max-w-3xl mx-auto px-4 pt-8 pb-16 relative">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-white/40 text-sm mb-1">{getGreeting()}،</p>
            <h1 className="text-3xl font-black text-white mb-4" data-testid="text-client-greeting">{firstName}</h1>

            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/prices">
                <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-full h-10 px-5 font-bold gap-2 shadow-lg border-0" data-testid="button-new-order">
                  <Plus className="w-4 h-4" /> طلب جديد
                </Button>
              </Link>
              <Link href="/cs-chat">
                <Button size="sm" variant="outline" className="rounded-full h-10 px-4 border-white/20 text-white/70 bg-white/[0.07] hover:bg-white/[0.14] hover:text-white gap-2">
                  <MessageSquare className="w-3.5 h-3.5" /> تواصل معنا
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">

        {/* ── Urgent: Pending Bank Transfer ── */}
        <AnimatePresence>
          {pendingBankOrders.map((order: any) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-4"
              data-testid={`banner-pending-transfer-${order.id}`}
            >
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900 text-sm">في انتظار سند التحويل</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  طلب #{order.id?.slice(-6) || "—"} · {Number(order.totalAmount || 0).toLocaleString()} ر.س
                </p>
                <p className="text-amber-600 text-[11px] mt-1">ارفع صورة إيصال التحويل البنكي لتأكيد طلبك</p>
              </div>
              <input
                ref={proofRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f || !uploadingFor) return;
                  uploadProof.mutate({ orderId: uploadingFor, file: f });
                }}
              />
              <Button
                size="sm"
                onClick={() => { setUploadingFor(order.id); proofRef.current?.click(); }}
                disabled={uploadProof.isPending && uploadingFor === order.id}
                className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 h-9 px-3"
                data-testid={`button-upload-proof-${order.id}`}
              >
                {uploadProof.isPending && uploadingFor === order.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Upload className="w-3.5 h-3.5" />
                }
                رفع الإيصال
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "طلباتي", value: (orders as any[]).length, color: "text-blue-600", bg: "bg-blue-50", icon: FileText },
            { label: "مشاريع نشطة", value: activeProjects.length, color: "text-violet-600", bg: "bg-violet-50", icon: Activity },
            { label: "رصيد المحفظة", value: walletBalance > 0 ? `${walletBalance.toLocaleString()} ر.س` : "0", color: "text-green-600", bg: "bg-green-50", icon: CreditCard },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-4 text-center">
                <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium mt-0.5">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs: Projects / Orders ── */}
        <div className="mt-6">
          <div className="flex bg-gray-100 dark:bg-white/[0.05] rounded-2xl p-1 mb-4">
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "projects" ? "bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500"}`}
              data-testid="tab-projects"
            >
              مشاريعي
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "orders" ? "bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500"}`}
              data-testid="tab-orders"
            >
              طلباتي
            </button>
          </div>

          {/* ── PROJECTS TAB ── */}
          {activeTab === "projects" && (
            <AnimatePresence mode="wait">
              <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {projectsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                ) : activeProjects.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-10 text-center">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Package className="w-7 h-7 text-gray-300 dark:text-slate-600" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">لا توجد مشاريع نشطة</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500 mb-5">ابدأ بطلب جديد وسيبدأ فريقنا في التنفيذ</p>
                    <Link href="/prices">
                      <Button className="gap-2 rounded-xl font-bold" data-testid="button-start-project">
                        <Sparkles className="w-4 h-4" /> ابدأ مشروعك
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeProjects.map((project: any) => {
                      const progress = Number(project.progress || 0);
                      const phaseLabel = getPhaseLabel(progress);
                      return (
                        <motion.div
                          key={project.id || project._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden"
                          data-testid={`card-project-${project.id}`}
                        >
                          {/* Progress bar at top */}
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                              style={{ width: `${Math.max(3, progress)}%` }}
                            />
                          </div>

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-gray-900 dark:text-white text-base truncate">
                                  {project.name || project.projectType || "مشروعي"}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                  {project.businessName || project.sector || ""}
                                </p>
                              </div>
                              <div className="shrink-0 text-left">
                                <span className="text-2xl font-black text-blue-600">{progress}%</span>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center">{phaseLabel}</p>
                              </div>
                            </div>

                            {/* Phases visual */}
                            <div className="flex items-center gap-1 mb-4">
                              {PROJECT_PHASES.filter(p => p.min < 100).map((phase, i) => {
                                const done = progress > phase.min + 24;
                                const active = progress >= phase.min && progress <= phase.min + 24;
                                return (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className={`w-full h-1.5 rounded-full transition-all ${done ? "bg-blue-500" : active ? "bg-blue-300" : "bg-gray-100 dark:bg-gray-800"}`} />
                                    <span className={`text-[9px] font-bold ${done || active ? "text-blue-500" : "text-gray-300 dark:text-slate-600"}`}>{phase.label}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Notes from team */}
                            {project.adminNotes && (
                              <div className="bg-blue-50 dark:bg-blue-500/[0.08] border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-3 mb-4">
                                <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">آخر تحديث من الفريق</p>
                                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{project.adminNotes}</p>
                              </div>
                            )}

                            {/* Delivery links */}
                            {(project.liveUrl || project.githubUrl) && (
                              <div className="flex gap-2 mb-4">
                                {project.liveUrl && (
                                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-xs font-bold text-green-700 dark:text-green-400 hover:bg-green-100 transition-colors"
                                    data-testid={`link-live-${project.id}`}
                                  >
                                    <ArrowUpRight className="w-3 h-3" /> رابط المشروع
                                  </a>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Link href={`/projects/${project.id || project._id}`} className="flex-1">
                                <button className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.07] rounded-xl transition-all"
                                  data-testid={`button-view-project-${project.id}`}
                                >
                                  <span className="text-sm font-bold text-gray-700 dark:text-slate-300">تفاصيل المشروع</span>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                              </Link>
                              <Link href="/cs-chat">
                                <button className="px-3 py-2.5 bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 rounded-xl transition-all" title="تواصل مع الفريق">
                                  <MessageSquare className="w-4 h-4 text-gray-400" />
                                </button>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── ORDERS TAB ── */}
          {activeTab === "orders" && (
            <AnimatePresence mode="wait">
              <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {ordersLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                ) : (orders as any[]).length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-10 text-center">
                    <ShoppingBag className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                    <p className="font-bold text-gray-900 dark:text-white mb-1">لا توجد طلبات بعد</p>
                    <p className="text-sm text-gray-400 dark:text-slate-500">ابدأ بتصفح باقاتنا</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(orders as any[]).map((order: any) => {
                      const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                      const Icon = st.icon;
                      const needsProof = (order.paymentMethod === "bank_transfer" || order.paymentMethod === "bank") && !order.paymentProofUrl && order.status === "pending";
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-white dark:bg-gray-900 rounded-2xl border ${needsProof ? "border-amber-200 dark:border-amber-500/30" : "border-black/[0.06] dark:border-white/[0.07]"} p-4`}
                          data-testid={`card-order-${order.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${st.bg} border ${st.border}`}>
                              <Icon className={`w-4 h-4 ${st.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                  {order.projectType || order.businessName || "طلب #" + (order.id?.slice(-6) || "")}
                                </p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.bg} ${st.color} border ${st.border}`}>
                                  {st.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-slate-500">
                                {Number(order.totalAmount || 0).toLocaleString()} ر.س
                                {order.createdAt && ` · ${new Date(order.createdAt).toLocaleDateString("ar-SA")}`}
                              </p>
                              {needsProof && (
                                <div className="mt-2 flex items-center gap-2">
                                  <input
                                    type="file" accept="image/*,.pdf" className="hidden"
                                    id={`proof-input-${order.id}`}
                                    onChange={async e => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      uploadProof.mutate({ orderId: order.id, file: f });
                                    }}
                                  />
                                  <label
                                    htmlFor={`proof-input-${order.id}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-amber-600 transition-colors"
                                    data-testid={`button-upload-proof-order-${order.id}`}
                                  >
                                    <Upload className="w-3 h-3" /> ارفع إيصال التحويل
                                  </label>
                                </div>
                              )}
                              {order.paymentProofUrl && order.status === "pending" && (
                                <p className="mt-1.5 text-[11px] text-green-600 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3" /> تم رفع الإيصال — بانتظار التحقق
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { label: "تواصل مع الدعم",  desc: "نرد خلال دقائق",  href: "/cs-chat",     icon: Headphones, color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-500/[0.08]",   border: "border-blue-100 dark:border-blue-500/20" },
            { label: "طلب تعديل",        desc: "على مشروعك الحالي", href: "/support",   icon: RefreshCw,  color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/[0.08]", border: "border-violet-100 dark:border-violet-500/20" },
            { label: "فواتيري",          desc: "سجل المدفوعات",   href: "/client/invoices", icon: FileText, color: "text-gray-600", bg: "bg-gray-50 dark:bg-white/[0.04]",        border: "border-gray-100 dark:border-white/[0.07]" },
            { label: "باقات جديدة",      desc: "أضف خدمات أخرى", href: "/prices",      icon: Star,       color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-500/[0.08]",   border: "border-amber-100 dark:border-amber-500/20" },
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <div className={`bg-white dark:bg-gray-900 rounded-2xl border ${item.border} p-4 hover:shadow-sm transition-all cursor-pointer`} data-testid={`quick-link-${i}`}>
                <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{item.label}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
