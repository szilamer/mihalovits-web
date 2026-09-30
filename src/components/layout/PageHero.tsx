import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealChild, RevealGroup } from "@/components/ui/Reveal";

type Crumb = { label: string; href?: string };

export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  aside,
  tone = "dark",
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  crumbs?: Crumb[];
  aside?: React.ReactNode;
  tone?: "dark" | "light";
}) {
  const dark = tone === "dark";
  return (
    <section
      className={`relative overflow-hidden pb-16 pt-32 lg:pb-24 lg:pt-44 ${
        dark ? "bg-ink text-white" : "bg-paper text-ink"
      }`}
    >
      <div className={`${dark ? "bg-uprights-light" : "bg-uprights mask-fade-b"} absolute inset-0`} aria-hidden />
      <div
        aria-hidden
        className="absolute -right-40 -top-20 h-[480px] w-[480px] rounded-full bg-sky/15 blur-[130px]"
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <RevealGroup className={aside ? "lg:col-span-7" : "lg:col-span-9"} gap={0.1} amount={0.1}>
          {crumbs && (
            <RevealChild>
              <nav aria-label="Morzsamenü" className={`mb-6 flex flex-wrap items-center gap-1.5 text-[12.5px] ${dark ? "text-white/50" : "text-muted"}`}>
                {crumbs.map((c, i) => (
                  <span key={c.label} className="inline-flex items-center gap-1.5">
                    {i > 0 && <CaretRight size={11} aria-hidden />}
                    {c.href ? (
                      <Link href={c.href} className={dark ? "hover:text-white" : "hover:text-ink"}>
                        {c.label}
                      </Link>
                    ) : (
                      <span className={dark ? "text-white/80" : "text-ink"}>{c.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </RevealChild>
          )}
          <RevealChild>
            <Eyebrow tone={dark ? "dark" : "light"}>{eyebrow}</Eyebrow>
          </RevealChild>
          <RevealChild as="h1" className="mt-6 max-w-[16ch] text-balance font-display text-[2.6rem] font-medium leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.4rem]">
            {title}
          </RevealChild>
          {lead && (
            <RevealChild as="p" className={`mt-7 max-w-[58ch] text-pretty text-[16.5px] leading-relaxed ${dark ? "text-white/65" : "text-muted"}`}>
              {lead}
            </RevealChild>
          )}
        </RevealGroup>
        {aside && <div className="lg:col-span-5 lg:self-end">{aside}</div>}
      </div>
    </section>
  );
}
