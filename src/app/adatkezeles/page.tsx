import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Prose } from "@/components/layout/Prose";
import { firm, legalPages } from "@/content/site";

export const metadata: Metadata = {
  title: legalPages.privacy.title,
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        tone="light"
        eyebrow="Jogi tájékoztató"
        title={legalPages.privacy.title}
        lead={`Hatályos: ${legalPages.privacy.updated}. A jelen tájékoztató vázlat; a végleges szöveget a weboldal indulása előtt kell véglegesíteni.`}
        crumbs={[{ label: "Főoldal", href: "/" }, { label: legalPages.privacy.title }]}
      />
      <section className="bg-paper pb-24">
        <Prose>
          <h2>1. Az adatkezelő</h2>
          <p>
            {firm.legalName} (székhely: {firm.address.zip} {firm.address.city}, {firm.address.street};
            e-mail: {firm.email}; telefon: {firm.phone}), a továbbiakban: Adatkezelő.
          </p>

          <h2>2. A kezelt adatok köre és célja</h2>
          <h3>Kapcsolatfelvételi űrlap</h3>
          <p>
            Név, e-mail cím, telefonszám (opcionális), a megkeresés témája és szövege. Az adatkezelés
            célja a megkeresés megválaszolása és az esetleges megbízás előkészítése. Jogalap: az
            érintett hozzájárulása (GDPR 6. cikk (1) a) pont), illetve szerződés előkészítése (6. cikk
            (1) b) pont).
          </p>
          <h3>Weboldal-látogatás</h3>
          <p>
            A weboldal kizárólag a működéshez elengedhetetlen technikai adatokat kezel; marketing
            célú követő sütiket nem alkalmaz. A Google Térkép beágyazása során a Google LLC saját
            adatkezelési szabályzata szerint kezelhet adatokat.
          </p>

          <h2>3. Az adatkezelés időtartama</h2>
          <p>
            A kapcsolatfelvétel során megadott adatokat megbízás létrejötte hiányában a megkeresés
            lezárását követő 6 hónapig, megbízás esetén az ügyvédi tevékenységről szóló 2017. évi
            LXXVIII. törvényben előírt ideig őrizzük meg.
          </p>

          <h2>4. Az érintettek jogai</h2>
          <ul>
            <li>hozzáférés a kezelt személyes adatokhoz,</li>
            <li>helyesbítés, törlés, az adatkezelés korlátozása,</li>
            <li>adathordozhatóság,</li>
            <li>a hozzájárulás bármikori visszavonása,</li>
            <li>
              panasz benyújtása a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (
              <a href="https://naih.hu" target="_blank" rel="noreferrer">
                naih.hu
              </a>
              ).
            </li>
          </ul>

          <h2>5. Adatbiztonság és ügyvédi titok</h2>
          <p>
            Az Adatkezelő a személyes adatokat az ügyvédi titoktartás szabályai szerint, megfelelő
            technikai és szervezési intézkedésekkel védi. A megkeresés tartalmát harmadik személy
            részére kizárólag jogszabályi kötelezettség alapján adja át.
          </p>
        </Prose>
      </section>
    </>
  );
}
