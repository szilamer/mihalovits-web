import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealChild, RevealGroup } from "@/components/ui/Reveal";
import { getHome } from "@/content";

export function Process() {
  const { process } = getHome();
  return (
    <section id="folyamat" className="relative overflow-hidden bg-white py-24 lg:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>{process.eyebrow}</Eyebrow>
            <h2 className="mt-6 max-w-[20ch] text-balance font-display text-4xl font-medium leading-[1.02] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {process.title}
            </h2>
          </div>
          <Button href="/kapcsolat" tone="ink" className="shrink-0">
            {process.cta}
          </Button>
        </Reveal>

        <RevealGroup as="ol" className="relative mt-20 grid gap-y-14 lg:grid-cols-4 lg:gap-x-8" gap={0.12}>
          <div
            aria-hidden
            className="absolute left-[1.35rem] top-2 hidden h-px w-[calc(100%-2.7rem)] bg-ink/10 lg:block"
          />
          {process.steps.map((s, i) => (
            <RevealChild as="li" key={i} className="relative lg:pt-10">
              <span className="arch absolute -top-1 left-0 hidden h-5 w-3 bg-sky lg:block" aria-hidden />
              <span className="font-display text-[2.75rem] font-medium leading-none tracking-tight text-sky">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-[1.75rem] font-medium leading-tight tracking-tight text-ink">
                {s.title}
              </h3>
              <p className="mt-3 max-w-[38ch] text-[14.5px] leading-relaxed text-muted">
                {s.text}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-soft/70 px-3 py-1 text-[11.5px] font-medium text-sky-deep ring-1 ring-sky/25">
                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                {s.meta}
              </span>
            </RevealChild>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
