import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Prose } from "@/components/layout/Prose";
import { getFirm, getImprintPage, renderMarkdown } from "@/content";

export function generateMetadata(): Metadata {
  return { title: getImprintPage().title, robots: { index: false } };
}

export default function ImprintPage() {
  const firm = getFirm();
  const page = getImprintPage();
  const { hosting } = page;
  return (
    <>
      <PageHero
        tone="light"
        eyebrow={page.eyebrow}
        title={page.title}
        lead={page.lead}
        crumbs={[{ label: "Főoldal", href: "/" }, { label: page.title }]}
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
          <p>
            <strong className="text-ink">{hosting.name}</strong>
            <br />
            Székhely: {hosting.address}
            <br />
            E-mail: <a href={`mailto:${hosting.email}`}>{hosting.email}</a>
            <br />
            Telefon: {hosting.phone}
            <br />
            Web:{" "}
            <a href={hosting.web} target="_blank" rel="noreferrer">
              {hosting.web.replace(/^https?:\/\//, "")}
            </a>
          </p>

          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />
        </Prose>
      </section>
    </>
  );
}
