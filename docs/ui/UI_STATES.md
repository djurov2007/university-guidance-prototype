# Statički UI: demonstracija i matrica stanja

Datum: 2026-10-05. Korak 4 koristi [UI-only fixture](../../src/test-fixtures/ui-demo.ts), [specifikaciju profila](../test-fixtures/SYNTHETIC_PROFILES.md) i [korisničke tokove](../USER_FLOWS.md). Sve osobe, programi, ustanove, iznosi i izvori su izmišljeni. Nema stvarnog kataloga, AI-ja ili preporuke o podobnosti.

## Kako demonstrirati kompletan tok

1. Otvori [lokalni interfejs](http://127.0.0.1:3000/). Izaberi Bachelor’s, Master’s ili PhD. Prikazuju se cilj i odgovarajuće podpitanje; nepoznata polja ostaju prazna.
2. Klikni Use these example details. Ovo unosi unapred pripremljen sintetički odgovor; slobodan tekst se može prikazati, ali se ne obrađuje NLP-om.
3. Pregledaj Your study brief i klikni Confirm brief. Na telefonu izaberi Study brief, pa se vrati na Conversation.
4. Klikni Explore example options. Posle kratkog lokalnog loading prikaza dobijaju se jedna UG / dve MA / jedna nepotvrđena PhD ilustracija. To je fiksni scenario, bez filtera ili API-ja.
5. Otvori Sources & checks i View next step. Datum 05 Oct 2026 je označen kao simulated; Live URL je None — fictional reference.
6. Edit brief omogućava promenu cilja, zemlje i godišnjeg EUR iznosa. Save changes uklanja ranije kartice i dozvolu. Fiksni walkthrough ne računa novi rezultat; Start over vraća početni primer. Reload takođe uklanja lokalni state.

Početni primeri koriste vidljive ulaze SYN-UG-01, SYN-MA-01 i SYN-PHD-01, uz SYN-UG-02 za dozvolu i SYN-X-01 za konflikt. Galerija nije testiranje svih 12 budućih profila niti njihovih institucionalnih uslova. Program/source ID-jevi `UI-*` pripadaju samo ilustraciji; serverski mock repository ostaje prazan.

## Sva namerno dostupna stanja

Otvori Preview scenarios → Show a UI state. Izbor učitava sintetičku postavku, osim što Server error / AI unavailable čuvaju već postojeći brief i poruke. Dva dodatna stanja (Profile ready i odvojeni One/Two izbor) daju ukupno 17 izbora za 15 stavki prompta.

| Izbor / interna vrednost                | Šta se vidi / radnja                                                                                                     | Broj kartica pre dodatne radnje |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Initial screen / welcome                | Namena, ograničena buduća pokrivenost, tri početna nivoa, prazni paneli.                                                 | 0                               |
| Loading / loading                       | Lokalni indikator i status; Finish loading preview završava ručno izabrano stanje.                                       | 0                               |
| Partial profile / partial               | Četiri nepoznata polja i primer odgovora; potvrda nepotpunog profila onemogućena.                                        | 0                               |
| Conflicting data / conflict             | Serbia only / Germany only; eksplicitni izbor granice, bez tihog prepisivanja. Promena uklanja rezultate.                | 0                               |
| Profile ready / ready                   | Podaci za pregled, predloženi budžet; Explore onemogućen do potvrde.                                                     | 0                               |
| Three recommendations / recommendations | Tri označene ilustracije sa razlozima, izvorima i nepoznatim zahtevima.                                                  | 3                               |
| One recommendation / one                | Jedna ilustracija; nema dopunjavanja do tri.                                                                             | 1                               |
| Two recommendations / two               | Dve ilustracije; nema dopunjavanja do tri.                                                                               | 2                               |
| No matches / no-match                   | Nema opcija za primer; praznina nije tvrdnja da kandidat nema šanse.                                                     | 0                               |
| Conditional alternative / conditional   | I direktan izbor prvo traži dozvolu za Italiju.                                                                          | 0; posle Yes 1                  |
| Permission request / permission         | Yes, explore Italy / No, keep my limit; originalni Germany-only brief se čuva.                                           | 0; posle Yes 1                  |
| Unverified source / unverified          | Uslovna ilustracija i upozorenje: izvor/intake/uslovi nisu potvrđeni.                                                    | 1                               |
| Out-of-scope question / out-of-scope    | Pripremljeni nepovezani upit i povratak obrazovnom toku.                                                                 | 0                               |
| Server error / server-error             | Bezbedna greška; Try again čuva postojeći brief, uključujući korisničku korekciju.                                       | 0                               |
| AI unavailable / ai-unavailable         | Brief ostaje; osnovni primeri dostupni bez AI-ja samo za potvrđen neizmenjen primer.                                     | 0; posle Review 1/2 po nivou    |
| Expired session / expired               | Stare poruke, polja i composer nisu u DOM-u; Start a new example briše prethodni state. UI simulacija bez sesije/auth-a. | 0                               |
| Empty catalog / empty-catalog           | Upozorenje o pokrivenosti i predlog zvanične provere; ne prikazuje izmišljene stvarne linkove.                           | 0                               |

## Dozvola, korekcija i podaci

Permission i Conditional koriste Germany-only economics primer SYN-UG-02. Naziv alternativnog programa/kartica se ne prikazuje pre Yes. Dozvola pokriva samo istraživanje Italije; ne menja originalni brief i ne ukida institucionalne uslove. No uklanja alternativu. Withdraw permission i ispravka profila takođe uklanjaju karticu i poništavaju dozvolu.

Ovo su UI pravila, bez serverske autorizacije. Javni sintetički fixture je deo client bundle-a; skrivanje kartice nije zaštita poverljivih podataka. Poslovni profil, pravi filteri/ranking, baze i sesije čekaju Korake 5–10. Freeform odgovor ima fiksni demonstracioni odgovor i ne tumači tekst kao potvrđeni profil.

Na desktopu su sva tri panela vidljiva. Na telefonu se koriste Conversation / Study brief / Options. Composer i profile editor nisu prisutni u istekloj simulaciji. Nema localStorage-a, cookies-a ili slanja chat sadržaja. Odvojena [tehnička stranica](http://127.0.0.1:3000/technical) zadržava mock dijagnostiku Koraka 3 i njen lokalni API poziv; obrazovni UI je ne koristi.

Dokaz provera: [VERIFICATION](VERIFICATION.md). Dizajn: [DESIGN_SYSTEM](DESIGN_SYSTEM.md).
