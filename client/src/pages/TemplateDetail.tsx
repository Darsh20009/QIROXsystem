import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import type { SectorTemplate } from "@shared/schema";
import {
  ArrowRight, Play, Globe, Download, BookOpen,
  Loader2, ChevronLeft, ExternalLink, Package,
  CheckCircle2, Zap, Star, FileText, Video,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

const TIER_META: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
  lite:     { label: "لايت",    color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   desc: "الباقة الأساسية — كل ما تحتاجه للبداية" },
  pro:      { label: "برو",     color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", desc: "الباقة الاحترافية — للمشاريع المتوسطة والكبيرة" },
  infinite: { label: "إنفينيت", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  desc: "الباقة الكاملة — بلا حدود لأكبر المشاريع" },
  custom:   { label: "مخصص",   color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-200",   desc: "باقة مخصصة حسب احتياجك" },
};

function getVideoEmbed(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
  return null;
}

export default function TemplateDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const { data: template, isLoading, isError } = useQuery<SectorTemplate>({
    queryKey: ["/api/templates/slug", slug],
    queryFn: () => fetch(`/api/templates/slug/${slug}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    enabled: !!slug,
  });

  const color = template?.heroColor || "#0f172a";
  const tier = template?.tier ? TIER_META[template.tier] : null;
  const videoEmbed = template?.howToUseVideoUrl ? getVideoEmbed(template.howToUseVideoUrl) : null;
  const isDirectVideo = template?.howToUseVideoUrl && !videoEmbed && !template.howToUseVideoUrl.includes("youtube") && !template.howToUseVideoUrl.includes("vimeo");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir={dir}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-black/20 dark:text-white/20" />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !template) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir={dir}>
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Globe className="w-16 h-16 text-black/10 dark:text-white/10" />
          <p className="text-black/40 dark:text-white/40 font-bold text-xl">
            {L ? "النموذج غير موجود" : "Template not found"}
          </p>
          <Link href="/demos">
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="w-4 h-4" /> {L ? "العودة للنماذج" : "Back to Demos"}
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Hero Banner */}
      <div className="relative overflow-hidden pt-24 pb-16" style={{ backgroundColor: color }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link href="/demos">
              <button className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm font-medium" data-testid="btn-back-to-demos">
                <ChevronLeft className="w-4 h-4" />
                {L ? "النماذج" : "Demos"}
              </button>
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-white/80 text-sm font-medium">{L ? template.nameAr : (template.name || template.nameAr)}</span>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="flex-1">
              {/* Status */}
              {template.status === "coming_soon" && (
                <span className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  {L ? "قريباً" : "Coming Soon"}
                </span>
              )}
              {template.status === "active" && (
                <span className="inline-flex items-center gap-1.5 bg-green-400/20 border border-green-400/30 text-green-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  {L ? "متاح الآن" : "Available Now"}
                </span>
              )}

              <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
                {L ? template.nameAr : (template.name || template.nameAr)}
              </h1>
              {template.name !== template.nameAr && (
                <p className="text-white/40 text-base mb-4">{template.name}</p>
              )}
              <p className="text-white/60 text-base leading-relaxed mb-6 max-w-xl">
                {template.descriptionAr || template.description}
              </p>

              {/* Tier badge */}
              {tier && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${tier.bg} ${tier.border} mb-6`}>
                  <Package className={`w-4 h-4 ${tier.color}`} />
                  <div>
                    <span className={`text-sm font-black ${tier.color}`}>باقة {tier.label}</span>
                    <span className="text-xs text-black/50 mr-2">{tier.desc}</span>
                  </div>
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {template.demoUrl && template.status === "active" && (
                  <a href={template.demoUrl} target="_blank" rel="noopener noreferrer" data-testid="btn-open-demo">
                    <Button className="h-11 px-6 rounded-2xl font-bold gap-2 bg-white text-black hover:bg-white/90">
                      <Globe className="w-4 h-4" /> {L ? "فتح الديمو" : "Open Demo"}
                      <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                    </Button>
                  </a>
                )}
                {(!template.demoUrl || template.status !== "active") && (
                  <Button disabled className="h-11 px-6 rounded-2xl font-bold gap-2 bg-white/10 text-white/50 cursor-not-allowed">
                    <Globe className="w-4 h-4" />
                    {template.status === "coming_soon" ? (L ? "الديمو قريباً" : "Demo Coming Soon") : (L ? "لا يوجد ديمو" : "No Demo")}
                  </Button>
                )}
                <Link href={`/order?template=${template.slug}`}>
                  <Button variant="outline" className="h-11 px-6 rounded-2xl font-bold gap-2 border-white/20 text-white hover:bg-white/10" data-testid="btn-order-template">
                    <ArrowRight className="w-4 h-4" /> {L ? "ابدأ مشروعك" : "Start Your Project"}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-row lg:flex-col gap-3 flex-wrap lg:flex-nowrap">
              {template.estimatedDuration && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[110px]">
                  <p className="text-white/40 text-[10px] mb-1">{L ? "مدة التسليم" : "Delivery Time"}</p>
                  <p className="text-white font-black text-sm">{template.estimatedDuration}</p>
                </div>
              )}
              {template.featuresAr && template.featuresAr.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[110px]">
                  <p className="text-white/40 text-[10px] mb-1">{L ? "عدد المميزات" : "Features"}</p>
                  <p className="text-white font-black text-sm">{template.featuresAr.length} {L ? "ميزة" : "features"}</p>
                </div>
              )}
              {template.templateFiles && template.templateFiles.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[110px]">
                  <p className="text-white/40 text-[10px] mb-1">{L ? "ملفات متاحة" : "Files"}</p>
                  <p className="text-white font-black text-sm">{template.templateFiles.length} {L ? "ملف" : "files"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">

        {/* Demo Video */}
        {(videoEmbed || isDirectVideo) && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Video className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">{L ? "فيديو تعريفي" : "Demo Video"}</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{L ? "شاهد النظام في العمل" : "Watch the system in action"}</p>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06] shadow-xl bg-black aspect-video">
              {videoEmbed ? (
                <iframe
                  src={videoEmbed}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                  data-testid="iframe-demo-video"
                />
              ) : (
                <video
                  src={template.howToUseVideoUrl}
                  controls
                  className="w-full h-full"
                  data-testid="video-demo"
                />
              )}
            </div>
          </motion.section>
        )}

        {/* How to Use */}
        {template.howToUseAr && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <BookOpen className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">{L ? "طريقة الاستخدام" : "How to Use"}</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{L ? "دليل استخدام النظام خطوة بخطوة" : "Step-by-step guide"}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-black/70 dark:text-white/70 whitespace-pre-line">
                {template.howToUseAr}
              </div>
            </div>
          </motion.section>
        )}

        {/* Tier / Package Level */}
        {tier && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Package className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">{L ? "مستوى الباقة" : "Package Level"}</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{L ? "يعكس هذا النموذج مستوى الخدمة التالي" : "This template reflects the following service level"}</p>
              </div>
            </div>
            <div className={`border-2 ${tier.border} ${tier.bg} rounded-3xl p-6 flex items-center gap-5`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-sm border ${tier.border}`}>
                <Package className={`w-8 h-8 ${tier.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-black ${tier.color}`}>{L ? "باقة" : "Plan:"} {tier.label}</p>
                <p className="text-sm text-black/50 dark:text-black/50 mt-1">{tier.desc}</p>
                <Link href="/pricing">
                  <button className={`mt-2 text-xs font-bold ${tier.color} flex items-center gap-1 hover:underline`} data-testid="btn-view-pricing">
                    {L ? "عرض الأسعار والمقارنة" : "View Pricing & Comparison"} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* Demo Website */}
        {template.demoUrl && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Globe className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">{L ? "موقع الديمو" : "Demo Website"}</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{L ? "جرّب النظام مباشرة" : "Try the system live"}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-black dark:text-white">{L ? "رابط الديمو الحي" : "Live Demo Link"}</p>
                    <p className="text-xs text-black/40 dark:text-white/40 truncate">{template.demoUrl}</p>
                  </div>
                </div>
                <a href={template.demoUrl} target="_blank" rel="noopener noreferrer" data-testid="btn-open-demo-link">
                  <Button className="h-10 px-5 rounded-xl gap-2 font-bold" style={{ backgroundColor: color }}>
                    <Play className="w-3.5 h-3.5" /> {L ? "فتح الديمو" : "Open Demo"}
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </Button>
                </a>
              </div>
              {/* Embed Preview */}
              <div className="mt-4 rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06] h-64 bg-gray-50 dark:bg-gray-800">
                <iframe
                  src={template.demoUrl}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  data-testid="iframe-demo-preview"
                  title="demo preview"
                />
              </div>
            </div>
          </motion.section>
        )}

        {/* Files */}
        {template.templateFiles && template.templateFiles.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Download className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">{L ? "الملفات والموارد" : "Files & Resources"}</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{template.templateFiles.length} {L ? "ملف متاح للتحميل" : "files available"}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl overflow-hidden divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {template.templateFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors" data-testid={`file-item-${i}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-black/40 dark:text-white/40" />
                    </div>
                    <p className="text-sm font-bold text-black dark:text-white truncate">{L ? file.nameAr : (file.name || file.nameAr)}</p>
                  </div>
                  {file.url && (
                    <a href={file.url} target="_blank" rel="noopener noreferrer" download data-testid={`btn-download-file-${i}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl gap-1.5 text-xs font-bold flex-shrink-0">
                        <Download className="w-3.5 h-3.5" /> {L ? "تحميل" : "Download"}
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Features List */}
        {template.featuresAr && template.featuresAr.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <Zap className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">{L ? "مميزات النظام" : "System Features"}</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{template.featuresAr.length} {L ? "ميزة مدمجة" : "built-in features"}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {template.featuresAr.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 py-1" data-testid={`feature-item-${i}`}>
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-black/70 dark:text-white/70">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Feature Details */}
        {template.featuresDetails && template.featuresDetails.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color }}>
                <BookOpen className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">{L ? "دليل المميزات التفصيلي" : "Detailed Feature Guide"}</h2>
                <p className="text-xs text-black/40 dark:text-white/40">{L ? "شرح كامل لكل ميزة في النظام" : "Full breakdown of every feature"}</p>
              </div>
            </div>
            <div className="space-y-3">
              {template.featuresDetails.map((fd, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{fd.icon || "✨"}</span>
                    <div>
                      <p className="font-bold text-sm text-black dark:text-white">{fd.titleAr}</p>
                      {fd.descAr && (
                        <p className="text-xs text-black/50 dark:text-white/50 mt-1 leading-relaxed">{fd.descAr}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-3xl p-8 text-center" style={{ backgroundColor: color }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <Star className="w-10 h-10 text-white/60 mx-auto mb-3" />
          <h3 className="text-2xl font-black text-white mb-2">
            {L ? "أعجبك هذا النموذج؟" : "Like what you see?"}
          </h3>
          <p className="text-white/50 text-sm mb-6">
            {L ? "ابدأ مشروعك الآن وسيتولى فريقنا تهيئة النظام لك" : "Start your project now and our team will set everything up for you"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/order?template=${template.slug}`}>
              <Button className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-bold text-base gap-2" data-testid="btn-start-order-cta">
                <ArrowRight className="w-5 h-5" /> {L ? "ابدأ مشروعك الآن" : "Start Your Project"}
              </Button>
            </Link>
            <Link href="/demos">
              <Button variant="outline" className="h-12 px-8 rounded-2xl border-white/20 text-white hover:bg-white/10 font-bold text-base">
                {L ? "استعرض نماذج أخرى" : "Browse Other Templates"}
              </Button>
            </Link>
          </div>
        </motion.div>

      </div>

      <Footer />
    </div>
  );
}
