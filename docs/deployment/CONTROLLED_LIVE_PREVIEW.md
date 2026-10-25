# Controlled live preview: GitHub, Railway and OpenAI

Aktuelno 25. oktobra 2026, D-045/D-048. Ovaj vodič postavlja privatni GitHub repozitorijum i jedan pozivnicom zaštićen HTTPS preview. Podrazumevani i završni cloud režim je mock. Nijedan API ključ ne ide u Git, browser bundle, Docker image, dokumentaciju ili deploy log.

## Aktuelni provereni mock preview

Stanje 19. oktobra 2026, D-046:

- privatni repo: `https://github.com/djurov2007/university-guidance-prototype`;
- preview: `https://university-guidance-prototype-production.up.railway.app`;
- health: `https://university-guidance-prototype-production.up.railway.app/api/health` → HTTP 200, `status=ready`, `mode=mock`;
- Dockerfile build successful, jedna US East replika, target port 8080;
- Railway volume montiran na `/data`; kontrolni DB je `/data/control.sqlite`;
- Railway healthcheck path je `/api/health`;
- posle D-048 probe provider je mock i live approval je false; ključ i ceiling čekaju posebnu odluku o uklanjanju ili zadržavanju.

Root je HTTPS dostupan, ali aplikacioni tok i dalje zahteva pozivnicu, 18+ izjavu i prihvatanje fictional-data obaveštenja. Mock invite tok je 19. oktobra potvrđen kroz redemption, reviewed katalog, kontrolisanu alternativu, official source prikaz, clear session i revoke. D-047 je 20. oktobra dobio dva `AUTHENTICATION` rezultata. D-048 je 25. oktobra, nakon credential-only model provere i pricing osveženja, poslao jedan novi fictional-only synthetic zahtev bez retry-ja. `gpt-6-luna` je vratio strict validan izlaz; UI je četiri izdvojene vrednosti prikazao samo kao predloge za potvrdu. Ledger 2→3 i procena USD 0,000354 potvrđuju tačno jedan novi attempt. Servis je zatim vraćen na provereni mock režim.

## Zašto Railway za prvi preview

Postojeća aplikacija je jedan Next.js server sa RAM profilom i SQLite kontrolnim ledgerom. Railway podržava [Next.js deployment sa GitHub-a](https://docs.railway.com/guides/nextjs) i [persistent volume](https://docs.railway.com/volumes/reference), uključujući mali volume na Free/Trial planu. To odgovara sadašnjem single-process prototipu bolje od besplatnog Render web servisa čiji je filesystem efemeran, dok je Render persistent disk vezan za plaćeni servis.

Railway Free trenutno daje USD 1 mesečnog resursnog kredita; novi Trial može imati jednokratnih USD 5 do 30 dana. Hobby je najmanje USD 5 mesečno i tada je to eksplicitna kupovina. Free/Trial volume je do 0,5 GB. Limited Trial može imati ograničen outbound network, pa OpenAI poziv možda neće raditi dok GitHub verifikacija ili plan to ne omoguće. Aktuelni uslovi: [planovi](https://docs.railway.com/pricing/plans) i [trial](https://docs.railway.com/pricing/free-trial).

## GitHub granica

Repo mora biti nov i privatan, predloženo ime `university-guidance-prototype`, pod nalogom `djurov2007`. Projekat dobija sopstveni `.git` i `main`; postojeći nadređeni remote `djurov2007/B` ne koristi se.

Pre prvog push-a proverava se da indeks ne sadrži:

- `.env.local` ili drugi `.env*` osim `.env.example`;
- `.local/`, `.cache/`, SQLite/sidecar fajlove, invitation kodove ili test rezultate;
- vrednost `OPENAI_API_KEY` ili prepoznatljiv API-key obrazac.

Master PDF ostaje read-only. Privatni repo ne menja njegov sadržaj, ali uključivanje PDF-a u prvi commit mora biti vidljivo u Git inventaru.

## Prvi Railway deploy: mock

1. U Railway napravi projekat iz privatnog GitHub repozitorijuma i izaberi granu `main`. Dockerfile gradi Node 24 standalone Next.js servis.
2. Zadrži tačno jednu repliku. Aktivni profili su u RAM-u, a SQLite volume ne podržava bezbedno horizontalno deljenje ove aplikacije.
3. Dodaj volume i montiraj ga na `/data`. Najmanji Free/Trial volume je dovoljan za kontrolni ledger.
4. Generiši Railway domen. Kao `PROTOTYPE_PUBLIC_ORIGIN` upiši njegov tačan origin, na primer `https://ime-servisa.up.railway.app`, bez putanje i bez završnog `/`.
5. Dodaj sledeće server varijable:

```text
APP_MODE=mock
AI_PROVIDER=mock
AI_MODEL=gpt-6-luna
AI_LIVE_APPROVED=false
AI_DOCUMENT_ANALYSIS=false
NEXT_TELEMETRY_DISABLED=1
PROTOTYPE_TRANSPORT=https
PROTOTYPE_PUBLIC_ORIGIN=https://TAČAN-RAILWAY-DOMEN
PROTOTYPE_CONTROL_DB=/data/control.sqlite
PROTOTYPE_PERSISTENT_ROOT=/data
```

6. Ne dodaj `OPENAI_API_KEY` za prvi mock deploy. Otvori `/api/health`; očekivanje je HTTP 200 sa `status=ready` i `mode=mock`.
7. U Railway shell-u napravi jednokratnu pozivnicu kao aplikacioni korisnik:

```sh
runuser -u nextjs -- node --conditions=react-server scripts/invitations.mjs create 1
runuser -u nextjs -- cat /data/local-review-invitation.txt
```

Kod ne stavljaj u GitHub issue, deploy log ili javnu poruku. Posle probe opozovi ID:

```sh
runuser -u nextjs -- node --conditions=react-server scripts/invitations.mjs revoke INVITATION_ID
```

8. U UI-ju koristi samo izmišljene podatke i **Reviewed real catalogue**. Proveri potvrdu profila, ograničene rezultate, zvanične izvore, unknown upozorenja, reload i **End and clear session**.

## Uključivanje pravog OpenAI API-ja

OpenAI dokumentacija zahteva da ključ ostane serverska tajna i učitava se iz environment/secret store-a. Aplikacija već koristi `/v1/responses`, strict JSON schema, semantic/source validaciju, nula automatskih retry-ja i persistent SpendGuard. Zvanična osnova: [OpenAI API authentication](https://developers.openai.com/api/reference/overview) i [Responses create](https://developers.openai.com/api/reference/resources/responses/methods/create).

Pre uključivanja zapiši tačan novi budžet. D-049 kontrolisani demo hard caps su 200 pokušaja, USD 2 ukupno, USD 0,50 dnevno, USD 0,10 po sesiji i USD 0,01 po zahtevu. Environment ceiling može samo da smanji 200. Tek posle odobrenja tih granica:

```text
OPENAI_API_KEY=<Railway secret, nikad u repozitorijumu>
AI_PROVIDER=openai
AI_LIVE_APPROVED=true
PROTOTYPE_AI_ATTEMPT_CEILING=200
```

Redeploy, napravi novu jednokratnu pozivnicu i prihvati OpenAI notice u UI-ju. Prvo proveri jedan sintetički unos, zatim reviewed published rezultate. Validan JSON nije dovoljan: uspeh znači da UI prikazuje samo serverom dozvoljene programe/izvore, čuva unknown i beleži bounded usage. Railway log ne sme sadržati poruku, profil, invitation code ili ključ.

D-047 rezultat: Viktor je odobrio do 5 pokušaja/USD 0,05. Izvršena su tačno dva zahteva, bez retry-ja; oba su mapirana na `AUTHENTICATION`, pa uspešan model odgovor nije dobijen. Najviše USD 0,02 konzervativne rezervacije moglo je biti vezano za dva pokušaja; stvarni provider usage/faktura nisu potvrđeni. Live režim je zatim ugašen, ključ uklonjen i pozivnica opozvana.

D-048 rezultat: Viktor je odobrio tačno jedan novi Railway pokušaj do USD 0,01. Pre outbound-a je dodat svež, zvanično proveren pricing snapshot bez promene cena. Jedan synthetic zahtev je završen bez greške i bez retry-ja: returned model `gpt-6-luna`, 2.409 input, 2.406 cache-write, 105 output i 2.514 ukupno tokena; procena je 354 mikro-USD. UI je prihvatio strict odgovor i ostavio izdvojene vrednosti nepotvrđenim. Klikovi sa isteklom sesijom i pokušaji pre pricing osveženja nisu rezervisali budžet niti kontaktirali provider. Posle dokaza provider je vraćen na mock i live approval na false; brisanje ključa/ceiling-a zahteva posebnu korisničku odluku.

## Zaustavljanje i rollback

Zaustavi live AI vraćanjem `AI_PROVIDER=mock` i `AI_LIVE_APPROVED=false`, pa redeploy. Opozovi aktivne pozivnice. Gašenje ili brisanje Railway servisa ili volume-a je odvojena radnja; volume ne briši pre preuzimanja potrebnog minimalnog dokaza o attempts/spend stanju. Git rollback ne vraća obrisani volume.

## Granice dokaza

Uspešan remote health dokazuje da server radi. Mock browser tok dokazuje mrežni/proxy/cookie/origin put bez AI kvaliteta. Jedan live odgovor dokazuje taj transport i taj validirani rezultat, ne opštu tačnost modela, produkcionu bezbednost, SLA, privatnost pravih korisnika ili spremnost za javni pilot. Aktivna sesija nestaje pri restartu jer je profil u RAM-u; invitation/kvota ostaju u SQLite-u.
