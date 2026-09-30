import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { AreaIcon } from "@/components/ui/AreaIcon";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealChild, RevealGroup } from "@/components/ui/Reveal";
import { nicheHighlight, practiceAreas, type PracticeArea } from "@/content/site";

// Asymmetric 12-column bento – no two rows share the same split.
const spans = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
  "lg:col-span-6",
  "lg:col-span-6",
];

function AreaCard({ area, span }: { area: PracticeArea; span: string }) {
  return (
    <RevealChild as="li" className={`${span}`}>
      <Link
        href={`/szakteruletek/${area.slug}`}
        className="group block h-full rounded-[1.75rem] bg-white/[0.04] p-1.5 ring-1 ring-white/10 transition-[background-color,transform] duration-700 ease-soft hover:bg-white/[0.07] active:scale-[0.995]"
      >
        <article className="relative flex h-full flex-col rounded-[calc(1.75rem-0.375rem)] bg-ink-800 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <span className="arch grid h-14 w-11 place-items-end justify-items-center bg-sky/12 pb-2.5 text-sky ring-1 ring-sky/20">
              <AreaIcon name={area.icon} size={22} />
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-white/6 text-white/70 ring-1 ring-white/10 transition-[transform,background-color,color] duration-500 ease-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-sky group-hover:text-ink">
              <ArrowUpRight size={16} weight="bold" />
            </span>
          </div>
          <p className="mt-7 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-sky/90">
            {area.eyebrow}
          </p>
          <h3 className="mt-2 font-display text-[1.9rem] font-medium leading-[1.05] tracking-tight text-white">
            {area.title}
          </h3>
          <p className="mt-4 max-w-[52ch] text-[14.5px] leading-relaxed text-white/60">
            {area.summary}
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {area.services.slice(0, 3).map((s) => (
              <li
                key={s.title}
                className="rounded-full px-3 py-1 text-[12px] text-white/70 ring-1 ring-white/10"
              >
                {s.title}
              </li>
            ))}
          </ul>
        </article>
      </Link>
    </RevealChild>
  );
}

export function PracticeAreas() {
  return (
    <section id="szakteruletek" className="relative overflow-hidden bg-ink py-24 text-white lg:py-36">
      <div className="bg-uprights-light absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute -left-40 top-1/3 h-[560px] w-[560px] rounded-full bg-sky/10 blur-[140px]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow tone="dark">Szakterületek</Eyebrow>
            <h2 className="mt-6 max-w-[16ch] text-balance font-display text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
              Fókuszált szakértelem, ahol a részletek számítanak
            </h2>
          </div>
          <p className="max-w-[46ch] text-[15.5px] leading-relaxed text-white/60 lg:col-span-5 lg:pb-2">
            Hat jogterület, amelyeken napi gyakorlattal dolgozom – mindegyik oldalon
            konkrét szolgáltatásokkal, folyamattal és a leggyakoribb kérdésekre adott
            válaszokkal.
          </p>
        </Reveal>

        <RevealGroup as="ul" className="mt-16 grid gap-4 lg:grid-cols-12" gap={0.08}>
          {practiceAreas.map((a, i) => (
            <AreaCard key={a.slug} area={a} span={spans[i % spans.length]} />
          ))}
        </RevealGroup>

        <Reveal className="mt-4 rounded-[1.75rem] bg-sky/[0.08] p-1.5 ring-1 ring-sky/20">
          <div className="grid gap-6 rounded-[calc(1.75rem-0.375rem)] bg-ink-800/70 p-7 sm:p-8 lg:grid-cols-12 lg:items-center">
            <div className="flex items-center gap-5 lg:col-span-4">
              <span className="arch grid h-16 w-12 shrink-0 place-items-end justify-items-center bg-sky text-ink pb-3">
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
            <p className="text-[14.5px] leading-relaxed text-white/65 lg:col-span-6">
              {nicheHighlight.text}
            </p>
            <div className="lg:col-span-2 lg:justify-self-end">
              <Button href="/kapcsolat" tone="glass">
                Egyeztetés
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
