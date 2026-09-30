# Dr. Mihalovits Máté ügyvéd – weboldal (mihalovits.eu)

Bemutatkozó oldal egyéni ügyvédi praxis számára, beépített tartalomkezelővel.
Next.js 16 (App Router, statikus export) · React 19 · Tailwind CSS v4 · Sveltia CMS ·
PHP-végpontok a tárhelyen (kapcsolati űrlap, admin-bejelentkezés).

## Tartalom szerkesztése (admin)

1. Nyissa meg: **https://mihalovits.eu/admin/**, és kattintson a **Belépés** gombra.
2. A felugró ablakban a saját felhasználónevével és jelszavával lépjen be. GitHub-fiók nem kell,
   és az előnézeti jelszó sem. Egy belépés 8 óráig érvényes. Minden belépésről értesítő e-mail
   megy az iroda címére. Öt hibás jelszó után a fiók 15 percre zárolódik.
3. **Oldalak**: a fix oldalak szövegei. **Szakterületek**: új szakterület a *New* gombbal,
   a sorrend a *Reorder* gombbal húzható. **Beállítások**: elérhetőségek, nyitvatartás, fotók.
4. **Save**: a mentés után az oldal kb. 3–5 percen belül frissül. A mentés a GitHubon egy
   commit, amit a GitHub Actions ellenőriz és lefordít, a tárhely pedig letölti és kiteszi.
   A commitok a bekapcsolt GitHub-fiók nevén jelennek meg (lásd *Szerkesztői fiókok*). Azt, hogy
   ki lépett be, a tárhely belépési naplója őrzi.

A képek feltöltéskor automatikusan WebP formátumra alakulnak, és legfeljebb 2400 px-esek
lesznek. Csak JPG, PNG vagy WebP tölthető fel, SVG biztonsági okból nem. A mezők
korlátait (kötelező, hossz, formátum) ugyanaz a séma adja, amivel a build ellenőriz.
Ha egy mentés mégis hibás tartalmat okozna, a telepítés leáll, és a régi oldal marad kint.
Ilyenkor a hiba oka a repó [Actions](https://github.com/szilamer/mihalovits-web/actions)
lapján olvasható.

A Sveltia CMS kezelőfelülete angol nyelvű, a mezők nevei és a súgók magyarok. A belépőablak
és a belépés gomb magyar.

### Szerkesztői fiókok és a GitHub-kapcsolat (üzemeltetőnek)

A belépést a tárhely kezeli (`public/oauth/`). A szerkesztők saját felhasználónévvel és jelszóval
lépnek be. A szerver ezután a tárolt GitHub-engedélyből kér egy 8 órás tokent, és azt adja át a
tartalomkezelőnek. A fiókokat a tárhelyen a `mihalovits-admin` parancs kezeli
([`public/oauth/cli.php`](public/oauth/cli.php)). A jelszót mindig a standard bemenetről olvassa,
így az nem látszik a folyamatlistában. A jelszavak a fejlesztő gépén a Keychainben vannak
(„mihalovits.eu admin”, fiók = felhasználónév).

```bash
ssh mihalovits '~/bin/mihalovits-admin list'
security find-generic-password -s 'mihalovits.eu admin' -a mate -w |
  ssh mihalovits '~/bin/mihalovits-admin add mate "Dr. Mihalovits Máté"'   # jelszó: legalább 16 karakter
ssh -t mihalovits '~/bin/mihalovits-admin passwd mate'   # rejtett bevitellel kéri az új jelszót
ssh mihalovits '~/bin/mihalovits-admin unlock mate'      # zárolás feloldása; továbbá: disable, enable, remove
```

**GitHub-kapcsolat.** A tartalomkezelő egyetlen GitHub-fiók nevében ment. Ezt a fiókot egyszer
kell engedélyezni: az alábbi parancs kiír egy kódot. A kódot a https://github.com/login/device
oldalon kell beírni, azzal a GitHub-fiókkal belépve, amelyik a repót írhatja. Ehhez a GitHub
App beállításaiban a *Device Flow*-nak bekapcsolva kell lennie. A kapcsolás után érdemes kikapcsolni,
mert így az App nevében senki sem kérhet ilyen kódot. Az *Expire user authorization tokens*
maradjon bekapcsolva.

```bash
ssh mihalovits '~/bin/mihalovits-admin github-connect'
ssh mihalovits '~/bin/mihalovits-admin github-status'
```

Az engedély 6 hónapig érvényes, és minden belépés megújítja. Ha hosszabb ideig senki nem lép be,
a heti cron (`keepalive`) újítja meg. Ha mégis megszakad (pl. valaki visszavonja a GitHubon),
a belépőablak ezt kiírja, és e-mail is megy. Ilyenkor a `github-connect`-et kell újra futtatni.

## Fejlesztés

```bash
npm ci
npm run dev        # http://localhost:3000 (a kapcsolati űrlap itt egy helyi végpontra megy)
npm run lint
npm test           # tartalom-, admin-konfig-, űrlap- és belépési tesztek (PHP kell: curl, Argon2)
npm run build      # statikus export az out/ mappába, az adminnal együtt (out/admin/)
```

Node ≥ 22.18 kell (a `.ts` sémafájlt a Node közvetlenül futtatja), a CI Node 24-et használ.

| Hol | Mi |
| --- | --- |
| `content/` | minden szöveg és kép-hivatkozás JSON-ban – ezt írja az admin |
| `src/content/schema.ts` | a tartalom sémája (Zod): validáció buildkor **és** az admin űrlapjai |
| `src/content/index.ts` | betöltés, képméretek, Markdown → HTML (nyers HTML tiltva) |
| `scripts/cms-config.mjs` | az admin konfigurációja, a sémából generálva |
| `scripts/build-admin.mjs` | a Sveltia CMS becsomagolása az `out/admin/` mappába (nincs külső CDN) |
| `scripts/postbuild.mjs` | CSP-hash-ek a `.htaccess`-be, előnézeti kapu, ellenőrzések |
| `public/contact.php`, `public/oauth/` | a tárhelyen futó PHP-végpontok |
| `public/uploads/` | az adminból feltöltött (és a szerkeszthető) képek |

Új mező felvétele: a mezőt a `schema.ts`-ben kell hozzáadni (címkével, súgóval), a JSON-ba
értéket írni, és a komponensben megjeleníteni. Az admin űrlapja magától követi.

## Telepítés

**Automatikus:** minden push a `main` ágra (így minden admin-mentés is) elindítja a
[`deploy.yml`](.github/workflows/deploy.yml) munkafolyamatot:

1. lint, tesztek, build;
2. a kész oldal egyetlen commitként a `deploy` ágra kerül;
3. a tárhely percenként megnézi ezt az ágat (`~/bin/mihalovits-deploy` cronból, forrása
   [`scripts/server-deploy.sh`](scripts/server-deploy.sh)). Ha változott, pontosan azt a commitot
   tölti le HTTPS-en, ellenőrzi, és kiteszi a `public_html`-be;
4. a CI megvárja, amíg az új build élesben megjelenik (`/build.txt`), aztán lefuttatja az élő
   füsttesztet (`scripts/smoke-test.sh`). A futások sorba állnak.

A tárhelyre kívülről semmi nem ír. Az SSH-ja a GitHub gépeiről nem is érhető el, és a CI-ban
nincs tárhely-hozzáférés. A `deploy` ágat a „deploy ág: csak a CI (deploy kulcs)” ruleset védi:
csak a CI deploy kulcsa írhatja (`DEPLOY_PUSH_KEY` secret), a szerkesztők és az admin tokenje nem.

**Szerveroldali fájlok jóváhagyása.** A tárhely csak akkor tesz ki egy buildet, ha a benne lévő
PHP-fájlok és a `.htaccess` (a CSP-hash-ek listáját leszámítva) megegyeznek a jóváhagyottakkal.
Új vagy módosult PHP, alkönyvtárbeli `.htaccess`, `.user.ini` vagy szimbolikus link esetén a
build nem megy ki. Így egy ellopott szerkesztői fiókkal sem lehet kódot futtatni a tárhelyen,
ahol a levelezés is van. Ha szándékosan módosul a PHP vagy a `.htaccess` (élesítéskor is), a CI
„The host has not published…” hibával áll meg, és kiírja a parancsot. A változás átnézése után:

```bash
ssh mihalovits '~/bin/mihalovits-deploy --approve <deploy commit>'
```

Utána egy percen belül kimegy. Napló: `~/.cache/mihalovits-deploy/deploy.log`.

**Füstteszt a CI-ban és helyben.** A tárhely védelme (Imunify360) a GitHub gépeit gyanúsnak
tartja. A PHP-kérésekre ilyenkor JS-próbát ad, ezeket az ellenőrzéseket a CI kihagyja. A tiltott
útvonalak próbáit (pl. `/.git/config`) szkennelésnek veszi, és letiltaná az IP-t, ezért ezek a
CI-ban nem futnak. Jóváhagyás után ezért a teljes tesztet egy fejlesztői gépről kell futtatni:

```bash
PREVIEW_PASSWORD="$(security find-generic-password -s 'mihalovits.eu előnézet' -a elonezet -w)" \
  bash scripts/smoke-test.sh
```

**Kézi (fejlesztői gépről):** `npm run deploy` (előtte `npm run deploy -- --dry-run`).
Ehhez a `~/.ssh/config`-ban egy `mihalovits` nevű host kell a saját kulccsal, és a tárhely SSH-ja
csak engedélyezett hálózatból érhető el. A következő automatikus telepítés felülírja.

**A tárhely beállítása vagy a telepítő frissítése:** `scripts/server-setup.sh`. Ez telepíti a
`server-deploy.sh`-t, a `mihalovits-admin` parancsot és a két cron-sort, és ismételten is futtatható.

## Előnézeti mód és élesítés

Amíg a tartalom nincs jóváhagyva, az oldal jelszóval védett (`elonezet` felhasználó),
és `noindex` fejlécet küld. A jelszó a fejlesztő gépén a Keychainben van
(„mihalovits.eu előnézet”), a CI-ban pedig a `PREVIEW_PASSWORD` secretben.
Új jelszó beállítása: `PREVIEW_PASSWORD=... scripts/server-setup.sh`.

**Élesítés** (jelszó és noindex ki):

```bash
gh variable set SITE_PREVIEW --body off -R szilamer/mihalovits-web
gh workflow run deploy.yml -R szilamer/mihalovits-web
```

Ettől a `.htaccess` megváltozik (kikerül belőle a jelszókapu), ezért a buildet a tárhelyen jóvá
kell hagyni (lásd *Szerveroldali fájlok jóváhagyása*).

Az nginx a létező statikus fájlokat (képek, JS, CSS, `.txt`, `.json`) közvetlenül szolgálja
ki, ezért ezekre a jelszó nem vonatkozik. Az oldalak védettek. Az admin nem, mert annak saját
belépése van, és előtte nem mutat tartalmat.

## Biztonság röviden

- **CSP:** a fő oldalon csak a Next.js saját inline scriptjei futhatnak, hash alapján. A build
  leáll, ha más inline script kerülne a kimenetbe. Az admin saját, szigorú CSP-t kap, és csak
  a GitHub API-val kommunikál.
- **Bejelentkezés:** saját felhasználónév és jelszó. A tárhelyen a jelszavaknak csak az
  Argon2id-hash-e van meg. A hibás próbálkozásokat fiókonként, IP-címenként és összesítve is
  korlátozza. Zároláskor és minden sikeres belépéskor e-mail megy. Sikeres belépés után a szerver
  a tárolt GitHub-engedélyből 8 órás tokent kér, és csak a `https://mihalovits.eu` originnek adja
  át. Az engedélyt a „Mihalovits Web Admin” GitHub App adja, amelynek csak `contents: write` joga
  van, és csak erre a repóra van telepítve. Az űrlapot egy `SameSite=Strict` süti és az
  origin-ellenőrzés védi, a belépőablakra nonce-os CSP vonatkozik.
- **Kapcsolati űrlap:** időalapú HMAC-token, rate limit, origin-ellenőrzés, fejléc-injektálás
  elleni szűrés. Az üzenet nem kerül lemezre, csak e-mailben megy ki.
- **Telepítés:** a tárhely maga tölti le a buildet, kívülről nem lehet rá írni. A `deploy` ágat
  csak a CI írhatja. PHP- vagy `.htaccess`-változás csak SSH-s jóváhagyás után megy ki.
- **Titkok** sosem kerülnek a repóba. A szerveren a webrooton kívül vannak, a CI-ban
  GitHub secretként. A nyilvános repón titokkeresés és push-védelem is fut.

## Szerver (Magyar Hosting, we052.tarhely.com, felhasználó: `mihalov2`)

| Útvonal | Tartalom |
| --- | --- |
| `~/public_html/` | a telepített oldal (a telepítő tükrözi, a `.well-known/` kivétel) |
| `~/bin/mihalovits-deploy` + crontab | a percenkénti telepítő (`scripts/server-deploy.sh`) |
| `~/bin/mihalovits-admin` + crontab | szerkesztői fiókok, GitHub-kapcsolat, heti megújítás (`public/oauth/cli.php`) |
| `~/.config/mihalovits/deploy-approved` | a jóváhagyott PHP- és `.htaccess`-fájlok ujjlenyomatai |
| `~/.cache/mihalovits-deploy/` | a telepítő naplója és állapota |
| `~/.config/mihalovits/contact.php` | űrlap-címzett és HMAC-titok (`scripts/server-setup.sh` hozza létre); az értesítők is ide mennek |
| `~/.config/mihalovits/oauth.php` | a GitHub App azonosítója és titka |
| `~/.config/mihalovits/editors.json` | a szerkesztői fiókok (a jelszavak csak Argon2id-hash-ként) |
| `~/.config/mihalovits/github-grant.json` | a GitHub-engedély megújító tokenje (minden használatkor cserélődik) |
| `~/.cache/mihalovits-oauth/` | belépési napló (`auth.log`), zárolási számlálók, hibanapló |
| `~/.cache/mihalovits-contact/` | az űrlap rate-limit számlálói és hibanaplója |
| `~/.htpasswds/mihalovits-preview` | az előnézeti jelszó bcrypt-hash-e |

A GitHub App titkának cseréje: GitHub → *Settings → Developer settings → GitHub Apps →
Mihalovits Web Admin → Generate a new client secret*, majd az új értéket az `oauth.php`-ba kell
írni. A csere a zárolási számlálókat is lenullázza. Az App privát kulcsára (`.pem`) nincs szükség.

## Indulás előtti teendők

1. A minta-szövegek cseréje az adminban: KASZ-szám, diploma, díjak, és a vélemények
   ügyfél-hozzájárulással.
2. Az adatkezelési tájékoztató és az impresszum jogi véglegesítése.
3. Az ügyvéd belépési adatainak személyes átadása: a felhasználónév `mate`, a jelszó a
   Keychainben van („mihalovits.eu admin” / `mate`).
4. Élesítés (`SITE_PREVIEW=off`, lásd fent), utána a Google Search Console-ban a sitemap
   beküldése: `https://mihalovits.eu/sitemap.xml`.
