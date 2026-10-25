# Granice poverenja

Datum: 2026-10-05. Veze: [ARCHITECTURE](ARCHITECTURE.md), [CONTEXT](CONTEXT.md), [SCOPE](../PROTOTYPE_SCOPE.md), [VERIFICATION](VERIFICATION.md).

## Dopuna UI granice Koraka 4

Slobodan tekst i korekcija na / ostaju samo u React state-u, bez slanja serveru/logovanja/persistence-a; tekst je escaped, limitiran i nije NLP ekstrakcija. Privremeno potvrđen UI brief nije poslovno validiran profil. UI-only izmišljeni programi/izvori su javni test double-ovi u browser bundle-u, odvojeni od praznog serverskog repository-ja. Consent pre kartice je UX pravilo, ne autorizacija ili zaštita tajnih podataka.

Izmena/revoke brišu prikazane opcije; expired simulacija uklanja poruke/polja iz DOM-a i novi početak resetuje state. To ne dokazuje stvarni retention/session isolation. Pre stvarnih podataka ostaju kapije i server provere iz tabele ispod. [UI dokaz](../ui/VERIFICATION.md).

## Mapa i stvarne zaštite

| Ulaz/granica            | Zašto nije pouzdan                                                                    | Zaštita sada                                                                                                                                                                                                        | Pre stvarnog proizvoda/pilota                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Browser → server        | Kod browsera i njegov state se mogu promeniti; isti zahtev se može poslati bez UI-ja. | Server strict Zod ugovor prihvata samo poznati sintetički ID, bez dodatnih polja. UI validacija ne zamenjuje server validaciju.                                                                                     | Sesijska izolacija, pozivnice, kontrola pristupa, kvote/veličina ulaza, origin/CSRF po stvarnom toku.                                |
| Korisnički ulaz         | Slobodan tekst može sadržati konflikt, skript/instrukciju ili osetljiv podatak.       | Slobodan tekst nije ulaz dijagnostike; nepoznata polja/ID se odbijaju, vrednosti se ne echo-uju/loguju.                                                                                                             | Potvrđivanje profila, minimizacija, granice sadržaja, hard/preference/institutional pravila; ne izvršavati tekst kao kod.            |
| Dokument                | Tekst/slika/PDF može sadržati prompt injection ili štetan sadržaj.                    | Nema upload-a ili parsiranja dokumenata. Master plan je neizmenjen referentni izvor, nije izvršni runtime sadržaj.                                                                                                  | Odvojena kapija formata/veličine/izolacije/brisanja/obaveštenja i potvrde ekstrakcije.                                               |
| Spoljni izvor → katalog | URL, zvaničan domen ili studentski komentar ne garantuju aktuelnost/kontekst/tačnost. | Katalog je prazan; nema crawler-a, URL alata ili izmišljenih izvora.                                                                                                                                                | Reviewer, izvor/datum/intake/kategorija kandidata, official/unofficial oznaka, konflikti i unknown.                                  |
| Model → domen/UI        | Model može vratiti validan JSON sa izmišljenim programom, uslovom ili instrukcijom.   | Nema pravog modela; izlaz mock adaptera se validira istim neutralnim ugovorom. Negativni test odbija nepoznati ID. React prikazuje tekst; nema `dangerouslySetInnerHTML`.                                           | Allowlist stvarnih ID-jeva, provera činjenica i hard pravila, refusal/nepotpun izlaz, timeout/usage/budžet. Zod nije dokaz tačnosti. |
| Server config → browser | Direktni uvoz može otkriti privatne vrednosti/buduće ključeve.                        | `server-only` marker na config/adapter/repository modulima; nema `NEXT_PUBLIC_*` tajni ili eksportovanja process.env. Lint sprečava `@/server/*` u zajedničkim/UI modulima. Pravi negativni build proverava marker. | Svaki novi secret-bearing modul zadržava marker; testovi browser bundle-a i operativno upravljanje tajnama.                          |
| Sesija → druga sesija   | Deljeni mutable state može pomešati korisnike.                                        | Nema persistence-a/cookies/profila sesije; mock je stateless. To nije dokaz izolacije budućih sesija.                                                                                                               | Negativni test A/B, autorizacija svakog pristupa, istecanje/brisanje/backup provera u 10/11.                                         |

## Konfiguracija i greške

Jedini app config je APP_MODE, default `mock`. Nepodržani režim se odbija; nema tihog prelaska na realnog dobavljača. API vraća samo neutralne kodove i fiksne engleske poruke, bez sirovog Zod error-a, stack-a, ulaznog sadržaja ili vrednosti okruženja. Nema aplikacionih request/response logova. Server `env.ts` ne izlaže ceo process.env i nikad se ne uvozi u client komponentu; pozitivni browser koristi samo zajednički ugovor. Čista config schema ne sadrži ključeve ni čitanje okruženja.

`.env.local` i svi `.env*` osim bezbednog example-a su ignorisani. U ovom koraku nema takvog fajla, API ključa ili cloud credentials-a. Test stringovi sa oznakom SENTINEL su izmišljene vrednosti za dokaz da se ne vraćaju kroz API. Ignore pravilo nije zamena za proveru novih fajlova ili rotaciju eventualno izloženog ključa.

## Dokaz i ograničenje

Vitest privremeno mock-uje `server-only` marker da testira serversku logiku; to samo po sebi nije dokaz granice bundlera. `npm run test:boundary` zato gradi zaseban App Router fixture sa Client Component-om koji uvozi tačnu kopiju stvarnih `env.ts`/`schema.ts`. PASS zahteva neuspešan Next build sa očekivanim server-only/client error-om; pozitivan build aplikacije mora zasebno proći. Fixture se briše samo iz proverene, novoformirane podputanje `.cache/`.

Smoke test blokira svaku browser mrežnu adresu van lokalne aplikacije; server integration test zabranjuje globalni fetch i dokazuje da mock ne koristi mrežu. To nije sandbox za budući stvarni adapter niti sveobuhvatna bezbednosna revizija. Nema implementiranog ograničenja velikog HTTP body-ja, auth-a/kvota ili retention politike; dijagnostika se koristi lokalno sa sintetičkim ulazom. Bez javnog deploy-a i pravih podataka.

Audit razvojnih zavisnosti je zaseban rezultat: upozorenje za `braces` u lint lancu nema objavljenu zakrpu; audit kompletnog dependency stabla ne prolazi. Proveru runtime zavisnosti i stvarne brojeve čitati u VERIFICATION. Ne učitavati nepouzdane glob obrasce kroz razvojne alate i pregledati usklađeno izdanje pre kasnijeg širenja/upotrebe; nema slepog `audit fix --force` downgrade-a Next stack-a.

## Dopuna AI granice Koraka 8 — 2026-10-06

[AI ugovor](../ai/AI_CONTRACT.md), [verifikacija](../ai/VERIFICATION.md). Trusted server caller daje matching/profile snapshot; browser ne daje katalog/grants/provider/ključ/alate. Strict message/revision/task, heuristički scope screen, minimalni kontekst i strict semantic output grounding čuvaju pravila. Model selektuje samo existing visible ID/reasons; server čuva warnings/unknown i permission pre identity. Profile proposals ostaju nepotvrđeni. Nema modelskih URL/shell/database alata ili HTML prikaza.

Novi OpenAI provider ima server-only marker, fixed HTTPS endpoint bez redirects, bounded response, no-store zahtev, timeout i rezervaciju/unknown settlement port. Nema live poziva, logova ili javne AI rute; false document/live zastavice i bez produkcionog spend guard-a drže slanje zatvorenim. Ovo ne zatvara session/distributed quota, privacy/retention, source human review ili stvarnu AI evaluaciju. Istorijske tabele iz Koraka 3 opisuju tadašnje stanje; trenutna detaljna kontrola je u AI ugovoru.

## Dopuna Koraka 9 — lokalne serverske sesije

[Vertikalni ugovor](../integration/CONTRACT.md), [dokaz](../integration/VERIFICATION.md). Browser dostavlja samo strict action/revision/field odgovore, ne katalog, model ili profile/grants snapshot. Novi lokalni endpoints proveravaju loopback URL i Host, porede Origin sa validiranim public Host-om (Next može rekonstruisati drugi interni port), ograničavaju body i odbijaju stale/parallel zahteve. Opaque HttpOnly cookie bira izolovan serverski profil. TTL/delete/late completion i profile change/source visibility imaju negativne provere. UI koristi React tekst i validiran DTO; AI metadata/history/consent scope nisu izloženi.

Ovo su lokalne mock granice, bez produkcione auth/persistence/invitations/distributed/global financial quota zaštite. Stara tehnička dijagnostika ostaje lokalni sintetički kostur; nove safeguards nisu retroaktivna potvrda pilota. Nema live AI poziva, stvarnih dokumenata/personal toka ili javnog hosting odobrenja. Korak 10 nije otvoren; ranija ograničenja dependency-a ostaju.

## Korak 10 — pristup i lifecycle

Strict redemption i atomic bounded hashes; cookie je jedini session selector. Body/URL/model ne bira tuđi profil. Origin/Host/SameSite, expiry/revoke/late commit i visible program provera su nezavisni od modela. Server-only ledger ne šalje hashes, quotas ili logs browseru. Minimalni allowlist metadata je nov; raniji opis bez logging-a je istorijski. Local storage/cache/.env nisu Next trace. Live/document false nisu UI dozvole. [Policy](../security/SECURITY_PRIVACY_BASELINE.md), [retention](../security/LOGGING_RETENTION.md), [pretnje](../security/THREAT_MODEL.md).
