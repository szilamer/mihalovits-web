import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { PracticeAreas } from "@/components/home/PracticeAreas";
import { About } from "@/components/home/About";
import { Process } from "@/components/home/Process";
import { Testimonials } from "@/components/home/Testimonials";
import { Faq } from "@/components/home/Faq";
import { ContactSection } from "@/components/contact/ContactSection";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <PracticeAreas />
      <About />
      <Process />
      <Testimonials />
      <Faq />
      <ContactSection />
    </>
  );
}
