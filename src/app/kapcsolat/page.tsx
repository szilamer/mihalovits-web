import type { Metadata } from "next";
import { ContactSection } from "@/components/contact/ContactSection";

export const metadata: Metadata = {
  title: "Kapcsolat – konzultáció kérése",
  description:
    "Kérjen időpontot személyes vagy online konzultációra. Iroda: 1064 Budapest, Podmaniczky utca 31. Telefon: +36 30 219 5593. Válasz 24 órán belül.",
  alternates: { canonical: "/kapcsolat" },
};

export default function ContactPage() {
  return (
    <div className="pt-16 lg:pt-20">
      <ContactSection showMap headingLevel="h1" />
    </div>
  );
}
