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
          <p>
            A weboldal az űrlap tartalmát nem tárolja: az üzenet e-mailben érkezik az Adatkezelő
            postafiókjába. A tömeges visszaélések (spam) kiszűrésére a szerver a küldő IP-címéből
            titkos kulccsal képzett, vissza nem fejthető kivonatot legfeljebb 2 napig megőriz; magát
            az IP-címet nem tárolja és nem továbbítja. Jogalap: jogos érdek (GDPR 6. cikk (1) f) pont).
          </p>
          <h3>Weboldal-látogatás</h3>
          <p>
            A weboldal nem használ sütiket, és látogatottság-mérést vagy követő szolgáltatást nem
            alkalmaz. A tárhelyszolgáltató a webszerver működéséhez és biztonságához szükséges
            technikai naplókat (pl. IP-cím, időpont, lekért oldal) a saját szabályai szerint kezeli.
          </p>
          <h3>Térkép</h3>
          <p>
            A Kapcsolat oldalon a térkép csak az Ön kifejezett kattintására töltődik be a Google
            Ireland Limited szolgáltatásából. Ekkor a Google az Ön IP-címét és böngészőjének technikai
            adatait a saját adatkezelési tájékoztatója szerint kezeli; kattintás nélkül a weboldal nem
            kapcsolódik a Google-hez.
          </p>

          <h2>3. Adatfeldolgozó</h2>
          <p>
            Tárhelyszolgáltató: {legalPages.hosting.name} ({legalPages.hosting.address};{" "}
            {legalPages.hosting.email}). Feladata a weboldal és az Adatkezelő e-mail postafiókjának
            üzemeltetése; a személyes adatokat kizárólag az Adatkezelő utasításai szerint, az Európai
            Unió területén kezeli.
          </p>

          <h2>4. Az adatkezelés időtartama</h2>
          <p>
            A kapcsolatfelvétel során megadott adatokat megbízás létrejötte hiányában a megkeresés
            lezárását követő 6 hónapig, megbízás esetén az ügyvédi tevékenységről szóló 2017. évi
            LXXVIII. törvényben előírt ideig őrizzük meg.
          </p>

          <h2>5. Az érintettek jogai</h2>
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

          <h2>6. Adatbiztonság és ügyvédi titok</h2>
          <p>
            Az Adatkezelő a személyes adatokat az ügyvédi titoktartás szabályai szerint, megfelelő
            technikai és szervezési intézkedésekkel védi: a weboldal kizárólag titkosított (HTTPS)
            kapcsolaton érhető el, az űrlap-végpont visszaélés elleni védelemmel működik. A megkeresés
            tartalmát harmadik személy részére kizárólag jogszabályi kötelezettség alapján adja át.
          </p>
        </Prose>
      </section>
    </>
  );
}
