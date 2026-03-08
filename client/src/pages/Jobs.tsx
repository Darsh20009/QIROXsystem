import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Loader2, Briefcase, MapPin, Clock, DollarSign,
  ArrowLeft, Users, X, Rocket, Heart, Zap, Globe,
  Star, CheckCircle2, ChevronRight, Sparkles,
  Code2, Palette, BarChart3, Headphones, Shield,
  Send, User, Mail, Phone, FileText, ArrowRight,
  Upload, File, Link2
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  type?: string;
  salaryRange?: string;
  status: string;
  createdAt: string;
}

const typeLabels: Record<string, { ar: string; en: string; color: string }> = {
  "full-time":  { ar: "دوام كامل",  en: "Full Time",   color: "bg-blue-500" },
  "part-time":  { ar: "دوام جزئي",  en: "Part Time",   color: "bg-purple-500" },
  "remote":     { ar: "عن بُعد",    en: "Remote",      color: "bg-green-500" },
  "freelance":  { ar: "مستقل",      en: "Freelance",   color: "bg-orange-500" },
  "internship": { ar: "تدريب",      en: "Internship",  color: "bg-pink-500" },
};

const departments = [
  { icon: Code2,     ar: "التطوير",        en: "Development",   color: "from-blue-500 to-cyan-500",     bg: "bg-blue-50 dark:bg-blue-950/30" },
  { icon: Palette,   ar: "التصميم",        en: "Design",        color: "from-pink-500 to-rose-500",     bg: "bg-pink-50 dark:bg-pink-950/30" },
  { icon: BarChart3, ar: "التسويق",        en: "Marketing",     color: "from-orange-500 to-amber-500",  bg: "bg-orange-50 dark:bg-orange-950/30" },
  { icon: Headphones,ar: "خدمة العملاء",   en: "Support",       color: "from-green-500 to-emerald-500", bg: "bg-green-50 dark:bg-green-950/30" },
  { icon: Shield,    ar: "العمليات",       en: "Operations",    color: "from-purple-500 to-violet-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { icon: Globe,     ar: "المبيعات",       en: "Sales",         color: "from-teal-500 to-sky-500",      bg: "bg-teal-50 dark:bg-teal-950/30" },
];

const values = [
  { icon: Rocket, ar: "نبتكر أولاً",      en: "Innovation First",  desc_ar: "نحن نبني المستقبل قبل أن يصبح حاضراً",               desc_en: "We build the future before it becomes present" },
  { icon: Heart,  ar: "نهتم فعلاً",       en: "We Truly Care",     desc_ar: "كل عميل وكل موظف مهم لنا بشكل حقيقي",               desc_en: "Every client and every employee truly matters" },
  { icon: Zap,    ar: "نتحرك بسرعة",     en: "Move Fast",          desc_ar: "السرعة مع الجودة هي معادلتنا السرية",                desc_en: "Speed with quality is our secret formula" },
  { icon: Star,   ar: "معايير عالية",    en: "High Standards",     desc_ar: "لا نقبل أقل من الاستثنائي في كل ما نصنعه",          desc_en: "We accept nothing less than exceptional" },
];

const stats = [
  { value: "50+",  ar: "مشروع أُنجز",     en: "Projects Done" },
  { value: "12",   ar: "عضو في الفريق",   en: "Team Members" },
  { value: "98%",  ar: "رضا العملاء",     en: "Client Satisfaction" },
  { value: "4",    ar: "سنوات خبرة",      en: "Years Experience" },
];

interface ApplicationForm {
  name: string;
  email: string;
  phone: string;
  coverLetter: string;
  cvUrl: string;
  cvFileName: string;
}
const emptyForm: ApplicationForm = { name: "", email: "", phone: "", coverLetter: "", cvUrl: "", cvFileName: "" };

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <PageGraphics variant="hero-light" />
      {[
        { w: 400, h: 400, top: "-10%", right: "-5%",  from: "from-blue-400/10",  to: "to-purple-400/10",  dur: 8 },
        { w: 300, h: 300, top: "30%",  left: "-8%",   from: "from-pink-400/10",  to: "to-orange-400/10",  dur: 10 },
        { w: 200, h: 200, top: "60%",  right: "10%",  from: "from-green-400/10", to: "to-cyan-400/10",    dur: 7 },
        { w: 150, h: 150, top: "15%",  left: "30%",   from: "from-amber-400/8",  to: "to-red-400/8",      dur: 12 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${orb.from} ${orb.to} blur-3xl`}
          style={{ width: orb.w, height: orb.h, top: orb.top, ...(orb.right ? { right: orb.right } : { left: orb.left }) }}
          animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function GridPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="jobs-grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#jobs-grid)" />
    </svg>
  );
}

function StatCounter({ value, lang }: { value: string; lang: string }) {
  const [displayed, setDisplayed] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const num = parseInt(value.replace(/\D/g, ""));
    const suffix = value.replace(/[0-9]/g, "");
    let start = 0;
    const step = Math.ceil(num / 40);
    const timer = setInterval(() => {
      start = Math.min(start + step, num);
      setDisplayed(start + suffix);
      if (start >= num) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span ref={ref}>{displayed}</span>;
}

function JobCard({ job, index, lang, onOpen, onApply }: { job: Job; index: number; lang: string; onOpen: () => void; onApply: (e: React.MouseEvent) => void }) {
  const typeMeta = typeLabels[job.type || ""] || { ar: job.type || "", en: job.type || "", color: "bg-gray-500" };
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), { stiffness: 200, damping: 30 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() { mouseX.set(0); mouseY.set(0); }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onOpen}
      data-testid={`card-job-${job.id}`}
      className="group relative cursor-pointer"
    >
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/40 hover:border-black/20 dark:hover:border-white/20">
        {/* Gradient bar top */}
        <div className={`h-1 w-full bg-gradient-to-r ${typeMeta.color === "bg-blue-500" ? "from-blue-400 to-cyan-400" : typeMeta.color === "bg-green-500" ? "from-green-400 to-emerald-400" : typeMeta.color === "bg-purple-500" ? "from-purple-400 to-violet-400" : typeMeta.color === "bg-orange-500" ? "from-orange-400 to-amber-400" : typeMeta.color === "bg-pink-500" ? "from-pink-400 to-rose-400" : "from-gray-400 to-gray-500"}`} />

        {/* Hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="p-7">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {job.type && (
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${typeMeta.color} text-white px-3 py-1 rounded-full`}>
                    {lang === "ar" ? typeMeta.ar : typeMeta.en}
                  </span>
                )}
                <span className="text-[10px] font-medium text-black/30 dark:text-white/30 border border-black/10 dark:border-white/10 px-2.5 py-0.5 rounded-full">
                  {lang === "ar" ? "مفتوح الآن" : "Open Now"}
                </span>
              </div>
              <h2 className="text-xl font-black text-black dark:text-white leading-tight mb-2 group-hover:text-black/80 dark:group-hover:text-white/80 transition-colors">
                {job.title}
              </h2>
              <p className="text-sm text-black/50 dark:text-white/50 line-clamp-2 leading-relaxed">{job.description}</p>
            </div>

            {/* Icon box */}
            <div className={`w-14 h-14 rounded-2xl ${typeMeta.color} shrink-0 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Briefcase className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Meta tags */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {job.location && (
              <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.04] rounded-lg px-3 py-1.5">
                <MapPin className="w-3 h-3 text-black/40 dark:text-white/40" />
                <span className="text-xs font-medium text-black/50 dark:text-white/50">{job.location}</span>
              </div>
            )}
            {job.salaryRange && (
              <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.04] rounded-lg px-3 py-1.5">
                <DollarSign className="w-3 h-3 text-black/40 dark:text-white/40" />
                <span className="text-xs font-medium text-black/50 dark:text-white/50">{job.salaryRange}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.04] rounded-lg px-3 py-1.5">
              <Clock className="w-3 h-3 text-black/40 dark:text-white/40" />
              <span className="text-xs font-medium text-black/50 dark:text-white/50">
                {new Date(job.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className={`flex-1 h-11 ${typeMeta.color === "bg-blue-500" ? "bg-blue-500 hover:bg-blue-600" : typeMeta.color === "bg-green-500" ? "bg-green-500 hover:bg-green-600" : typeMeta.color === "bg-purple-500" ? "bg-purple-500 hover:bg-purple-600" : typeMeta.color === "bg-orange-500" ? "bg-orange-500 hover:bg-orange-600" : typeMeta.color === "bg-pink-500" ? "bg-pink-500 hover:bg-pink-600" : "bg-black hover:bg-black/80"} text-white rounded-xl font-bold gap-2 shadow-lg shadow-${typeMeta.color.replace("bg-", "")}/30`}
              onClick={onApply}
              data-testid={`button-apply-${job.id}`}
            >
              <Send className="w-3.5 h-3.5" />
              {lang === "ar" ? "تقدّم الآن" : "Apply Now"}
            </Button>
            <button
              onClick={onOpen}
              className="h-11 px-4 rounded-xl border-2 border-black/10 dark:border-white/10 text-sm font-semibold text-black/50 dark:text-white/50 hover:border-black/30 dark:hover:border-white/30 hover:text-black dark:hover:text-white transition-all flex items-center gap-1.5"
            >
              {lang === "ar" ? "التفاصيل" : "Details"}
              {lang === "ar" ? <ChevronRight className="w-4 h-4 rotate-180" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CVUploadZone({ lang, form, setForm, gradientColor }: { lang: string; form: ApplicationForm; setForm: any; gradientColor: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const doUpload = async (file: File) => {
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      return toast({ title: lang === "ar" ? "نوع الملف غير مدعوم. استخدم PDF أو Word" : "File type not supported. Use PDF or Word", variant: "destructive" });
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast({ title: lang === "ar" ? "حجم الملف كبير جداً (الحد 5 ميغابايت)" : "File too large (max 5MB)", variant: "destructive" });
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setForm((f: ApplicationForm) => ({ ...f, cvUrl: data.url, cvFileName: file.name }));
        toast({ title: lang === "ar" ? "تم رفع الملف بنجاح" : "File uploaded successfully" });
      }
    } catch {
      toast({ title: lang === "ar" ? "فشل رفع الملف" : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  };

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); }} data-testid="input-file-cv" />

      {form.cvFileName ? (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed bg-gradient-to-r ${gradientColor} bg-opacity-5 border-current/20`}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <File className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{form.cvFileName}</p>
            <p className="text-[10px] text-white/60">{lang === "ar" ? "تم الرفع بنجاح ✓" : "Uploaded successfully ✓"}</p>
          </div>
          <button onClick={() => setForm((f: ApplicationForm) => ({ ...f, cvUrl: "", cvFileName: "" }))}
            className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shrink-0">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`w-full rounded-2xl border-2 border-dashed transition-all duration-200 p-8 text-center cursor-pointer
            ${dragging ? "border-white/60 bg-white/10 scale-[1.01]" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}
          data-testid="button-upload-cv">
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
              <p className="text-sm text-white/60">{lang === "ar" ? "جاري الرفع..." : "Uploading..."}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <Upload className="w-7 h-7 text-white/60" />
              </div>
              <div>
                <p className="text-sm font-bold text-white/80">{lang === "ar" ? "اسحب ملفك هنا أو اضغط للاختيار" : "Drag your file here or click to browse"}</p>
                <p className="text-[11px] text-white/40 mt-1">{lang === "ar" ? "PDF, Word, JPG — حد أقصى 5MB" : "PDF, Word, JPG — max 5MB"}</p>
              </div>
            </div>
          )}
        </button>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] text-white/30 font-medium uppercase tracking-widest">{lang === "ar" ? "أو" : "or"}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="relative">
        <Link2 className="absolute top-3.5 right-3 w-4 h-4 text-white/30" />
        <Input value={form.cvUrl && !form.cvFileName ? form.cvUrl : ""}
          onChange={e => setForm((f: ApplicationForm) => ({ ...f, cvUrl: e.target.value, cvFileName: "" }))}
          placeholder={lang === "ar" ? "أو الصق رابط CV مباشرة..." : "Or paste your CV link directly..."}
          className="pr-10 h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:bg-white/15"
          dir="ltr" data-testid="input-cv-url" />
      </div>
    </div>
  );
}

function ApplyModal({ job, onClose, lang }: { job: Job; onClose: () => void; lang: string }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const TOTAL_STEPS = 3;

  const applyMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/apply`, {
      jobId: job.id, fullName: form.name, email: form.email,
      phone: form.phone, resumeUrl: form.cvUrl, coverLetter: form.coverLetter,
    }),
    onSuccess: () => setSubmitted(true),
    onError: () => toast({ title: lang === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Error occurred, please try again", variant: "destructive" }),
  });

  const typeMeta = typeLabels[job.type || ""] || { ar: "", en: "", color: "bg-black" };
  const gradientColor = typeMeta.color === "bg-blue-500" ? "from-blue-500 to-cyan-500" : typeMeta.color === "bg-green-500" ? "from-green-500 to-emerald-500" : typeMeta.color === "bg-purple-500" ? "from-purple-500 to-violet-500" : typeMeta.color === "bg-orange-500" ? "from-orange-500 to-amber-500" : typeMeta.color === "bg-pink-500" ? "from-pink-500 to-rose-500" : "from-gray-800 to-black";

  const stepTitles = lang === "ar"
    ? ["معلوماتك الشخصية", "السيرة الذاتية", "رسالة التقديم"]
    : ["Personal Info", "Resume / CV", "Cover Letter"];

  const canNext1 = !!form.name && !!form.email;
  const canNext2 = true;
  const canSubmit = !!form.coverLetter.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 30 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[94vh] overflow-hidden rounded-[2.5rem] shadow-2xl"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {/* Full gradient background */}
        <div className={`bg-gradient-to-br ${gradientColor} min-h-full`}>

          {/* Decorative circles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[["-top-16", "-right-16", "w-64 h-64"], ["top-1/3", "-left-20", "w-48 h-48"], ["bottom-0", "right-1/4", "w-32 h-32"]].map(([t, l, s], i) => (
              <div key={i} className={`absolute ${s} rounded-full border border-white/10 bg-white/5`} style={{ top: t?.startsWith("-") ? t : undefined, bottom: t?.startsWith("b") ? "0" : undefined, right: l?.startsWith("-r") || l?.startsWith("r") ? (l.startsWith("r") ? "25%" : l.replace("-right-", "")) + (l.startsWith("r") ? "" : "px") : undefined, left: l?.startsWith("-l") ? l.replace("-left-", "") + "px" : undefined }} />
            ))}
          </div>

          {/* Header */}
          <div className="relative px-8 pt-8 pb-6">
            <button onClick={onClose} className="absolute top-7 left-7 w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors z-10">
              <X className="w-4 h-4 text-white" />
            </button>

            {!submitted && (
              <div className="mb-5">
                <div className="flex items-center gap-1.5 mb-1">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i + 1 <= step ? "bg-white" : "bg-white/20"}`} />
                  ))}
                </div>
                <p className="text-white/50 text-[11px] font-semibold tracking-widest uppercase">
                  {lang === "ar" ? `الخطوة ${step} من ${TOTAL_STEPS} · ${stepTitles[step - 1]}` : `Step ${step} of ${TOTAL_STEPS} · ${stepTitles[step - 1]}`}
                </p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-2xl ${typeMeta.color} bg-white/20 flex items-center justify-center shrink-0`}>
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-tight">{job.title}</h2>
                {job.location && <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{job.location}</p>}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white/[0.07] backdrop-blur-sm rounded-t-[2rem] min-h-[380px] overflow-y-auto max-h-[60vh]">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-8 py-12 text-center">
                <motion.div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.15 }}>
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-2xl font-black text-white mb-2">{lang === "ar" ? "تم إرسال طلبك! 🎉" : "Application Sent! 🎉"}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                  {lang === "ar" ? "وصل طلبك بنجاح. سيراجع فريق HR طلبك وسيتواصل معك خلال 3-5 أيام عمل." : "We got your application. Our HR team will review it and reach out within 3-5 business days."}
                </p>
                <Button onClick={onClose} className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-2xl font-black text-sm">
                  {lang === "ar" ? "ممتاز، إغلاق" : "Got it, Close"}
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {/* Step 1 — Personal Info */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: lang === "ar" ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: lang === "ar" ? 30 : -30 }} className="px-8 py-6 space-y-4">
                    <div className="relative">
                      <User className="absolute top-3.5 right-3 w-4 h-4 text-white/40" />
                      <Input value={form.name} onChange={e => setForm((f: ApplicationForm) => ({ ...f, name: e.target.value }))}
                        placeholder={lang === "ar" ? "الاسم الكامل *" : "Full Name *"}
                        className="pr-10 h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:bg-white/15"
                        data-testid="input-apply-name" />
                    </div>
                    <div className="relative">
                      <Mail className="absolute top-3.5 right-3 w-4 h-4 text-white/40" />
                      <Input type="email" value={form.email} onChange={e => setForm((f: ApplicationForm) => ({ ...f, email: e.target.value }))}
                        placeholder={lang === "ar" ? "البريد الإلكتروني *" : "Email Address *"}
                        className="pr-10 h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:bg-white/15"
                        data-testid="input-apply-email" />
                    </div>
                    <div className="relative">
                      <Phone className="absolute top-3.5 right-3 w-4 h-4 text-white/40" />
                      <Input value={form.phone} onChange={e => setForm((f: ApplicationForm) => ({ ...f, phone: e.target.value }))}
                        placeholder={lang === "ar" ? "رقم الجوال" : "Phone Number"}
                        className="pr-10 h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:bg-white/15"
                        data-testid="input-apply-phone" />
                    </div>
                    <Button onClick={() => setStep(2)} disabled={!canNext1}
                      className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-2xl font-black text-sm gap-2 mt-2"
                      data-testid="button-next-step">
                      {lang === "ar" ? "التالي" : "Continue"}
                      {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    </Button>
                  </motion.div>
                )}

                {/* Step 2 — CV Upload */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: lang === "ar" ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: lang === "ar" ? 30 : -30 }} className="px-8 py-6 space-y-4">
                    <p className="text-white/60 text-xs leading-relaxed">
                      {lang === "ar" ? "ارفع سيرتك الذاتية من جهازك مباشرة (اختياري لكن يُنصح به)" : "Upload your resume from your device (optional but recommended)"}
                    </p>
                    <CVUploadZone lang={lang} form={form} setForm={setForm} gradientColor={gradientColor} />
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setStep(1)} className="flex-1 h-12 rounded-2xl border border-white/20 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors">
                        {lang === "ar" ? "رجوع" : "Back"}
                      </button>
                      <Button onClick={() => setStep(3)} disabled={!canNext2}
                        className="flex-1 h-12 bg-white text-black hover:bg-white/90 rounded-2xl font-black text-sm gap-2"
                        data-testid="button-next-step-2">
                        {lang === "ar" ? "التالي" : "Continue"}
                        {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3 — Cover Letter */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: lang === "ar" ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: lang === "ar" ? 30 : -30 }} className="px-8 py-6 space-y-4">
                    <div className="bg-white/10 rounded-2xl p-4">
                      <p className="text-white/70 text-xs leading-relaxed">
                        {lang === "ar"
                          ? "💡 اكتب ببضع جمل: لماذا أنت الشخص المناسب؟ ما الذي يميزك؟ ما طموحك في هذه الوظيفة؟"
                          : "💡 Write briefly: Why are you the right fit? What sets you apart? What's your ambition here?"}
                      </p>
                    </div>
                    <Textarea value={form.coverLetter} onChange={e => setForm((f: ApplicationForm) => ({ ...f, coverLetter: e.target.value }))}
                      placeholder={lang === "ar" ? "اكتب رسالتك هنا..." : "Write your cover letter here..."}
                      className="h-40 resize-none rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50 focus:bg-white/15"
                      data-testid="textarea-apply-letter" />

                    {/* Summary */}
                    <div className="bg-white/10 rounded-2xl p-4 text-xs space-y-1.5">
                      <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-2">{lang === "ar" ? "ملخص طلبك" : "Your Summary"}</p>
                      <div className="flex items-center gap-2 text-white/70"><User className="w-3 h-3" />{form.name}</div>
                      <div className="flex items-center gap-2 text-white/70"><Mail className="w-3 h-3" />{form.email}</div>
                      {form.cvFileName && <div className="flex items-center gap-2 text-green-300"><CheckCircle2 className="w-3 h-3" />{form.cvFileName}</div>}
                      {form.cvUrl && !form.cvFileName && <div className="flex items-center gap-2 text-white/70"><Link2 className="w-3 h-3" />{lang === "ar" ? "رابط CV مرفق" : "CV link attached"}</div>}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="flex-1 h-12 rounded-2xl border border-white/20 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors">
                        {lang === "ar" ? "رجوع" : "Back"}
                      </button>
                      <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending || !canSubmit}
                        className="flex-1 h-12 bg-white text-black hover:bg-white/90 rounded-2xl font-black text-sm gap-2"
                        data-testid="button-submit-application">
                        {applyMutation.isPending
                          ? <><Loader2 className="w-4 h-4 animate-spin" />{lang === "ar" ? "إرسال..." : "Sending..."}</>
                          : <><Send className="w-4 h-4" />{lang === "ar" ? "إرسال الطلب" : "Submit Application"}</>}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function JobDetailModal({ job, onClose, onApply, lang }: { job: Job; onClose: () => void; onApply: () => void; lang: string }) {
  const typeMeta = typeLabels[job.type || ""] || { ar: "", en: "", color: "bg-gray-500" };
  const gradientColor = typeMeta.color === "bg-blue-500" ? "from-blue-500 to-cyan-500" : typeMeta.color === "bg-green-500" ? "from-green-500 to-emerald-500" : typeMeta.color === "bg-purple-500" ? "from-purple-500 to-violet-500" : typeMeta.color === "bg-orange-500" ? "from-orange-500 to-amber-500" : typeMeta.color === "bg-pink-500" ? "from-pink-500 to-rose-500" : "from-black to-gray-800";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white dark:bg-gray-950 rounded-[2rem] max-w-2xl w-full max-h-[88vh] overflow-hidden shadow-2xl"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className={`bg-gradient-to-br ${gradientColor} px-8 pt-8 pb-10 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-[0.08]">
            <GridPattern />
          </div>
          <button onClick={onClose} className="absolute top-5 left-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10">
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="relative z-10">
            <div className="flex flex-wrap gap-2 mb-3">
              {job.type && <span className="bg-white/20 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">{lang === "ar" ? typeMeta.ar : typeMeta.en}</span>}
              <span className="bg-white/20 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">{lang === "ar" ? "مفتوح" : "Open"}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-3">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-white/70">
              {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.location}</span>}
              {job.salaryRange && <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" />{job.salaryRange}</span>}
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{new Date(job.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[50vh] px-8 py-6 space-y-6">
          <div>
            <p className="text-[11px] font-bold text-black/30 dark:text-white/30 uppercase tracking-[3px] mb-3">{lang === "ar" ? "الوصف الوظيفي" : "Job Description"}</p>
            <p className="text-sm text-black/70 dark:text-white/70 leading-[1.9] whitespace-pre-line">{job.description}</p>
          </div>
          {job.requirements && (
            <div>
              <p className="text-[11px] font-bold text-black/30 dark:text-white/30 uppercase tracking-[3px] mb-3">{lang === "ar" ? "المتطلبات" : "Requirements"}</p>
              <div className="space-y-2">
                {job.requirements.split("\n").filter(Boolean).map((req, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-black/70 dark:text-white/70 leading-relaxed">{req}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-8 py-5 border-t border-black/[0.06] dark:border-white/[0.06]">
          <Button onClick={onApply} className={`w-full h-12 bg-gradient-to-r ${gradientColor} text-white rounded-xl font-bold gap-2 shadow-lg text-sm`} data-testid="button-apply-from-detail">
            <Send className="w-4 h-4" />
            {lang === "ar" ? "تقدّم لهذه الوظيفة الآن" : "Apply for This Position Now"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Jobs() {
  const { lang, dir } = useI18n();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const r = await fetch("/api/jobs");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const openJobs = jobs.filter(j => j.status === "open");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* ─── HERO ─── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-black dark:bg-gray-950 pt-16">
        <GridPattern />
        <FloatingOrbs />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 border border-white/20 rounded-full px-5 py-2.5 mb-8 bg-white/5 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white/70">
                {lang === "ar" ? "نحن نبني المستقبل — انضم إلينا" : "We're building the future — Join us"}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight"
            >
              {lang === "ar" ? (
                <>
                  اصنع شيئاً<br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">يهمّ</span>
                </>
              ) : (
                <>
                  Build something<br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">that matters</span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {lang === "ar"
                ? "QIROX ليست مجرد شركة — إنها مصنع أنظمة يُغيّر قطاعات. نبحث عن عقول تريد الأثر الحقيقي"
                : "QIROX isn't just a company — it's a systems factory reshaping industries. We seek minds that want real impact"}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <a href="#positions" className={`inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-black text-sm hover:bg-white/90 transition-all hover:scale-105 shadow-xl shadow-white/10`}>
                <Briefcase className="w-4 h-4" />
                {lang === "ar" ? `استعرض ${openJobs.length} وظيفة` : `See ${openJobs.length} openings`}
              </a>
              <a href="#culture" className="inline-flex items-center gap-2 border border-white/20 text-white/70 px-8 py-4 rounded-2xl font-semibold text-sm hover:border-white/40 hover:text-white transition-all">
                {lang === "ar" ? "ثقافة العمل" : "Our Culture"}
                {lang === "ar" ? <ChevronRight className="w-4 h-4 rotate-180" /> : <ChevronRight className="w-4 h-4" />}
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      </section>

      {/* ─── STATS ─── */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center py-8 px-4 border border-black/[0.06] dark:border-white/[0.06] first:rounded-r-2xl last:rounded-l-2xl"
              >
                <p className="text-4xl font-black text-black dark:text-white mb-1">
                  <StatCounter value={stat.value} lang={lang} />
                </p>
                <p className="text-xs text-black/40 dark:text-white/40 font-medium">{lang === "ar" ? stat.ar : stat.en}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEPARTMENTS ─── */}
      <section className="py-20 bg-[#fafafa] dark:bg-gray-900/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-[11px] font-bold text-black/30 dark:text-white/30 tracking-[4px] uppercase mb-3">{lang === "ar" ? "أقسامنا" : "Departments"}</p>
            <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white">{lang === "ar" ? "أين ستجد مكانك؟" : "Where will you fit in?"}</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {departments.map((dept, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`${dept.bg} border border-black/[0.05] dark:border-white/[0.05] rounded-2xl p-5 cursor-default`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${dept.color} flex items-center justify-center mb-3 shadow-md`}>
                  <dept.icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-black text-black dark:text-white text-sm">{lang === "ar" ? dept.ar : dept.en}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUES ─── */}
      <section id="culture" className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[11px] font-bold text-black/30 dark:text-white/30 tracking-[4px] uppercase mb-3">{lang === "ar" ? "ثقافتنا" : "Our Culture"}</p>
            <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white mb-4">{lang === "ar" ? "نؤمن بهذه المبادئ" : "We believe in these principles"}</h2>
            <p className="text-black/40 dark:text-white/40 max-w-xl mx-auto">{lang === "ar" ? "هذه ليست شعارات — هي الطريقة التي نعمل بها كل يوم" : "These aren't slogans — they're how we work every day"}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group flex gap-4 bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-black dark:bg-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <v.icon className="w-5 h-5 text-white dark:text-black" />
                </div>
                <div>
                  <p className="font-black text-black dark:text-white mb-1">{lang === "ar" ? v.ar : v.en}</p>
                  <p className="text-sm text-black/45 dark:text-white/45 leading-relaxed">{lang === "ar" ? v.desc_ar : v.desc_en}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POSITIONS ─── */}
      <section id="positions" className="py-20 bg-[#fafafa] dark:bg-gray-900/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-[11px] font-bold text-black/30 dark:text-white/30 tracking-[4px] uppercase mb-3">{lang === "ar" ? "الفرص المتاحة" : "Open Roles"}</p>
            <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white mb-3">{lang === "ar" ? "ابحث عن دورك" : "Find your role"}</h2>
            {openJobs.length > 0 && (
              <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-bold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {openJobs.length} {lang === "ar" ? "وظيفة مفتوحة" : "open positions"}
              </div>
            )}
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin" />
                <p className="text-sm text-black/30 dark:text-white/30">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
              </div>
            </div>
          ) : openJobs.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-24 h-24 bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Briefcase className="w-10 h-10 text-black/20 dark:text-white/20" />
              </motion.div>
              <h3 className="text-xl font-black text-black/40 dark:text-white/40 mb-2">{lang === "ar" ? "لا توجد وظائف مفتوحة حالياً" : "No open positions right now"}</h3>
              <p className="text-sm text-black/25 dark:text-white/25 mb-8">{lang === "ar" ? "نحن دائماً نبحث عن المواهب — أرسل لنا سيرتك الذاتية وسنتواصل معك" : "We're always looking for talent — send your CV and we'll reach out"}</p>
              <a href="mailto:info@qiroxstudio.online"
                className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">
                <Send className="w-4 h-4" />
                {lang === "ar" ? "أرسل سيرتك الذاتية" : "Send your CV"}
              </a>
            </motion.div>
          ) : (
            <div className="grid gap-5">
              {openJobs.map((job, i) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={i}
                  lang={lang}
                  onOpen={() => setSelectedJob(job)}
                  onApply={e => { e.stopPropagation(); setApplyJob(job); }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA BOTTOM ─── */}
      <section className="py-24 bg-black dark:bg-gray-950 relative overflow-hidden">
        <FloatingOrbs />
        <GridPattern />
        <div className="relative z-10 text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-white/40 text-sm uppercase tracking-[3px] mb-4">{lang === "ar" ? "لم تجد ما تبحث عنه؟" : "Didn't find what you're looking for?"}</p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-5">
              {lang === "ar" ? "أرسل طلبك المفتوح" : "Send an open application"}
            </h2>
            <p className="text-white/40 max-w-xl mx-auto mb-8">
              {lang === "ar" ? "إذا كنت تؤمن أنك ستضيف قيمة لفريقنا، نريد أن نسمع منك بغض النظر عن الوظائف المعلنة"
                : "If you believe you'll add value to our team, we want to hear from you regardless of posted openings"}
            </p>
            <a href="mailto:info@qiroxstudio.online"
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-black text-sm hover:bg-white/90 transition-all hover:scale-105 shadow-xl shadow-white/10">
              <Mail className="w-4 h-4" />
              info@qiroxstudio.online
            </a>
          </motion.div>
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {selectedJob && (
          <JobDetailModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onApply={() => { setApplyJob(selectedJob); setSelectedJob(null); }}
            lang={lang}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} lang={lang} />}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
