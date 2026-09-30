import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { firm, practiceAreas } from "@/content/site";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(firm.url),
  title: {
    default: `${firm.name} ügyvéd | Ingatlanjog, társasági jog, GDPR – Budapest`,
    template: `%s | ${firm.name} ügyvéd`,
  },
  description: firm.description,
  keywords: [
    "ügyvéd Budapest",
    "ingatlan ügyvéd",
    "adásvételi szerződés ügyvéd",
    "társasági jog",
    "GDPR ügyvéd",
    "gyógyszerjog",
    "egészségügyi jog",
    "munkajog ügyvéd",
    "Mihalovits Máté",
  ],
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: `${firm.name} ügyvéd`,
    title: `${firm.name} ügyvéd – Budapest`,
    description: firm.tagline,
    images: [{ url: "/brand/card.jpg", width: 1022, height: 620, alt: firm.name }],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico", apple: "/brand/icon-512.png" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: firm.legalName,
  url: firm.url,
  image: `${firm.url}/brand/card.jpg`,
  logo: `${firm.url}/brand/logo-light.png`,
  telephone: firm.phone,
  email: firm.email,
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: firm.address.street,
    addressLocality: firm.address.city,
    postalCode: firm.address.zip,
    addressCountry: "HU",
  },
  areaServed: "Budapest és Pest megye",
  knowsLanguage: ["hu", "en", "de"],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
  ],
  founder: { "@type": "Person", name: firm.name, jobTitle: "ügyvéd" },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Szakterületek",
    itemListElement: practiceAreas.map((p) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: p.title, url: `${firm.url}/szakteruletek/${p.slug}` },
    })),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="relative flex min-h-full flex-col">
        <div className="grain" aria-hidden />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
