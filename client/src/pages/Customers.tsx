import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { type Partner } from "@shared/schema";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

export default function Customers() {
  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      <main className="flex-1 pt-24 pb-20 relative overflow-hidden">
        <PageGraphics variant="rings-sides" />
        <div className="container mx-auto px-4 md:px-8 max-w-5xl relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-black font-heading mb-4">عملاؤنا وشركاؤنا</h1>
            <p className="text-black/40 text-lg">نفخر بثقة عملائنا وشركائنا في منطومة قيروكس</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin w-8 h-8 text-black/30" />
            </div>
          ) : !partners || partners.length === 0 ? (
            <div className="text-center py-20 text-black/30">
              <p>لا يوجد شركاء مضافون بعد</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-8 justify-center items-center">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                  data-testid={`partner-logo-${partner.id}`}
                >
                  {partner.websiteUrl ? (
                    <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" title={partner.nameAr || partner.name}>
                      <img src={partner.logoUrl} alt={partner.name} className="h-14 w-auto object-contain max-w-[160px]" />
                    </a>
                  ) : (
                    <img src={partner.logoUrl} alt={partner.name} className="h-14 w-auto object-contain max-w-[160px]" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
