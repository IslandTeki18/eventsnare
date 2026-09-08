import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { ProductPeek } from '@/components/landing/ProductPeek'
import { ProblemStatement } from '@/components/landing/ProblemStatement'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Features } from '@/components/landing/Features'
import { ProviderGrid } from '@/components/landing/ProviderGrid'
import { Pricing } from '@/components/landing/Pricing'
import { FooterCta } from '@/components/landing/FooterCta'
import { Footer } from '@/components/landing/Footer'

export function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProductPeek />
        <ProblemStatement />
        <HowItWorks />
        <Features />
        <ProviderGrid />
        <Pricing />
        <FooterCta />
      </main>
      <Footer />
    </>
  )
}
