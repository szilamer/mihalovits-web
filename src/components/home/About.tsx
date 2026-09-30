import Image from "next/image";
import { Certificate, Translate, Timer, Handshake } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealChild, RevealGroup } from "@/components/ui/Reveal";
import { getAbout, getFirm, getHome } from "@/content";

const valueIcons = [Handshake, Timer, Certificate];

export function About() {
  const firm = getFirm();
  const about = getAbout();
  const section = getHome().about;
  return (
    <section id="rolam" className="relative overflow-hidden bg-paper py-24 lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <Reveal className="relative lg:col-span-5" amount={0.15}>
          <div className="lg:sticky lg:top-32">
            <div className="relative mx-auto max-w-[460px]">
              <div className="rounded-[2rem] bg-ink/5 p-2 ring-1 ring-ink/6">
                <div className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] shadow-ambient">
                  <Image
                    src={firm.images.office.src}
                    alt={`${firm.name} az irodájában`}
                    width={firm.images.office.width}
                    height={firm.images.office.height}
                    sizes="(min-width: 1024px) 460px, 90vw"
                    className="aspect-[582/620] h-auto w-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-3 hidden sm:block lg:-right-8">
                <div className="rounded-2xl bg-ink p-1 shadow-ambient ring-1 ring-white/10">
                  <div className="flex items-center gap-4 rounded-[calc(1rem-0.25rem)] bg-ink-800 px-5 py-4 text-white">
                    <Translate size={26} weight="light" className="text-sky" />
                    <div>
                      <p className="text-[10.5px] uppercase tracking-[0.2em] text-white/55">
                        {section.languagesLabel}
                      </p>
                      <p className="mt-0.5 font-display text-xl font-medium leading-none">
                        {section.languages}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <RevealGroup className="lg:col-span-7 lg:pl-6" gap={0.1}>
          <RevealChild>
            <Eyebrow>{about.eyebrow}</Eyebrow>
          </RevealChild>
          <RevealChild as="h2" className="mt-6 max-w-[18ch] text-balance font-display text-4xl font-medium leading-[1.02] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]">
            {about.title}
          </RevealChild>
          <RevealChild as="p" className="mt-7 max-w-[60ch] text-pretty text-[17px] leading-relaxed text-ink/85">
            {about.lead}
          </RevealChild>
          {about.paragraphs.map((p, i) => (
            <RevealChild key={i} as="p" className="mt-5 max-w-[62ch] text-pretty text-[15.5px] leading-relaxed text-muted">
              {p}
            </RevealChild>
          ))}

          <RevealChild as="div" className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-ink/8 ring-1 ring-ink/8 sm:grid-cols-3">
            {about.values.map((v, i) => {
              const Icon = valueIcons[i % valueIcons.length];
              return (
                <div key={i} className="bg-white p-6">
                  <Icon size={24} weight="light" className="text-sky-deep" />
                  <h3 className="mt-4 font-display text-xl font-medium tracking-tight text-ink">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{v.text}</p>
                </div>
              );
            })}
          </RevealChild>

          <RevealChild as="div" className="mt-10 flex flex-wrap items-center gap-3">
            <Button href="/rolam" tone="ink">
              {section.primaryCta}
            </Button>
            <Button href="/kapcsolat" tone="ghost" icon={false}>
              {section.secondaryCta}
            </Button>
          </RevealChild>
        </RevealGroup>
      </div>
    </section>
  );
}
