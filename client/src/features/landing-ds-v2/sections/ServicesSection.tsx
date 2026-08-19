import { useServices } from "@/hooks/use-services";
import { useI18n } from "@/lib/i18n";
import { Cpu, Code2, BarChart3, MessagesSquare, KanbanSquare, Layers, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";

// The live /api/services payload is Mongo-backed and uses a bilingual
// title/titleAr + description/descriptionAr + preformatted `price` string
// shape (e.g. "يبدأ من 1,875 ر.س / جلسة") — it does not match the legacy
// Drizzle `services` table types in shared/schema.ts, so we type it locally.
interface LiveService {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  price?: string;
  order?: number;
}

export default function ServicesSection() {
  const { t, lang } = useI18n();
  const { data: services, isLoading } = useServices() as { data?: LiveService[]; isLoading: boolean };
  const L = lang === "ar";
  const Arrow = L ? ArrowLeft : ArrowRight;

  const getIcon = (title: string) => {
    const s = title.toLowerCase();
    if (s.includes("ai") || s.includes("machine") || s.includes("ذكاء")) return Cpu;
    if (s.includes("web") || s.includes("مواقع") || s.includes("development") || s.includes("تطوير")) return Code2;
    if (s.includes("business") || s.includes("analysis") || s.includes("تحليل")) return BarChart3;
    if (s.includes("consult") || s.includes("استشار")) return MessagesSquare;
    if (s.includes("project") || s.includes("management") || s.includes("إدارة")) return KanbanSquare;
    return Layers;
  };

  const sorted = services ? [...services].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];

  return (
    <section id="services" className="py-24 md:py-32 bg-ds-surface-1 border-y border-ds-border-hairline">
      <div className="max-w-ds-container-xl mx-auto px-6">
        
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <span className="text-ds-sm font-semibold tracking-wide text-ds-blue-600 uppercase mb-4 block">
              {t("dsv2.services.badge")}
            </span>
            <h2 className="font-heading text-ds-4xl md:text-ds-5xl tracking-tight text-ds-foreground mb-6">
              {t("dsv2.services.title")}
            </h2>
            <p className="text-ds-lg text-ds-muted-foreground leading-relaxed">
              {t("dsv2.services.subtitle")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[360px] ds-card animate-pulse bg-ds-surface-2 border-transparent" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((service) => {
              const Icon = getIcon(service.title);
              return (
                <div key={service.id} className="ds-card ds-card-elevated p-8 flex flex-col group hover:-translate-y-1 transition-transform duration-ds-base ease-ds-standard bg-ds-surface-0 border-ds-border-hairline hover:border-ds-border-emphasis">
                  <div className="w-12 h-12 rounded-ds-lg bg-ds-blue-50 dark:bg-ds-blue-950/40 text-ds-blue-600 flex items-center justify-center mb-8 border border-ds-blue-100 dark:border-ds-blue-900/50 shadow-ds-xs">
                    <Icon size={24} strokeWidth={1.75} />
                  </div>
                  <h3 className="font-heading text-ds-2xl font-semibold mb-4 text-ds-foreground group-hover:text-ds-blue-600 transition-colors duration-ds-fast">
                    {L ? service.titleAr : service.title}
                  </h3>
                  <p className="text-ds-base text-ds-muted-foreground mb-8 flex-grow leading-relaxed">
                    {L ? service.descriptionAr : service.description}
                  </p>
                  <div className="pt-6 border-t border-ds-border-hairline flex items-center justify-between mt-auto">
                    <span className="text-ds-sm font-semibold text-ds-foreground">
                      {service.price || t("dsv2.services.customQuote")}
                    </span>
                    <Link href={`/order?service=${service.id}`} className="w-10 h-10 rounded-ds-full bg-ds-surface-1 flex items-center justify-center text-ds-foreground group-hover:bg-ds-primary group-hover:text-ds-primary-foreground transition-all duration-ds-fast shadow-ds-sm group-hover:shadow-ds-md" aria-label={t("dsv2.services.order")}>
                      <Arrow size={18} strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
