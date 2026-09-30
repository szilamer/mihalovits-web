# Dr. Mihalovits Máté ügyvéd – weboldal (mihalovits.eu)

Bemutatkozó oldal egyéni ügyvédi praxis számára, beépített tartalomkezelővel.
Next.js 16 (App Router, statikus export) · React 19 · Tailwind CSS v4 · Sveltia CMS ·
PHP-végpontok a tárhelyen (kapcsolati űrlap, admin-bejelentkezés).

## Tartalom szerkesztése (admin)

1. Nyissa meg: **https://mihalovits.eu/admin/**. Amíg az előnézeti mód be van kapcsolva,
   a böngésző előbb az előnézeti felhasználót és jelszót kéri (lásd lent).
2. **Sign In with GitHub**: GitHub-fiókkal lehet belépni. Szerkeszteni az tud, akinek
   írási joga van a [szilamer/mihalovits-web](https://github.com/szilamer/mihalovits-web)
   repóhoz. Új szerkesztőt a repó *Settings → Collaborators* menüjében lehet hozzáadni.
3. **Oldalak**: a fix oldalak szövegei. **Szakterületek**: új szakterület a *New* gombbal,
   a sorrend a *Reorder* gombbal húzható. **Beállítások**: elérhetőségek, nyitvatartás, fotók.
4. **Save**: a mentés után az oldal kb. 2–3 percen belül frissül. A mentés a GitHubon egy
   commit, amit a GitHub Actions ellenőriz, lefordít és feltölt.

A képek feltöltéskor automatikusan WebP formátumra alakulnak, és legfeljebb 2400 px-esek
lesznek. Csak JPG, PNG vagy WebP tölthető fel, SVG biztonsági okból nem. A mezők
korlátait (kötelező, hossz, formátum) ugyanaz a séma adja, amivel a build ellenőriz.
Ha egy mentés mégis hibás tartalmat okozna, a telepítés leáll, és a régi oldal marad kint.
Ilyenkor a hiba oka a repó [Actions](https://github.com/szilamer/mihalovits-web/actions)
lapján olvasható.

A Sveltia CMS kezelőfelülete angol nyelvű, a mezők nevei és a súgók magyarok.

## Fejlesztés

```bash
npm ci
npm run dev        # http://localhost:3000 (a kapcsolati űrlap itt egy helyi végpontra megy)
npm run lint
npm test           # tartalom-, admin-konfig-, űrlap- és OAuth-tesztek (a PHP-sekhez php kell)
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
[`deploy.yml`](.github/workflows/deploy.yml) munkafolyamatot. Ennek lépései: lint, tesztek,
build, feltöltés rsync-kel, majd élő füstteszt (`scripts/smoke-test.sh`). A futások sorba
állnak, egy feltöltést sosem szakít meg a következő.

A CI egy külön SSH-kulccsal dolgozik (GitHub secret: `DEPLOY_SSH_KEY`). A szerveren ez a
kulcs `rrsync -wo` korlátozással csak fájlokat tud a `public_html`-be írni: shellt nem kap,
olvasni nem tud. A szerver hostkulcsai rögzítettek (`DEPLOY_KNOWN_HOSTS` változó).

**Kézi (fejlesztői gépről):** `npm run deploy` (előtte `npm run deploy -- --dry-run`).
Ehhez a `~/.ssh/config`-ban egy `mihalovits` nevű host kell a saját kulccsal.

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

Az nginx a létező statikus fájlokat (képek, JS, CSS, `.txt`, `.json`) közvetlenül szolgálja
ki, ezért ezekre a jelszó nem vonatkozik. Az oldalak és az admin védettek.

## Biztonság röviden

- **CSP:** a fő oldalon csak a Next.js saját inline scriptjei futhatnak, hash alapján. A build
  leáll, ha más inline script kerülne a kimenetbe. Az admin saját, szigorú CSP-t kap, és csak
  a GitHub API-val kommunikál.
- **Bejelentkezés:** GitHub App („Mihalovits Web Admin”) csak `contents: write` joggal, csak
  erre a repóra telepítve. A tokent a `callback.php` szerveroldalon kéri le (PKCE +
  egyszer használatos state-süti), és csak a `https://mihalovits.eu` originnek adja át.
  A token 8 óra után lejár.
- **Kapcsolati űrlap:** időalapú HMAC-token, rate limit, origin-ellenőrzés, fejléc-injektálás
  elleni szűrés. Az üzenet nem kerül lemezre, csak e-mailben megy ki.
- **Titkok** sosem kerülnek a repóba. A szerveren a webrooton kívül vannak, a CI-ban
  GitHub secretként. A nyilvános repón titokkeresés és push-védelem is fut.

## Szerver (Magyar Hosting, we052.tarhely.com, felhasználó: `mihalov2`)

| Útvonal | Tartalom |
| --- | --- |
| `~/public_html/` | a telepített oldal (a CI tükrözi, a `.well-known/` kivétel) |
| `~/.config/mihalovits/contact.php` | űrlap-címzett és HMAC-titok (`scripts/server-setup.sh` hozza létre) |
| `~/.config/mihalovits/oauth.php` | a GitHub App azonosítója és titka |
| `~/.cache/mihalovits-contact/`, `~/.cache/mihalovits-oauth/` | rate-limit számlálók, hibanaplók |
| `~/.htpasswds/mihalovits-preview` | az előnézeti jelszó bcrypt-hash-e |
| `~/bin/rrsync`, `~/.ssh/authorized_keys` | a CI-kulcs korlátozása |

A GitHub App titkának cseréje: GitHub → *Settings → Developer settings → GitHub Apps →
Mihalovits Web Admin → Generate a new client secret*, majd az új értéket az `oauth.php`-ba kell
írni. Az App privát kulcsára (`.pem`) nincs szükség.

## Indulás előtti teendők

1. A minta-szövegek cseréje az adminban: KASZ-szám, diploma, díjak, és a vélemények
   ügyfél-hozzájárulással.
2. Az adatkezelési tájékoztató és az impresszum jogi véglegesítése.
3. Az ügyvéd GitHub-fiókjának felvétele a repóba szerkesztőként (Collaborator, Write).
4. Élesítés (`SITE_PREVIEW=off`, lásd fent), utána a Google Search Console-ban a sitemap
   beküldése: `https://mihalovits.eu/sitemap.xml`.
