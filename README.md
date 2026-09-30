# Dr. Mihalovits Máté ügyvéd – weboldal

Modern, bizalomépítő bemutatkozó oldal egyéni ügyvédi praxis számára.
Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Motion · Phosphor Icons.

## Indítás

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
```

## Mi valós és mi minta?

| Elem | Forrás |
| --- | --- |
| Logó (`public/brand/logo-*.png`, `mark.png`), portré (`portrait*.jpg`, `card.jpg`) | Google Cégprofil – valós brand eszközök |
| Színvilág (`#0E151B` navy, `#4FB1EA` égszínkék), ív-motívum | A logóból és a névjegykártyából származtatva |
| Cím, telefon, e-mail | A Google Cégprofilon és a névjegyen szereplő nyilvános adatok |
| Minden más szöveg, statisztika, vélemény, díjak, életút részletei | **Minta (mock) tartalom** – indulás előtt cserélendő |

A minta-tartalom egyetlen helyen él: `src/content/site.ts`. Itt szerkeszthető a
navigáció, a szakterületek (szolgáltatások, folyamat, GYIK), a bemutatkozás, a
vélemények, a gyakori kérdések és a kapcsolati adatok. Új szakterület
hozzáadásához elég a `practiceAreas` tömböt bővíteni – az aloldal, a sitemap és a
láblécmenü automatikusan követi.

## Struktúra

```
src/
  app/                      # útvonalak (App Router)
    page.tsx                # főoldal
    szakteruletek/          # lista + [slug] aloldalak (SSG)
    rolam/  kapcsolat/  adatkezeles/  impresszum/
    api/contact/route.ts    # űrlap-végpont (validáció + honeypot)
    sitemap.ts  robots.ts   # SEO
  components/
    layout/                 # Header (lebegő „island” nav), Footer, PageHero, Prose
    home/                   # főoldali szekciók
    contact/                # ContactSection + ContactForm (állapotkezelés, hibák)
    ui/                     # Button, Eyebrow, Logo, Reveal, Accordion, AreaIcon
  content/site.ts           # minden szöveg és adat
  lib/contact-schema.ts     # megosztott űrlap-validáció (kliens + szerver)
public/brand/               # logó- és fotóváltozatok
```

## Design-döntések

- **Tipográfia:** Cormorant Garamond (címek – a logó vékony szerif betűjéhez
  igazodva) + Plus Jakarta Sans (szövegtörzs).
- **Ív-motívum:** a logó „MM” íveit idézi a portré keretezése, az ikon-tartók,
  a folyamat- és idővonal-jelölők (`arch` utility a `globals.css`-ben).
- **Bizalmi elemek** (kutatás alapján: érthető értékajánlat az első képernyőn,
  egy domináns CTA + tap-to-call, szakterületek két kattintásra, valódi fotó,
  kamarai tagság, vélemények, átlátható folyamat és díjazás, GYIK, rövid űrlap).
- **Motion:** viewport-alapú, `transform`/`opacity` animációk; `prefers-reduced-motion`
  tiszteletben tartva.

## Indulás előtti teendők

1. Minta-szövegek cseréje a `src/content/site.ts` fájlban (KASZ-szám, diploma,
   díjak, vélemények – ügyfél-hozzájárulással).
2. `deliver()` bekötése a `src/app/api/contact/route.ts`-ben (pl. Resend / CRM).
3. Végleges domain beállítása (`firm.url`) – ez hajtja a sitemapet, a canonical
   URL-eket és a JSON-LD sémát.
4. Adatkezelési tájékoztató és impresszum jogi véglegesítése.
