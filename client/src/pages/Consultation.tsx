import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Clock, Video, Phone, MapPin, CheckCircle, ArrowLeft, MessageSquare, Shield, Zap, Users, Star, CalendarCheck, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const typeConfig: Record<string, { label: string; labelEn: string; icon: any; color: string; bg: string }> = {
  phone:     { label: "مكالمة هاتفية", labelEn: "Phone Call",    icon: Phone,  color: "text-emerald-600", bg: "bg-emerald-50" },
  video:     { label: "اجتماع فيديو",  labelEn: "Video Meeting", icon: Video,  color: "text-blue-600",    bg: "bg-blue-50" },
  in_person: { label: "حضوري",          labelEn: "In Person",     icon: MapPin, color: "text-violet-600",  bg: "bg-violet-50" },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: "في انتظار تحديد الموعد", color: "bg-amber-50 text-amber-700 border-amber-200",   icon: Clock },
  confirmed: { label: "تم تأكيد الموعد",        color: "bg-green-50 text-green-700 border-green-200",   icon: CheckCircle },
  rejected:  { label: "مرفوض",                  color: "bg-red-50 text-red-700 border-red-200",         icon: AlertCircle },
  cancelled: { label: "ملغي",                    color: "bg-gray-50 text-gray-600 border-gray-200",      icon: AlertCircle },
  completed: { label: "مكتمل",                   color: "bg-blue-50 text-blue-700 border-blue-200",      icon: CheckCircle },
};

export default function Consultation() {
  const { lang, dir } = useI18n();
  const { data: user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    clientName: (user as any)?.fullName || "",
    clientEmail: (user as any)?.email || "",
    clientPhone: (user as any)?.phone || "",
    consultationType: "phone",
    topic: "",
    notes: "",
  });

  const { data: myBookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["/api/consultation/bookings"],
    enabled: !!user,
  });

  const bookMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/consultation/book", data);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/consultation/bookings"] });
    },
    onError: (err: any) => toast({ title: err.message || "فشل إرسال الطلب", variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.clientName || !form.clientEmail || !form.topic) {
      return toast({ title: "يرجى تعبئة الاسم والبريد الإلكتروني والموضوع", variant: "destructive" });
    }
    bookMutation.mutate(form);
  };

  const features = [
    { icon: Shield, title: "استشارة متخصصة",     desc: "فريقنا من الخبراء جاهز لمساعدتك في مشروعك" },
    { icon: Zap,    title: "استجابة سريعة",        desc: "سيتم التواصل معك لتحديد الموعد خلال ساعات" },
    { icon: Users,  title: "خبرة واسعة",           desc: "أكثر من 500 مشروع في مختلف القطاعات" },
    { icon: Star,   title: "رضا العملاء 99%",      desc: "من عملائنا يوصون بخدمات QIROX Studio" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
      <PageGraphics variant="hero-light" />
      <Navigation />
      <div className="pt-20">

        {/* Hero */}
        <section className="relative py-20 md:py-28 bg-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          {[
            { w: 400, h: 400, top: "-10%", right: "-5%",  from: "from-violet-500/20", to: "to-purple-500/10" },
            { w: 300, h: 300, top: "50%",  left: "-5%",   from: "from-teal-500/15",   to: "to-cyan-500/10" },
          ].map((o, i) => (
            <motion.div key={i} className={`absolute rounded-full bg-gradient-to-br ${o.from} ${o.to} blur-3xl`}
              style={{ width: o.w, height: o.h, top: o.top, ...(o.right ? { right: o.right } : { left: o.left }) }}
              animate={{ y: [0, -20, 0], scale: [1, 1.06, 1] }}
              transition={{ duration: 8 + i * 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }} />
          ))}
          <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block text-xs tracking-[4px] uppercase text-white/30 mb-4">QIROX STUDIO</span>
              <h1 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
                {lang === "ar" ? "احجز استشارتك" : "Book a Consultation"}
                <span className="block text-white/30">{lang === "ar" ? "المجانية" : "For Free"}</span>
              </h1>
              <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                {lang === "ar"
                  ? "أرسل طلبك وسيتواصل معك فريقنا لتحديد الموعد المناسب"
                  : "Submit your request and our team will contact you to schedule a convenient time"}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Form */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 px-8 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-black text-black dark:text-white mb-3">
                      {lang === "ar" ? "تم استلام طلبك!" : "Request Received!"}
                    </h2>
                    <p className="text-black/50 dark:text-white/50 mb-2 leading-relaxed">
                      {lang === "ar"
                        ? "شكراً لك. سيتواصل معك فريقنا في أقرب وقت لتحديد الموعد المناسب."
                        : "Thank you. Our team will contact you shortly to schedule a convenient time."}
                    </p>
                    <p className="text-xs text-black/30 dark:text-white/30 mb-8">
                      {lang === "ar" ? "تابع حالة طلبك أدناه" : "Track your request status below"}
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline"
                      className="rounded-xl border-black/10 dark:border-white/10 text-sm">
                      {lang === "ar" ? "إرسال طلب جديد" : "Submit Another Request"}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-black text-black dark:text-white mb-1">
                        {lang === "ar" ? "تفاصيل طلبك" : "Your Request Details"}
                      </h2>
                      <p className="text-sm text-black/40 dark:text-white/40">
                        {lang === "ar" ? "أخبرنا بما تحتاجه وسنرد عليك" : "Tell us what you need and we'll get back to you"}
                      </p>
                    </div>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-1.5">
                            {lang === "ar" ? "الاسم الكامل *" : "Full Name *"}
                          </label>
                          <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                            placeholder={lang === "ar" ? "محمد أحمد" : "John Doe"}
                            className="rounded-xl border-black/10 dark:border-white/10 h-11" data-testid="input-name" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-1.5">
                            {lang === "ar" ? "رقم الجوال *" : "Phone Number *"}
                          </label>
                          <Input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                            placeholder="+966 5x xxx xxxx" dir="ltr"
                            className="rounded-xl border-black/10 dark:border-white/10 h-11" data-testid="input-phone" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-1.5">
                          {lang === "ar" ? "البريد الإلكتروني *" : "Email Address *"}
                        </label>
                        <Input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                          placeholder="email@example.com" dir="ltr"
                          className="rounded-xl border-black/10 dark:border-white/10 h-11" data-testid="input-email" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-1.5">
                          {lang === "ar" ? "نوع الاستشارة المفضل" : "Preferred Consultation Type"}
                        </label>
                        <Select value={form.consultationType} onValueChange={v => setForm(f => ({ ...f, consultationType: v }))}>
                          <SelectTrigger className="rounded-xl border-black/10 dark:border-white/10 h-11" data-testid="select-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(typeConfig).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                <span className="flex items-center gap-2">
                                  <v.icon className={`w-4 h-4 ${v.color}`} />
                                  {lang === "ar" ? v.label : v.labelEn}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-1.5">
                          {lang === "ar" ? "موضوع الاستشارة *" : "Consultation Topic *"}
                        </label>
                        <Input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                          placeholder={lang === "ar" ? "مثال: أريد بناء تطبيق لمطعمي" : "e.g. I want to build an app for my restaurant"}
                          className="rounded-xl border-black/10 dark:border-white/10 h-11" data-testid="input-topic" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-1.5">
                          {lang === "ar" ? "ملاحظات إضافية (اختياري)" : "Additional Notes (Optional)"}
                        </label>
                        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder={lang === "ar" ? "أي تفاصيل إضافية تود مشاركتها..." : "Any additional details you'd like to share..."}
                          className="rounded-xl border-black/10 dark:border-white/10 resize-none h-24" data-testid="input-notes" />
                      </div>
                      <Button onClick={handleSubmit} disabled={bookMutation.isPending}
                        className="w-full h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm gap-2 hover:bg-black/80"
                        data-testid="button-submit">
                        {bookMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />{lang === "ar" ? "جاري الإرسال..." : "Sending..."}</>
                        ) : (
                          <>{lang === "ar" ? "إرسال الطلب" : "Submit Request"}<ArrowLeft className="w-4 h-4" /></>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Features */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-5 lg:pt-4">
              <div className="mb-8">
                <h3 className="text-xl font-black text-black dark:text-white mb-2">
                  {lang === "ar" ? "لماذا QIROX؟" : "Why QIROX?"}
                </h3>
                <p className="text-sm text-black/40 dark:text-white/40">
                  {lang === "ar" ? "نحن هنا لمساعدتك في تحقيق رؤيتك الرقمية" : "We're here to help bring your digital vision to life"}
                </p>
              </div>
              {features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-start gap-4 p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.1] dark:hover:border-white/[0.1] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-black/60 dark:text-white/60" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-black dark:text-white mb-0.5">{f.title}</p>
                    <p className="text-xs text-black/40 dark:text-white/40 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}

              {/* How it works */}
              <div className="mt-6 p-6 rounded-2xl bg-black dark:bg-white/[0.04] text-white dark:text-white">
                <h4 className="font-black text-sm mb-4 text-white/80">{lang === "ar" ? "كيف يعمل النظام؟" : "How it works?"}</h4>
                <div className="space-y-3">
                  {[
                    { n: "١", t: lang === "ar" ? "أرسل طلب الاستشارة"   : "Submit your request" },
                    { n: "٢", t: lang === "ar" ? "يراجع فريقنا الطلب"   : "Our team reviews it" },
                    { n: "٣", t: lang === "ar" ? "نحدد لك موعداً مناسباً" : "We assign a suitable time" },
                    { n: "٤", t: lang === "ar" ? "تلقى تأكيداً بالموعد" : "You receive confirmation" },
                  ].map(s => (
                    <div key={s.n} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60 shrink-0">{s.n}</span>
                      <span className="text-xs text-white/60">{s.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* My Bookings — for logged-in users */}
        {user && (
          <section className="py-12 px-4 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-black/60 dark:text-white/60" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-black dark:text-white">
                    {lang === "ar" ? "طلباتي" : "My Requests"}
                  </h2>
                  <p className="text-xs text-black/30 dark:text-white/30">
                    {lang === "ar" ? "تابع حالة طلبات الاستشارة" : "Track your consultation requests"}
                  </p>
                </div>
              </div>

              {bookingsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
                </div>
              ) : !myBookings?.length ? (
                <div className="text-center py-12 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                  <MessageSquare className="w-8 h-8 text-black/10 dark:text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-black/30 dark:text-white/30">
                    {lang === "ar" ? "لا توجد طلبات استشارة بعد" : "No consultation requests yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBookings.map((b: any) => {
                    const st = statusConfig[b.status] || statusConfig.pending;
                    const StatusIcon = st.icon;
                    const tc = typeConfig[b.consultationType] || typeConfig.phone;
                    const TypeIcon = tc.icon;
                    return (
                      <motion.div key={b._id || b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 hover:border-black/[0.1] dark:hover:border-white/[0.1] transition-colors">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${st.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {st.label}
                              </span>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tc.bg} ${tc.color} border-current/20`}>
                                <TypeIcon className="w-3 h-3" />
                                {lang === "ar" ? tc.label : tc.labelEn}
                              </span>
                            </div>
                            <p className="font-bold text-black dark:text-white text-sm mb-1">{b.topic || "استشارة عامة"}</p>
                            {b.notes && <p className="text-xs text-black/40 dark:text-white/40 line-clamp-1">{b.notes}</p>}
                          </div>
                          <div className="text-left rtl:text-right shrink-0">
                            <p className="text-[10px] text-black/30 dark:text-white/30">
                              {new Date(b.createdAt).toLocaleDateString("ar-SA")}
                            </p>
                          </div>
                        </div>

                        {/* Appointment details if confirmed */}
                        {b.status === "confirmed" && b.date && (
                          <div className="mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
                            <p className="text-xs font-semibold text-green-600 mb-3 flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {lang === "ar" ? "تم تحديد موعدك" : "Your appointment is set"}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" />
                                <div>
                                  <p className="text-[10px] text-black/30 dark:text-white/30">{lang === "ar" ? "التاريخ" : "Date"}</p>
                                  <p className="text-xs font-bold text-black dark:text-white">
                                    {new Date(b.date).toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" })}
                                  </p>
                                </div>
                              </div>
                              {b.startTime && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" />
                                  <div>
                                    <p className="text-[10px] text-black/30 dark:text-white/30">{lang === "ar" ? "الوقت" : "Time"}</p>
                                    <p className="text-xs font-bold text-black dark:text-white">{b.startTime} {b.endTime ? `— ${b.endTime}` : ""}</p>
                                  </div>
                                </div>
                              )}
                              {b.employeeName && (
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-black/30 dark:text-white/30 shrink-0" />
                                  <div>
                                    <p className="text-[10px] text-black/30 dark:text-white/30">{lang === "ar" ? "المستشار" : "Consultant"}</p>
                                    <p className="text-xs font-bold text-black dark:text-white">{b.employeeName}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            {b.meetingLink && (
                              <button onClick={() => window.open(b.meetingLink, '_blank')}
                                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline">
                                <Video className="w-3.5 h-3.5" />
                                {lang === "ar" ? "انضم للاجتماع" : "Join Meeting"}
                              </button>
                            )}
                            {b.adminNotes && (
                              <div className="mt-3 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03]">
                                <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed">{b.adminNotes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rejected reason */}
                        {b.status === "rejected" && b.adminNotes && (
                          <div className="mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
                            <p className="text-xs text-red-500">{b.adminNotes}</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}
