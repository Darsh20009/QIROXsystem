// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import {
  Building2, FileText, CreditCard, ShieldCheck, Target, Calendar,
  Sparkles, MapPin, Phone, Mail, Instagram, Twitter, Users,
  Download, ExternalLink, Search, Filter, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, Eye, Package, Briefcase, IdCard,
  Percent, Pen, Globe2, AlertCircle, Hash, Star, Image as ImageIcon,
  Loader2, Tag, User, FolderOpen, Layers, TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:   { label: "بانتظار المراجعة", color: "text-amber-700",   bg: "bg-amber-50 dark:bg-amber-500/10",   icon: Clock },
  approved:  { label: "مقبول",            color: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-500/10",icon: CheckCircle2 },
  rejected:  { label: "مرفوض",            color: "text-red-700",     bg: "bg-red-50 dark:bg-red-500/10",        icon: XCircle },
  in_progress:{ label: "قيد التنفيذ",     color: "text-blue-700",    bg: "bg-blue-50 dark:bg-blue-500/10",      icon: TrendingUp },
  completed: { label: "مكتمل",            color: "text-gray-700 dark:text-gray-300", bg: "bg-gray-100 dark:bg-white/[0.06]", icon: CheckCircle2 },
};

function FileLink({ url, label }: { url: string; label: string }) {
  if (!url) return null;
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
    >
      {isImage ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
      {label}
      <ExternalLink className="w-3 h-3 opacity-60" />
    </a>
  );
}

function Section({ icon: Icon, title, color = "blue", children }: any) {
  const colorMap: Record<string, string> = {
    blue:   "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    rose:   "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20",
    violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-500/20",
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
    teal:   "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-500/20",
    green:  "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20",
    cyan:   "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/20",
    amber:  "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
  };
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  if (!value && value !== 0 && value !== false) return null;
  const displayVal = typeof value === "boolean" ? (value ? "نعم" : "لا") : value;
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 dark:border-white/[0.03] last:border-0">
      <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0 ml-4">{label}</span>
      <span className="text-xs font-semibold text-gray-800 dark:text-white text-left break-all max-w-[60%]">{displayVal}</span>
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const w = order.wizardData || {};
  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const StatusIcon = status.icon;

  const planLabel = order.planTier === "infinite" ? "إنفينتي" : order.planTier === "pro" ? "برو" : order.planTier === "lite" ? "لايت" : order.planTier;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm dark:shadow-xl dark:shadow-black/10"
    >
      {/* Card Header */}
      <div className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg shadow-blue-500/20">
          {(w.businessName || order.businessName || "?").charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 dark:text-white text-base truncate">
            {w.businessName || order.businessName || "—"}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {planLabel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-full text-[10px] font-black text-blue-700 dark:text-blue-400">
                <Star className="w-2.5 h-2.5" />
                {planLabel}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${status.bg} ${status.color} border-current/20`}>
              <StatusIcon className="w-2.5 h-2.5" />
              {status.label}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              {new Date(order.createdAt).toLocaleDateString("ar-SA")}
            </span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-9 h-9 rounded-xl border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all shrink-0"
          data-testid={`btn-expand-order-${order._id}`}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick stats bar */}
      {!expanded && (
        <div className="px-5 pb-4 flex flex-wrap gap-4">
          {w.whatsapp && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
              <Phone className="w-3 h-3" /> {w.whatsapp}
            </div>
          )}
          {w.email && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
              <Mail className="w-3 h-3" /> {w.email}
            </div>
          )}
          {w.selectedFeatures?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
              <Sparkles className="w-3 h-3" /> {w.selectedFeatures.length} مميزة
            </div>
          )}
          {w.paymobRegistered && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3" /> Paymob مسجّل
            </div>
          )}
          {w.paymobPolicyAccepted && (
            <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400">
              <Pen className="w-3 h-3" /> الاتفاقية موقّعة
            </div>
          )}
        </div>
      )}

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-black/[0.04] dark:border-white/[0.04] p-5 space-y-6">

              {/* ── معلومات المنشأة ── */}
              {(w.businessName || w.whatsapp || w.email || w.projectIdea || w.teamSize) && (
                <Section icon={Building2} title="معلومات المنشأة" color="blue">
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-2">
                    <InfoRow label="اسم النشاط" value={w.businessName || order.businessName} />
                    <InfoRow label="رقم الواتساب" value={w.whatsapp} />
                    <InfoRow label="البريد الإلكتروني" value={w.email} />
                    <InfoRow label="حجم الفريق" value={w.teamSize} />
                    <InfoRow label="انستغرام" value={w.instagram} />
                    <InfoRow label="تويتر / X" value={w.twitter} />
                    <InfoRow label="سناب شات" value={w.snapchat} />
                    <InfoRow label="شخص الاستلام" value={w.recipientName ? `${w.recipientName} — ${w.recipientPhone}` : undefined} />
                  </div>
                  {w.projectIdea && (
                    <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">فكرة المشروع</p>
                      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{w.projectIdea}</p>
                    </div>
                  )}
                </Section>
              )}

              {/* ── الملفات والهوية البصرية ── */}
              {(w.logoFile || w.brandFile || w.commercialReg || w.expectedCustomers || w.extraFiles?.length > 0) && (
                <Section icon={ImageIcon} title="الملفات والهوية البصرية" color="violet">
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-2 mb-3">
                    <InfoRow label="رقم السجل التجاري" value={w.commercialReg} />
                    <InfoRow label="خيار الشعار" value={w.logoChoice === "upload" ? "مرفوع" : w.logoChoice === "design" ? "طلب تصميم" : "لاحقاً"} />
                    <InfoRow label="خيار الهوية البصرية" value={w.brandChoice === "upload" ? "مرفوعة" : w.brandChoice === "create" ? "طلب إنشاء" : "لاحقاً"} />
                    <InfoRow label="العملاء المتوقعون شهرياً" value={w.expectedCustomers} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FileLink url={w.logoFile} label="ملف الشعار" />
                    <FileLink url={w.brandFile} label="ملف الهوية البصرية" />
                    {w.extraFiles?.map((f: string, i: number) => (
                      <FileLink key={i} url={f} label={`ملف إضافي ${i + 1}`} />
                    ))}
                  </div>
                </Section>
              )}

              {/* ── المعلومات القانونية ── */}
              {(w.legalDocNumber || w.legalDocFile || w.ibanCertFile || w.idNumber || w.idPhotoFile) && (
                <Section icon={ShieldCheck} title="المعلومات القانونية والهوية" color="rose">
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-2 mb-3">
                    <InfoRow label="نوع الوثيقة" value={w.legalDocType === "commercial" ? "سجل تجاري" : "وثيقة عمل حر"} />
                    <InfoRow label="رقم الوثيقة" value={w.legalDocNumber} />
                    <InfoRow label="الرقم الضريبي" value={w.taxNumber} />
                    <InfoRow label="رقم الهوية الوطنية" value={w.idNumber} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FileLink url={w.legalDocFile} label="وثيقة النشاط" />
                    <FileLink url={w.ibanCertFile} label="شهادة الإيبان" />
                    <FileLink url={w.idPhotoFile} label="صورة الهوية" />
                  </div>
                </Section>
              )}

              {/* ── بيانات Paymob ── */}
              <Section icon={CreditCard} title="بيانات تسجيل Paymob" color="indigo">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${w.paymobRegistered ? "bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20" : "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.04]"}`}>
                    <div className="flex items-center gap-2">
                      {w.paymobRegistered
                        ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        : <XCircle className="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0" />
                      }
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">تسجيل Paymob</p>
                        <p className={`text-sm font-black ${w.paymobRegistered ? "text-green-700 dark:text-green-400" : "text-gray-400 dark:text-slate-500"}`}>
                          {w.paymobRegistered ? "مكتمل ✓" : "لم يتم بعد"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${w.paymobPolicyAccepted ? "bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20" : "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.04]"}`}>
                    <div className="flex items-center gap-2">
                      {w.paymobPolicyAccepted
                        ? <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                        : <XCircle className="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0" />
                      }
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">الاتفاقية</p>
                        <p className={`text-sm font-black ${w.paymobPolicyAccepted ? "text-teal-700 dark:text-teal-400" : "text-gray-400 dark:text-slate-500"}`}>
                          {w.paymobPolicyAccepted ? "موافق ✓" : "لم يوافق بعد"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {w.paymobSignatureName && (
                  <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-500/[0.06] border border-teal-100 dark:border-teal-500/15 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pen className="w-3.5 h-3.5 text-teal-500" />
                      <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">التوقيع الرقمي</span>
                    </div>
                    <span className="text-gray-800 dark:text-white font-bold text-base" style={{ fontFamily: "Georgia, serif" }}>
                      {w.paymobSignatureName}
                    </span>
                  </div>
                )}
              </Section>

              {/* ── المميزات المختارة ── */}
              {w.selectedFeatures?.length > 0 && (
                <Section icon={Sparkles} title="المميزات المختارة" color="amber">
                  <div className="flex flex-wrap gap-2">
                    {w.selectedFeatures.map((f: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400">
                        <Sparkles className="w-2.5 h-2.5" />
                        {f}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── المعلومات التنافسية ── */}
              {(w.competitorUrl || w.technicalFeatures?.length > 0 || w.projectTechIdeas || w.technicalLevel) && (
                <Section icon={Target} title="المعلومات التنافسية والتقنية" color="green">
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-2 mb-3">
                    <InfoRow label="موقع منافس" value={w.competitorUrl} />
                    <InfoRow label="موقع سابق؟" value={w.hadPrevSite} />
                    <InfoRow label="ملاحظات الموقع السابق" value={w.prevSiteFeedback} />
                    <InfoRow label="مستوى تقني" value={w.technicalLevel === "high" ? "لديه خلفية تقنية" : w.technicalLevel === "low" ? "أعمال فقط" : undefined} />
                    <InfoRow label="تفاصيل تقنية" value={w.technicalDetails} />
                    <InfoRow label="فريق مبرمجين؟" value={w.hasDevTeam} />
                    <InfoRow label="تفاصيل الفريق" value={w.devTeamDetails} />
                  </div>
                  {w.technicalFeatures?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {w.technicalFeatures.map((f: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-full text-[10px] font-bold text-green-700 dark:text-green-400">{f}</span>
                      ))}
                    </div>
                  )}
                  {w.projectTechIdeas && (
                    <div className="mt-3 p-3 bg-green-50/50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10 rounded-xl">
                      <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">الأفكار التقنية</p>
                      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{w.projectTechIdeas}</p>
                    </div>
                  )}
                </Section>
              )}

              {/* ── جدولة الاجتماع ── */}
              {(w.preferredTimes?.length > 0 || w.preferredDays?.length > 0) && (
                <Section icon={Calendar} title="جدولة الاجتماع" color="cyan">
                  <div className="grid grid-cols-2 gap-3">
                    {w.preferredDays?.length > 0 && (
                      <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 rounded-xl">
                        <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-2">الأيام المفضلة</p>
                        <div className="flex flex-wrap gap-1">
                          {w.preferredDays.map((d: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white dark:bg-white/[0.08] rounded-lg text-xs font-bold text-gray-700 dark:text-white">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {w.preferredTimes?.length > 0 && (
                      <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 rounded-xl">
                        <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-2">الأوقات المفضلة</p>
                        <div className="flex flex-wrap gap-1">
                          {w.preferredTimes.map((t: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white dark:bg-white/[0.08] rounded-lg text-xs font-bold text-gray-700 dark:text-white">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* ── عنوان التوصيل ── */}
              {w.address?.name && (
                <Section icon={MapPin} title="عنوان التوصيل" color="amber">
                  <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-2">
                    <InfoRow label="المستلم" value={w.address.name} />
                    <InfoRow label="الجوال" value={w.address.phone} />
                    <InfoRow label="المدينة" value={w.address.city} />
                    <InfoRow label="الحي" value={w.address.district} />
                    <InfoRow label="الشارع" value={w.address.street} />
                  </div>
                </Section>
              )}

              {/* ── معلومات الطلب ── */}
              <Section icon={Package} title="معلومات الطلب" color="teal">
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl px-4 py-2">
                  <InfoRow label="رقم الطلب" value={order._id} />
                  <InfoRow label="الباقة" value={planLabel} />
                  <InfoRow label="الإجمالي" value={order.totalAmount ? `${order.totalAmount?.toLocaleString()} ر.س` : undefined} />
                  <InfoRow label="طريقة الدفع" value={order.paymentMethod} />
                  <InfoRow label="تاريخ الطلب" value={new Date(order.createdAt).toLocaleDateString("ar-SA")} />
                </div>
                {order.paymentProofUrl && (
                  <div className="mt-2">
                    <FileLink url={order.paymentProofUrl} label="إثبات الدفع" />
                  </div>
                )}
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminProjectData() {
  const { lang, dir } = useI18n();
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymob, setFilterPaymob] = useState("all");

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!user,
  });

  if (!user || (!["admin", "employee", "manager", "developer"].includes((user as any)?.role) && (user as any)?.username !== "qadmin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950" dir="rtl">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400 font-bold">غير مصرح بالوصول</p>
        </div>
      </div>
    );
  }

  const ordersWithData = orders.filter((o: any) => o.wizardData && Object.keys(o.wizardData).length > 0);

  const filtered = ordersWithData.filter((o: any) => {
    const w = o.wizardData || {};
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (w.businessName || o.businessName || "").toLowerCase().includes(q) ||
      (w.whatsapp || "").includes(q) ||
      (w.email || "").toLowerCase().includes(q) ||
      (o._id || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchPaymob = filterPaymob === "all" ||
      (filterPaymob === "registered" && w.paymobRegistered) ||
      (filterPaymob === "policy" && w.paymobPolicyAccepted) ||
      (filterPaymob === "none" && !w.paymobRegistered);
    return matchSearch && matchStatus && matchPaymob;
  });

  const totalPaymobRegistered = ordersWithData.filter((o: any) => o.wizardData?.paymobRegistered).length;
  const totalPolicySigned = ordersWithData.filter((o: any) => o.wizardData?.paymobPolicyAccepted).length;
  const totalFiles = ordersWithData.reduce((acc: number, o: any) => {
    const w = o.wizardData || {};
    return acc + (w.legalDocFile ? 1 : 0) + (w.ibanCertFile ? 1 : 0) + (w.idPhotoFile ? 1 : 0) + (w.logoFile ? 1 : 0) + (w.brandFile ? 1 : 0) + (w.extraFiles?.length || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600" />

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.05] dark:border-white/[0.05] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-gray-900 dark:text-white text-lg">بيانات المشاريع</h1>
              <p className="text-xs text-gray-400 dark:text-slate-500">{filtered.length} طلب يحتوي على بيانات كاملة</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/orders")}
            className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors font-bold"
          >
            كل الطلبات →
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Layers,        label: "طلبات مكتملة البيانات", val: ordersWithData.length,       color: "blue" },
            { icon: CreditCard,    label: "مسجّلون في Paymob",     val: totalPaymobRegistered,        color: "indigo" },
            { icon: Pen,           label: "وقّعوا الاتفاقية",       val: totalPolicySigned,            color: "teal" },
            { icon: FileText,      label: "ملفات مرفوعة",           val: totalFiles,                   color: "violet" },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${
                stat.color === "blue"   ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                stat.color === "indigo" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" :
                stat.color === "teal"   ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400" :
                "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
              }`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.val}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-slate-600" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الجوال أو البريد..."
              className="pr-10 h-10 rounded-xl text-sm border-black/[0.07] dark:border-white/[0.07]"
              data-testid="input-search"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-slate-300 focus:outline-none"
            data-testid="select-status"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">بانتظار المراجعة</option>
            <option value="approved">مقبول</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتمل</option>
            <option value="rejected">مرفوض</option>
          </select>

          <select
            value={filterPaymob}
            onChange={e => setFilterPaymob(e.target.value)}
            className="h-10 px-3 rounded-xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-slate-300 focus:outline-none"
            data-testid="select-paymob"
          >
            <option value="all">كل Paymob</option>
            <option value="registered">مسجّل في Paymob</option>
            <option value="policy">وقّع الاتفاقية</option>
            <option value="none">لم يسجّل بعد</option>
          </select>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-slate-500 font-bold">
              {search || filterStatus !== "all" || filterPaymob !== "all"
                ? "لا توجد نتائج تطابق البحث"
                : "لا توجد طلبات تحتوي على بيانات المعالج"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order: any) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
