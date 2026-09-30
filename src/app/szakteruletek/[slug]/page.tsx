import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check } from "@phosphor-icons/react/dist/ssr";
import { PageHero } from "@/components/layout/PageHero";
import { Accordion } from "@/components/ui/Accordion";
import { AreaIcon } from "@/components/ui/AreaIcon";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealChild, RevealGroup } from "@/components/ui/Reveal";
import { ContactSection } from "@/components/contact/ContactSection";
import { contact, firm, practiceAreas } from "@/content/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return practiceAreas.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const area = practiceAreas.find((p) => p.slug === slug);
  if (!area) return {};
  return {
    title: `${area.title} – ügyvéd Budapest`,
    description: area.summary,
    alternates: { canonical: `/szakteruletek/${area.slug}` },
  };
}

// Maps a practice area to the closest contact-form topic so the form arrives pre-selected.
function topicFor(slug: string): string | undefined {
  const map: Record<string, string> = {
    ingatlanjog: contact.topics[0],
    "tarsasagi-jog": contact.topics[1],
    "egeszsegugyi-jog": contact.topics[2],
    "adatvedelem-gdpr": contact.topics[3],
    munkajog: contact.topics[4],
    "polgari-jog": contact.topics[5],
  };
  return map[slug];
}

export default async function PracticeAreaPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const area = practiceAreas.find((p) => p.slug === slug);
  if (!area) notFound();

  const others = practiceAreas.filter((p) => p.slug !== area.slug).slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={area.eyebrow}
        title={area.title}
        lead={area.summary}
        crumbs={[
          { label: "Főoldal", href: "/" },
          { label: "Szakterületek", href: "/szakteruletek" },
          { label: area.shortTitle },
        ]}
        aside={
          <Reveal delay={0.2} className="rounded-[2rem] bg-white/[0.05] p-2 ring-1 ring-white/10">
            <div className="flex items-center gap-5 rounded-[calc(2rem-0.5rem)] bg-ink-800 p-5">
              <div className="arch relative h-28 w-24 shrink-0 overflow-hidden">
                <Image
                  src="/brand/portrait-tall.jpg"
                  alt={firm.name}
                  fill
                  sizes="96px"
                  className="object-cover object-top"
                />
              </div>
              <div>
                <p className="text-[10.5px] uppercase tracking-[0.2em] text-sky">Az Ön ügyvédje</p>
                <p className="mt-1 font-display text-2xl font-medium leading-none text-white">{firm.name}</p>
                <p className="mt-2 text-[13px] text-white/60">
                  Válasz 24 órán belül · {firm.languages.join(", ")}
                </p>
                <a href={firm.phoneHref} className="mt-3 inline-block text-[14px] font-medium text-white underline decoration-sky decoration-2 underline-offset-4">
                  {firm.phone}
                </a>
              </div>
            </div>
          </Reveal>
        }
      />

      <section className="bg-paper py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
          <Reveal className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <span className="arch grid h-20 w-16 place-items-end justify-items-center bg-white pb-4 text-sky-deep ring-1 ring-ink/8">
                <AreaIcon name={area.icon} size={30} />
              </span>
              <h2 className="mt-8 max-w-[16ch] text-balance font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
                Miért fontos a jó jogi háttér ezen a területen?
              </h2>
              {area.intro.map((p) => (
                <p key={p.slice(0, 20)} className="mt-5 max-w-[56ch] text-pretty text-[15.5px] leading-relaxed text-muted">
                  {p}
                </p>
              ))}
              <div className="mt-8">
                <Button href="#kapcsolat" tone="ink">
                  Konzultációt kérek
                </Button>
              </div>
            </div>
          </Reveal>

          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Miben segítek</Eyebrow>
            </Reveal>
            <RevealGroup as="ul" className="mt-6 grid gap-px overflow-hidden rounded-[1.75rem] bg-ink/8 ring-1 ring-ink/8 sm:grid-cols-2" gap={0.07}>
              {area.services.map((s) => (
                <RevealChild as="li" key={s.title} className="bg-white p-6 sm:p-7">
                  <span className="grid size-8 place-items-center rounded-full bg-sky-soft text-sky-deep">
                    <Check size={14} weight="bold" />
                  </span>
                  <h3 className="mt-4 font-display text-[1.35rem] font-medium leading-tight tracking-tight text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{s.description}</p>
                </RevealChild>
              ))}
            </RevealGroup>

            <Reveal className="mt-16">
              <Eyebrow>A folyamat</Eyebrow>
            </Reveal>
            <RevealGroup as="ol" className="mt-6 grid gap-4 sm:grid-cols-2" gap={0.08}>
              {area.process.map((p, i) => (
                <RevealChild as="li" key={p.step} className="relative rounded-[1.5rem] bg-white p-6 ring-1 ring-ink/8">
                  <span className="font-display text-[2.6rem] font-medium leading-none text-sky/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-2xl font-medium tracking-tight text-ink">{p.step}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{p.detail}</p>
                </RevealChild>
              ))}
            </RevealGroup>

            {area.faq.length > 0 && (
              <>
                <Reveal className="mt-16">
                  <Eyebrow>Gyakori kérdések</Eyebrow>
                </Reveal>
                <Reveal className="mt-6" delay={0.05}>
                  <Accordion items={area.faq} />
                </Reveal>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="flex items-end justify-between gap-6">
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              További szakterületek
            </h2>
            <Link href="/szakteruletek" className="hidden items-center gap-2 text-[13.5px] font-medium text-ink sm:inline-flex">
              Összes terület <ArrowUpRight size={14} />
            </Link>
          </Reveal>
          <RevealGroup as="ul" className="mt-8 grid gap-4 md:grid-cols-3" gap={0.08}>
            {others.map((o) => (
              <RevealChild as="li" key={o.slug}>
                <Link
                  href={`/szakteruletek/${o.slug}`}
                  className="group flex h-full flex-col rounded-[1.5rem] bg-paper p-6 ring-1 ring-ink/6 transition-colors duration-500 hover:bg-sky-mist"
                >
                  <div className="flex items-start justify-between">
                    <AreaIcon name={o.icon} size={26} className="text-sky-deep" />
                    <ArrowUpRight size={16} className="text-ink/50 transition-transform duration-500 ease-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-medium leading-tight tracking-tight text-ink">
                    {o.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-muted">{o.summary}</p>
                </Link>
              </RevealChild>
            ))}
          </RevealGroup>
        </div>
      </section>

      <ContactSection defaultTopic={topicFor(area.slug)} />
    </>
  );
}
