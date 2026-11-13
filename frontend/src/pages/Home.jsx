import HomeHero from "../components/HomeHero";
import { LoanProducts, StatsStrip } from "../components/HomeSections";
import Partners from "../components/Partners";
import HowItWorks from "../components/HowItWorks";
import EmiCalculator from "../components/EmiCalculator";
import WhyUs from "../components/WhyUs";
import Testimonials from "../components/Testimonials";
import Faq from "../components/Faq";
import Cta from "../components/Cta";

export default function Home() {
  return (
    <>
      <HomeHero />
      <StatsStrip />
      <LoanProducts />
      <Partners />
      <HowItWorks />
      <EmiCalculator />
      <WhyUs />
      <Testimonials />
      <Faq />
      <Cta />
    </>
  );
}
