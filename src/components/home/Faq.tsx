import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { getFirm, getHome, type Firm } from "@/content";

/** Replaces the `{telefon}` token of editable copy with the call link. */
function withPhoneLink(text: string, firm: Firm) {
  return text.split("{telefon}").flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a
            key={i}
            href={firm.phoneHref}
            className="font-medium text-ink underline decoration-sky decoration-2 underline-offset-4"
          >
            {firm.phone}
          </a>,
          part,
        ],
  );
}

export function Faq() {
  const firm = getFirm();
  const { faq } = getHome();
  return (
    <section id="kerdesek" className="relative bg-paper py-24 lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
        <Reveal className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <Eyebrow>{faq.eyebrow}</Eyebrow>
            <h2 className="mt-6 max-w-[14ch] text-balance font-display text-4xl font-medium leading-[1.02] tracking-tight text-ink sm:text-5xl">
              {faq.title}
            </h2>
            <p className="mt-6 max-w-[38ch] text-[15px] leading-relaxed text-muted">
              {withPhoneLink(faq.text, firm)}
            </p>
            <div className="mt-8">
              <Button href="/kapcsolat" tone="ink">
                {faq.cta}
              </Button>
            </div>
          </div>
        </Reveal>
        <Reveal className="lg:col-span-8" delay={0.1}>
          <Accordion items={faq.items} />
        </Reveal>
      </div>
    </section>
  );
}
