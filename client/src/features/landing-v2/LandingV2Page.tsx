import HeroCinematic from "./sections/HeroCinematic";
import StorySection from "./sections/StorySection";
import ServicesShowcase from "./sections/ServicesShowcase";
import PortfolioPremium from "./sections/PortfolioPremium";
import CustomerJourneySection from "./sections/CustomerJourneySection";
import LiveStatsSection from "./sections/LiveStatsSection";
import InteractiveTimeline from "./sections/InteractiveTimeline";
import TestimonialsSection from "./sections/TestimonialsSection";
import PricingExperience from "./sections/PricingExperience";
import CTASection from "./sections/CTASection";
import FooterV2 from "./sections/FooterV2";
import Navigation from "@/components/Navigation";
import { useSEO } from "@/hooks/use-seo";
import { useI18n } from "@/lib/i18n";

export default function LandingV2Page() {
  const { t } = useI18n();
  useSEO({
    title: t("v2.hero.badge") + " | QIROX",
    description: t("v2.hero.subtitle"),
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow flex flex-col">
        <HeroCinematic />
        <StorySection />
        <ServicesShowcase />
        <PortfolioPremium />
        <CustomerJourneySection />
        <LiveStatsSection />
        <InteractiveTimeline />
        <TestimonialsSection />
        <PricingExperience />
        <CTASection />
      </main>
      <FooterV2 />
    </div>
  );
}
