/**
 * Single source of truth for all site copy and data.
 *
 * NOTE: Everything here is placeholder ("mock") content prepared for design
 * review, except for the brand assets (logo, portrait) and the publicly listed
 * contact details that also appear on the business card image.
 * Replace texts, numbers and testimonials with approved content before launch.
 */

export type IconName =
  | "buildings"
  | "briefcase"
  | "first-aid"
  | "shield-check"
  | "users-three"
  | "scales"
  | "diamond";

export interface PracticeArea {
  slug: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  summary: string;
  icon: IconName;
  featured?: boolean;
  intro: string[];
  services: { title: string; description: string }[];
  process: { step: string; detail: string }[];
  faq: { q: string; a: string }[];
}

export const firm = {
  name: "Dr. Mihalovits Máté",
  brand: "mihalovits",
  legalName: "Dr. Mihalovits Máté egyéni ügyvéd",
  title: "ügyvéd",
  tagline: "Gyakorlatias jogi megoldások vállalkozásoknak és magánszemélyeknek",
  description:
    "Budapesti ügyvédi praxis ingatlanjogi, társasági jogi, egészségügyi- és gyógyszerjogi, valamint adatvédelmi ügyekben. Jogi tanácsadás, okiratszerkesztés és képviselet magyar, angol és német nyelven.",
  url: "https://mihalovits.eu",
  email: "info@mihalovits.eu",
  phone: "+36 30 219 5593",
  phoneHref: "tel:+36302195593",
  address: {
    street: "Podmaniczky utca 31., A épület, 3. emelet 18.",
    city: "Budapest",
    zip: "1064",
    district: "VI. kerület",
    country: "Magyarország",
    mapsQuery: "Podmaniczky utca 31, 1064 Budapest",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Dr.+Mihalovits+M%C3%A1t%C3%A9+%C3%BCgyv%C3%A9d+Podmaniczky+u.+31+1064+Budapest",
  },
  hours: [
    { days: "Hétfő – Péntek", time: "8:00 – 18:00" },
    { days: "Szombat – Vasárnap", time: "Előzetes egyeztetéssel" },
  ],
  languages: ["magyar", "angol", "német"],
  chamber: "Budapesti Ügyvédi Kamara",
  chamberId: "KASZ 36-0XXXXX (minta)",
  founded: 2026,
  social: {
    linkedin: "https://www.linkedin.com/",
    google: "https://www.google.com/maps/search/?api=1&query=Dr.+Mihalovits+M%C3%A1t%C3%A9+%C3%BCgyv%C3%A9d+Budapest",
  },
};

export const nav = [
  { label: "Szakterületek", href: "/szakteruletek" },
  { label: "Rólam", href: "/rolam" },
  { label: "Hogyan dolgozom", href: "/#folyamat" },
  { label: "Kérdések", href: "/#kerdesek" },
  { label: "Kapcsolat", href: "/kapcsolat" },
];

export const heroStats = [
  { value: "7+", label: "év jogi tapasztalat nemzetközi irodáknál és multinacionális cégeknél" },
  { value: "3", label: "munkanyelv: magyar, angol, német" },
  { value: "24 ó", label: "alatt visszajelzés minden megkeresésre" },
];

export const trustPoints = [
  "Budapesti Ügyvédi Kamara tagja",
  "Ügyvédi felelősségbiztosítással",
  "Személyes és online konzultáció",
  "Sürgős esetben 4 órán belül",
  "Átlátható, előre egyeztetett díjazás",
  "Magyar, angol és német nyelven",
];

export const practiceAreas: PracticeArea[] = [
  {
    slug: "ingatlanjog",
    title: "Ingatlanjog és adásvétel",
    shortTitle: "Ingatlanjog",
    eyebrow: "Magánszemélyeknek és befektetőknek",
    summary:
      "Adásvételi, ajándékozási és bérleti szerződések gyors elkészítése, véleményezése és ellenjegyzése – rugalmas időpontokkal, akár online aláírással.",
    icon: "buildings",
    featured: true,
    intro: [
      "Egy ingatlan megvásárlása a legtöbb család életében a legnagyobb pénzügyi döntés. A szerződés nem formalitás: ez az az okirat, amely a vevő tulajdonszerzését és a vételár biztonságát garantálja.",
      "Az ügylet minden szakaszában végigkísérem az ügyfeleimet – a tulajdoni lap ellenőrzésétől a földhivatali bejegyzésig – úgy, hogy a folyamat gyors, kiszámítható és érthető legyen.",
    ],
    services: [
      { title: "Adásvételi szerződés", description: "Szerződés elkészítése, véleményezése és ügyvédi ellenjegyzése 48 órán belül, földhivatali ügyintézéssel." },
      { title: "Ajándékozás, csere, haszonélvezet", description: "Családon belüli vagyonrendezés adó- és illetékoptimalizált szerkezetben." },
      { title: "Bérleti szerződések", description: "Lakás- és üzlethelyiség-bérlet közjegyzői okiratba foglalható, kiköltözési nyilatkozattal." },
      { title: "Társasházi ügyek", description: "Alapító okirat, SZMSZ módosítása, közgyűlési határozatok megtámadása." },
      { title: "Hitel és letét", description: "Banki hitellel finanszírozott ügyletek, ügyvédi letétkezelés, tehermentesítés." },
      { title: "Külföldi vevők", description: "Teljes körű angol és német nyelvű ügyintézés, tolmácsolás nélkül." },
    ],
    process: [
      { step: "Ellenőrzés", detail: "Tulajdoni lap, terhek, építésügyi státusz és energetikai tanúsítvány áttekintése." },
      { step: "Szerződés", detail: "Tervezet 2 munkanapon belül, egyeztetés a felekkel és a bankkal." },
      { step: "Aláírás", detail: "Személyesen az irodában vagy azonosításra visszavezetett elektronikus aláírással." },
      { step: "Bejegyzés", detail: "Földhivatali benyújtás, tulajdonjog-bejegyzés nyomon követése, birtokbaadás." },
    ],
    faq: [
      { q: "Mennyi az ügyvédi munkadíj adásvételnél?", a: "A díj a vételár és az ügylet összetettsége alapján, előre rögzített összegben kerül meghatározásra. Az ajánlat az első egyeztetés után 24 órán belül elkészül." },
      { q: "Milyen gyorsan készül el a szerződés?", a: "A szükséges adatok megadása után jellemzően 2 munkanapon belül, sürgős esetben ennél gyorsabban." },
      { q: "Aláírhatunk online?", a: "Igen, azonosításra visszavezetett dokumentumhitelesítéssel (AVDH) vagy videós azonosítással is lehetséges az aláírás." },
    ],
  },
  {
    slug: "tarsasagi-jog",
    title: "Társasági és kereskedelmi jog",
    shortTitle: "Társasági jog",
    eyebrow: "Cégeknek és tulajdonosoknak",
    summary:
      "Cégalapítás, tulajdonosi megállapodások, kereskedelmi szerződések és compliance – üzleti szemlélettel, a napi működést támogatva.",
    icon: "briefcase",
    intro: [
      "Több évet töltöttem multinacionális vállalatok belső jogi csapatában, ezért tudom, hogy egy vállalkozás nem jogi memorandumot, hanem működő megoldást vár.",
      "A tanácsadás során az üzleti célt tartom szem előtt, és a kockázatokat úgy kezelem, hogy a döntéshozatal ne lassuljon le.",
    ],
    services: [
      { title: "Cégalapítás és módosítás", description: "Kft., Zrt., Bt. alapítása, tőkeemelés, tulajdonosváltás, székhelyváltozás elektronikus cégeljárásban." },
      { title: "Szindikátusi szerződés", description: "Tulajdonosok közötti megállapodások, elővásárlási jogok, drag-along és tag-along klauzulák." },
      { title: "Kereskedelmi szerződések", description: "Szállítási, forgalmazási, franchise- és ügynöki szerződések magyar, angol és német nyelven." },
      { title: "Általános szerződési feltételek", description: "Webshopok és szolgáltatók ÁSZF-je, fogyasztóvédelmi megfelelőség." },
      { title: "Compliance", description: "Belső szabályzatok, visszaélés-bejelentési rendszer, versenyjogi megfelelés." },
      { title: "Átvilágítás (due diligence)", description: "Céges és ingatlanos átvilágítás akvizíciók, befektetések előtt." },
    ],
    process: [
      { step: "Megismerés", detail: "Az üzleti modell és a döntési struktúra feltérképezése." },
      { step: "Kockázatelemzés", detail: "A jogi kockázatok rangsorolása üzleti hatás szerint." },
      { step: "Dokumentáció", detail: "Szerződések, szabályzatok elkészítése érthető, alkalmazható formában." },
      { step: "Támogatás", detail: "Folyamatos rendelkezésre állás havidíjas keretmegbízásban is." },
    ],
    faq: [
      { q: "Vállal havidíjas jogi támogatást?", a: "Igen. Kis- és középvállalkozásoknak kiszámítható, óraalapú vagy fix havidíjas keretmegbízást ajánlok." },
      { q: "Mennyi idő egy cégalapítás?", a: "Egyszerűsített cégeljárásban az iratok aláírásától számítva jellemzően 1–3 munkanap." },
    ],
  },
  {
    slug: "egeszsegugyi-jog",
    title: "Gyógyszer- és egészségügyi jog",
    shortTitle: "Egészségügyi jog",
    eyebrow: "Life sciences",
    summary:
      "Gyógyszeripari és egészségügyi szolgáltatók szabályozási, reklám- és szerződéses kérdései – a Pfizernél és a GSK-nál szerzett belső tapasztalattal.",
    icon: "first-aid",
    featured: true,
    intro: [
      "A gyógyszer- és egészségügyi szektor az egyik legszigorúbban szabályozott terület, ahol egy rosszul megfogalmazott promóciós anyag vagy egy hiányos szerződés komoly hatósági következményekkel járhat.",
      "Vezető gyógyszeripari vállalatoknál szerzett tapasztalatom alapján a napi működés nyelvén beszélek: a compliance-t nem akadálynak, hanem a piaci siker feltételének tekintem.",
    ],
    services: [
      { title: "Gyógyszerpromóció és reklámjog", description: "Egészségügyi szakembereknek szóló anyagok, rendezvények, szponzoráció megfelelősége." },
      { title: "Klinikai vizsgálatok", description: "Vizsgálati szerződések, beleegyező nyilatkozatok, adatkezelési dokumentáció." },
      { title: "Egészségügyi szolgáltatók", description: "Magánrendelők, klinikák működési engedélye, betegjogi kérdések, panaszkezelés." },
      { title: "Orvostechnikai eszközök", description: "MDR-megfelelőség, forgalmazási szerződések, hatósági eljárások." },
      { title: "Beszerzési és disztribúciós szerződések", description: "Kórházi tenderek, nagykereskedelmi és forgalmazási megállapodások." },
      { title: "Hatósági eljárások", description: "Képviselet az NNGYK és egyéb felügyeleti szervek előtti eljárásokban." },
    ],
    process: [
      { step: "Szabályozási térkép", detail: "Az adott termékre vagy szolgáltatásra irányadó előírások összegzése." },
      { step: "Gap-elemzés", detail: "A jelenlegi gyakorlat és a szabályozás közti eltérések azonosítása." },
      { step: "Megoldás", detail: "Szerződések, folyamatok, tréninganyagok kidolgozása." },
      { step: "Fenntartás", detail: "Jogszabályváltozások követése, rendszeres felülvizsgálat." },
    ],
    faq: [
      { q: "Kisebb magánrendelőnek is tud segíteni?", a: "Igen. Az egyszemélyes praxistól a több telephelyes klinikáig minden méretű szolgáltatóval dolgozom." },
      { q: "Angol nyelvű anyavállalati egyeztetésben részt vesz?", a: "Természetesen – a nemzetközi csoportokkal való napi együttműködés a korábbi munkáim természetes része volt." },
    ],
  },
  {
    slug: "adatvedelem-gdpr",
    title: "Adatvédelem, GDPR és compliance",
    shortTitle: "Adatvédelem",
    eyebrow: "Privacy & compliance",
    summary:
      "Adatkezelési dokumentáció, incidenskezelés, hatósági eljárások és belső auditok – korábbi Privacy & Compliance Officer tapasztalattal.",
    icon: "shield-check",
    intro: [
      "Adatvédelmi tisztviselőként dolgoztam egy nemzetközi gyógyszeripari vállalatnál, ahol napi szinten kellett a GDPR elvárásait a valós üzleti folyamatokra fordítanom.",
      "Ezt a szemléletet hozom az ügyfeleimhez is: nem sablonokat adok, hanem az adott vállalkozás működésére szabott, védhető megoldásokat.",
    ],
    services: [
      { title: "Adatkezelési tájékoztató és szabályzat", description: "Weboldalak, alkalmazások, HR-folyamatok teljes dokumentációja." },
      { title: "Adatvédelmi hatásvizsgálat (DPIA)", description: "Magas kockázatú adatkezelések értékelése és dokumentálása." },
      { title: "Incidenskezelés", description: "72 órás bejelentési kötelezettség kezelése, hatósági kommunikáció." },
      { title: "Adatfeldolgozói szerződések", description: "DPA-k, nemzetközi adattovábbítás, standard szerződési klauzulák." },
      { title: "NAIH-eljárások", description: "Képviselet hatósági vizsgálatban, kérelmek és panaszok kezelése." },
      { title: "Kiszervezett DPO-szolgáltatás", description: "Adatvédelmi tisztviselői feladatok ellátása havidíjas keretben." },
    ],
    process: [
      { step: "Adatleltár", detail: "Az adatkezelési folyamatok és jogalapok feltérképezése." },
      { step: "Kockázatértékelés", detail: "Hiányosságok rangsorolása és cselekvési terv." },
      { step: "Dokumentáció", detail: "Tájékoztatók, szabályzatok, szerződések elkészítése." },
      { step: "Oktatás", detail: "Munkavállalói tréning, éves felülvizsgálat." },
    ],
    faq: [
      { q: "Kötelező adatvédelmi tisztviselőt kijelölni?", a: "Csak meghatározott esetekben (pl. nagy léptékű különleges adatkezelés). Az első konzultáción ezt pontosan megvizsgáljuk." },
      { q: "Mennyi idő egy teljes GDPR-megfelelési projekt?", a: "Kisvállalkozásnál jellemzően 3–6 hét, nagyobb szervezetnél a folyamatok számától függően 2–4 hónap." },
    ],
  },
  {
    slug: "munkajog",
    title: "Munkajog",
    shortTitle: "Munkajog",
    eyebrow: "Munkáltatóknak és munkavállalóknak",
    summary:
      "Munkaszerződések, vezetői megállapodások, munkaviszony megszüntetése és munkaügyi perek – mindkét oldal szemszögének ismeretével.",
    icon: "users-three",
    intro: [
      "A munkajogi kérdések ritkán pusztán jogi kérdések: emberi és üzleti helyzetek, amelyeket diszkréten és határozottan kell kezelni.",
      "Munkáltatói oldalon a kockázatmentes folyamatokat, munkavállalói oldalon a jogos igények hatékony érvényesítését helyezem középpontba.",
    ],
    services: [
      { title: "Munkaszerződés és szabályzatok", description: "Munkaszerződések, versenytilalmi és titoktartási megállapodások, belső szabályzatok." },
      { title: "Vezetői megállapodások", description: "Vezető állású munkavállalók szerződései, bónusz- és részvényprogramok." },
      { title: "Munkaviszony megszüntetése", description: "Felmondás, közös megegyezés, csoportos létszámcsökkentés jogszerű lebonyolítása." },
      { title: "Munkaügyi perek", description: "Képviselet jogellenes megszüntetés, elmaradt munkabér és kártérítés ügyében." },
      { title: "Kiküldetés és külföldi munkavállalók", description: "Munkavállalási engedélyek, kiküldetési dokumentáció angol és német nyelven." },
      { title: "Munkahelyi adatkezelés", description: "Kamerás megfigyelés, e-mail ellenőrzés, whistleblowing rendszerek." },
    ],
    process: [
      { step: "Helyzetfelmérés", detail: "A tényállás és a rendelkezésre álló dokumentumok áttekintése." },
      { step: "Stratégia", detail: "Egyezségi és peres alternatívák költség-haszon elemzése." },
      { step: "Végrehajtás", detail: "Dokumentumok elkészítése, tárgyalás, szükség esetén per." },
      { step: "Zárás", detail: "Megállapodás rögzítése, teljesítés ellenőrzése." },
    ],
    faq: [
      { q: "Mennyi időn belül lehet megtámadni a felmondást?", a: "A közléstől számított 30 napon belül kell benyújtani a keresetet – ezért fontos a gyors kapcsolatfelvétel." },
    ],
  },
  {
    slug: "polgari-jog",
    title: "Polgári jog, szerződések és peres képviselet",
    shortTitle: "Polgári jog",
    eyebrow: "Szerződések és jogviták",
    summary:
      "Szerződések szerkesztése és véleményezése, kártérítési igények, követeléskezelés, valamint képviselet peres és peren kívüli eljárásokban.",
    icon: "scales",
    intro: [
      "A legjobb per az, amelyre nem kerül sor. A szerződéskötési szakaszban végzett gondos munka a viták többségét megelőzi – ha pedig a vita mégis kialakul, határozott és stratégiai képviseletre van szükség.",
    ],
    services: [
      { title: "Szerződések", description: "Vállalkozási, megbízási, kölcsön- és biztosítéki szerződések szerkesztése, véleményezése." },
      { title: "Kártérítés és sérelemdíj", description: "Szerződésszegésből és szerződésen kívüli károkozásból eredő igények érvényesítése." },
      { title: "Követeléskezelés", description: "Fizetési meghagyás, végrehajtás, felszámolási eljárásban való részvétel." },
      { title: "Peres képviselet", description: "Képviselet bíróság előtt polgári és gazdasági perekben, valamint választottbírósági eljárásban." },
      { title: "Egyezségi tárgyalások", description: "Mediációs és peren kívüli megállapodások előkészítése." },
      { title: "Öröklési jog", description: "Végrendelet, öröklési szerződés, hagyatéki eljárásban való képviselet." },
    ],
    process: [
      { step: "Elemzés", detail: "Jogi álláspont és esélyek írásbeli értékelése." },
      { step: "Felszólítás", detail: "Peren kívüli igényérvényesítés, egyezségi javaslat." },
      { step: "Eljárás", detail: "Kereset, fizetési meghagyás vagy választottbírósági eljárás indítása." },
      { step: "Végrehajtás", detail: "A jogerős döntés érvényesítése." },
    ],
    faq: [
      { q: "Mekkora a pernyertesség esélye?", a: "Minden ügyben írásbeli kockázatértékelést készítek az első konzultáció után, mielőtt bármilyen eljárás indul." },
    ],
  },
];

export const nicheHighlight = {
  eyebrow: "Speciális iparági fókusz",
  title: "Ékszer- és nemesfém-ágazat",
  text: "Nemesfém-kereskedők, ékszerkészítők és luxuscikk-forgalmazók számára nyújtok jogi támogatást: nemesfém-nyilvántartás, fémjelzés, pénzmosás elleni megfelelés, forgalmazási és konszignációs szerződések, márkavédelem.",
  icon: "diamond" as IconName,
};

export const about = {
  eyebrow: "Rólam",
  title: "Jogász, aki a vállalati oldalt is belülről ismeri",
  lead:
    "Pályám első éveit ügyvédi irodákban töltöttem, majd hat évig nemzetközi gyógyszeripari vállalatok belső jogászaként és adatvédelmi tisztviselőjeként dolgoztam. 2026-ban nyitottam meg saját praxisomat Budapesten.",
  paragraphs: [
    "Ez a kettős tapasztalat határozza meg a munkamódszeremet: ismerem az ügyvédi precizitást és azt is, hogy egy vállalat vezetése mit vár a jogásztól – gyors, egyértelmű, döntésre alkalmas választ.",
    "Ügyfeleim között magánszemélyek, hazai kis- és középvállalkozások, valamint nemzetközi cégcsoportok magyar leányvállalatai szerepelnek. Bármely méretben ugyanazt vállalom: elérhető vagyok, érthetően fogalmazok, és a határidőket tartom.",
  ],
  credentials: [
    { label: "Ügyvéd", detail: "Budapesti Ügyvédi Kamara" },
    { label: "Jogi diploma", detail: "ELTE Állam- és Jogtudományi Kar (minta)" },
    { label: "Szakvizsga", detail: "Jogi szakvizsga, 2023 (minta)" },
    { label: "Nyelvek", detail: "Magyar, angol (C1), német (C1)" },
  ],
  timeline: [
    { period: "2026 –", role: "Egyéni ügyvéd", org: "Saját praxis, Budapest", detail: "Ingatlanjog, társasági jog, life sciences, adatvédelem." },
    { period: "2025 – 2026", role: "Ügyvéd (Associate)", org: "Nemzetközi ügyvédi iroda, Budapest", detail: "Kereskedelmi jog, szabályozási és compliance-ügyek." },
    { period: "2024 – 2025", role: "Privacy & Compliance Officer", org: "Globális gyógyszeripari vállalat", detail: "Adatvédelmi program, belső vizsgálatok, hatósági kapcsolattartás." },
    { period: "2020 – 2024", role: "Legal Specialist", org: "Globális gyógyszeripari vállalat", detail: "Szerződések, promóciós megfelelőség, klinikai vizsgálatok." },
    { period: "2019 – 2020", role: "Ügyvédjelölt", org: "Budapesti ügyvédi iroda", detail: "Polgári jog, ingatlanjog, peres képviselet." },
  ],
  values: [
    { title: "Érthető nyelv", text: "A jogi szakzsargon helyett a döntéshez szükséges lényeget mondom el." },
    { title: "Tartott határidők", text: "Minden megkeresésre 24 órán belül válaszolok, a vállalt határidőket tartom." },
    { title: "Kiszámítható díjazás", text: "A munkadíjat előre, írásban rögzítjük – nincs meglepetés a számlán." },
  ],
};

export const process = {
  eyebrow: "Hogyan dolgozom",
  title: "Négy átlátható lépés az első hívástól a megoldásig",
  steps: [
    {
      title: "Kapcsolatfelvétel",
      text: "Írjon vagy hívjon – 24 órán belül visszajelzek, és javaslok egy időpontot. Sürgős ügyben akár 4 órán belül.",
      meta: "Díjmentes",
    },
    {
      title: "Első konzultáció",
      text: "45–60 perces személyes vagy online megbeszélés, ahol átnézzük a helyzetet, a lehetőségeket és a várható költségeket.",
      meta: "Személyesen vagy online",
    },
    {
      title: "Ajánlat és megbízás",
      text: "Írásbeli ajánlatot kap fix díjjal vagy óradíjas kerettel. A megbízási szerződést elektronikusan is aláírhatja.",
      meta: "Írásban rögzített díj",
    },
    {
      title: "Ügyintézés",
      text: "Folyamatos tájékoztatás minden fontos lépésről, elérhetőség telefonon és e-mailben, az ügy lezárásáig.",
      meta: "Rendszeres státuszjelentés",
    },
  ],
};

export const testimonials = {
  eyebrow: "Ügyfélvélemények",
  title: "Amit az ügyfeleim mondanak",
  rating: { value: "5,0", count: 4, source: "Google-értékelés" },
  items: [
    {
      quote:
        "Lakásvásárlásnál két nap alatt megkaptuk a szerződéstervezetet, minden kérdésünkre érthető választ kaptunk. A bankkal is ő egyeztetett – nekünk csak aláírni kellett.",
      name: "Bérczi Nóra",
      role: "Ingatlan adásvétel · Budapest XIII.",
      initials: "BN",
    },
    {
      quote:
        "Magánrendelőnk GDPR-dokumentációját és a betegtájékoztatóinkat készítette el. Végre olyan jogászunk van, aki érti az egészségügyi működést.",
      name: "Dr. Vass Kornélia",
      role: "Ügyvezető · magánklinika",
      initials: "VK",
    },
    {
      quote:
        "Német anyavállalatunkkal közvetlenül, német nyelven egyeztetett a forgalmazási szerződésről. Pontos, gyors, és az üzleti szempontokat is érti.",
      name: "Halmágyi Gergő",
      role: "Country Manager · kereskedelmi vállalat",
      initials: "HG",
    },
    {
      quote:
        "Munkaviszonyom megszüntetésekor segített egy méltányos megállapodást elérni – tárgyalás közben is nyugodt és határozott maradt.",
      name: "Szendrey Ákos",
      role: "Munkajogi képviselet",
      initials: "SÁ",
    },
  ],
};

export const faq = {
  eyebrow: "Gyakori kérdések",
  title: "Amit az első megbeszélés előtt érdemes tudni",
  items: [
    {
      q: "Mennyibe kerül az első konzultáció?",
      a: "Az első, 45–60 perces konzultáció díja 25 000 Ft + ÁFA (minta), amely megbízás esetén teljes egészében beszámításra kerül a munkadíjba. Egyszerű, előre tisztázható kérdésekben a telefonos egyeztetés díjmentes.",
    },
    {
      q: "Hogyan alakul az ügyvédi munkadíj?",
      a: "Az ügy típusától függően fix díjas (pl. adásvételi szerződés, cégalapítás) vagy óradíjas elszámolást alkalmazok. A díjat minden esetben előre, írásban rögzítjük, és a megbízás során nincs rejtett költség.",
    },
    {
      q: "Lehet online intézni az ügyeket?",
      a: "Igen. A konzultáció videóhívásban is tartható, a dokumentumokat pedig elektronikusan, AVDH-val vagy minősített elektronikus aláírással is aláírhatja. Külföldön élő ügyfeleim jelentős része teljesen online intézi ügyeit.",
    },
    {
      q: "Milyen nyelveken dolgozik?",
      a: "Magyar, angol és német nyelven egyaránt vállalok tanácsadást, okiratszerkesztést és tárgyalást – tolmács bevonása nélkül.",
    },
    {
      q: "Mit hozzak az első találkozóra?",
      a: "Minden, az üggyel kapcsolatos dokumentumot (szerződések, levelezés, határozatok) érdemes elhozni vagy előre e-mailben elküldeni, így a konzultáción már konkrét javaslatokat tudok adni.",
    },
    {
      q: "Sürgős ügyben mennyire gyorsan érhető el?",
      a: "Munkanapokon 8 és 18 óra között telefonon közvetlenül elérhető vagyok, sürgős esetben 4 órán belül visszahívom. Határidős ügyekben (pl. felmondás megtámadása) kérem, jelezze ezt már az első üzenetben.",
    },
  ],
};

export const contact = {
  eyebrow: "Kapcsolat",
  title: "Beszéljük át az ügyét",
  text: "Írja le röviden, miben segíthetek – 24 órán belül visszajelzek egy javasolt időponttal. Az üzenet küldése nem jár kötelezettséggel, tartalmát ügyvédi titok védi.",
  topics: [
    "Ingatlan adásvétel",
    "Cégügyek, szerződések",
    "Egészségügyi / gyógyszerjog",
    "Adatvédelem, GDPR",
    "Munkajog",
    "Polgári jog, jogvita",
    "Egyéb",
  ],
};

export const legalPages = {
  privacy: {
    title: "Adatkezelési tájékoztató",
    updated: "2026. szeptember 30.",
  },
  imprint: {
    title: "Impresszum",
  },
  hosting: {
    name: "Websupport Magyarország Kft. (Magyar Hosting)",
    address: "1119 Budapest, Fehérvári út 97–99.",
    email: "info@mhosting.hu",
    phone: "+36 1 700 2323",
    web: "https://www.mhosting.hu",
  },
};
