import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Loader2, ArrowRight, ExternalLink, Download, FileText, Video, File, Globe, BookOpen, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import SARIcon from "@/components/SARIcon";
import { useSEO } from "@/hooks/use-seo";

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
  if (type === "pdf") return <FileText className="w-5 h-5 text-ds-foreground" />;
  if (type === "video") return <Video className="w-5 h-5 text-ds-foreground" />;
  if (type === "document") return <FileText className="w-5 h-5 text-ds-foreground" />;
  return <File className="w-5 h-5 text-ds-muted-foreground" />;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

export default function ServiceDetailDSV2() {
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

  useSEO({
    title: service?.title || "",
    description: service?.description || "",
    ...(service
      ? {
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.description,
            ...(service.priceMin
              ? {
                  offers: {
                    "@type": "AggregateOffer",
                    lowPrice: service.priceMin,
                    ...(service.priceMax ? { highPrice: service.priceMax } : {}),
                    priceCurrency: "SAR",
                  },
                }
              : {}),
          },
        }
      : {}),
  });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-ds-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-ds-primary" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-ds-background">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-ds-muted-foreground text-ds-lg font-medium">
            {lang === "ar" ? "الخدمة غير موجودة" : "Service not found"}
          </p>
          <Link href="/systems" className="ds-btn ds-btn-outline px-5 py-2.5 gap-2">
            <ArrowRight className="w-4 h-4" />
            {lang === "ar" ? "العودة للأنظمة" : "Back to Systems"}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const videos = service.portfolioFiles?.filter(f => f.type === "video") || [];
  const documents = service.portfolioFiles?.filter(f => f.type !== "video") || [];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-ds-background" dir={dir}>
      <Navigation />

      <main className="flex-1 pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-ds-container-md">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="mb-12">
              <Link href="/systems" className="inline-flex items-center gap-2 text-ds-sm font-medium text-ds-muted-foreground hover:text-ds-foreground transition-colors mb-6" data-testid="link-back-systems">
                <ArrowRight className="w-4 h-4" />
                {lang === "ar" ? "العودة للأنظمة" : "Back to Systems"}
              </Link>
              <h1 className="text-ds-4xl md:text-ds-5xl font-black text-ds-foreground tracking-[var(--ds-tracking-tight)] mb-4" data-testid="text-service-title">
                {service.title}
              </h1>
              <p className="text-ds-lg text-ds-muted-foreground leading-[var(--ds-leading-relaxed)] max-w-2xl" data-testid="text-service-description">
                {service.description}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {service.priceMin && (
                <motion.div variants={fadeUp} custom={1} className="ds-card p-6 bg-ds-surface-1 transition-all duration-ds-fast hover:shadow-ds-sm">
                  <p className="text-ds-xs text-ds-muted-foreground font-semibold mb-2 uppercase tracking-[var(--ds-tracking-wide)]">{lang === "ar" ? "السعر" : "Price"}</p>
                  <p className="text-ds-xl font-bold text-ds-foreground flex items-center gap-2" data-testid="text-service-price">
                    {service.priceMin?.toLocaleString()}
                    {service.priceMax ? ` - ${service.priceMax.toLocaleString()}` : "+"} <SARIcon size={16} />
                  </p>
                </motion.div>
              )}
              {service.estimatedDuration && (
                <motion.div variants={fadeUp} custom={2} className="ds-card p-6 bg-ds-surface-1 transition-all duration-ds-fast hover:shadow-ds-sm">
                  <p className="text-ds-xs text-ds-muted-foreground font-semibold mb-2 uppercase tracking-[var(--ds-tracking-wide)]">{lang === "ar" ? "المدة المتوقعة" : "Duration"}</p>
                  <p className="text-ds-xl font-bold text-ds-foreground" data-testid="text-service-duration">{service.estimatedDuration}</p>
                </motion.div>
              )}
              {service.platformUrl && (
                <motion.div variants={fadeUp} custom={3} className="ds-card p-6 bg-ds-surface-1 flex flex-col justify-center transition-all duration-ds-fast hover:shadow-ds-sm">
                  <p className="text-ds-xs text-ds-muted-foreground font-semibold mb-2 uppercase tracking-[var(--ds-tracking-wide)]">{lang === "ar" ? "المنصة" : "Platform"}</p>
                  <a href={service.platformUrl} target="_blank" rel="noopener noreferrer" className="text-ds-base font-bold text-ds-foreground hover:text-ds-primary transition-colors flex items-center gap-2 w-fit group" data-testid="link-platform-url">
                    <Globe className="w-5 h-5 group-hover:scale-110 transition-transform duration-ds-fast" />
                    {lang === "ar" ? "زيارة المنصة" : "Visit Platform"}
                    <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                </motion.div>
              )}
            </div>

            {service.features && service.features.length > 0 && (
              <motion.div variants={fadeUp} custom={4} className="ds-card p-8 mb-8 bg-ds-surface-0 shadow-ds-sm">
                <h2 className="text-ds-xl font-bold text-ds-foreground mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-ds-lg bg-ds-surface-2 flex items-center justify-center">
                    <Check className="w-4 h-4 text-ds-foreground" strokeWidth={2.5} />
                  </div>
                  {lang === "ar" ? "المميزات" : "Features"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="section-features">
                  {service.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-ds-xl bg-ds-surface-1 border border-ds-border-hairline transition-all duration-ds-fast hover:border-ds-border-emphasis hover:shadow-ds-xs">
                      <div className="w-6 h-6 rounded-ds-md bg-ds-surface-2 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-ds-foreground" strokeWidth={2.5} />
                      </div>
                      <span className="text-ds-sm font-medium text-ds-foreground leading-[var(--ds-leading-normal)]">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {videos.length > 0 && (
              <motion.div variants={fadeUp} custom={5} className="ds-card p-8 mb-8 bg-ds-surface-0 shadow-ds-sm">
                <h2 className="text-ds-xl font-bold text-ds-foreground mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-ds-lg bg-ds-surface-2 flex items-center justify-center">
                    <Video className="w-4 h-4 text-ds-foreground" strokeWidth={2} />
                  </div>
                  {lang === "ar" ? "فيديوهات الشرح" : "Tutorial Videos"}
                </h2>
                <div className="space-y-6" data-testid="section-videos">
                  {videos.map((file, idx) => (
                    <div key={idx} className="rounded-ds-2xl overflow-hidden border border-ds-border-hairline shadow-ds-xs bg-ds-surface-1">
                      <video
                        controls
                        preload="metadata"
                        className="w-full max-h-[480px] bg-ds-black"
                        data-testid={`video-player-${idx}`}
                      >
                        <source src={file.url} />
                      </video>
                      <div className="flex items-center justify-between p-4 border-t border-ds-border-hairline">
                        <span className="text-ds-sm font-bold text-ds-foreground truncate pr-4">{file.name}</span>
                        <a href={file.url} download={file.name} className="ds-btn ds-btn-outline px-3 py-1.5 text-ds-xs shrink-0" data-testid={`link-download-video-${idx}`}>
                          <Download className="w-4 h-4" />
                          {lang === "ar" ? "تحميل" : "Download"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {documents.length > 0 && (
              <motion.div variants={fadeUp} custom={6} className="ds-card p-8 mb-8 bg-ds-surface-0 shadow-ds-sm">
                <h2 className="text-ds-xl font-bold text-ds-foreground mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-ds-lg bg-ds-surface-2 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-ds-foreground" strokeWidth={2} />
                  </div>
                  {lang === "ar" ? "ملفات الشرح" : "Documentation Files"}
                </h2>
                <div className="space-y-3" data-testid="section-documents">
                  {documents.map((file, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-ds-xl bg-ds-surface-1 border border-ds-border-hairline hover:border-ds-border-emphasis transition-all duration-ds-fast hover:shadow-ds-xs">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-ds-lg bg-ds-surface-2 flex items-center justify-center shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-ds-sm font-bold text-ds-foreground truncate">{file.name}</p>
                          <p className="text-ds-xs font-medium text-ds-muted-foreground mt-0.5 uppercase tracking-[var(--ds-tracking-wide)]">
                            {file.type === "pdf" ? "PDF" : file.type === "document" ? (lang === "ar" ? "مستند" : "Document") : (lang === "ar" ? "ملف" : "File")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:shrink-0 mt-2 sm:mt-0">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn-outline px-3 py-1.5 text-ds-xs flex-1 sm:flex-none justify-center" data-testid={`link-open-doc-${idx}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          {lang === "ar" ? "فتح" : "Open"}
                        </a>
                        <a href={file.url} download={file.name} className="ds-btn ds-btn-secondary px-3 py-1.5 text-ds-xs flex-1 sm:flex-none justify-center" data-testid={`link-download-doc-${idx}`}>
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
              <motion.div variants={fadeUp} custom={7} className="ds-card p-8 mb-8 bg-ds-surface-0 shadow-ds-sm">
                <h2 className="text-ds-xl font-bold text-ds-foreground mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-ds-lg bg-ds-surface-2 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-ds-foreground" strokeWidth={2} />
                  </div>
                  {lang === "ar" ? "طريقة الاستخدام" : "Usage Instructions"}
                </h2>
                <div className="prose prose-sm max-w-none text-ds-muted-foreground whitespace-pre-line leading-[var(--ds-leading-relaxed)]" data-testid="text-usage-instructions">
                  {service.usageInstructions}
                </div>
              </motion.div>
            )}

            {service.portfolioImages && service.portfolioImages.length > 0 && (
              <motion.div variants={fadeUp} custom={8} className="ds-card p-8 mb-12 bg-ds-surface-0 shadow-ds-sm">
                <h2 className="text-ds-xl font-bold text-ds-foreground mb-6">
                  {lang === "ar" ? "صور المشروع" : "Project Images"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="section-images">
                  {service.portfolioImages.map((img, idx) => (
                    <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block rounded-ds-xl overflow-hidden border border-ds-border-hairline shadow-ds-sm hover:shadow-ds-md transition-all duration-ds-fast group relative">
                      <div className="absolute inset-0 bg-ds-black/0 group-hover:bg-ds-black/10 transition-colors duration-ds-fast z-10"></div>
                      <img src={img} alt={`${service.title} - ${idx + 1}`} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-ds-slow" data-testid={`img-portfolio-${idx}`} />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div variants={fadeUp} custom={9} className="text-center pt-8 border-t border-ds-border-hairline">
              <Link href="/order" className="ds-btn ds-btn-primary px-10 py-4 text-ds-lg font-bold shadow-ds-md hover:shadow-ds-lg transition-all" data-testid="button-order-service">
                {lang === "ar" ? "اطلب هذه الخدمة" : "Order This Service"}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
