# Od API ključa do stvarnog razgovora — korisnički vodič

Aktuelno D-037, 2026-10-15: [kompletan tok i stvarni rezultati](FULL_FLOW_AI_VERIFICATION.md). Offline PASS, live PARTIAL: jedno objašnjenje preporuka radi sa pravim modelom, ali promena budžeta još nema uspešan završni v2 live dokaz. Dodati cache-write obračun i stroža šema po zadatku, 529 testova/Edge 9/9 i final fake full-flow PASS. Svih 5 novoodobrenih pokušaja iskorišćeno, kumulativno 9/USD 0.005000 rezerve/procene. Podrazumevani mock je očuvan, server ugašen; ne pokretati live komandu bez novog odobrenja. Za besplatnu ponovljivu probu: `npm run ai:full-flow -- --offline`. Za pregled kataloga: [Viktorov paket](../data/CATALOG_REVIEW_PACKET_2026-10-15.md); nisu još objavljeni stvarni programi. Raniji statusi ispod su istorijski.

Aktuelno D-036 (2026-10-15): **ograničena browser proba sa pravim API-jem PASS**. Tačne četiri vrednosti, korisnička potvrda, ručna izmena budžeta 9000→8000, nova potvrda, reload i brisanje provereni u Edge-u. Jedan novi plaćeni pokušaj, procena USD 0.000076; ukupno 4 pokušaja/USD 0.002176 računovodstvene rezerve/procene. [Browser dokaz](BROWSER_AI_VERIFICATION.md). Test server je ugašen; `.env.local` i podrazumevani mock ostali isti. `npm run ai:browser` podrazumevano radi offline sa lažnim odgovorom; `--approve-one-call` je samo za svaki posebno odobreni plaćeni test. Ova dozvola je iskorišćena. Istorijski statusi ispod nisu trenutni zbir.

Najnovije D-035 (2026-10-15): jedan dodatno odobreni sintetički API poziv sa D-034 ispravkom je **PASS**: četiri prihvaćena nepotvrđena polja, issue null, diagnostics prazni. [Aktuelni dokaz](LOCAL_LIVE_AI_VERIFICATION.md) ima prednost nad istorijskim FAIL/NOT RUN podacima ispod. Ovo još nije široka/live browser evaluacija niti pravi savet; nema automatskog uključivanja browser live režima. Odobrenje za jedan poziv je iskorišćeno.

D-034 (2026-10-15): [offline semantic provera](SEMANTIC_GROUNDING_VERIFICATION.md) reprodukovala je i ispravila annual/year problem i dodala privatne rule/field/index oznake. To nije još jedan pravi API test ili potvrda prethodnog live uzroka. Zasebno odobreni naredni test koristi ovu ispravku i detaljniju dijagnostiku; brojač ostaje 2.

Aktuelno D-033 (2026-10-15): drugi posebno odobreni sintetički test potvrđuje transport, gpt-6-luna odgovor, usage i JSON schema, ali semantic provera odbija predlog. Live prihvatanje i dalje FAIL; pojedinačni semantic razlog ostaje za offline dijagnostiku. Sada su 2 pokušaja i USD 0.002024 u ledger-u (rezerva + procena). [Najnoviji rezultat](LOCAL_LIVE_AI_VERIFICATION.md) ima prednost nad istorijskim podacima ispod. Nema automatskog ponavljanja.

Dopuna D-032 (2026-10-15): sledeći zasebno odobreni one-call test sada beleži i privatni `diagnostics` niz sa fiksnim kodovima razloga. [Ugovor dijagnostike](AI_DIAGNOSTICS.md) i [offline dokaz](LOCAL_LIVE_AI_VERIFICATION.md). To ne otkriva stari odgovor i nije novi live PASS. Ne ponavljati plaćeni poziv automatski.

Aktuelno 2026-10-15: jedan posebno odobreni pravi sintetički pokušaj je izvršen, ali je odgovor odbijen kao MODEL_INVALID_OUTPUT. Nema uspešnog live dokaza; zadržana rezerva USD 0.001948 nije potvrđeni račun. Nema automatskog ponavljanja ili uključenog browser live režima. [Najnoviji rezultat](LOCAL_LIVE_AI_VERIFICATION.md) ima prednost nad istorijskim offline/NOT RUN statusom ispod.

Datum provere: 2026-10-11. Status: **KORAK 7 IMPLEMENTIRAN I OFFLINE PASS; pravi poziv NOT RUN**. Tehnički plan (private development record), odluke (private development record), otvorene kapije (private development record). D-030: korisnik je zatražio izvršavanje sedmog koraka; prvi plaćeni poziv ostaje završna potvrda posle konkretnih dokaza.

Cilj: na ovom računaru koristiti stvarni OpenAI model za podržanu englesku ekstrakciju/pitanja uz eksplicitnu potvrdu profila. Prvi test koristi izmišljene ljude i sintetički katalog. Nova cloud baza nije potrebna: postoje SQLite pozivnice/kvote, a profil je privremen. Pravi univerzitetski rezultati čekaju poseban human review.

## 1. Odrediti prvi obim i limit — Viktor

Implementirani prvi protokol: najviše **20 API pokušaja, USD 0.25 ukupno i USD 0.01 po zahtevu**, uz jedan aktivni poziv po sesiji, bez retry-ja ili automatskog povećanja. Ovi plafoni nisu očekivani račun ili depozit. Brojač pokušaja i novca je u SQLite-u i opstaje kroz restart, dnevni reset i brisanje sesije. Ne brisati/promenjivati ledger radi novog budžeta. Kasnije redovno korišćenje zahteva novi dogovor i proveru. Platformski predlog USD 5 mesečno je odvojen od internog USD 0.25 plafona.

Za test će se koristiti samo izmišljene poruke. Postojeće instrukcije ostaju: English-only, bez novih činjenica/izvora/procenta prijema, bez automatske potvrde profila, bez ukidanja čvrstih i institucionalnih uslova. Model ne čita automatski Markdown/PDF ili Codex prepisku.

## 2. Napraviti ili odabrati OpenAI projekat — Viktor

1. Prijavi se na [OpenAI Platform](https://platform.openai.com/).
2. Otvori [Projects](https://platform.openai.com/settings/organization/projects). Ako treba, prvo izaberi svoju organizaciju u platformi.
3. Napravi zaseban projekat, predloženi naziv `studyguide-prototype-dev`, ili koristi odgovarajući postojeći projekat za ovu aplikaciju.
4. Proveri da možeš da upravljaš njegovim ključevima/limitima; ako nemaš dozvolu, vlasnik organizacije/projekta mora da omogući pristup.

Navigacija/dugmad zavise od naloga; privatna dashboard podešavanja nisu vidljiva u ovoj proveri. [Pravila dozvola](https://developers.openai.com/api/docs/guides/rbac) objašnjavaju odnos projekta, korisnika i API ključa. Za lokalni početak ne treba administratorski API ključ ili Terraform.

## 3. Proveriti API naplatu — Viktor

Otvori [Billing](https://platform.openai.com/settings/organization/billing/overview), proveri aktivan način plaćanja i kredit/odobrenu API potrošnju. Ako nalog zahteva kredit, pregledaj najmanji ponuđeni iznos i potvrdi uplatu samo ako ti odgovara. Ne pretpostavljaj besplatne kredite ili isti minimum za sve naloge. Za prepaid test, ako se nudi automatska dopuna, ostavi je isključenu osim ako je zasebno želiš.

API potrošnja je odvojena od ChatGPT/Codex pretplatničkog korišćenja. Postojeća pretplata nije dokaz da ovaj API projekat može da šalje plaćene zahteve. [Zvanično objašnjenje odvojene API cene](https://learn.chatgpt.com/docs/pricing), [API operativne smernice](https://developers.openai.com/api/docs/guides/production-best-practices).

## 4. Podesiti platformsku zaštitu troška — Viktor

U [Settings](https://platform.openai.com/settings/) odaberi projekat, zatim `Limits → Spend → Edit spend limit`. Postavi mali mesečni plafon; za ovaj izdvojeni prvi test predlog je USD 5. Ako nalog nudi `Enforce a hard limit`, uključi ga i sačuvaj. Dodaj upozorenje ispod limita ako je dostupno.

Upozorenje šalje obaveštenje, a ne zaustavlja pozive. Hard limit zaustavlja pogođene zahteve nakon evidentirane potrošnje, ali može imati kašnjenje i mali prekoračaj. Zato su i dalje potrebni naši serverski limiti pre svakog poziva. Mesečni platform limit nije isto što i ukupan budžet našeg test protokola. [Zvanične spend-limit instrukcije](https://developers.openai.com/api/docs/guides/spend-limits).

## 5. Napraviti ključ za aplikaciju — Viktor

1. Otvori [API Keys](https://platform.openai.com/api-keys) i proveri izabrani projekat.
2. Izaberi kreiranje novog tajnog ključa; predloženi naziv je `studyguide-local-dev`.
3. Odaberi ograničene dozvole ako ih interfejs nudi. Ključ/korisnik moraju imati pristup modelu i kreiranju Responses odgovora; ne trebaju administratorsko upravljanje, upload ili web alati za ovaj tok. Tačni nazivi dozvola zavise od interfejsa.
4. Kopiraj ključ samo u privatnu lokalnu konfiguraciju ili svoj password manager. Ako ga kasnije ne možeš ponovo prikazati, napravi novi i opozovi stari.

Ne šalji ključ u chat, screenshot ili source kod. Nikad ga ne stavljaj u `NEXT_PUBLIC_*`. [Zvanični quickstart](https://developers.openai.com/api/docs/quickstart) i [serversko čuvanje tajni](https://developers.openai.com/api/docs/guides/production-best-practices).

## 6. Sačuvati ključ lokalno, uz isključen live — Viktor uz tehničku pripremu

U glavnom folderu projekta, pored `package.json`, napravi fajl sa tačnim nazivom `.env.local`, bez `.txt` nastavka. Ako već postoji, dopuni postojeći sadržaj; ne prepisuj ostala podešavanja. U editoru ubaci:

```dotenv
OPENAI_API_KEY=OVDE_UNESI_SVOJ_STVARNI_KLJUC_LOKALNO
APP_MODE=mock
AI_PROVIDER=mock
AI_MODEL=gpt-6-luna
AI_LIVE_APPROVED=false
AI_DOCUMENT_ANALYSIS=false
PROTOTYPE_TRANSPORT=local_http
NEXT_TELEMETRY_DISABLED=1
```

Prvi red je mesto za tvoju privatnu vrednost, nije validan ključ. Dokument ne sadrži tajnu. `.gitignore` već isključuje `.env*` osim javnog `.env.example`; to ne zamenjuje proveru arhiva/backupa/client-a. Ne unositi ključ u `.env.example`.

`APP_MODE=live` se odbija. Zadrži `APP_MODE=mock`: ovo označava lokalni aplikacioni režim, a AI provider se bira zasebno. Posle nove implementacije `AI_PROVIDER=openai` i `AI_LIVE_APPROVED=true` mogu otvoriti sintetički tok, ali ključ, sveža cena, odgovarajuće obaveštenje i jedinstvena rezervacija su takođe obavezni. Za sada ostavi live isključen.

## 7. Povezati stvarni provider i proveriti zaštite — Codex/tehnički izvršilac

Ovih sedam tehničkih podkoraka je implementirano u okviru D-030; završne rezultate prati [LOCAL_LIVE_AI_VERIFICATION](LOCAL_LIVE_AI_VERIFICATION.md):

1. Baseline/inventar bez tajni sačuvan u ignorisanom `.cache/live-api-baseline`. Git nije inicijalizovan; PDF/katalog/lockfile se proveravaju hash poređenjem.
2. `local-runtime.ts` bira serverski provider za lokalne sintetičke scenarije. Mock ostaje default; `published` i namerna provider-failure demonstracija nikada ne šalju plaćeni poziv. Postojeći Next.js na tvom računaru je server; nova baza/hosting nisu potrebni.
3. `liveSpendGuard` rezerviše tokene i procenjeni novac zajedno u jednoj SQLite transakciji. OpenAI put ne radi dodatnu mock rezervaciju. Poznati usage vraća nepotrošeni deo; nepoznati ishod/crash zadržava maksimum.
4. Ukupan protokol je 20 pokušaja/USD 0.25; pojedinačni USD 0.01, 1.600 izlaznih tokena, 12s, nula retry-ja. Postojeći sesijski/dnevni/message/rate limiti ostaju dodatna zaštita. Nijedna env promenljiva ne povećava novi plafon.
5. Englesko OpenAI obaveštenje ima verziju `synthetic-openai-1`, posebnu od mock obaveštenja. Nova potvrda je obavezna pri promeni providera, uključujući staru sesiju. Prvi tok je samo za izmišljene podatke. Upload, cloud i human publication ostaju zatvoreni.
6. Zvanični model/pricing ponovo proveren 2026-10-11. Prvi lokalni tok je ograničen na `gpt-6-luna`; snapshot cene važi sedam dana i tada blokira live do nove provere. Model vraća strict JSON, a aplikacija proverava značenje, izvore i ograničenja. Pristup tvog API naloga/kvalitet modela nisu dokazani offline proverom.
7. Dodate fake HTTP integracione/quota/consent provere i browser notice test. Offline suite blokira spoljni fetch i koristi lažni ključ. Browser provere eksplicitno isključuju live. Status alat ne šalje poziv; one-call runner je zaseban opt-in.

Očekivani dokaz: bez ključa/odobrenja/limita nema mreže; paralelni ili obrisani/resetovani zahtevi ne zaobilaze budžet; odgovor ne potvrđuje profil ili ne izmišlja izvor. Kodni plan: LOCAL_LIVE_AI_READINESS_PLAN (private development record).

## 8. Izabrati model i razumeti cenu — zajednički

Početni kandidat [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna) podržava Responses/Structured Outputs prema dokumentaciji proverenoj 2026-10-11; to ne potvrđuje pristup tvog naloga. Pogledaj [Standard API cenovnik](https://developers.openai.com/api/docs/pricing).

Za Standard short-context tekst na datum provere: USD 0.10 / 1M input tokena i USD 0.50 / 1M output tokena. Primer 3.000 input + 800 output je USD 0.0007 za jedan takav poziv. To je ilustracija, ne izmerena cena naše sesije; kontekst, broj poziva, retry, reasoning/output usage, tier i eventualni dodatni troškovi određuju račun. Naš prvi tok ne uključuje web/file alate. Cena/limit se proveravaju ponovo pri implementaciji.

Aktuelni snapshot proveren je 2026-10-11, a istorijski od 2026-10-06 je sačuvan za stare fixture datume. Cena se ne produžava bez provere izvora. Model vraća strukturu, a aplikacija proverava značenje. Ne očekuj slobodni neograničeni chat: sadašnji ugovor bira podržana pitanja/razloge i predlaže polja za potvrdu.

## 9. Aktivirati i napraviti jedan pravi poziv — tek posle koraka 7

Najpre proveri stanje komandom koja nikada ne šalje mrežni zahtev:

```powershell
npm run ai:status
```

Ispisuje samo prisustvo ključa (true/false), svežinu cene i ukupni brojač. Ne dokazuje valjanost ključa, billing ili model access. Posle offline PASS i izričitog odobrenja **jednog** plaćenog sintetičkog pokušaja:

```powershell
npm run ai:live
```

Runner poziva integrisani invitation/notice/conversation tok jednom, ne uključuje retry, ne menja `.env.local` i ne uključuje već pokrenuti server. Na kraju opoziva svoju jednokratnu pozivnicu i briše svoj privremeni profil, a trošak/brojač ostaju. Sanitizovan rezultat je u `.cache/live-api/`; privatni usage/model/request ID logovi u ledger-u, bez poruke i ključa. Greška/timeout ne opravdava automatsko ponavljanje. Runner izričito učitava `.env.local` bez ispisivanja tajne.

Za kasnije odobreni interaktivni rad u browseru u `.env.local` se menjaju:

```dotenv
AI_PROVIDER=openai
AI_LIVE_APPROVED=true
```

Zadržati ostale vrednosti i `APP_MODE=mock`. Limit je fiksiran u serverskom kodu i SQLite-u; ne postoji env promenljiva za povećanje budžeta. Otvoriti novu sesiju i prihvatiti OpenAI obaveštenje. Svaka poruka ili AI objašnjenje može potrošiti preostali pokušaj; platformsku uplatu i limit prvo lično proverava Viktor.

Zaustavi stari server i ponovo ga pokreni. Ranije postavljene PowerShell/sistemske env vrednosti mogu imati prioritet nad fajlom; posebno stare `AI_PROVIDER=mock`/`AI_LIVE_APPROVED=false` iz demo komandi. Tehnički izvršilac proverava efektivni režim bez ispisivanja ključa. Novi status/one-call runner izričito učitava `.env.local` i za pojedinačni poziv koristi process-only konfiguraciju; ostale standalone skripte ne moraju učitati ovaj fajl.

Jedan minimalan poziv sa sintetičkom porukom mora proći pravi integrisani adapter, ne zaobilazni generički tutorial. Proveriti provider request ID, model, token usage i naplatu u privatnoj serverskoj evidenciji/Platform Usage. API uspeh ili HTTP 200 sam nije dokaz ispravnog profila, izvora i prikaza.

## 10. Pokrenuti aplikaciju i proveriti razgovor — zajedno

Sledeće su postojeće komande za produkcioni lokalni server; **pravi AI radi tek sa prethodno završenom integracijom i aktivnom konfiguracijom**. Node24/npm11 su potrebni. Postojeći runtime može pripremiti Codex; ako `node`/`npm` nisu na PATH-u, koristiti uputstvo iz [lokalnog release vodiča](../demo/RELEASE_CHECKLIST.md), bez izlaganja tajni.

```powershell
Set-Location -LiteralPath 'C:\Users\Viktor\Desktop\PROJEKAT'
npm run build
npm run invitation:create -- 8
npm run start -- --port 3200
```

Proveri da svaka komanda uspe pre naredne. Izgradnja/offline testovi ne smeju da naprave plaćene pozive. Ako port već koristi drugi program, izabrati slobodan, ne gasiti tuđe procese.

Otvori `http://127.0.0.1:3200/`. Pozivnicu privatno pročitaj iz ignorisanog `.local/security/local-review-invitation.txt`; ne kopiraj je u javne beleške. Kreiranje nove pozivnice ne opoziva stare. Ako live konfiguracija u `.env.local` nije odobrena/aktivirana, ovo je i dalje mock demo; fajl `.env.live` se ne koristi.

Izaberi lokalni synthetic scenario, potvrdi adult/notice i pošalji jednostavnu novu obrazovnu poruku, na primer: `I want to study computer science in Germany in English.` Proveri predložena podržana polja/pitanja i zatim potvrdi vrednosti. Primer je test ulaz, ne garantovan rezultat: nepodržano/nejasno polje može dobiti dopunsko pitanje.

Posle jednog uspeha, do odobrenog ukupnog broja pokušaja proveri budžet bez perioda, promenu zemlje/budžeta, konflikt, nepoznato i API grešku. Negativne/limit/concurrency slučajeve prvenstveno proveravati fake transportom bez troška. Na [Usage](https://platform.openai.com/settings/organization/usage) izaberi isti projekat i period; dashboard može kasniti u odnosu na poziv.

## 11. Prepoznati greške i zaustaviti trošak

| Stanje                       | Šta proveriti                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 401/authentication           | Da li proces ima odgovarajući aktivan ključ iz pravog projekta; ne ispisivati njegovu vrednost.            |
| 403/model access             | Projekat, ključ/korisničke dozvole, model access i ograničenja naloga.                                     |
| 429                          | Razlikovati rate limit, credit balance i project/organization spend cap; ne podizati budžet automatski.    |
| LIVE_DISABLED                | Kodno povezivanje, eksplicitna dozvola/flag i guard; ključ sam nije dovoljan.                              |
| CONFIGURATION_ERROR          | Efektivna env konfiguracija, model allowlist, ključ i svež pricing snapshot.                               |
| BUDGET_EXCEEDED              | Naš ukupni/sesijski/token/po-zahtevu maksimum. Duži kontekst može biti odbijen i kada Platform ima kredit. |
| MODEL_INVALID_OUTPUT         | Model nije zadovoljio šemu ili proveru značenja/izvora; ne zaobilaziti validator.                          |
| TIMEOUT/provider unavailable | Mreža/trajanje/provider; zahtev možda već ima trošak, pa ne ponavljati neograničeno.                       |
| UI radi ali sve ostaje mock  | Provider wiring, efektivna env vrednost i restart; health/isti tekst sami ne dokazuju pravi AI.            |

[Zvanični API error codes](https://developers.openai.com/api/docs/guides/error-codes). Za normalno isključivanje vratiti `AI_PROVIDER=mock` i `AI_LIVE_APPROVED=false`, pa restartovati server. Ako želiš odmah sprečiti buduće pozive kompromitovanim ili nepotrebnim ključem, opozovi ga na [API Keys](https://platform.openai.com/api-keys). Ne brisati SQLite ledger da bi se resetovala kvota.

## 12. Šta tačno znači da radi

- Pravi provider izvršava ograničeni poziv i postoji stvarna usage evidencija.
- UI prikazuje validne predloge, korisnik ih potvrđuje, a profil/rekomendacije se menjaju prema pravilima.
- Nepoznato, konflikt, institucionalni uslovi i scoped alternativa ostaju tačni.
- Greške/limiti imaju provereno ponašanje, ključ nije izložen i potrošnja staje prema protokolu.
- Evaluacija ima izmerene rezultate; generalni NLP kvalitet i studentska vrednost nisu pretpostavljeni.

Prvi stvarni AI uz sintetički katalog nije stvaran univerzitetski savet. Sledeći posao je pregled/publikacija malog realnog kataloga, zatim odobreni korisnički tok i eventualni hosting. `store:false` nije garancija nultog provider retention-a; [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data) odvajaju response state i druge evidencije. Zato ovaj prvi korak koristi samo izmišljene podatke.

## Šta Viktor javlja za nastavak

Naziv API projekta (bez ključa), da li je billing spreman, izabrani model/pristup, da li je ključ lokalno sačuvan i koji iznos/broj pokušaja odobrava. Ključ ili sadržaj `.env.local` nisu potrebni u poruci. Uplata/platformski cap sami nisu odobrenje Codex-u da troši.

## Verifikacija ovog vodiča

Izvori i konfiguracija pregledani 2026-10-11; D-030 sada uključuje implementaciju i offline kodne testove. Linkovi ka dashboard-u zahtevaju prijavu; billing/model access nisu pregledani. Ključ je samo provereno prisutan bez prikazivanja vrednosti; `.env.local` nije prepisan. Nema uplata, stvarnih API poziva ili deploy-a. Aktuelne komande, rezultate, format/linkove/preservation i granice vodi [LOCAL_LIVE_AI_VERIFICATION](LOCAL_LIVE_AI_VERIFICATION.md).
