import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { StepsSection } from "@/components/landing/StepsSection";
import { FaqSection } from "@/components/landing/FaqSection";

export default function Home() {
  return (
    <div className="love-cinematic-bg love-grain relative min-h-screen">
      <SiteNav />
      <main className="relative z-10">
        <HeroSection />
        <PricingSection />
        <StepsSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}
