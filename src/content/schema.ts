/**
 * Content model of the site.
 *
 * Each schema validates one JSON file under `content/` at build time, and its `.meta()` labels
 * and hints generate the matching form of the admin interface (scripts/cms-config.mjs), so the
 * validation rules and the editor can never drift apart.
 *
 * The admin build runs this file directly with Node's type stripping: keep it free of path
 * aliases, local imports and non-erasable TypeScript syntax (enums, namespaces).
 */
import { z } from "zod";

export const SITE_URL = "https://mihalovits.eu";

export type FieldMeta = {
  label: string;
  hint?: string;
  widget?: "text" | "richtext" | "image" | "relation";
  /** Maintained by the admin itself (e.g. drag-and-drop order), so it gets no form field. */
  managed?: boolean;
  /** Display labels of enum values, keyed by value. */
  options?: Record<string, string>;
  /** Collapsed list item summary, e.g. `{{fields.title}}`. */
  summary?: string;
  labelSingular?: string;
  relation?: { collection: string; file: string; valueField: string };
};

type StringOptions = {
  hint?: string;
  max?: number;
  optional?: boolean;
  pattern?: [RegExp, string];
};

function withMeta<T extends z.ZodType>(schema: T, meta: FieldMeta): T {
  return schema.meta(meta);
}

function str(label: string, widget: FieldMeta["widget"], defaultMax: number, o: StringOptions) {
  let schema = z.string().trim().max(o.max ?? defaultMax);
  if (!o.optional) schema = schema.min(1);
  if (o.pattern) schema = schema.regex(...o.pattern);
  return withMeta(schema, { label, hint: o.hint, widget });
}

const line = (label: string, o: StringOptions = {}) => str(label, undefined, 160, o);
const text = (label: string, o: StringOptions = {}) => str(label, "text", 1500, o);
const richtext = (label: string, o: StringOptions = {}) => str(label, "richtext", 60000, o);

/** Only https links: every URL field ends up in an `href`. */
const url = (label: string, o: StringOptions = {}) =>
  line(label, { max: 500, ...o, pattern: [/^https:\/\/\S+$/, "https:// kezdetű webcím szükséges."] });

const image = (label: string, hint: string) =>
  str(label, "image", 200, {
    hint,
    pattern: [
      /^\/(?:uploads|brand)\/[\w.-]+\.(?:jpe?g|png|webp)$/i,
      "Feltöltött JPG, PNG vagy WebP kép szükséges.",
    ],
  });

function list<T extends z.ZodType>(
  item: T,
  meta: Omit<FieldMeta, "widget" | "options"> & { min?: number; max: number },
) {
  const { min = 0, max, ...rest } = meta;
  return withMeta(z.array(item).min(min).max(max), rest);
}

function group<T extends z.ZodRawShape>(shape: T, meta: Pick<FieldMeta, "label" | "hint">) {
  return withMeta(z.strictObject(shape), meta);
}

export const iconNames = [
  "buildings",
  "briefcase",
  "first-aid",
  "shield-check",
  "users-three",
  "scales",
  "diamond",
] as const;

export type IconName = (typeof iconNames)[number];

const icon = (label: string) =>
  withMeta(z.enum(iconNames), {
    label,
    options: {
      buildings: "Épületek (ingatlan)",
      briefcase: "Aktatáska (cég, szerződés)",
      "first-aid": "Elsősegély (egészségügy)",
      "shield-check": "Pajzs (adatvédelem)",
      "users-three": "Emberek (munkajog)",
      scales: "Mérleg (polgári jog)",
      diamond: "Gyémánt (ékszer, luxus)",
    },
  });

const eyebrow = (hint = "A cím feletti kis, nagybetűs felirat.") =>
  line("Felső címke", { max: 80, hint });
const heading = (hint?: string) => line("Cím", { max: 140, hint });
const button = (label: string, hint?: string) => line(label, { max: 40, hint });

const faqList = (label = "Kérdések és válaszok", min = 0) =>
  list(
    z.strictObject({
      q: line("Kérdés", { max: 200 }),
      a: text("Válasz", { max: 1500 }),
    }),
    { label, min, max: 20, summary: "{{fields.q}}", labelSingular: "kérdés" },
  );

const seo = (titleHint: string) =>
  group(
    {
      title: line("Cím a keresőben", { max: 90, hint: titleHint }),
      description: text("Leírás a keresőben", {
        max: 300,
        optional: true,
        hint: "1–2 mondat, amely a Google-találat alatt jelenik meg (ideálisan 150 karakter körül). Ha üresen marad, az oldal bevezető szövege kerül ide.",
      }),
    },
    { label: "Keresőoptimalizálás (SEO)" },
  );

const SEO_SUFFIX_HINT =
  "A böngészőfülön és a Google-találatban megjelenő cím. A „| Dr. … ügyvéd” utótag automatikusan kerül mögé.";

export const firmSchema = z.strictObject({
  name: line("Név", { max: 80, hint: "Teljes név titulussal, pl. „Dr. Mihalovits Máté”." }),
  title: line("Megnevezés", { max: 60, hint: "A név alatt megjelenő foglalkozás, pl. „ügyvéd”." }),
  legalName: line("Hivatalos megnevezés", {
    max: 120,
    hint: "Az impresszumban és a lábléc szerzői jogi sorában szerepel.",
  }),
  brand: line("Márkanév a fejlécben", { max: 40, hint: "A logó mellett álló rövid név." }),
  tagline: line("Szlogen", {
    max: 160,
    hint: "Közösségi megosztáskor (Facebook, LinkedIn, Messenger) megjelenő rövid leírás.",
  }),
  description: text("Rövid bemutatkozás", {
    max: 400,
    hint: "A láblécben és a keresőtalálatokban megjelenő 1–2 mondat.",
  }),
  email: line("E-mail cím", {
    max: 254,
    pattern: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Érvényes e-mail cím szükséges."],
    hint: "Az oldalon megjelenő cím. A kapcsolati űrlap üzeneteinek címzettje a szerveren van beállítva.",
  }),
  phone: line("Telefonszám", {
    max: 30,
    pattern: [/^\+?[\d\s()/-]{7,}$/, "Csak számjegy, szóköz, +, -, / és zárójel szerepelhet benne."],
    hint: "Pl. „+36 30 219 5593”. A hívható link ebből készül.",
  }),
  address: group(
    {
      zip: line("Irányítószám", { max: 10 }),
      city: line("Város", { max: 60 }),
      street: line("Utca, házszám", { max: 120 }),
      mapsQuery: line("Keresés a térképen", {
        max: 160,
        hint: "Ez a szöveg kerül a Kapcsolat oldal térképének keresőjébe.",
      }),
      mapsUrl: url("Útvonaltervező link", { hint: "A címre kattintva megnyíló Google Térkép-link." }),
    },
    { label: "Iroda címe" },
  ),
  hours: list(
    z.strictObject({ days: line("Napok", { max: 60 }), time: line("Időpont", { max: 60 }) }),
    {
      label: "Ügyfélfogadás",
      hint: "Az első sor a láblécben is megjelenik.",
      min: 1,
      max: 7,
      summary: "{{fields.days}}: {{fields.time}}",
      labelSingular: "sor",
    },
  ),
  languages: list(line("Nyelv", { max: 30 }), {
    label: "Munkanyelvek",
    hint: "Kisbetűvel, pl. „angol”. A láblécben és a szakterület-oldalakon jelenik meg.",
    min: 1,
    max: 6,
    labelSingular: "nyelv",
  }),
  chamber: line("Ügyvédi kamara", { max: 120 }),
  chamberId: line("Kamarai azonosító", { max: 60 }),
  googleProfileUrl: url("Google Cégprofil linkje", {
    hint: "A vélemények szekció értékelés-dobozára kattintva nyílik meg.",
  }),
  images: group(
    {
      portrait: image(
        "Álló portré",
        "A főoldal nyitóképe, a Rólam oldal és a szakterület-oldalak képe. 3:4 arányban jelenik meg; legalább 900×1200 képpont ajánlott.",
      ),
      office: image(
        "Irodai fotó",
        "A főoldal bemutatkozó szekciójának képe. Közel négyzetes (kb. 15:16) arányban jelenik meg.",
      ),
      share: image(
        "Megosztási kép",
        "Ez a kép jelenik meg, ha valaki megosztja az oldalt (Facebook, LinkedIn, Messenger). Kb. 1200×630 képpont ajánlott.",
      ),
    },
    { label: "Képek" },
  ),
});

const stat = z.strictObject({
  value: line("Érték", { max: 12, hint: "Rövid szám vagy jel, pl. „7+” vagy „24 ó”." }),
  label: line("Magyarázat", { max: 120 }),
});

const processStep = z.strictObject({
  title: line("Lépés neve", { max: 60 }),
  text: text("Leírás", { max: 400 }),
  meta: line("Címke", { max: 60, hint: "A leírás alatti kis kék címke, pl. „15 perc, díjmentes”." }),
});

const testimonial = z.strictObject({
  quote: text("Vélemény", { max: 600 }),
  name: line("Név", { max: 60 }),
  role: line("Szerep", { max: 80, hint: "Pl. „Ingatlanvásárló, Budapest”." }),
  initials: line("Monogram", { max: 3, hint: "1–3 betű a név melletti jelvényben." }),
});

export const homeSchema = z.strictObject({
  seo: seo("A böngészőfülön és a Google-találatban megjelenő teljes cím."),
  hero: group(
    {
      eyebrow: eyebrow("A főcím feletti kis, nagybetűs felirat."),
      title: line("Főcím", {
        max: 90,
        hint: "A *csillagok közé* tett rész dőlt, kék kiemelést kap.",
      }),
      lead: text("Bevezető", { max: 400 }),
      primaryCta: button("Fő gomb felirata", "A Kapcsolat oldalra visz."),
      secondaryCta: button("Második gomb felirata", "A Szakterületek oldalra visz."),
      highlights: list(line("Pont", { max: 60 }), {
        label: "Kiemelt pontok",
        hint: "A gombok alatti, pipával jelölt rövid állítások.",
        max: 5,
        labelSingular: "pont",
      }),
      responseBadge: group(
        { label: line("Címke", { max: 30 }), value: line("Érték", { max: 30 }) },
        { label: "Válaszidő-kártya", hint: "A portré mellett lebegő sötét kártya." },
      ),
      stats: list(stat, {
        label: "Számok",
        hint: "A nyitó szekció alján álló számok; 3 elem mutat a legjobban.",
        max: 4,
        summary: "{{fields.value}} – {{fields.label}}",
        labelSingular: "szám",
      }),
    },
    { label: "Nyitó szekció" },
  ),
  trustPoints: list(line("Állítás", { max: 60 }), {
    label: "Futó szalag",
    hint: "A nyitó szekció alatt folyamatosan úszó rövid állítások.",
    min: 1,
    max: 12,
    labelSingular: "állítás",
  }),
  practiceAreas: group(
    {
      eyebrow: eyebrow(),
      title: heading(),
      text: text("Szöveg", { max: 400 }),
    },
    {
      label: "Szakterületek szekció",
      hint: "Maguk a szakterületek a bal oldali „Szakterületek” menüpontban szerkeszthetők.",
    },
  ),
  niche: group(
    {
      eyebrow: eyebrow(),
      title: heading(),
      text: text("Szöveg", { max: 600 }),
      icon: icon("Ikon"),
      cta: button("Gomb felirata", "A Kapcsolat oldalra visz."),
    },
    { label: "Iparági fókusz doboz", hint: "A szakterületek alatti kiemelt doboz; a Szakterületek oldalon is megjelenik." },
  ),
  about: group(
    {
      languagesLabel: line("Nyelvkártya címkéje", { max: 30 }),
      languages: line("Nyelvkártya szövege", { max: 60 }),
      primaryCta: button("Fő gomb felirata", "A Rólam oldalra visz."),
      secondaryCta: button("Második gomb felirata", "A Kapcsolat oldalra visz."),
    },
    {
      label: "Bemutatkozás szekció",
      hint: "A szekció címe és szövege a „Rólam” oldal tartalmából jelenik meg; itt csak a saját elemei szerkeszthetők.",
    },
  ),
  process: group(
    {
      eyebrow: eyebrow(),
      title: heading(),
      cta: button("Gomb felirata", "A Kapcsolat oldalra visz."),
      steps: list(processStep, {
        label: "Lépések",
        hint: "4 lépés mutat a legjobban.",
        min: 1,
        max: 6,
        summary: "{{fields.title}}",
        labelSingular: "lépés",
      }),
    },
    { label: "Együttműködés menete" },
  ),
  testimonials: group(
    {
      eyebrow: eyebrow(),
      title: heading(),
      rating: group(
        {
          value: line("Értékelés", { max: 4, hint: "Pl. „5,0”." }),
          count: withMeta(z.number().int().min(0).max(100000), { label: "Vélemények száma" }),
          source: line("Forrás", { max: 40, hint: "Pl. „Google-értékelés”." }),
        },
        { label: "Összesített értékelés" },
      ),
      items: list(testimonial, {
        label: "Vélemények",
        hint: "Csak az ügyfél hozzájárulásával közölt, valós vélemény szerepelhet.",
        max: 8,
        summary: "{{fields.name}}",
        labelSingular: "vélemény",
      }),
      note: text("Megjegyzés a vélemények alatt", {
        max: 300,
        optional: true,
        hint: "Apró betűs megjegyzés. Üresen hagyva nem jelenik meg.",
      }),
    },
    { label: "Vélemények" },
  ),
  faq: group(
    {
      eyebrow: eyebrow(),
      title: heading(),
      text: text("Szöveg", {
        max: 300,
        hint: "A {telefon} helyére a telefonszám kerül hívható linkként.",
      }),
      cta: button("Gomb felirata", "A Kapcsolat oldalra visz."),
      items: faqList("Kérdések és válaszok", 1),
    },
    { label: "Gyakori kérdések" },
  ),
});

export const aboutSchema = z.strictObject({
  seo: seo(SEO_SUFFIX_HINT),
  eyebrow: eyebrow(),
  title: heading(),
  lead: text("Bevezető", { max: 600 }),
  paragraphs: list(text("Bekezdés", { max: 1500 }), {
    label: "Bekezdések",
    min: 1,
    max: 8,
    labelSingular: "bekezdés",
  }),
  values: list(
    z.strictObject({ title: line("Cím", { max: 60 }), text: text("Szöveg", { max: 300 }) }),
    {
      label: "Értékek",
      hint: "3 elem mutat a legjobban.",
      max: 6,
      summary: "{{fields.title}}",
      labelSingular: "érték",
    },
  ),
  credentials: group(
    {
      title: heading(),
      items: list(
        z.strictObject({ label: line("Megnevezés", { max: 80 }), detail: line("Részlet", { max: 160 }) }),
        { label: "Tételek", max: 8, summary: "{{fields.label}}", labelSingular: "tétel" },
      ),
    },
    { label: "Képesítés és tagság" },
  ),
  career: group(
    {
      eyebrow: eyebrow(),
      title: heading(),
      text: text("Szöveg", { max: 400 }),
      items: list(
        z.strictObject({
          period: line("Időszak", { max: 40, hint: "Pl. „2019 – 2025”." }),
          role: line("Pozíció", { max: 120 }),
          org: line("Szervezet", { max: 120 }),
          detail: text("Leírás", { max: 600 }),
        }),
        {
          label: "Állomások",
          hint: "A legfrissebb kerüljön felülre.",
          max: 12,
          summary: "{{fields.period}} – {{fields.role}}",
          labelSingular: "állomás",
        },
      ),
    },
    { label: "Szakmai út" },
  ),
});

export const practiceAreasPageSchema = z.strictObject({
  seo: seo(SEO_SUFFIX_HINT),
  eyebrow: eyebrow(),
  title: heading(),
  lead: text("Bevezető", { max: 600 }),
});

export const contactSchema = z.strictObject({
  seo: seo(SEO_SUFFIX_HINT),
  eyebrow: eyebrow(),
  title: heading(),
  text: text("Szöveg", { max: 600 }),
  topics: list(line("Téma", { max: 80 }), {
    label: "Témák",
    hint: "Az űrlap „Miben segíthetek?” legördülő listájának elemei.",
    min: 1,
    max: 12,
    labelSingular: "téma",
  }),
  form: group(
    {
      successTitle: line("Köszönő cím", { max: 80 }),
      successText: text("Köszönő szöveg", { max: 400 }),
      responseNote: line("Válaszidő a küldés gomb mellett", { max: 80 }),
    },
    { label: "Űrlap", hint: "A sikeres küldés után és a küldés gomb mellett megjelenő szövegek." },
  ),
});

export const privacySchema = z.strictObject({
  eyebrow: eyebrow(),
  title: heading(),
  updated: line("Hatályos", { max: 40, hint: "Pl. „2026. szeptember 30.”" }),
  lead: text("Bevezető megjegyzés", {
    max: 400,
    optional: true,
    hint: "A „Hatályos: …” mondat után áll. Üresen hagyva nem jelenik meg.",
  }),
  body: richtext("Szöveg", {
    hint: "A fejezetcímekhez használja a „Heading 2”, az alfejezetekhez a „Heading 3” formátumot. Az iroda adatai itt szövegként szerepelnek: ha változnak, itt is frissítse őket.",
  }),
});

export const imprintSchema = z.strictObject({
  eyebrow: eyebrow(),
  title: heading(),
  lead: text("Bevezető", { max: 400 }),
  hosting: group(
    {
      name: line("Név", { max: 120 }),
      address: line("Székhely", { max: 160 }),
      email: line("E-mail", { max: 254 }),
      phone: line("Telefon", { max: 30 }),
      web: url("Weboldal"),
    },
    { label: "Tárhelyszolgáltató" },
  ),
  body: richtext("További tudnivalók", {
    hint: "A szolgáltató, a kamarai tagság és a tárhelyszolgáltató adatai után megjelenő szöveg.",
  }),
});

export const practiceAreaSchema = z.strictObject({
  // First, where the admin's drag-and-drop reordering writes it.
  order: withMeta(z.number().int().min(0).max(999).default(999), {
    label: "Sorrend",
    managed: true,
  }),
  title: line("Megnevezés", {
    max: 90,
    hint: "Az oldal főcíme. A webcím (link) létrehozáskor ebből készül, és később nem változik.",
  }),
  shortTitle: line("Rövid név", { max: 40, hint: "A láblécben és a morzsamenüben megjelenő rövid név." }),
  eyebrow: eyebrow("A kártyák és az oldal címe feletti kis felirat."),
  summary: text("Összefoglaló", {
    max: 400,
    hint: "A kártyákon, az oldal bevezetőjében és a Google-találatban megjelenő 1–2 mondat.",
  }),
  icon: icon("Ikon"),
  contactTopic: withMeta(z.string().trim().max(80), {
    label: "Téma az űrlapon",
    hint: "Az oldal alján lévő űrlapon ez a téma lesz előre kiválasztva.",
    widget: "relation",
    relation: { collection: "pages", file: "contact", valueField: "topics.*" },
  }),
  intro: list(text("Bekezdés", { max: 1500 }), {
    label: "Miért fontos? – bekezdések",
    min: 1,
    max: 6,
    labelSingular: "bekezdés",
  }),
  services: list(
    z.strictObject({
      title: line("Szolgáltatás", { max: 80 }),
      description: text("Leírás", { max: 400 }),
    }),
    {
      label: "Miben segítek",
      hint: "Az első három a főoldali kártyán is megjelenik.",
      min: 1,
      max: 12,
      summary: "{{fields.title}}",
      labelSingular: "szolgáltatás",
    },
  ),
  process: list(
    z.strictObject({ step: line("Lépés", { max: 60 }), detail: text("Leírás", { max: 400 }) }),
    { label: "A folyamat", max: 8, summary: "{{fields.step}}", labelSingular: "lépés" },
  ),
  faq: faqList("Gyakori kérdések"),
});

export type FirmContent = z.output<typeof firmSchema>;
export type PracticeAreaContent = z.output<typeof practiceAreaSchema>;

type FileEntry = {
  name: string;
  label: string;
  file: string;
  schema: z.ZodObject;
  previewPath?: string;
};

export type CmsCollection =
  | { name: string; label: string; icon: string; description?: string; files: FileEntry[] }
  | {
      name: string;
      label: string;
      labelSingular: string;
      icon: string;
      description?: string;
      folder: string;
      schema: z.ZodObject;
      previewPath: string;
    };

export const contentFiles = {
  home: { name: "home", label: "Főoldal", file: "content/pages/home.json", schema: homeSchema, previewPath: "/" },
  about: { name: "about", label: "Rólam", file: "content/pages/about.json", schema: aboutSchema, previewPath: "/rolam/" },
  practiceAreas: {
    name: "practice-areas",
    label: "Szakterületek (áttekintő oldal)",
    file: "content/pages/practice-areas.json",
    schema: practiceAreasPageSchema,
    previewPath: "/szakteruletek/",
  },
  contact: { name: "contact", label: "Kapcsolat", file: "content/pages/contact.json", schema: contactSchema, previewPath: "/kapcsolat/" },
  privacy: {
    name: "privacy",
    label: "Adatkezelési tájékoztató",
    file: "content/pages/privacy.json",
    schema: privacySchema,
    previewPath: "/adatkezeles/",
  },
  imprint: { name: "imprint", label: "Impresszum", file: "content/pages/imprint.json", schema: imprintSchema, previewPath: "/impresszum/" },
  firm: { name: "firm", label: "Iroda adatai", file: "content/settings/firm.json", schema: firmSchema },
} satisfies Record<string, FileEntry>;

export const practiceAreaFolder = "content/practice-areas";

/** Slugs double as file names and URL segments. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const cmsCollections: CmsCollection[] = [
  {
    name: "pages",
    label: "Oldalak",
    icon: "article",
    description: "Az oldalak szövegei. Mentés után az oldal kb. 3–5 percen belül frissül.",
    files: [
      contentFiles.home,
      contentFiles.about,
      contentFiles.practiceAreas,
      contentFiles.contact,
      contentFiles.privacy,
      contentFiles.imprint,
    ],
  },
  {
    name: "practice-areas",
    label: "Szakterületek",
    labelSingular: "szakterület",
    icon: "gavel",
    description: "Minden szakterület saját oldalt kap a /szakteruletek/ alatt.",
    folder: practiceAreaFolder,
    schema: practiceAreaSchema,
    previewPath: "/szakteruletek/{{slug}}/",
  },
  {
    name: "settings",
    label: "Beállítások",
    icon: "settings",
    description: "Elérhetőségek, címek és képek, amelyek több oldalon is megjelennek.",
    files: [contentFiles.firm],
  },
];
