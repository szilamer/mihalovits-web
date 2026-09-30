import Image from "next/image";
import { CheckCircle, Star } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealChild, RevealGroup } from "@/components/ui/Reveal";
import { firm, heroStats, testimonials } from "@/content/site";

const proofs = ["Ingatlan adásvétel 48 órán belül", "Személyesen vagy online", "HU · EN · DE"];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-paper">
      <div className="bg-uprights mask-fade-b absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute -right-32 top-24 -z-10 h-[520px] w-[520px] rounded-full bg-sky/20 blur-[120px]"
      />

      <div className="mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-12 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-x-8 lg:gap-y-0 lg:px-8 lg:pb-24 lg:pt-40">
        <RevealGroup className="lg:col-span-7 lg:self-end" delay={0.1} gap={0.1} amount={0.1}>
          <RevealChild>
            <Eyebrow>
              Ügyvéd · Budapest, {firm.address.district}
            </Eyebrow>
          </RevealChild>

          <RevealChild as="h1" className="mt-7 max-w-[13ch] text-balance font-display text-[2.9rem] font-medium leading-[0.98] tracking-tight text-ink sm:text-6xl lg:text-[4.9rem]">
            Jogi biztonság, <em className="font-normal italic text-sky-deep">érthető</em> nyelven.
          </RevealChild>

          <RevealChild as="p" className="mt-7 max-w-[54ch] text-pretty text-[17px] leading-relaxed text-muted">
            Ingatlanügyletek, cégek, egészségügyi szektor és adatvédelem – nemzetközi
            ügyvédi irodákban és gyógyszeripari vállalatoknál szerzett tapasztalattal,
            gyakorlatias és üzleti szemlélettel képviselem ügyfeleimet.
          </RevealChild>

          <RevealChild className="mt-9 flex flex-wrap items-center gap-3">
            <Button href="/kapcsolat" size="lg">
              Konzultációt kérek
            </Button>
            <Button href="/szakteruletek" tone="ghost" size="lg" icon={false}>
              Szakterületek
            </Button>
          </RevealChild>

          <RevealChild as="ul" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
            {proofs.map((p) => (
              <li key={p} className="inline-flex items-center gap-2">
                <CheckCircle size={16} weight="fill" className="text-sky" />
                {p}
              </li>
            ))}
          </RevealChild>
        </RevealGroup>

        <RevealGroup className="relative lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1" delay={0.25} gap={0.15} amount={0.1}>
          <RevealChild className="relative mx-auto w-full max-w-[420px]">
            <Image
              src="/brand/mark.png"
              alt=""
              width={749}
              height={514}
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-16 w-[440px] opacity-[0.07] select-none lg:-left-32"
            />

            <div className="arch-lg relative bg-ink/5 p-2 ring-1 ring-ink/6">
              <div className="arch-lg relative overflow-hidden bg-ink-800 shadow-ambient">
                <Image
                  src="/brand/portrait-tall.jpg"
                  alt={`${firm.name} ügyvéd portréja`}
                  width={465}
                  height={620}
                  priority
                  sizes="(min-width: 1024px) 420px, 80vw"
                  className="h-auto w-full object-cover"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-white">
                  <div>
                    <p className="font-display text-2xl font-medium leading-none">{firm.name}</p>
                    <p className="mt-1.5 text-[12px] uppercase tracking-[0.2em] text-sky">
                      {firm.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </RevealChild>

          <RevealChild className="absolute -left-2 top-[62%] hidden sm:block lg:-left-10">
            <div className="animate-float rounded-2xl bg-white/85 p-1 shadow-ambient-sm ring-1 ring-ink/6 backdrop-blur-md">
              <div className="rounded-[calc(1rem-0.25rem)] bg-white px-4 py-3">
                <div className="flex items-center gap-1 text-sky">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} weight="fill" />
                  ))}
                  <span className="ml-1.5 font-display text-xl font-semibold text-ink">
                    {testimonials.rating.value}
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {testimonials.rating.source} · {testimonials.rating.count} vélemény
                </p>
              </div>
            </div>
          </RevealChild>

          <RevealChild className="absolute -right-2 top-[16%] hidden sm:block lg:-right-6">
            <div className="rounded-2xl bg-ink/90 p-1 shadow-ambient ring-1 ring-white/10 backdrop-blur-md">
              <div className="rounded-[calc(1rem-0.25rem)] bg-ink px-4 py-3 text-white">
                <p className="text-[11px] uppercase tracking-[0.2em] text-sky">Visszajelzés</p>
                <p className="mt-1 font-display text-2xl font-medium leading-none">24 órán belül</p>
              </div>
            </div>
          </RevealChild>
        </RevealGroup>

        <Reveal
          className="grid grid-cols-1 gap-6 border-t border-ink/8 pt-8 sm:grid-cols-3 sm:gap-8 lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:mt-14 lg:self-start"
          delay={0.55}
          amount={0.1}
        >
          {heroStats.map((s) => (
            <div key={s.label} className="sm:border-l sm:border-ink/8 sm:pl-6 first:sm:border-l-0 first:sm:pl-0">
              <div className="font-display text-4xl font-medium tracking-tight text-ink">
                {s.value}
              </div>
              <p className="mt-1.5 max-w-[24ch] text-[12.5px] leading-snug text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
