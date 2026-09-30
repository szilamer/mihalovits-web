import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Prose } from "@/components/layout/Prose";
import { getPrivacyPage, renderMarkdown } from "@/content";

export function generateMetadata(): Metadata {
  return { title: getPrivacyPage().title, robots: { index: false } };
}

export default function PrivacyPage() {
  const page = getPrivacyPage();
  const updated = page.updated.replace(/\.?$/, ".");
  return (
    <>
      <PageHero
        tone="light"
        eyebrow={page.eyebrow}
        title={page.title}
        lead={`Hatályos: ${updated}${page.lead ? ` ${page.lead}` : ""}`}
        crumbs={[{ label: "Főoldal", href: "/" }, { label: page.title }]}
      />
      <section className="bg-paper pb-24">
        <Prose>
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />
        </Prose>
      </section>
    </>
  );
}
