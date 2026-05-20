import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { StepsSection } from "@/components/landing/StepsSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { LandingViewTracker } from "@/components/analytics/LandingViewTracker";

export default function Home() {
  return (
    <div className="love-cinematic-bg love-grain relative min-h-screen">
      <LandingViewTracker />
      <SiteNav />
      <main className="relative z-10">
        <HeroSection />
        <SocialProofSection />
        <PricingSection />
        <StepsSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}
