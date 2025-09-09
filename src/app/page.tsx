// src/app/page.tsx  ─ landing route
import Navbar              from '@/components/landing/navbar'
import { HeroSection }     from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { CTASection }      from '@/components/landing/cta-section'

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen">
        {/* 1 Hero with headline + USP */}
        <HeroSection />

        {/* 2 Key features – ONLY what the app really offers */}
        <FeaturesSection />

        {/* 3 Single CTA section – email capture + free-trial button */}
        <CTASection />
      </main>
    </>
  )
}
