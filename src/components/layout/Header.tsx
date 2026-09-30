"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Phone } from "@phosphor-icons/react";
import { nav } from "@/content/navigation";

const ease = [0.32, 0.72, 0, 1] as const;

/** Routes whose hero is light; every other route (incl. 404) opens on a navy hero. */
const LIGHT_HERO_ROUTES = new Set(["/", "/kapcsolat", "/adatkezeles", "/impresszum"]);

type HeaderProps = {
  firm: { brand: string; phone: string; phoneHref: string; email: string };
};

export function Header({ firm }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  const dark = open || scrolled || !LIGHT_HERO_ROUTES.has(pathname);

  useEffect(() => {
    // IntersectionObserver on a sentinel avoids a scroll listener.
    const sentinel = document.getElementById("top-sentinel");
    if (!sentinel) return;
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: "0px" },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href.startsWith("/#") ? false : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <div id="top-sentinel" aria-hidden className="absolute top-0 h-px w-px" />
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4 sm:pt-5">
        <motion.nav
          layout
          transition={{ duration: 0.6, ease }}
          className={[
            "pointer-events-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-full pl-4 pr-2 py-2",
            "ring-1 transition-[background-color,box-shadow,ring-color] duration-700 ease-soft",
            dark
              ? "bg-ink/85 text-white ring-white/10 shadow-ambient backdrop-blur-xl"
              : "bg-white/70 text-ink ring-ink/8 backdrop-blur-xl",
          ].join(" ")}
          aria-label="Fő navigáció"
        >
          <Link href="/" className="flex items-center gap-3" aria-label="Főoldal">
            <Image
              src="/brand/mark.png"
              alt=""
              width={749}
              height={514}
              priority
              className="h-6 w-auto sm:h-7"
            />
            <span className="font-display text-[20px] font-medium tracking-[0.18em] sm:text-[22px]">
              {firm.brand}
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "relative rounded-full px-4 py-2 text-[13.5px] font-medium tracking-tight transition-colors duration-300",
                    dark
                      ? "text-white/75 hover:text-white"
                      : "text-ink/70 hover:text-ink",
                    isActive(item.href) ? "!text-sky" : "",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={firm.phoneHref}
              className={[
                "hidden items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-medium tracking-tight ring-1 transition-colors duration-300 md:inline-flex",
                dark
                  ? "text-white ring-white/15 hover:bg-white/10"
                  : "text-ink ring-ink/10 hover:bg-white",
              ].join(" ")}
            >
              <Phone size={15} weight="light" />
              {firm.phone}
            </a>
            <a
              href={firm.phoneHref}
              aria-label={`Hívás: ${firm.phone}`}
              className={[
                "grid size-10 place-items-center rounded-full ring-1 transition-colors duration-300 md:hidden",
                dark ? "text-white ring-white/15 hover:bg-white/10" : "text-ink ring-ink/10 hover:bg-white",
              ].join(" ")}
            >
              <Phone size={17} weight="light" />
            </a>
            <Link
              href="/kapcsolat"
              className="hidden h-10 items-center rounded-full bg-sky px-5 text-[13.5px] font-semibold tracking-tight text-ink transition-[background-color,color,transform] duration-500 ease-soft hover:bg-sky-deep hover:text-white active:scale-[0.98] sm:inline-flex"
            >
              Konzultáció
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Menü bezárása" : "Menü megnyitása"}
              className={[
                "relative grid size-10 place-items-center rounded-full ring-1 transition-colors duration-300 lg:hidden",
                dark ? "ring-white/15 hover:bg-white/10" : "ring-ink/10 hover:bg-white",
              ].join(" ")}
            >
              <span
                className={`absolute h-px w-4 bg-current transition-transform duration-500 ease-soft ${
                  open ? "rotate-45" : "-translate-y-[3.5px]"
                }`}
              />
              <span
                className={`absolute h-px w-4 bg-current transition-transform duration-500 ease-soft ${
                  open ? "-rotate-45" : "translate-y-[3.5px]"
                }`}
              />
            </button>
          </div>
        </motion.nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease }}
            className="fixed inset-0 z-30 flex flex-col bg-ink/92 px-6 pb-10 pt-28 text-white backdrop-blur-3xl lg:hidden"
          >
            <ul className="flex flex-col gap-1">
              {nav.map((item, i) => (
                <li key={item.href} className="overflow-hidden">
                  <motion.div
                    initial={{ y: 48, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 24, opacity: 0 }}
                    transition={{ duration: 0.7, ease, delay: 0.08 + i * 0.06 }}
                  >
                    <Link
                      href={item.href}
                      onClick={close}
                      className="block border-b border-white/10 py-4 font-display text-4xl font-medium tracking-tight"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease, delay: 0.45 }}
              className="mt-auto space-y-4"
            >
              <a href={firm.phoneHref} className="block text-lg text-white/80">
                {firm.phone}
              </a>
              <a href={`mailto:${firm.email}`} className="block text-lg text-white/80">
                {firm.email}
              </a>
              <Link
                href="/kapcsolat"
                onClick={close}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-sky text-[15px] font-semibold text-ink"
              >
                Konzultáció kérése
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
