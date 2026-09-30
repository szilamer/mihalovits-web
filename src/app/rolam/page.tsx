import type { Metadata } from "next";
import Image from "next/image";
import { Certificate, GraduationCap, Scales, Translate } from "@phosphor-icons/react/dist/ssr";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealChild, RevealGroup } from "@/components/ui/Reveal";
import { ContactSection } from "@/components/contact/ContactSection";
import { getAbout, getFirm } from "@/content";

export function generateMetadata(): Metadata {
  const about = getAbout();
  return {
    title: about.seo.title,
    description: about.seo.description || about.lead,
    alternates: { canonical: "/rolam" },
  };
}

const credIcons = [Scales, GraduationCap, Certificate, Translate];

export default function AboutPage() {
  const firm = getFirm();
  const about = getAbout();
  return (
    <>
      <PageHero
        eyebrow={about.eyebrow}
        title={about.title}
        lead={about.lead}
        crumbs={[{ label: "Főoldal", href: "/" }, { label: "Rólam" }]}
        aside={
          <Reveal delay={0.2} className="mx-auto max-w-[360px] lg:ml-auto">
            <div className="arch-lg bg-white/[0.05] p-2 ring-1 ring-white/10">
              <div className="arch-lg relative overflow-hidden shadow-ambient">
                <Image
                  src={firm.images.portrait.src}
                  alt={`${firm.name} portréja`}
                  width={firm.images.portrait.width}
                  height={firm.images.portrait.height}
                  priority
                  sizes="(min-width: 1024px) 360px, 70vw"
                  className="aspect-[3/4] h-auto w-full object-cover"
                />
              </div>
            </div>
          </Reveal>
        }
      />

      <section className="bg-paper py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
          <Reveal className="lg:col-span-7">
            {about.paragraphs.map((p, i) => (
              <p key={i} className="mt-5 max-w-[64ch] text-pretty text-[16px] leading-relaxed text-ink/85 first:mt-0">
                {p}
              </p>
            ))}
            <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-ink/8 ring-1 ring-ink/8 sm:grid-cols-3">
              {about.values.map((v, i) => (
                <div key={i} className="bg-white p-6">
                  <h3 className="font-display text-xl font-medium tracking-tight text-ink">{v.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{v.text}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="lg:col-span-5" delay={0.1}>
            <div className="rounded-[1.75rem] bg-ink p-1.5">
              <div className="rounded-[calc(1.75rem-0.375rem)] bg-ink-800 p-7 text-white">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-sky">
                  {about.credentials.title}
                </p>
                <ul className="mt-6 divide-y divide-white/8">
                  {about.credentials.items.map((c, i) => {
                    const Icon = credIcons[i % credIcons.length];
                    return (
                      <li key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                        <Icon size={22} weight="light" className="mt-0.5 shrink-0 text-sky" />
                        <div>
                          <p className="text-[14.5px] font-semibold tracking-tight">{c.label}</p>
                          <p className="mt-0.5 text-[13px] text-white/60">{c.detail}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Eyebrow>{about.career.eyebrow}</Eyebrow>
              <h2 className="mt-6 max-w-[16ch] text-balance font-display text-4xl font-medium leading-[1.02] tracking-tight text-ink sm:text-5xl">
                {about.career.title}
              </h2>
            </div>
            <p className="max-w-[44ch] text-[15px] leading-relaxed text-muted lg:col-span-5">
              {about.career.text}
            </p>
          </Reveal>

          <RevealGroup as="ol" className="mt-14 border-l border-ink/10 pl-8 lg:pl-12" gap={0.1}>
            {about.career.items.map((t, i) => (
              <RevealChild as="li" key={i} className="relative grid gap-3 pb-12 last:pb-0 lg:grid-cols-12 lg:gap-8">
                <span
                  aria-hidden
                  className={`arch absolute -left-[2.6rem] top-1 h-5 w-3 lg:-left-[3.6rem] ${i === 0 ? "bg-sky" : "bg-ink/20"}`}
                />
                <p className="font-display text-xl font-medium tracking-tight text-ink lg:col-span-3">{t.period}</p>
                <div className="lg:col-span-9">
                  <h3 className="text-[17px] font-semibold tracking-tight text-ink">{t.role}</h3>
                  <p className="mt-0.5 text-[14px] text-sky-deep">{t.org}</p>
                  <p className="mt-2 max-w-[60ch] text-[14.5px] leading-relaxed text-muted">{t.detail}</p>
                </div>
              </RevealChild>
            ))}
          </RevealGroup>

          <Reveal className="mt-16 flex flex-wrap items-center gap-3">
            <Button href="/szakteruletek" tone="ink">
              Szakterületek
            </Button>
            <Button href="#kapcsolat" tone="ghost" icon={false}>
              Időpontot kérek
            </Button>
          </Reveal>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
