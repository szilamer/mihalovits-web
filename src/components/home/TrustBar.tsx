import { getHome } from "@/content";

/** Continuous marquee of trust signals; duplicated list gives a seamless loop. */
export function TrustBar() {
  const { trustPoints } = getHome();
  const items = [...trustPoints, ...trustPoints];
  return (
    <div className="relative border-y border-ink/6 bg-white/60">
      <div className="mask-fade-x mx-auto max-w-7xl overflow-hidden py-5">
        <ul className="flex w-max animate-marquee items-center gap-10 pr-10 will-change-transform hover:[animation-play-state:paused]">
          {items.map((t, i) => (
            <li
              key={`${t}-${i}`}
              className="flex items-center gap-4 whitespace-nowrap text-[13px] font-medium tracking-tight text-ink/70"
              aria-hidden={i >= trustPoints.length}
            >
              <span className="arch inline-block h-3 w-2 bg-sky" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
