import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Loader2, ArrowRight, ExternalLink, Download, FileText, Video, File, Globe, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import SARIcon from "@/components/SARIcon";

interface PortfolioFile {
  url: string;
  name: string;
  type: "pdf" | "video" | "document" | "other";
}

interface ServiceData {
  id: string;
  title: string;
  description: string;
  category: string;
  priceMin?: number;
  priceMax?: number;
  estimatedDuration?: string;
  features?: string[];
  icon?: string;
  portfolioImages?: string[];
  portfolioUrl?: string;
  platformUrl?: string;
  usageInstructions?: string;
  portfolioFiles?: PortfolioFile[];
}

function getFileIcon(type: string) {
  if (type === "pdf") return <FileText className="w-5 h-5 text-red-500" />;
  if (type === "video") return <Video className="w-5 h-5 text-blue-500" />;
  if (type === "document") return <FileText className="w-5 h-5 text-green-500" />;
  return <File className="w-5 h-5 text-black/40 dark:text-white/40" />;
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|avi|webm|mkv)$/i.test(url);
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

export default function ServiceDetail() {
  const { lang, dir } = useI18n();
  const [, params] = useRoute("/service/:id");
  const id = params?.id;

  const { data: service, isLoading, error } = useQuery<ServiceData>({
    queryKey: ["/api/services", id],
    queryFn: async () => {
      const res = await fetch(`/api/services/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-black/40 dark:text-white/40 text-lg">
            {lang === "ar" ? "الخدمة غير موجودة" : "Service not found"}
          </p>
          <Link href="/systems">
            <Button variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              {lang === "ar" ? "العودة للأنظمة" : "Back to Systems"}
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const videos = service.portfolioFiles?.filter(f => f.type === "video") || [];
  const documents = service.portfolioFiles?.filter(f => f.type !== "video") || [];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="mb-8">
              <Link href="/systems">
                <button className="flex items-center gap-2 text-sm text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors mb-4" data-testid="link-back-systems">
                  <ArrowRight className="w-4 h-4" />
                  {lang === "ar" ? "العودة للأنظمة" : "Back to Systems"}
                </button>
              </Link>
              <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white mb-3" data-testid="text-service-title">
                {service.title}
              </h1>
              <p className="text-base text-black/50 dark:text-white/45 leading-relaxed max-w-2xl" data-testid="text-service-description">
                {service.description}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {service.priceMin && (
                <motion.div variants={fadeUp} custom={1} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] p-5">
                  <p className="text-xs text-black/40 dark:text-white/40 mb-1">{lang === "ar" ? "السعر" : "Price"}</p>
                  <p className="text-lg font-bold text-black dark:text-white flex items-center gap-1.5" data-testid="text-service-price">
                    {service.priceMin?.toLocaleString()}
                    {service.priceMax ? ` - ${service.priceMax.toLocaleString()}` : "+"} <SARIcon size={14} />
                  </p>
                </motion.div>
              )}
              {service.estimatedDuration && (
                <motion.div variants={fadeUp} custom={2} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] p-5">
                  <p className="text-xs text-black/40 dark:text-white/40 mb-1">{lang === "ar" ? "المدة المتوقعة" : "Duration"}</p>
                  <p className="text-lg font-bold text-black dark:text-white" data-testid="text-service-duration">{service.estimatedDuration}</p>
                </motion.div>
              )}
              {service.platformUrl && (
                <motion.div variants={fadeUp} custom={3} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] p-5">
                  <p className="text-xs text-black/40 dark:text-white/40 mb-1">{lang === "ar" ? "المنصة" : "Platform"}</p>
                  <a href={service.platformUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5" data-testid="link-platform-url">
                    <Globe className="w-4 h-4" />
                    {lang === "ar" ? "زيارة المنصة" : "Visit Platform"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </motion.div>
              )}
            </div>

            {service.features && service.features.length > 0 && (
              <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-6 mb-8">
                <h2 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  {lang === "ar" ? "المميزات" : "Features"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-testid="section-features">
                  {service.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm text-black/70 dark:text-white/70">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {videos.length > 0 && (
              <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-6 mb-8">
                <h2 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-500" />
                  {lang === "ar" ? "فيديوهات الشرح" : "Tutorial Videos"}
                </h2>
                <div className="space-y-4" data-testid="section-videos">
                  {videos.map((file, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06]">
                      <video
                        controls
                        preload="metadata"
                        className="w-full max-h-[400px] bg-black"
                        data-testid={`video-player-${idx}`}
                      >
                        <source src={file.url} />
                      </video>
                      <div className="flex items-center justify-between p-3 bg-black/[0.02] dark:bg-white/[0.02]">
                        <span className="text-sm text-black/60 dark:text-white/55 truncate">{file.name}</span>
                        <a href={file.url} download={file.name} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0" data-testid={`link-download-video-${idx}`}>
                          <Download className="w-3.5 h-3.5" />
                          {lang === "ar" ? "تحميل" : "Download"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {documents.length > 0 && (
              <motion.div variants={fadeUp} custom={6} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-6 mb-8">
                <h2 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  {lang === "ar" ? "ملفات الشرح" : "Documentation Files"}
                </h2>
                <div className="space-y-2" data-testid="section-documents">
                  {documents.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black dark:text-white truncate">{file.name}</p>
                        <p className="text-xs text-black/40 dark:text-white/40">
                          {file.type === "pdf" ? "PDF" : file.type === "document" ? (lang === "ar" ? "مستند" : "Document") : (lang === "ar" ? "ملف" : "File")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-black/50 dark:text-white/45 hover:text-black/80 dark:hover:text-white/70 transition-colors" data-testid={`link-open-doc-${idx}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          {lang === "ar" ? "فتح" : "Open"}
                        </a>
                        <a href={file.url} download={file.name} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline" data-testid={`link-download-doc-${idx}`}>
                          <Download className="w-3.5 h-3.5" />
                          {lang === "ar" ? "تحميل" : "Download"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {service.usageInstructions && (
              <motion.div variants={fadeUp} custom={7} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-6 mb-8">
                <h2 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-500" />
                  {lang === "ar" ? "طريقة الاستخدام" : "Usage Instructions"}
                </h2>
                <div className="prose prose-sm max-w-none text-black/70 dark:text-white/65 whitespace-pre-line leading-relaxed" data-testid="text-usage-instructions">
                  {service.usageInstructions}
                </div>
              </motion.div>
            )}

            {service.portfolioImages && service.portfolioImages.length > 0 && (
              <motion.div variants={fadeUp} custom={8} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900/50 p-6 mb-8">
                <h2 className="text-lg font-bold text-black dark:text-white mb-4">
                  {lang === "ar" ? "صور المشروع" : "Project Images"}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-testid="section-images">
                  {service.portfolioImages.map((img, idx) => (
                    <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06] hover:shadow-md transition-shadow">
                      <img src={img} alt={`${service.title} - ${idx + 1}`} className="w-full h-40 object-cover" data-testid={`img-portfolio-${idx}`} />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div variants={fadeUp} custom={9} className="text-center pt-4">
              <Link href="/order">
                <Button className="premium-btn gap-2 px-8 py-3 text-base" data-testid="button-order-service">
                  {lang === "ar" ? "اطلب هذه الخدمة" : "Order This Service"}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
