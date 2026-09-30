import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Prose } from "@/components/layout/Prose";
import { firm, legalPages } from "@/content/site";

export const metadata: Metadata = {
  title: legalPages.imprint.title,
  robots: { index: false },
};

export default function ImprintPage() {
  return (
    <>
      <PageHero
        tone="light"
        eyebrow="Jogi tájékoztató"
        title={legalPages.imprint.title}
        lead="Az elektronikus kereskedelmi szolgáltatásokról szóló 2001. évi CVIII. törvény és az ügyvédi tevékenységről szóló 2017. évi LXXVIII. törvény szerinti közzététel."
        crumbs={[{ label: "Főoldal", href: "/" }, { label: legalPages.imprint.title }]}
      />
      <section className="bg-paper pb-24">
        <Prose>
          <h2>Szolgáltató</h2>
          <p>
            <strong className="text-ink">{firm.legalName}</strong>
            <br />
            Székhely: {firm.address.zip} {firm.address.city}, {firm.address.street}
            <br />
            E-mail: <a href={`mailto:${firm.email}`}>{firm.email}</a>
            <br />
            Telefon: <a href={firm.phoneHref}>{firm.phone}</a>
          </p>

          <h2>Kamarai tagság</h2>
          <p>
            {firm.chamber} · Kamarai azonosító: {firm.chamberId}
            <br />
            Az ügyvédi tevékenységre irányadó szakmai szabályok a Magyar Ügyvédi Kamara honlapján (
            <a href="https://www.mük.hu" target="_blank" rel="noreferrer">
              www.mük.hu
            </a>
            ) érhetők el.
          </p>

          <h2>Tárhelyszolgáltató</h2>
          <p>A tárhelyszolgáltató adatai a weboldal indulása előtt kerülnek kitöltésre.</p>

          <h2>Felelősség</h2>
          <p>
            A weboldalon közzétett tartalmak általános tájékoztatásra szolgálnak, nem minősülnek
            jogi tanácsadásnak, és nem hoznak létre ügyvéd–ügyfél jogviszonyt. Konkrét ügyben
            kérjen személyre szabott konzultációt.
          </p>
        </Prose>
      </section>
    </>
  );
}
