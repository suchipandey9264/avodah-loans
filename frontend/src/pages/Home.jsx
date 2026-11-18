import HomeHero from "../components/HomeHero";
import { LoanProducts } from "../components/HomeSections";
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
