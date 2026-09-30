import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  EnvelopeSimple,
  MapPin,
  Phone,
} from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/ui/Logo";
import { getFirm, getPracticeAreas } from "@/content";
import { nav } from "@/content/navigation";

export function Footer() {
  const firm = getFirm();
  const practiceAreas = getPracticeAreas();
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="bg-uprights-light absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo variant="dark" className="h-24 w-auto" />
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-white/65">
              {firm.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-[12.5px] text-white/60">
              {firm.languages.map((l) => (
                <span key={l} className="rounded-full px-3 py-1 ring-1 ring-white/12 capitalize">
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-7">
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky">
                Szakterületek
              </h4>
              <ul className="mt-5 space-y-3">
                {practiceAreas.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/szakteruletek/${p.slug}`}
                      className="text-[14px] text-white/75 transition-colors duration-300 hover:text-white"
                    >
                      {p.shortTitle}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky">
                Navigáció
              </h4>
              <ul className="mt-5 space-y-3">
                {nav.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      className="text-[14px] text-white/75 transition-colors duration-300 hover:text-white"
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/adatkezeles" className="text-[14px] text-white/75 hover:text-white">
                    Adatkezelés
                  </Link>
                </li>
                <li>
                  <Link href="/impresszum" className="text-[14px] text-white/75 hover:text-white">
                    Impresszum
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky">
                Elérhetőség
              </h4>
              <ul className="mt-5 space-y-4 text-[14px] text-white/75">
                <li className="flex gap-3">
                  <MapPin size={18} weight="light" className="mt-0.5 shrink-0 text-sky" />
                  <a href={firm.address.mapsUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                    {firm.address.zip} {firm.address.city},<br />
                    {firm.address.street}
                  </a>
                </li>
                <li className="flex gap-3">
                  <Phone size={18} weight="light" className="mt-0.5 shrink-0 text-sky" />
                  <a href={firm.phoneHref} className="hover:text-white">
                    {firm.phone}
                  </a>
                </li>
                <li className="flex gap-3">
                  <EnvelopeSimple size={18} weight="light" className="mt-0.5 shrink-0 text-sky" />
                  <a href={`mailto:${firm.email}`} className="hover:text-white">
                    {firm.email}
                  </a>
                </li>
                <li className="flex gap-3">
                  <Clock size={18} weight="light" className="mt-0.5 shrink-0 text-sky" />
                  <span>
                    {firm.hours[0].days}
                    <br />
                    {firm.hours[0].time}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-white/10 pt-8 text-[12.5px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {firm.legalName}. Minden jog fenntartva.
          </p>
          <p className="flex items-center gap-1.5">
            <span>{firm.chamber}</span>
            <span aria-hidden>·</span>
            <a
              href="https://magyarugyvedikamara.hu/html/nyilvanos-kereso/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-white"
            >
              Kamarai nyilvántartás <ArrowUpRight size={12} />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
