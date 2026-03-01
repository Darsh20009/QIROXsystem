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
  CheckCircle2, Loader2, Send, ArrowLeft, Star, Zap, Heart
} from "lucide-react";

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
  "دوام كامل": "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  "عن بعد": "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "دوام جزئي": "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "تدريب": "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
};

const perks = [
  { icon: Star, title: "بيئة ابتكارية", desc: "نُشجع الأفكار الجديدة ونمنح فريقنا الحرية في التجريب والتعلم" },
  { icon: Zap, title: "نمو مستمر", desc: "دعم كامل لمسيرتك المهنية من تدريب وشهادات وفرص ترقٍّ" },
  { icon: Heart, title: "ثقافة محترمة", desc: "فريق صغير ومتعاون يقدّر كل فرد ويُقدّم بيئة عمل صحية" },
  { icon: Users, title: "تأثير حقيقي", desc: "عملك يُبنى ويُطلق — تأثيرك مباشر على عشرات العملاء" },
];

export default function JoinUs() {
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
    onError: () => toast({ title: "فشل إرسال الطلب، يرجى المحاولة لاحقاً", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast({ title: "يرجى تعبئة الاسم والبريد الإلكتروني", variant: "destructive" });
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
              انضم إلى <span className="text-gray-400">QIROX</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-black/40 dark:text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
              نبحث عن مواهب استثنائية لبناء أنظمة رقمية تُحدث فرقاً حقيقياً.
              هل أنت مستعد لبناء الأنظمة؟
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-16 bg-[#fafafa] dark:bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {perks.map((perk, i) => (
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
          <div className="mb-10" dir="rtl">
            <span className="text-black/40 dark:text-white/40 text-sm font-semibold">الوظائف المتاحة</span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-black dark:text-white mt-2">
              {isLoading ? "جاري التحميل..." : jobs.filter((j: any) => j.status === "open").length > 0 ? "انضم إلى فريقنا" : "لا توجد وظائف مفتوحة حالياً"}
            </h2>
            {jobs.filter((j: any) => j.status === "open").length === 0 && !isLoading && (
              <p className="text-black/40 dark:text-white/40 text-sm mt-2">
                تابعنا على منصات التواصل الاجتماعي أو تواصل معنا مباشرة لإرسال طلبك الرقمي.
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
                      <div className="flex items-start justify-between gap-4" dir="rtl">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-black/40 dark:text-white/40" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-black dark:text-white text-base mb-1">{job.titleAr || job.title}</h3>
                            <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed mb-3 line-clamp-2">
                              {job.descriptionAr || job.description}
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
                          تقدم الآن
                          <ArrowLeft className="w-4 h-4" />
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
            <h3 className="font-bold text-black dark:text-white text-base mb-2">لا تجد وظيفة مناسبة؟</h3>
            <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed mb-6 max-w-sm mx-auto">
              أرسل طلبك المفتوح وسنتواصل معك عند توفر فرصة تناسب مهاراتك.
            </p>
            <Button
              onClick={() => openApply({ _id: "open", titleAr: "طلب مفتوح", title: "Open Application" })}
              className="premium-btn px-6 rounded-xl"
              data-testid="button-open-application"
            >
              إرسال طلب مفتوح
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Apply Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={v => { if (!v) setSelectedJob(null); }}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-right">
              <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-white dark:text-black" />
              </div>
              {selectedJob?.titleAr || selectedJob?.title || "التقديم"}
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">تم إرسال طلبك!</h3>
              <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed">
                شكراً لاهتمامك بالانضمام إلى QIROX. سيراجع فريقنا طلبك ويتواصل معك قريباً.
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-xl"
                onClick={() => setSelectedJob(null)}
                data-testid="button-close-dialog"
              >
                إغلاق
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-1.5">الاسم الكامل <span className="text-red-400">*</span></label>
                <Input
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="محمد أحمد"
                  className="h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25"
                  data-testid="input-apply-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-1.5">البريد الإلكتروني <span className="text-red-400">*</span></label>
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
                <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-1.5">رقم الهاتف</label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+966 5x xxx xxxx"
                  className="h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25"
                  data-testid="input-apply-phone"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-1.5">رابط السيرة الذاتية أو Portfolio</label>
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
                <label className="text-sm font-medium text-black/50 dark:text-white/50 block mb-1.5">لماذا QIROX؟</label>
                <Textarea
                  value={form.coverLetter}
                  onChange={e => setForm(p => ({ ...p, coverLetter: e.target.value }))}
                  placeholder="أخبرنا عن نفسك ولماذا تريد الانضمام إلى فريقنا..."
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
                {applyMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
