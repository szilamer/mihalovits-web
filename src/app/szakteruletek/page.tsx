import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { PageHero } from "@/components/layout/PageHero";
import { AreaIcon } from "@/components/ui/AreaIcon";
import { RevealChild, RevealGroup } from "@/components/ui/Reveal";
import { ContactSection } from "@/components/contact/ContactSection";
import { getHome, getPracticeAreas, getPracticeAreasPage } from "@/content";

export function generateMetadata(): Metadata {
  const page = getPracticeAreasPage();
  return { title: page.seo.title, description: page.seo.description || page.lead };
}

export default function PracticeAreasPage() {
  const page = getPracticeAreasPage();
  const practiceAreas = getPracticeAreas();
  const nicheHighlight = getHome().niche;
  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        lead={page.lead}
        crumbs={[{ label: "Főoldal", href: "/" }, { label: "Szakterületek" }]}
      />

      <section className="bg-paper py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealGroup as="ul" className="divide-y divide-ink/8 border-y border-ink/8" gap={0.08}>
            {practiceAreas.map((a, i) => (
              <RevealChild as="li" key={a.slug}>
                <Link
                  href={`/szakteruletek/${a.slug}`}
                  className="group grid gap-6 py-10 transition-colors duration-500 lg:grid-cols-12 lg:items-center lg:gap-8"
                >
                  <div className="flex items-center gap-6 lg:col-span-5">
                    <span className="font-display text-[13px] tracking-[0.2em] text-muted-soft">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="arch grid h-14 w-11 shrink-0 place-items-end justify-items-center bg-white pb-2.5 text-sky-deep ring-1 ring-ink/8 transition-colors duration-500 group-hover:bg-sky group-hover:text-ink">
                      <AreaIcon name={a.icon} size={22} />
                    </span>
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-sky-deep">
                        {a.eyebrow}
                      </p>
                      <h2 className="mt-1 font-display text-[1.75rem] font-medium leading-tight tracking-tight text-ink sm:text-3xl">
                        {a.title}
                      </h2>
                    </div>
                  </div>
                  <p className="max-w-[54ch] text-[14.5px] leading-relaxed text-muted lg:col-span-5">
                    {a.summary}
                  </p>
                  <div className="lg:col-span-2 lg:justify-self-end">
                    <span className="inline-flex items-center gap-3 text-[13.5px] font-medium text-ink">
                      Részletek
                      <span className="grid size-9 place-items-center rounded-full ring-1 ring-ink/10 transition-[transform,background-color,color] duration-500 ease-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-ink group-hover:text-white">
                        <ArrowUpRight size={15} weight="bold" />
                      </span>
                    </span>
                  </div>
                </Link>
              </RevealChild>
            ))}
          </RevealGroup>

          <div className="mt-12 grid gap-6 rounded-[1.75rem] bg-ink p-1.5 lg:grid-cols-12 lg:items-center">
            <div className="flex items-center gap-5 rounded-[calc(1.75rem-0.375rem)] p-6 text-white lg:col-span-4">
              <span className="arch grid h-16 w-12 shrink-0 place-items-end justify-items-center bg-sky pb-3 text-ink">
                <AreaIcon name={nicheHighlight.icon} size={24} weight="regular" />
              </span>
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-sky">
                  {nicheHighlight.eyebrow}
                </p>
                <h3 className="mt-1 font-display text-2xl font-medium tracking-tight">
                  {nicheHighlight.title}
                </h3>
              </div>
            </div>
            <p className="px-6 pb-6 text-[14.5px] leading-relaxed text-white/65 lg:col-span-8 lg:py-6">
              {nicheHighlight.text}
            </p>
          </div>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
