import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getFirm, getHome, getPracticeAreas, SITE_URL } from "@/content";

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

export function generateMetadata(): Metadata {
  const firm = getFirm();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: getHome().seo.title,
      template: `%s | ${firm.name} ${firm.title}`,
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
      siteName: `${firm.name} ${firm.title}`,
      title: `${firm.name} ${firm.title} – Budapest`,
      description: firm.tagline,
      images: [
        {
          url: firm.images.share.src,
          width: firm.images.share.width,
          height: firm.images.share.height,
          alt: firm.name,
        },
      ],
    },
    robots: { index: true, follow: true },
    icons: { icon: "/favicon.ico", apple: "/brand/icon-512.png" },
  };
}

function structuredData() {
  const firm = getFirm();
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: firm.legalName,
    url: SITE_URL,
    image: `${SITE_URL}${firm.images.share.src}`,
    logo: `${SITE_URL}/brand/logo-light.png`,
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
    founder: { "@type": "Person", name: firm.name, jobTitle: firm.title },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Szakterületek",
      itemListElement: getPracticeAreas().map((p) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: p.title, url: `${SITE_URL}/szakteruletek/${p.slug}` },
      })),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const firm = getFirm();
  return (
    <html lang="hu" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="relative flex min-h-full flex-col">
        <div className="grain" aria-hidden />
        <Header firm={{ brand: firm.brand, phone: firm.phone, phoneHref: firm.phoneHref, email: firm.email }} />
        <main className="flex-1">{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          // Editable content must not be able to close the script element.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
