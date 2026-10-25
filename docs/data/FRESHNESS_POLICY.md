# Svežina, kontekst i istorijski rokovi

2026-10-06, konzervativna razvojna politika D-014. Ovi pragovi su odluka implementacije, nisu pravilo univerziteta. Provera zna stvarni `asOf`; datum prvog prikupljanja svih novih izvora je 2026-10-06. HTTP dostupnost nije dokaz sadržaja/svežine. Master plan str. 42 predlaže nedeljnu proveru aktivnih rokova/funding-a i tromesečnu strukture; politika to čuva. Za rok u narednih sedam dana maksimalna starost provere je jedan dan, uz ponovni pregled pred slanje prijave.

| Grupa                                               | Najduže od poslednje provere |
| --------------------------------------------------- | ---------------------------- |
| Rok, stipendija, početak intake-a                   | 7 dana                       |
| Školarina, drugi troškovi, uslovi, akademska godina | 30 dana                      |
| Identitet, lokacija, nivo, jezik, trajanje, credits | 90 dana                      |
| Human approval kompletnog sadržaja                  | 14 dana                      |

Rok je uključiv: status prelazi u stale kad je starost **veća** od praga. Efektivni status proverava fact, svaki supports source i evidence datum; star/konfliktan izvor ne postaje verifikovan promenom samo fact datuma. Explicit unknown/unverified/conflicting/stale se ne unapređuje automatski. `effectiveStatuses` u rezultatu validatora mora se koristiti pri čitanju; sirovi stari `status=verified` nije trenutni prikaz. `fully_verified` i publication proveravaju efektivni status.

Kandidat, track, program ID, akademska godina i runda čine primenljivost. Recurring February/May prozor nije tačan rok 2027. General policy sa null godinom nije future-intake potvrda. CandidateCategory/qualifier trenutno su eksplicitni tekst i još nisu izvršivi matching filter; budući Korak 7 mora dodati odgovarajuća pravila bez nagađanja.

`deadlineState` zasebno razlikuje unknown/closed/upcoming_or_today. Raniji tačan rok ostaje tačna istorijska činjenica sa `closed`, ne lažna aktuelna prijava i ne nova izmišljena godina. Datum danas nije dokaz da je prozor još otvoren: bez tačnog vremena/zone/otvaranja vraća se samo upcoming_or_today. Stale/conflicting/nepoznat rok nije usable aktuelni rok. Funkcija koristi `asOf` po danu i ne daje potvrdu otvorene prijave; matching/UI integration nije implementiran.

## Održavanje

Aktuelna lokalna published putanja od D-039 (2026-10-17) računa runtime `asOf` po kalendaru **Europe/Belgrade**, isto kao datum ovog ljudskog pregleda. Oko lokalne ponoći UTC datum može biti prethodni dan; datum pregleda nije zbog toga falsifikovan ili pomeren. CLI provere zadržavaju podrazumevani UTC datum i reprodukcioni `--as-of 2026-10-17`; za konzistentan lokalni pregled operator navodi taj datum eksplicitno. Validator i dalje odbija buduće datume u odnosu na prosleđeni `asOf`; pragovi 1/7/30/90 dana i zabrana stale publikacije nisu promenjeni. Ovo je odluka lokalnog prototipa, ne univerzalna vremenska zona kandidata ili univerzitetskog roka; cutoff čuva zasebni CET/CEST kontekst.

1. Pre demo/publikacije otvoriti merodavne izvore i pregledati kritične podatke za izabrani intake/kategoriju.
2. Sačuvati izmenjene assertions/dokaze i tačne datume. Nedostupnost ili dvosmislenost znači unverified/unknown, konflikt čuva obe vrednosti.
3. Napraviti novu verziju, pokrenuti offline validator i regenerisati pregled. Ne menjati stare godine ili priznati stipendiju bez award-a.
4. Čovek ponovo pregleda tačan digest i sve unknown. Tek eventualni odobreni published snapshot može biti korišćen kasnije; CLI nema promociju.

Nema scheduler-a, crawler-a ili automatskog recheck-a. `catalog:check` bez argumenta koristi današnji UTC datum, a za reprodukciju ovog pregleda `--as-of 2026-10-06`. Razlika UTC/local dana blizu ponoći rešava se eksplicitnim datumom pregleda. Aktuelni PASS ne važi zauvek.
