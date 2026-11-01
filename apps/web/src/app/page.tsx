import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Nav } from '../components/landing/Nav';
import { Hero } from '../components/landing/Hero';
import { Pillars3D } from '../components/landing/Pillars3D';
import { Metrics, QnA, Safety, Analytics, Pricing, FAQ, CTA, Footer } from '../components/landing/Sections';

export default function LandingPage() {
  return (
    <div className={`${GeistSans.className} ${GeistMono.variable} min-h-screen bg-[#04070A] text-[#F3F7F5] selection:bg-[#34E5A5]/30 [&_.font-mono]:font-[family-name:var(--font-geist-mono)]`}>
      <Nav />
      <main>
        <Hero />
        <Metrics />
        <Pillars3D />
        <QnA />
        <Safety />
        <Analytics />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
