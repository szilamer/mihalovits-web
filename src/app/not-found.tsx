import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-ink text-white">
      <div className="bg-uprights-light absolute inset-0" aria-hidden />
      <Image
        src="/brand/mark.png"
        alt=""
        aria-hidden
        width={749}
        height={514}
        className="pointer-events-none absolute -right-20 top-1/2 w-[560px] -translate-y-1/2 opacity-[0.06] select-none"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
        <Eyebrow tone="dark">404 · Az oldal nem található</Eyebrow>
        <h1 className="mt-6 max-w-[14ch] text-balance font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
          Ez az oldal nem létezik, vagy elköltözött.
        </h1>
        <p className="mt-6 max-w-[48ch] text-[16px] leading-relaxed text-white/65">
          Kérem, ellenőrizze a hivatkozást, vagy térjen vissza a főoldalra – onnan minden
          szakterület és elérhetőség két kattintással elérhető.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/">Vissza a főoldalra</Button>
          <Button href="/kapcsolat" tone="glass" icon={false}>
            Kapcsolat
          </Button>
        </div>
      </div>
    </section>
  );
}
