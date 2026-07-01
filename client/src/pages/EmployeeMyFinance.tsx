import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import EmployeeLayout from "@/components/EmployeeLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote, TrendingUp, TrendingDown, Calendar, CheckCircle2, Clock,
  Loader2, Wallet, Briefcase, Star, Gift, BadgeDollarSign, HelpCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fade(delay = 0) {
  return { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay } };
}

function StatCard({ label, value, icon: Icon, accent = "bg-black/[0.05] dark:bg-white/[0.07]", textAccent = "text-black dark:text-white", delay = 0 }: {
  label: string; value: string | number; icon: React.ElementType;
  accent?: string; textAccent?: string; delay?: number;
}) {
  return (
    <motion.div {...fade(delay)}>
      <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
          <Icon className={`w-5 h-5 ${textAccent}`} />
        </div>
        <div>
          <p className="text-xl font-black text-black dark:text-white leading-none">{value}</p>
          <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

const TYPE_LABELS: Record<string, [string, string]> = {
  salary:     ["راتب",   "Salary"],
  bonus:      ["مكافأة", "Bonus"],
  commission: ["عمولة",  "Commission"],
  allowance:  ["بدل",    "Allowance"],
  other:      ["أخرى",   "Other"],
};
const TYPE_ICON: Record<string, React.ElementType> = {
  salary: Banknote, bonus: Gift, commission: TrendingUp, allowance: BadgeDollarSign, other: HelpCircle,
};
const TYPE_COLOR: Record<string, string> = {
  salary:     "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  bonus:      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  commission: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  allowance:  "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  other:      "bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400",
};
const statusColor: Record<string, string> = {
  paid:    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  approved:"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  late:    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
};
const statusLabel: Record<string, [string, string]> = {
  paid:     ["مدفوع",        "Paid"],
  pending:  ["قيد المعالجة", "Pending"],
  approved: ["معتمد",        "Approved"],
  late:     ["متأخر",        "Late"],
};

export default function EmployeeMyFinance() {
  const { data: user } = useUser();
  const { lang } = useI18n();
  const L = lang === "ar";
  const [tab, setTab] = useState<"payroll" | "payments">("payments");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: records, isLoading: loadingPayroll } = useQuery<any[]>({
    queryKey: ["/api/employee/payroll"],
  });
  const { data: payments, isLoading: loadingPayments } = useQuery<any[]>({
    queryKey: ["/api/employee/my-payments"],
  });
  const { data: profile } = useQuery<any>({
    queryKey: ["/api/employee/profile"],
  });

  const latest = records?.[0];
  const totalPayroll = records?.reduce((s, r) => s + (r.netSalary || 0), 0) || 0;
  const totalDeductions = records?.reduce((s, r) => s + (r.deductions || 0), 0) || 0;
  const paidCount = records?.filter(r => r.status === "paid").length || 0;
  const pendingCount = records?.filter(r => r.status !== "paid").length || 0;

  const totalPayments = payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
  const paidPayments = payments?.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0) || 0;
  const pendingPayments = payments?.filter(p => p.status !== "paid").reduce((s, p) => s + (p.amount || 0), 0) || 0;
  const latestPayment = payments?.[0];

  return (
    <EmployeeLayout>
      <div className="p-5 space-y-5 max-w-2xl mx-auto" dir="rtl">

        {/* Header */}
        <motion.div {...fade(0)} className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-12 translate-x-12 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight">{L ? "حقي المالي" : "My Financials"}</h1>
              <p className="text-white/55 text-sm mt-0.5">
                {L ? `مرحباً ${(user as any)?.fullName || ""}، هذا سجلك المالي` : `Welcome ${(user as any)?.fullName || ""}, your financial record`}
              </p>
            </div>
          </div>

          {/* Latest entry summary */}
          {tab === "payroll" && latest && (
            <div className="relative z-10 mt-5 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-white/50 text-xs mb-1">{L ? "آخر راتب" : "Last Salary"} — {L ? MONTHS_AR[(latest.month || 1) - 1] : MONTHS_EN[(latest.month || 1) - 1]} {latest.year}</p>
              <p className="text-3xl font-black text-white">
                {(latest.netSalary || 0).toLocaleString()} <span className="text-lg font-bold opacity-60">{L ? "ر.س" : "SAR"}</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusColor[latest.status] || statusColor["pending"]}`}>
                  {L ? (statusLabel[latest.status]?.[0] || "قيد المعالجة") : (statusLabel[latest.status]?.[1] || "Pending")}
                </span>
              </div>
            </div>
          )}
          {tab === "payments" && latestPayment && (
            <div className="relative z-10 mt-5 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-white/50 text-xs mb-1">{L ? "آخر استحقاق" : "Latest Payment"}</p>
              <p className="text-3xl font-black text-white">
                {(latestPayment.amount || 0).toLocaleString()} <span className="text-lg font-bold opacity-60">{L ? "ر.س" : "SAR"}</span>
              </p>
              <p className="text-white/60 text-xs mt-1">{latestPayment.description || latestPayment.projectName || ""}</p>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div {...fade(0.05)}>
          <div className="flex rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] p-1 gap-1">
            <button
              onClick={() => setTab("payments")}
              className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${tab === "payments" ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm" : "text-black/40 dark:text-white/40"}`}
              data-testid="tab-payments"
            >
              <Briefcase className="w-3.5 h-3.5" />
              {L ? "الاستحقاقات" : "Payments"}
            </button>
            <button
              onClick={() => setTab("payroll")}
              className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${tab === "payroll" ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm" : "text-black/40 dark:text-white/40"}`}
              data-testid="tab-payroll"
            >
              <Calendar className="w-3.5 h-3.5" />
              {L ? "الرواتب الشهرية" : "Monthly Payroll"}
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {tab === "payments" && (
            <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {/* Payments Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label={L ? "إجمالي الاستحقاقات" : "Total Payments"} value={`${totalPayments.toLocaleString()} ${L?"ر.س":"SAR"}`} icon={TrendingUp} accent="bg-emerald-50 dark:bg-emerald-900/20" textAccent="text-emerald-600 dark:text-emerald-400" delay={0.06} />
                <StatCard label={L ? "المقبوض" : "Received"} value={`${paidPayments.toLocaleString()} ${L?"ر.س":"SAR"}`} icon={CheckCircle2} accent="bg-blue-50 dark:bg-blue-900/20" textAccent="text-blue-600 dark:text-blue-400" delay={0.08} />
                <StatCard label={L ? "قيد الانتظار" : "Pending"} value={`${pendingPayments.toLocaleString()} ${L?"ر.س":"SAR"}`} icon={Clock} accent="bg-amber-50 dark:bg-amber-900/20" textAccent="text-amber-600 dark:text-amber-400" delay={0.10} />
                <StatCard label={L ? "عدد الاستحقاقات" : "Count"} value={payments?.length || 0} icon={Star} accent="bg-purple-50 dark:bg-purple-900/20" textAccent="text-purple-600 dark:text-purple-400" delay={0.12} />
              </div>

              {/* Payments list */}
              <div>
                <p className="text-[11px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest px-1 mb-3 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  {L ? "سجل الاستحقاقات" : "Payment History"}
                </p>

                {loadingPayments && (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-black/30 dark:text-white/30" />
                  </div>
                )}

                {!loadingPayments && (!payments || payments.length === 0) && (
                  <div className="text-center py-12 text-black/30 dark:text-white/30">
                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">{L ? "لا توجد استحقاقات حتى الآن" : "No payments yet"}</p>
                    <p className="text-xs mt-1 opacity-70">{L ? "سيضيف المدير أو المسؤول استحقاقاتك هنا" : "Your manager will add payments here"}</p>
                  </div>
                )}

                {!loadingPayments && payments && payments.length > 0 && (
                  <div className="space-y-2">
                    {payments.map((p: any, i: number) => {
                      const TypeIcon = TYPE_ICON[p.type] || HelpCircle;
                      const isOpen = expanded === p._id;
                      return (
                        <motion.div key={p._id || i} {...fade(0.14 + i * 0.04)}>
                          <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden">
                            <button
                              className="w-full p-4 flex items-center gap-3 text-right"
                              onClick={() => setExpanded(isOpen ? null : p._id)}
                              data-testid={`payment-row-${p._id}`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[p.type] || TYPE_COLOR.other}`}>
                                <TypeIcon className="w-4.5 h-4.5" />
                              </div>
                              <div className="flex-1 text-right min-w-0">
                                <p className="font-bold text-sm text-black dark:text-white truncate">
                                  {p.description || (L ? TYPE_LABELS[p.type]?.[0] : TYPE_LABELS[p.type]?.[1]) || (L ? "استحقاق" : "Payment")}
                                </p>
                                {p.projectName && (
                                  <p className="text-[10px] text-black/40 dark:text-white/40 flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" /> {p.projectName}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-black text-base text-emerald-600 dark:text-emerald-400">
                                  {(p.amount || 0).toLocaleString()} <span className="text-xs font-bold opacity-60">{L ? "ر.س" : "SAR"}</span>
                                </p>
                                <Badge className={`text-[10px] border mt-1 ${statusColor[p.status] || statusColor["pending"]}`} variant="outline">
                                  {L ? (statusLabel[p.status]?.[0] || "قيد المعالجة") : (statusLabel[p.status]?.[1] || "Pending")}
                                </Badge>
                              </div>
                              {isOpen ? <ChevronUp className="w-4 h-4 text-black/30 dark:text-white/30 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-black/30 dark:text-white/30 flex-shrink-0" />}
                            </button>

                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 border-t border-black/[0.04] dark:border-white/[0.04] pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-black/40 dark:text-white/40">{L ? "النوع" : "Type"}</span>
                                      <span className="font-bold text-black dark:text-white">
                                        {L ? TYPE_LABELS[p.type]?.[0] : TYPE_LABELS[p.type]?.[1]}
                                      </span>
                                    </div>
                                    {p.addedBy && (
                                      <div className="flex justify-between">
                                        <span className="text-black/40 dark:text-white/40">{L ? "أضيف بواسطة" : "Added by"}</span>
                                        <span className="font-bold text-black dark:text-white">{p.addedBy.fullName || p.addedBy.username}</span>
                                      </div>
                                    )}
                                    {p.dueDate && (
                                      <div className="flex justify-between">
                                        <span className="text-black/40 dark:text-white/40">{L ? "تاريخ الاستحقاق" : "Due Date"}</span>
                                        <span className="font-bold text-black dark:text-white">{new Date(p.dueDate).toLocaleDateString(L ? "ar" : "en")}</span>
                                      </div>
                                    )}
                                    {p.paidAt && (
                                      <div className="flex justify-between">
                                        <span className="text-black/40 dark:text-white/40">{L ? "تاريخ الصرف" : "Paid At"}</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{new Date(p.paidAt).toLocaleDateString(L ? "ar" : "en")}</span>
                                      </div>
                                    )}
                                    {p.notes && (
                                      <p className="text-[11px] text-black/40 dark:text-white/40 border-t border-black/[0.04] dark:border-white/[0.04] pt-2">{p.notes}</p>
                                    )}
                                    <p className="text-[10px] text-black/25 dark:text-white/25">
                                      {new Date(p.createdAt).toLocaleDateString(L ? "ar" : "en")}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "payroll" && (
            <motion.div key="payroll" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {/* Payroll stats */}
              {!loadingPayroll && records && records.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label={L ? "إجمالي المقبوض" : "Total Received"} value={`${totalPayroll.toLocaleString()} ${L?"ر.س":"SAR"}`} icon={TrendingUp} accent="bg-emerald-50 dark:bg-emerald-900/20" textAccent="text-emerald-600 dark:text-emerald-400" delay={0.06} />
                  <StatCard label={L ? "إجمالي الخصومات" : "Total Deductions"} value={`${totalDeductions.toLocaleString()} ${L?"ر.س":"SAR"}`} icon={TrendingDown} accent="bg-red-50 dark:bg-red-900/20" textAccent="text-red-600 dark:text-red-400" delay={0.08} />
                  <StatCard label={L ? "رواتب مدفوعة" : "Paid"} value={paidCount} icon={CheckCircle2} accent="bg-blue-50 dark:bg-blue-900/20" textAccent="text-blue-600 dark:text-blue-400" delay={0.10} />
                  <StatCard label={L ? "قيد المعالجة" : "Pending"} value={pendingCount} icon={Clock} accent="bg-amber-50 dark:bg-amber-900/20" textAccent="text-amber-600 dark:text-amber-400" delay={0.12} />
                </div>
              )}

              {/* Salary profile info */}
              {profile && (
                <motion.div {...fade(0.14)}>
                  <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 space-y-3">
                    <p className="text-[11px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest">{L ? "بيانات الراتب" : "Salary Info"}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-black/50 dark:text-white/50">{L ? "نوع الراتب" : "Salary Type"}</span>
                      <span className="text-sm font-bold text-black dark:text-white">
                        {profile.salaryType === "fixed" ? (L ? "ثابت" : "Fixed") :
                         profile.salaryType === "hourly" ? (L ? "بالساعة" : "Hourly") :
                         profile.salaryType === "commission" ? (L ? "عمولة" : "Commission") : "—"}
                      </span>
                    </div>
                    {profile.fixedSalary > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-black/50 dark:text-white/50">{L ? "الراتب الأساسي" : "Base Salary"}</span>
                        <span className="text-sm font-bold text-black dark:text-white">{(profile.fixedSalary || 0).toLocaleString()} {L ? "ر.س" : "SAR"}</span>
                      </div>
                    )}
                    {profile.hourlyRate > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-black/50 dark:text-white/50">{L ? "معدل الساعة" : "Hourly Rate"}</span>
                        <span className="text-sm font-bold text-black dark:text-white">{(profile.hourlyRate || 0).toLocaleString()} {L ? "ر.س" : "SAR"}</span>
                      </div>
                    )}
                    {profile.commissionRate > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-black/50 dark:text-white/50">{L ? "نسبة العمولة" : "Commission Rate"}</span>
                        <span className="text-sm font-bold text-black dark:text-white">{profile.commissionRate}%</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Records list */}
              <div>
                <p className="text-[11px] font-black text-black/30 dark:text-white/30 uppercase tracking-widest px-1 mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {L ? "سجل الرواتب الشهري" : "Monthly Payroll History"}
                </p>

                {loadingPayroll && (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-black/30 dark:text-white/30" />
                  </div>
                )}

                {!loadingPayroll && (!records || records.length === 0) && (
                  <div className="text-center py-10 text-black/30 dark:text-white/30">
                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">{L ? "لا توجد سجلات راتب حتى الآن" : "No payroll records yet"}</p>
                  </div>
                )}

                {!loadingPayroll && records && records.length > 0 && (
                  <div className="space-y-2">
                    {records.map((rec: any, i: number) => (
                      <motion.div key={rec._id || i} {...fade(0.16 + i * 0.04)}>
                        <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-black dark:text-white">
                                  {L ? MONTHS_AR[(rec.month || 1) - 1] : MONTHS_EN[(rec.month || 1) - 1]} {rec.year}
                                </p>
                                <p className="text-[10px] text-black/35 dark:text-white/35">
                                  {rec.paidAt ? new Date(rec.paidAt).toLocaleDateString(L ? "ar" : "en") : (L ? "لم يُصرف بعد" : "Not paid yet")}
                                </p>
                              </div>
                            </div>
                            <Badge className={`text-[10px] border ${statusColor[rec.status] || statusColor["pending"]}`} variant="outline">
                              {L ? (statusLabel[rec.status]?.[0] || "قيد المعالجة") : (statusLabel[rec.status]?.[1] || "Pending")}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-black/[0.02] dark:bg-white/[0.03] rounded-xl p-2.5 text-center">
                              <p className="text-[10px] text-black/35 dark:text-white/35 mb-0.5">{L ? "الأساسي" : "Base"}</p>
                              <p className="text-sm font-black text-black dark:text-white">{(rec.baseSalary || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-black/[0.02] dark:bg-white/[0.03] rounded-xl p-2.5 text-center">
                              <p className="text-[10px] text-red-400 mb-0.5">{L ? "الخصومات" : "Deductions"}</p>
                              <p className="text-sm font-black text-red-500 dark:text-red-400">-{(rec.deductions || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-2.5 text-center">
                              <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 mb-0.5">{L ? "الصافي" : "Net"}</p>
                              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{(rec.netSalary || 0).toLocaleString()}</p>
                            </div>
                          </div>
                          {rec.notes && (
                            <p className="text-[11px] text-black/35 dark:text-white/35 mt-2 border-t border-black/[0.05] dark:border-white/[0.05] pt-2">{rec.notes}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </EmployeeLayout>
  );
}
