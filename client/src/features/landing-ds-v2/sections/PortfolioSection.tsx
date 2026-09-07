import { useTemplates } from "@/hooks/use-templates";
import { useI18n } from "@/lib/i18n";
import { ExternalLink, ArrowRight, ArrowLeft } from "lucide-react";
import ecommerceDemoImg from "@/assets/ecommerce-demo.png";
import restaurantDemoImg from "@/assets/restaurant-demo.png";

export default function PortfolioSection() {
  const { t, lang } = useI18n();
  const { data: templates, isLoading } = useTemplates();
  const L = lang === "ar";
  
  const getImage = (nameAr: string, name: string) => {
    if (nameAr.includes("متجر") || name.toLowerCase().includes("commerce")) return ecommerceDemoImg;
    if (nameAr.includes("مطاعم") || name.toLowerCase().includes("restaurant")) return restaurantDemoImg;
    return null; 
  };

  return (
    <section id="portfolio" className="py-24 md:py-32 relative bg-ds-background">
      <div className="max-w-ds-container-xl mx-auto px-6">
        
        <div className="flex flex-col items-center text-center mb-16 md:mb-24">
          <span className="text-ds-sm font-semibold tracking-wide text-ds-blue-600 uppercase mb-4">
            {t("dsv2.portfolio.badge")}
          </span>
          <h2 className="font-heading text-ds-4xl md:text-ds-5xl tracking-tight text-ds-foreground mb-6 max-w-2xl">
            {t("dsv2.portfolio.title")}
          </h2>
          <p className="text-ds-lg text-ds-muted-foreground leading-relaxed max-w-3xl">
            {t("dsv2.portfolio.subtitle")}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] ds-card animate-pulse bg-ds-surface-1 border-transparent" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {templates?.slice(0, 4).map((template) => {
              const image = getImage(template.nameAr, template.name);
              return (
                <div key={template.id} className="group relative ds-card overflow-hidden bg-ds-surface-0 border-ds-border-hairline flex flex-col hover:border-ds-border-emphasis transition-colors duration-ds-base shadow-ds-sm hover:shadow-ds-md">
                  <div className="aspect-[16/10] bg-ds-surface-2 relative overflow-hidden flex items-center justify-center p-8 border-b border-ds-border-hairline">
                    {image ? (
                      <img 
                        src={image} 
                        alt={L ? template.nameAr : template.name} 
                        className="w-full h-auto rounded-ds-md shadow-ds-lg transform group-hover:scale-[1.02] group-hover:-translate-y-2 transition-all duration-ds-slow ease-ds-standard"
                      />
                    ) : (
                      <div className="w-full h-full bg-ds-navy-100/50 dark:bg-ds-navy-900/30 rounded-ds-md shadow-ds-sm flex items-center justify-center text-ds-muted-foreground border border-ds-border-hairline">
                        <span className="text-ds-sm font-medium uppercase tracking-widest">{t("dsv2.portfolio.liveDemo")}</span>
                      </div>
                    )}
                    
                    {/* Glass Overlay on Hover */}
                    {template.demoUrl && (
                      <div className="absolute inset-0 bg-ds-navy-900/5 dark:bg-ds-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-ds-base flex items-center justify-center backdrop-blur-[2px]">
                        <a 
                          href={template.demoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ds-surface-glass px-6 py-3 rounded-ds-full text-ds-white font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-ds-base text-ds-sm shadow-ds-xl hover:bg-ds-white/20"
                        >
                          <ExternalLink size={16} strokeWidth={2} />
                          {t("dsv2.portfolio.viewDemo")}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow bg-ds-surface-0">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-heading text-ds-2xl font-semibold text-ds-foreground group-hover:text-ds-blue-600 transition-colors">
                        {L ? template.nameAr : template.name}
                      </h3>
                      {template.demoUrl && (
                        <a href={template.demoUrl} target="_blank" rel="noopener noreferrer" className="text-ds-muted-foreground hover:text-ds-blue-600 transition-colors bg-ds-surface-1 p-2 rounded-ds-full shadow-ds-xs">
                          <ExternalLink size={16} strokeWidth={2} />
                        </a>
                      )}
                    </div>
                    <p className="text-ds-base text-ds-muted-foreground leading-relaxed flex-grow">
                      {L ? template.descriptionAr : template.description}
                    </p>
                    
                    {(() => {
                      const featureList = L && template.featuresAr?.length ? template.featuresAr : template.features;
                      return featureList && featureList.length > 0 ? (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {featureList.slice(0, 3).map((label, i) => (
                            <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-ds-sm bg-ds-surface-1 text-ds-muted-foreground border border-ds-border-hairline shadow-sm">
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : null;
                    })()}
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
