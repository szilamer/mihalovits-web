import { ArrowUpRight, Clock, EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import { ContactForm } from "@/components/contact/ContactForm";
import { MapEmbed } from "@/components/contact/MapEmbed";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { getContactPage, getFirm } from "@/content";

export function ContactSection({
  showMap = false,
  defaultTopic,
  headingLevel = "h2",
}: {
  showMap?: boolean;
  defaultTopic?: string;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  const firm = getFirm();
  const contact = getContactPage();
  return (
    <section id="kapcsolat" className="relative overflow-hidden bg-paper py-24 lg:py-36">
      <div className="bg-uprights mask-fade-b absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <Reveal className="lg:col-span-5">
          <Eyebrow>{contact.eyebrow}</Eyebrow>
          <Heading className="mt-6 max-w-[14ch] text-balance font-display text-4xl font-medium leading-[1.02] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {contact.title}
          </Heading>
          <p className="mt-6 max-w-[46ch] text-pretty text-[15.5px] leading-relaxed text-muted">
            {contact.text}
          </p>

          <ul className="mt-10 divide-y divide-ink/8 border-y border-ink/8">
            <li className="flex items-start gap-4 py-5">
              <span className="arch grid h-12 w-9 shrink-0 place-items-end justify-items-center bg-white pb-2 text-sky-deep ring-1 ring-ink/8">
                <Phone size={18} weight="light" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-soft">Telefon</p>
                <a href={firm.phoneHref} className="mt-1 block font-display text-2xl font-medium tracking-tight text-ink hover:text-sky-deep">
                  {firm.phone}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4 py-5">
              <span className="arch grid h-12 w-9 shrink-0 place-items-end justify-items-center bg-white pb-2 text-sky-deep ring-1 ring-ink/8">
                <EnvelopeSimple size={18} weight="light" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-soft">E-mail</p>
                <a href={`mailto:${firm.email}`} className="mt-1 block font-display text-2xl font-medium tracking-tight text-ink hover:text-sky-deep">
                  {firm.email}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4 py-5">
              <span className="arch grid h-12 w-9 shrink-0 place-items-end justify-items-center bg-white pb-2 text-sky-deep ring-1 ring-ink/8">
                <MapPin size={18} weight="light" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-soft">Iroda</p>
                <a
                  href={firm.address.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-start gap-1.5 text-[15px] leading-snug text-ink hover:text-sky-deep"
                >
                  <span>
                    {firm.address.zip} {firm.address.city}, {firm.address.street}
                  </span>
                  <ArrowUpRight size={14} className="mt-1 shrink-0" />
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4 py-5">
              <span className="arch grid h-12 w-9 shrink-0 place-items-end justify-items-center bg-white pb-2 text-sky-deep ring-1 ring-ink/8">
                <Clock size={18} weight="light" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-soft">Ügyfélfogadás</p>
                <dl className="mt-1 grid gap-0.5 text-[15px] text-ink">
                  {firm.hours.map((h) => (
                    <div key={h.days} className="flex justify-between gap-6">
                      <dt className="text-muted">{h.days}</dt>
                      <dd className="font-medium">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          </ul>

          {showMap && <MapEmbed query={firm.address.mapsQuery} title="Az iroda helye a térképen" />}
        </Reveal>

        <Reveal className="lg:col-span-7" delay={0.1} amount={0.1}>
          <ContactForm
            topics={contact.topics}
            defaultTopic={defaultTopic && contact.topics.includes(defaultTopic) ? defaultTopic : undefined}
            phone={firm.phone}
            phoneHref={firm.phoneHref}
            texts={contact.form}
          />
        </Reveal>
      </div>
    </section>
  );
}
