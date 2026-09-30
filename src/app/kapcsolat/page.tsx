import type { Metadata } from "next";
import { ContactSection } from "@/components/contact/ContactSection";
import { getContactPage } from "@/content";

export function generateMetadata(): Metadata {
  const page = getContactPage();
  return {
    title: page.seo.title,
    description: page.seo.description || page.text,
    alternates: { canonical: "/kapcsolat" },
  };
}

export default function ContactPage() {
  return (
    <div className="pt-16 lg:pt-20">
      <ContactSection showMap headingLevel="h1" />
    </div>
  );
}
