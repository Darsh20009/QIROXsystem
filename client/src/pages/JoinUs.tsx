import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";
import {
  Briefcase, MapPin, Users, Code2, Palette, Server, BarChart3,
  CheckCircle2, Loader2, Send, ArrowLeft, ArrowRight, Star, Zap, Heart,
  X, Upload, File, Link2, User, Mail, Phone, ChevronRight, Sparkles,
  Rocket, Globe, Shield, Coffee,
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

function getPerks(L: boolean) {
  return [
    { icon: Rocket, title: L ? "بيئة ابتكارية" : "Innovative Environment", desc: L ? "نُشجع الأفكار الجديدة ونمنح فريقنا الحرية في التجريب والتعلم" : "We encourage new ideas and give our team the freedom to experiment and learn" },
    { icon: Zap, title: L ? "نمو مستمر" : "Continuous Growth", desc: L ? "دعم كامل لمسيرتك المهنية من تدريب وشهادات وفرص ترقٍّ" : "Full support for your career with training, certifications, and promotion opportunities" },
    { icon: Heart, title: L ? "ثقافة محترمة" : "Respectful Culture", desc: L ? "فريق صغير ومتعاون يقدّر كل فرد ويُقدّم بيئة عمل صحية" : "A small, collaborative team that values each individual and promotes a healthy work environment" },
    { icon: Star, title: L ? "تأثير حقيقي" : "Real Impact", desc: L ? "عملك يُبنى ويُطلق — تأثيرك مباشر على عشرات العملاء" : "Your work gets built and launched — your impact is directly felt by dozens of clients" },
  ];
}

interface AppForm {
  fullName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  resumeFileName: string;
  coverLetter: string;
}
const emptyForm: AppForm = { fullName: "", email: "", phone: "", resumeUrl: "", resumeFileName: "", coverLetter: "" };

function CVUploadZone({ L, form, setForm }: { L: boolean; form: AppForm; setForm: (f: AppForm) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const doUpload = async (file: File) => {
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      return toast({ title: L ? "نوع الملف غير مدعوم. استخدم PDF أو Word" : "Unsupported file type. Use PDF or Word", variant: "destructive" });
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast({ title: L ? "حجم الملف كبير جداً (الحد 5 ميغابايت)" : "File too large (max 5MB)", variant: "destructive" });
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setForm({ ...form, resumeUrl: data.url, resumeFileName: file.name });
        toast({ title: L ? "تم رفع الملف بنجاح ✓" : "File uploaded successfully ✓" });
      }
    } catch {
      toast({ title: L ? "فشل رفع الملف" : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); }}
        data-testid="input-file-cv" />

      {form.resumeFileName ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border-2 border-black/[0.08] dark:border-white/[0.08]">
          <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center shrink-0">
            <File className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black dark:text-white truncate">{form.resumeFileName}</p>
            <p className="text-[11px] text-black/40 dark:text-white/40">{L ? "تم الرفع بنجاح ✓" : "Uploaded successfully ✓"}</p>
          </div>
          <button onClick={() => setForm({ ...form, resumeUrl: "", resumeFileName: "" })}
            className="w-7 h-7 rounded-full bg-black/[0.05] dark:bg-white/[0.05] flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            data-testid="button-remove-cv">
            <X className="w-3.5 h-3.5 text-black/50 dark:text-white/50" />
          </button>
        </motion.div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) doUpload(f); }}
          className={`w-full rounded-2xl border-2 border-dashed transition-all duration-200 p-8 text-center cursor-pointer
            ${dragging ? "border-black/40 dark:border-white/40 bg-black/[0.03] dark:bg-white/[0.03] scale-[1.01]"
              : "border-black/[0.10] dark:border-white/[0.10] hover:border-black/25 dark:hover:border-white/25 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}`}
          data-testid="button-upload-cv">
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-black/30 dark:text-white/30 animate-spin" />
              <p className="text-sm text-black/40 dark:text-white/40">{L ? "جاري الرفع..." : "Uploading..."}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center">
                <Upload className="w-7 h-7 text-black/30 dark:text-white/30" />
              </div>
              <div>
                <p className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "اسحب ملفك هنا أو اضغط للاختيار" : "Drag your file here or click to browse"}</p>
                <p className="text-[11px] text-black/35 dark:text-white/35 mt-1">{L ? "PDF, Word, JPG — حد أقصى 5MB" : "PDF, Word, JPG — max 5MB"}</p>
              </div>
            </div>
          )}
        </button>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-black/[0.07] dark:bg-white/[0.07]" />
        <span className="text-[10px] text-black/30 dark:text-white/30 font-medium uppercase tracking-widest">{L ? "أو" : "or"}</span>
        <div className="flex-1 h-px bg-black/[0.07] dark:bg-white/[0.07]" />
      </div>

      <div className="relative">
        <Link2 className={`absolute top-3.5 ${L ? "right-3" : "left-3"} w-4 h-4 text-black/25 dark:text-white/25`} />
        <Input
          value={form.resumeFileName ? "" : form.resumeUrl}
          onChange={e => setForm({ ...form, resumeUrl: e.target.value, resumeFileName: "" })}
          placeholder={L ? "أو الصق رابط LinkedIn أو Portfolio..." : "Or paste your LinkedIn or Portfolio link..."}
          className={`${L ? "pr-10" : "pl-10"} h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/25 dark:placeholder:text-white/25`}
          dir="ltr"
          data-testid="input-cv-url"
        />
      </div>
    </div>
  );
}

function ApplyDrawer({ job, onClose, L, dir }: { job: any; onClose: () => void; L: boolean; dir: string }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AppForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const TOTAL = 3;

  const applyMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/apply", {
        jobId: job?.id || job?._id,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        resumeUrl: form.resumeUrl,
        coverLetter: form.coverLetter,
      });
      return r.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: () => toast({ title: L ? "حدث خطأ، حاول مرة أخرى" : "Error occurred, please try again", variant: "destructive" }),
  });

  const stepTitles = L
    ? ["معلوماتك الشخصية", "السيرة الذاتية", "رسالة التعريف"]
    : ["Personal Info", "Resume / CV", "Cover Letter"];

  const canNext1 = !!form.fullName.trim() && !!form.email.trim();
  const canSubmit = !!form.coverLetter.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92vh] overflow-hidden rounded-[2.5rem] shadow-2xl bg-white dark:bg-gray-950 border border-black/[0.07] dark:border-white/[0.07]"
        dir={dir}
      >
        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-10 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="w-24 h-24 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-white dark:text-black" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="text-2xl font-black text-black dark:text-white mb-3">{L ? "تم إرسال طلبك! 🎉" : "Application Sent! 🎉"}</h3>
              <p className="text-black/40 dark:text-white/40 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                {L
                  ? "وصل طلبك بنجاح. سيراجع فريق HR طلبك ويتواصل معك خلال 3-5 أيام عمل."
                  : "We got your application. Our HR team will review it and reach out within 3-5 business days."}
              </p>
              <Button onClick={onClose} className="w-full h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-2xl font-black" data-testid="button-close-success">
                {L ? "ممتاز، إغلاق" : "Got it, Close"}
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="px-8 pt-8 pb-5 border-b border-black/[0.05] dark:border-white/[0.05]">
              <button onClick={onClose}
                className={`absolute top-6 ${L ? "left-6" : "right-6"} w-9 h-9 flex items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black/[0.10] dark:hover:bg-white/[0.10] transition-colors`}
                data-testid="button-close-drawer">
                <X className="w-4 h-4 text-black/50 dark:text-white/50" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-black dark:bg-white flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-white dark:text-black" />
                </div>
                <div>
                  <h2 className="font-black text-black dark:text-white leading-tight text-base">
                    {L ? (job?.titleAr || job?.title || "التقديم") : (job?.title || job?.titleAr || "Apply")}
                  </h2>
                  {job?.location && (
                    <p className="text-xs text-black/35 dark:text-white/35 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{job.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Step progress */}
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  {Array.from({ length: TOTAL }).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i + 1 <= step ? "bg-black dark:bg-white" : "bg-black/[0.08] dark:bg-white/[0.08]"}`} />
                  ))}
                </div>
                <p className="text-[10px] font-bold text-black/35 dark:text-white/35 uppercase tracking-widest">
                  {L ? `الخطوة ${step} من ${TOTAL} · ${stepTitles[step - 1]}` : `Step ${step} of ${TOTAL} · ${stepTitles[step - 1]}`}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto max-h-[60vh]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: L ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: L ? -30 : 30 }} className="px-8 py-6 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-black/40 dark:text-white/40 block mb-1.5">{L ? "الاسم الكامل" : "Full Name"} <span className="text-black dark:text-white">*</span></label>
                      <div className="relative">
                        <User className={`absolute top-3.5 ${L ? "right-3" : "left-3"} w-4 h-4 text-black/25 dark:text-white/25`} />
                        <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                          placeholder={L ? "محمد أحمد العنزي" : "John Doe"}
                          className={`${L ? "pr-10" : "pl-10"} h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20`}
                          data-testid="input-apply-name" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-black/40 dark:text-white/40 block mb-1.5">{L ? "البريد الإلكتروني" : "Email"} <span className="text-black dark:text-white">*</span></label>
                      <div className="relative">
                        <Mail className={`absolute top-3.5 ${L ? "right-3" : "left-3"} w-4 h-4 text-black/25 dark:text-white/25`} />
                        <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                          placeholder="name@example.com"
                          className={`${L ? "pr-10" : "pl-10"} h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20`}
                          dir="ltr" data-testid="input-apply-email" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-black/40 dark:text-white/40 block mb-1.5">{L ? "رقم الهاتف" : "Phone Number"}</label>
                      <div className="relative">
                        <Phone className={`absolute top-3.5 ${L ? "right-3" : "left-3"} w-4 h-4 text-black/25 dark:text-white/25`} />
                        <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="+966 5x xxx xxxx"
                          className={`${L ? "pr-10" : "pl-10"} h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20`}
                          dir="ltr" data-testid="input-apply-phone" />
                      </div>
                    </div>
                    <Button onClick={() => setStep(2)} disabled={!canNext1}
                      className="w-full h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-2xl font-black gap-2 mt-2"
                      data-testid="button-next-step-1">
                      {L ? "التالي" : "Continue"}
                      {L ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: L ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: L ? -30 : 30 }} className="px-8 py-6 space-y-4">
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 text-sm text-black/50 dark:text-white/50 leading-relaxed">
                      💡 {L ? "ارفع ملف PDF أو Word أو اترك رابط LinkedIn / Portfolio" : "Upload a PDF or Word file, or paste your LinkedIn / Portfolio link"}
                    </div>
                    <CVUploadZone L={L} form={form} setForm={setForm} />
                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="flex-1 h-12 rounded-2xl border border-black/10 dark:border-white/10 text-sm font-semibold text-black/50 dark:text-white/50 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
                        {L ? "رجوع" : "Back"}
                      </button>
                      <Button onClick={() => setStep(3)}
                        className="flex-1 h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-2xl font-black gap-2"
                        data-testid="button-next-step-2">
                        {L ? "التالي" : "Continue"}
                        {L ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: L ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: L ? -30 : 30 }} className="px-8 py-6 space-y-4">
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 text-sm text-black/50 dark:text-white/50 leading-relaxed">
                      💡 {L ? "أخبرنا عن نفسك: لماذا كيروكس؟ ما الذي يميزك؟ ما طموحك؟" : "Tell us about yourself: why Qirox? What sets you apart? What's your ambition?"}
                    </div>
                    <Textarea
                      value={form.coverLetter}
                      onChange={e => setForm({ ...form, coverLetter: e.target.value })}
                      placeholder={L ? "اكتب رسالتك هنا بحرية..." : "Write your message freely here..."}
                      rows={5}
                      className="rounded-xl resize-none bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20"
                      data-testid="textarea-apply-cover"
                    />

                    {/* Summary */}
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 space-y-2">
                      <p className="text-[10px] font-bold text-black/30 dark:text-white/30 uppercase tracking-widest mb-2">{L ? "ملخص طلبك" : "Your Summary"}</p>
                      <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50"><User className="w-3 h-3 shrink-0" />{form.fullName}</div>
                      <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50"><Mail className="w-3 h-3 shrink-0" />{form.email}</div>
                      {form.resumeFileName && <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50"><CheckCircle2 className="w-3 h-3 shrink-0" />{form.resumeFileName}</div>}
                      {form.resumeUrl && !form.resumeFileName && <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50"><Link2 className="w-3 h-3 shrink-0" />{L ? "رابط CV مرفق" : "CV link attached"}</div>}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="flex-1 h-12 rounded-2xl border border-black/10 dark:border-white/10 text-sm font-semibold text-black/50 dark:text-white/50 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
                        {L ? "رجوع" : "Back"}
                      </button>
                      <Button
                        onClick={() => applyMutation.mutate()}
                        disabled={applyMutation.isPending || !canSubmit}
                        className="flex-1 h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-2xl font-black gap-2"
                        data-testid="button-submit-application">
                        {applyMutation.isPending
                          ? <><Loader2 className="w-4 h-4 animate-spin" />{L ? "إرسال..." : "Sending..."}</>
                          : <><Send className="w-4 h-4" />{L ? "إرسال الطلب" : "Submit"}</>}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function JoinUs() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const { data: jobs = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/jobs"] });
  const openJobs = (jobs as any[]).filter((j: any) => j.status === "open");

  useSEO({
    title: L
      ? "وظائف كيروكس استوديو — انضم لفريقنا | التوظيف في الرياض"
      : "Qirox Studio Careers — Join Our Team | Hiring in Riyadh",
    description: L
      ? `كيروكس استوديو تبحث عن مبدعين ومطورين ومصممين للانضمام لفريقها في الرياض. ${openJobs.length > 0 ? openJobs.length + " وظيفة مفتوحة الآن." : "تقدّم بملفك المفتوح وسنتواصل معك."} بيئة عمل محترمة، فرص نمو حقيقية، تأثير مباشر.`
      : `Qirox Studio is hiring talented developers, designers, and creatives to join our Riyadh team. ${openJobs.length > 0 ? openJobs.length + " open positions." : "Submit an open application."} Respectful culture, real growth, direct impact.`,
    keywords: "وظائف كيروكس استوديو, وظائف قيروكس استوديو, وظائف برمجة الرياض, Qirox Studio careers, وظائف تقنية السعودية, مطلوب مطور مواقع الرياض, وظائف تصميم جرافيك, Qirox jobs, توظيف كيروكس, وظائف شركة برمجة, وظائف ريادة أعمال, وظائف مبيعات تقنية, كيروكس الرياض وظائف",
    canonical: "/join",
    ogType: "website",
    jsonLd: openJobs.length > 0 ? openJobs.map((job: any) => ({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.titleAr || job.title,
      "description": job.descriptionAr || job.description,
      "datePosted": (job.createdAt || new Date().toISOString()).split("T")[0],
      "employmentType": job.type === "full-time" || job.type === "دوام كامل" ? "FULL_TIME" : job.type === "part-time" ? "PART_TIME" : "FULL_TIME",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "Qirox Studio",
        "sameAs": "https://qiroxstudio.online",
        "logo": "https://qiroxstudio.online/qirox-icon.png"
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location || "الرياض",
          "addressRegion": "منطقة الرياض",
          "addressCountry": "SA"
        }
      },
      "validThrough": new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      "url": "https://qiroxstudio.online/join",
    })) : [{
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": "فرصة عمل مفتوحة — Qirox Studio",
      "description": "نقبل طلبات توظيف مفتوحة في التطوير والتصميم والمبيعات وخدمة العملاء في شركة كيروكس استوديو بالرياض",
      "datePosted": new Date().toISOString().split("T")[0],
      "employmentType": "FULL_TIME",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "Qirox Studio",
        "sameAs": "https://qiroxstudio.online",
        "logo": "https://qiroxstudio.online/qirox-icon.png"
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "الرياض",
          "addressCountry": "SA"
        }
      },
      "validThrough": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      "url": "https://qiroxstudio.online/join",
    }],
  });

  const openApply = (job: any) => setSelectedJob(job);
  const OPEN_APP = { id: "open", _id: "open", titleAr: "طلب مفتوح", title: "Open Application", location: L ? "الرياض، السعودية" : "Riyadh, Saudi Arabia" };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navigation />

      {/* ── Hero ── */}
      <section className="pt-36 pb-20 relative overflow-hidden">
        <PageGraphics variant="hero-light" />
        <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.045]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "36px 36px" }} />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/[0.07] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
              <span className="text-black/40 dark:text-white/40 text-xs font-semibold tracking-wider uppercase">
                {L ? "انضم لمصنع الأنظمة الرقمية" : "Join the Digital Systems Factory"}
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1}
              className="text-4xl md:text-6xl lg:text-7xl font-black font-heading text-black dark:text-white mb-5 tracking-tight leading-[1.05]">
              {L ? (
                <>اصنع شيئاً<br /><span className="text-black/20 dark:text-white/20">يهمّ</span></>
              ) : (
                <>Build something<br /><span className="text-black/20 dark:text-white/20">that matters</span></>
              )}
            </motion.h1>

            <motion.p variants={fadeUp} custom={2}
              className="text-black/40 dark:text-white/40 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              {L
                ? "QIROX ليست مجرد شركة — إنها مصنع أنظمة يُغيّر قطاعات. نبحث عن عقول تريد الأثر الحقيقي، لا مجرد عنوان وظيفي."
                : "QIROX isn't just a company — it's a systems factory reshaping industries. We seek minds that want real impact, not just a job title."}
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center justify-center gap-4">
              <a href="#positions"
                className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black text-sm hover:bg-black/90 dark:hover:bg-white/90 transition-all hover:scale-105 shadow-xl shadow-black/10 dark:shadow-white/10">
                <Briefcase className="w-4 h-4" />
                {L ? `استعرض ${openJobs.length} وظيفة` : `See ${openJobs.length} openings`}
              </a>
              <button onClick={() => openApply(OPEN_APP)}
                className="inline-flex items-center gap-2 border-2 border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 px-8 py-4 rounded-2xl font-semibold text-sm hover:border-black/30 dark:hover:border-white/30 hover:text-black dark:hover:text-white transition-all"
                data-testid="button-hero-open-apply">
                <Send className="w-4 h-4" />
                {L ? "تقديم مفتوح" : "Open Application"}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Perks ── */}
      <section className="py-16 bg-[#fafafa] dark:bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {getPerks(L).map((perk, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="bg-white dark:bg-gray-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 h-full hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all"
                  data-testid={`perk-card-${i}`}>
                  <div className="w-11 h-11 rounded-xl bg-black dark:bg-white flex items-center justify-center mb-4">
                    <perk.icon className="w-5 h-5 text-white dark:text-black" />
                  </div>
                  <h3 className="font-bold text-black dark:text-white text-sm mb-2">{perk.title}</h3>
                  <p className="text-xs text-black/40 dark:text-white/40 leading-relaxed">{perk.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Departments ── */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <p className="text-[11px] font-bold text-black/30 dark:text-white/30 tracking-[4px] uppercase mb-3">{L ? "أقسامنا" : "Departments"}</p>
            <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white">{L ? "أين ستجد مكانك؟" : "Where will you fit in?"}</h2>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {[
              { icon: Code2, label: L ? "التطوير" : "Development" },
              { icon: Palette, label: L ? "التصميم" : "Design" },
              { icon: BarChart3, label: L ? "التسويق" : "Marketing" },
              { icon: Users, label: L ? "خدمة العملاء" : "Support" },
              { icon: Globe, label: L ? "المبيعات" : "Sales" },
              { icon: Shield, label: L ? "العمليات" : "Operations" },
            ].map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.05] rounded-2xl p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center mx-auto mb-2">
                  <d.icon className="w-5 h-5 text-white dark:text-black" />
                </div>
                <p className="text-xs font-bold text-black dark:text-white">{d.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open Positions ── */}
      <section id="positions" className="py-20 bg-[#fafafa] dark:bg-gray-900/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10" dir={dir}>
            <span className="text-[11px] font-bold text-black/30 dark:text-white/30 tracking-[4px] uppercase">{L ? "الفرص المتاحة" : "Open Positions"}</span>
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-black dark:text-white mt-2">
              {isLoading ? (L ? "جاري التحميل..." : "Loading...") : openJobs.length > 0
                ? (L ? "ابحث عن دورك" : "Find your role")
                : (L ? "لا توجد وظائف مفتوحة حالياً" : "No Open Positions Currently")}
            </h2>
            {openJobs.length === 0 && !isLoading && (
              <p className="text-black/40 dark:text-white/40 text-sm mt-2">
                {L ? "نحن دائماً نبحث عن المواهب — أرسل لنا سيرتك المفتوحة وسنتواصل معك." : "We're always looking for talent — send your open application and we'll reach out."}
              </p>
            )}
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {openJobs.map((job: any, i: number) => {
                const Icon = categoryIcons[job.category] || categoryIcons.default;
                return (
                  <motion.div key={job._id || job.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                    <div className="group bg-white dark:bg-gray-900/60 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 hover:border-black/[0.12] dark:hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/[0.04] transition-all"
                      data-testid={`job-card-${job._id || job.id}`}>
                      <div className="flex items-start justify-between gap-4" dir={dir}>
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0 group-hover:bg-black dark:group-hover:bg-white transition-colors">
                            <Icon className="w-5 h-5 text-black/40 dark:text-white/40 group-hover:text-white dark:group-hover:text-black transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-black dark:text-white text-base mb-1">
                              {L ? (job.titleAr || job.title) : (job.title || job.titleAr)}
                            </h3>
                            <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed mb-3 line-clamp-2">
                              {L ? (job.descriptionAr || job.description) : (job.description || job.descriptionAr)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {job.type && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black/50 dark:text-white/50 border border-black/[0.06] dark:border-white/[0.06]">
                                  {job.type}
                                </span>
                              )}
                              {job.location && (
                                <span className="flex items-center gap-1 text-[11px] text-black/35 dark:text-white/35">
                                  <MapPin className="w-3 h-3" />{job.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => openApply(job)}
                          className="flex-shrink-0 h-10 px-5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:bg-gray-900 dark:hover:bg-gray-100 gap-1.5"
                          data-testid={`button-apply-${job._id || job.id}`}>
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

          {/* Open application banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-10 rounded-2xl border-2 border-dashed border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900/40 p-8 text-center"
            data-testid="open-application-banner">
            <div className="w-14 h-14 rounded-2xl bg-black dark:bg-white flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-6 h-6 text-white dark:text-black" />
            </div>
            <h3 className="font-bold text-black dark:text-white text-base mb-2">{L ? "لا تجد وظيفة مناسبة؟" : "Can't find a suitable position?"}</h3>
            <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed mb-6 max-w-sm mx-auto">
              {L
                ? "أرسل طلبك المفتوح. إذا كنت تؤمن أنك ستضيف قيمة لفريقنا، نريد أن نسمع منك."
                : "Submit an open application. If you believe you'll add value to our team, we want to hear from you."}
            </p>
            <Button onClick={() => openApply(OPEN_APP)}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 px-8 rounded-xl font-bold gap-2"
              data-testid="button-open-application">
              <Send className="w-4 h-4" />
              {L ? "إرسال طلب مفتوح" : "Submit Open Application"}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="py-24 bg-black dark:bg-gray-950 relative overflow-hidden">
        <PageGraphics variant="hero-light" />
        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-white/30 text-xs uppercase tracking-[4px] mb-4">{L ? "ابدأ رحلتك" : "Start your journey"}</p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight">
              {L ? "أرسل طلبك اليوم" : "Apply Today"}
            </h2>
            <p className="text-white/35 mb-8 text-base leading-relaxed">
              {L
                ? "بغض النظر عن الوظائف المعلنة — إذا كنت موهوباً ومتحمساً، نريد أن نعرفك"
                : "Regardless of posted openings — if you're talented and passionate, we want to meet you"}
            </p>
            <button
              onClick={() => openApply(OPEN_APP)}
              className="inline-flex items-center gap-2 bg-white text-black px-10 py-4 rounded-2xl font-black text-sm hover:bg-white/90 transition-all hover:scale-105 shadow-2xl shadow-white/10"
              data-testid="button-cta-apply">
              <Rocket className="w-4 h-4" />
              {L ? "تقدّم الآن" : "Apply Now"}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Apply Modal */}
      <AnimatePresence>
        {selectedJob && (
          <ApplyDrawer
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            L={L}
            dir={dir}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
