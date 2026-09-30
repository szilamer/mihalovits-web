import { GoogleLogo, Quotes, Star } from "@phosphor-icons/react/dist/ssr";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealChild, RevealGroup } from "@/components/ui/Reveal";
import { getFirm, getHome } from "@/content";

export function Testimonials() {
  const firm = getFirm();
  const { testimonials } = getHome();
  return (
    <section id="velemenyek" className="relative overflow-hidden bg-ink py-24 text-white lg:py-36">
      <div className="bg-uprights-light absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-sky/10 blur-[140px]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow tone="dark">{testimonials.eyebrow}</Eyebrow>
            <h2 className="mt-6 max-w-[16ch] text-balance font-display text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
              {testimonials.title}
            </h2>
          </div>
          <a
            href={firm.googleProfileUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex w-max items-center gap-5 rounded-2xl bg-white/[0.04] p-1.5 ring-1 ring-white/10 transition-colors duration-500 hover:bg-white/[0.07] lg:col-span-5 lg:justify-self-end"
          >
            <div className="flex items-center gap-5 rounded-[calc(1rem-0.25rem)] bg-ink-800 px-5 py-4">
              <GoogleLogo size={28} weight="bold" className="text-white/80" />
              <div>
                <div className="flex items-center gap-1 text-sky">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} weight="fill" />
                  ))}
                  <span className="ml-2 font-display text-2xl font-semibold leading-none text-white">
                    {testimonials.rating.value}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-white/55">
                  {testimonials.rating.count} nyilvános {testimonials.rating.source.toLowerCase()} alapján
                </p>
              </div>
            </div>
          </a>
        </Reveal>

        <RevealGroup
          as="ul"
          className="-mx-4 mt-16 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:grid lg:grid-cols-2 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
          gap={0.1}
        >
          {testimonials.items.map((t, i) => (
            <RevealChild
              as="li"
              key={i}
              className={`w-[85vw] shrink-0 snap-center sm:w-[420px] lg:w-auto ${i % 2 === 1 ? "lg:translate-y-8" : ""}`}
            >
              <figure className="h-full rounded-[1.75rem] bg-white/[0.04] p-1.5 ring-1 ring-white/10">
                <div className="flex h-full flex-col rounded-[calc(1.75rem-0.375rem)] bg-ink-800 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-8">
                  <Quotes size={30} weight="fill" className="text-sky/70" />
                  <blockquote className="mt-5 flex-1 font-display text-[1.45rem] font-medium leading-[1.3] tracking-tight text-white/90">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-8 flex items-center gap-4 border-t border-white/8 pt-6">
                    <span className="arch grid h-12 w-10 place-items-end justify-items-center bg-gradient-to-b from-sky to-sky-deep pb-2 font-display text-[15px] font-semibold text-ink">
                      {t.initials}
                    </span>
                    <div>
                      <p className="text-[14.5px] font-semibold tracking-tight">{t.name}</p>
                      <p className="text-[12.5px] text-white/55">{t.role}</p>
                    </div>
                  </figcaption>
                </div>
              </figure>
            </RevealChild>
          ))}
        </RevealGroup>
        {testimonials.note && (
          <p className="mt-6 text-[11.5px] text-white/35">{testimonials.note}</p>
        )}
      </div>
    </section>
  );
}
