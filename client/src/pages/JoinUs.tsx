import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, MapPin, Clock, Users, Code2, Palette, Server, BarChart3,
  CheckCircle2, Loader2, Send, ArrowLeft, ArrowRight, Star, Zap, Heart
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

const categoryIcons: Record<string, any> = {
  dev: Code2, design: Palette, infra: Server, marketing: BarChart3, default: Briefcase,
};

const typeColors: Record<string, string> = {
  "دوام كامل": "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
  "عن بعد": "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
  "دوام جزئي": "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
  "تدريب": "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white",
};

function getPerks(L: boolean) {
  return [
    { icon: Star, title: L ? "بيئة ابتكارية" : "Innovative Environment", desc: L ? "نُشجع الأفكار الجديدة ونمنح فريقنا الحرية في التجريب والتعلم" : "We encourage new ideas and give our team the freedom to experiment and learn" },
    { icon: Zap, title: L ? "نمو مستمر" : "Continuous Growth", desc: L ? "دعم كامل لمسيرتك المهنية من تدريب وشهادات وفرص ترقٍّ" : "Full support for your career with training, certifications, and promotion opportunities" },
    { icon: Heart, title: L ? "ثقافة محترمة" : "Respectful Culture", desc: L ? "فريق صغير ومتعاون يقدّر كل فرد ويُقدّم بيئة عمل صحية" : "A small, collaborative team that values each individual and promotes a healthy work environment" },
    { icon: Users, title: L ? "تأثير حقيقي" : "Real Impact", desc: L ? "عملك يُبنى ويُطلق — تأثيرك مباشر على عشرات العملاء" : "Your work gets built and launched — your impact is directly felt by dozens of clients" },
  ];
}

export default function JoinUs() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", resumeUrl: "", coverLetter: "" });
  const [submitted, setSubmitted] = useState(false);

  const { data: jobs = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/jobs"] });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/apply", {
        jobId: selectedJob?.id || selectedJob?._id,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        resumeUrl: form.resumeUrl,
        coverLetter: form.coverLetter,
      });
      return r.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      setForm({ fullName: "", email: "", phone: "", resumeUrl: "", coverLetter: "" });
    },
    onError: () => toast({ title: L ? "فشل إرسال الطلب، يرجى المحاولة لاحقاً" : "Failed to submit application, please try again later", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast({ title: L ? "يرجى تعبئة الاسم والبريد الإلكتروني" : "Please fill in your name and email", variant: "destructive" });
      return;
    }
    applyMutation.mutate();
  };

  const openApply = (job: any) => {
    setSelectedJob(job);
    setSubmitted(false);
    setForm({ fullName: "", email: "", phone: "", resumeUrl: "", coverLetter: "" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navigation />

      {/* Hero */}
      <section className="pt-36 pb-20 relative overflow-hidden">
        <PageGraphics variant="hero-light" />
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] mb-6">
              <Users className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs tracking-wider uppercase">Careers</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black font-heading text-black dark:text-white mb-6 tracking-tight">
              {L ? "انضم إلى" : "Join"} <span className="text-gray-400">QIROX</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
              {L ? "نبحث عن مواهب استثنائية لبناء أنظمة رقمية تُحدث فرقاً حقيقياً. هل أنت مستعد لبناء الأنظمة؟" : "We're looking for exceptional talent to build digital systems that make a real difference. Are you ready to build?"}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-16 bg-[#fafafa] dark:bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {getPerks(L).map((perk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="bg-white dark:bg-gray-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 h-full" data-testid={`perk-card-${i}`}>
                  <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mb-4">
                    <perk.icon className="w-5 h-5 text-black/40 dark:text-white/40" />
                  </div>
                  <h3 className="font-bold text-black dark:text-white text-sm mb-2">{perk.title}</h3>
                  <p className="text-xs text-black/40 dark:text-white/40 leading-relaxed">{perk.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10" dir={dir}>
            <span className="text-black/40 dark:text-white/40 text-sm font-semibold">{L ? "الوظائف المتاحة" : "Open Positions"}</span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-black dark:text-white mt-2">
              {isLoading ? (L ? "جاري التحميل..." : "Loading...") : jobs.filter((j: any) => j.status === "open").length > 0 ? (L ? "انضم إلى فريقنا" : "Join Our Team") : (L ? "لا توجد وظائف مفتوحة حالياً" : "No Open Positions Currently")}
            </h2>
            {jobs.filter((j: any) => j.status === "open").length === 0 && !isLoading && (
              <p className="text-black/40 dark:text-white/40 text-sm mt-2">
                {L ? "تابعنا على منصات التواصل الاجتماعي أو تواصل معنا مباشرة لإرسال طلبك الرقمي." : "Follow us on social media or contact us directly to submit your digital application."}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.filter((j: any) => j.status === "open").map((job: any, i: number) => {
                const Icon = categoryIcons[job.category] || categoryIcons.default;
                const colorCls = typeColors[job.type] || typeColors["دوام كامل"];
                return (
                  <motion.div
                    key={job._id || job.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div
                      className="bg-white dark:bg-gray-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 hover:border-black/[0.12] dark:hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/[0.04] transition-all group"
                      data-testid={`job-card-${job._id || job.id}`}
                    >
                      <div className="flex items-start justify-between gap-4" dir={dir}>
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-black/40 dark:text-white/40" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-black dark:text-white text-base mb-1">{L ? (job.titleAr || job.title) : (job.title || job.titleAr)}</h3>
                            <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed mb-3 line-clamp-2">
                              {L ? (job.descriptionAr || job.description) : (job.description || job.descriptionAr)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {job.type && (
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${colorCls}`}>
                                  {job.type}
                                </span>
                              )}
                              {job.location && (
                                <span className="flex items-center gap-1 text-[11px] text-black/35 dark:text-white/35">
                                  <MapPin className="w-3 h-3" />
                                  {job.location}
                                </span>
                              )}
                              {job.salary && (
                                <span className="flex items-center gap-1 text-[11px] text-black/35 dark:text-white/35">
                                  <Clock className="w-3 h-3" />
                                  {job.salary}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => openApply(job)}
                          className="flex-shrink-0 h-10 px-5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:bg-gray-900 dark:hover:bg-gray-100 gap-1.5"
                          data-testid={`button-apply-${job._id || job.id}`}
                        >
                          {L ? "تقدم الآن" : "Apply Now"}
                          {L ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Open application even if no jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-[#fafafa] dark:bg-gray-900/50 p-8 text-center"
            data-testid="open-application-banner"
          >
            <div className="w-14 h-14 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-black/40 dark:text-white/40" />
            </div>
            <h3 className="font-bold text-black dark:text-white text-base mb-2">{L ? "لا تجد وظيفة مناسبة؟" : "Can't find a suitable position?"}</h3>
            <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed mb-6 max-w-sm mx-auto">
              {L ? "أرسل طلبك المفتوح وسنتواصل معك عند توفر فرصة تناسب مهاراتك." : "Submit an open application and we'll reach out when a suitable opportunity becomes available."}
            </p>
            <Button
              onClick={() => openApply({ _id: "open", titleAr: "طلب مفتوح", title: "Open Application" })}
              className="premium-btn px-6 rounded-xl"
              data-testid="button-open-application"
            >
              {L ? "إرسال طلب مفتوح" : "Submit Open Application"}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Apply Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={v => { if (!v) setSelectedJob(null); }}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-right">
              <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-white dark:text-black" />
              </div>
              {L ? (selectedJob?.titleAr || selectedJob?.title || "التقديم") : (selectedJob?.title || selectedJob?.titleAr || "Apply")}
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-16 h-16 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-black dark:text-white" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">{L ? "تم إرسال طلبك!" : "Application Submitted!"}</h3>
              <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed">
                {L ? "شكراً لاهتمامك بالانضمام إلى QIROX. سيراجع فريقنا طلبك ويتواصل معك قريباً." : "Thank you for your interest in joining QIROX. Our team will review your application and get back to you soon."}
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-xl"
                onClick={() => setSelectedJob(null)}
                data-testid="button-close-dialog"
              >
                {L ? "إغلاق" : "Close"}
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-1.5">{L ? "الاسم الكامل" : "Full Name"} <span className="text-black/70 dark:text-white/70">*</span></label>
                <Input
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder={L ? "محمد أحمد" : "John Doe"}
                  className="h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25"
                  data-testid="input-apply-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-1.5">{L ? "البريد الإلكتروني" : "Email"} <span className="text-black/70 dark:text-white/70">*</span></label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="name@example.com"
                  className="h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25"
                  data-testid="input-apply-email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-1.5">{L ? "رقم الهاتف" : "Phone Number"}</label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+966 5x xxx xxxx"
                  className="h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25"
                  data-testid="input-apply-phone"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-1.5">{L ? "رابط السيرة الذاتية أو Portfolio" : "Resume or Portfolio Link"}</label>
                <Input
                  value={form.resumeUrl}
                  onChange={e => setForm(p => ({ ...p, resumeUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/yourname"
                  dir="ltr"
                  className="h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25"
                  data-testid="input-apply-resume"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-1.5">{L ? "لماذا QIROX؟" : "Why QIROX?"}</label>
                <Textarea
                  value={form.coverLetter}
                  onChange={e => setForm(p => ({ ...p, coverLetter: e.target.value }))}
                  placeholder={L ? "أخبرنا عن نفسك ولماذا تريد الانضمام إلى فريقنا..." : "Tell us about yourself and why you want to join our team..."}
                  rows={4}
                  className="rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25 resize-none"
                  data-testid="input-apply-cover"
                />
              </div>
              <Button
                type="submit"
                disabled={applyMutation.isPending}
                className="w-full h-12 premium-btn rounded-xl font-bold gap-2"
                data-testid="button-submit-application"
              >
                {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {applyMutation.isPending ? (L ? "جاري الإرسال..." : "Submitting...") : (L ? "إرسال الطلب" : "Submit Application")}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
