# Kriterijumi prihvatanja prototipa i Koraka 2

Dopuna 2026-10-17, D-043/D-044: published 1.0.3 ima osam human-reviewed programa i 26 prihvaćenih visible unknown. Time je zatvorena katalog publication kapija za ovaj digest; individualna podobnost/cena/funding, stvarni korisnički zadaci, puna live-model evaluacija, cloud, dokumenti i pilot acceptance ostaju neprovereni. [Završni status Faze 1](PHASE_1_CLOSEOUT.md). Donji raniji datumski rezultati ostaju istorija svojih koraka.

Dopuna 2026-10-06: Korak 5 ima stvarni partial staging katalog, published je prazan; Korak 6 dodaje [profilni domain dokaz](profile/VERIFICATION.md) za questions/status/confirmation/conflicts/readiness. Donji AC kriterijumi ostaju kompletna buduća produktna/pilot kapija. Deset novih profilnih razgovora ne dokazuje svih 12 originalnih SYN scenarija ili stvarni NLP/AI/matching/sesije/intervjue.

Verzija: 1.0, 2026-10-05. Izvori: [PROTOTYPE_SCOPE](PROTOTYPE_SCOPE.md), [USER_FLOWS](USER_FLOWS.md), [USER_STORIES](USER_STORIES.md), [SYNTHETIC_PROFILES](test-fixtures/SYNTHETIC_PROFILES.md). Status: specifikacija budućeg produktnog/pilot prihvatanja. Korak 3 sada ima tehničku aplikaciju/test runner i zasebne provere u [VERIFICATION](architecture/VERIFICATION.md); Korak 4 dodaje statički sintetički tok sa [zasebnim UI proverama](ui/VERIFICATION.md). U istorijskom Koraku 4 nije bilo stvarnog kataloga, AI-ja, sesija ili intervjua; aktuelne dopune navedene su iznad. Tehnički/UI PASS ne zatvara produktne/pilot kriterijume ove matrice.

## Dve odvojene kapije

**Kapija A - dokumentacioni Korak 2:** PASS znači da novi član može objasniti korisnika, problem, tok, nedostatak podataka, granice i način merenja vrednosti iz konkretnih dokumenata. Ne zahteva implementaciju ili održane intervjue. Korak 2 nije započeo implementaciju; kasnije dostavljeni Prompt 3 otvara zaseban tehnički nalog D-008.

**Kapija B - budući prototip/pilot:** PASS zahteva stvarne rezultate provera, pregledane podatke i odobrene uslove rada. Dokumentacioni PASS ne predstavlja bezbednosni audit, dokaz korisnosti, potvrdu pravne usklađenosti ili dozvolu stvarnog pilota/deploy-a.

## Matrica acceptance kriterijuma

U svakoj proveri sačuvati datum, verziju profila/kataloga/modela/prompta, ulaz, očekivani rezultat, stvarni rezultat, dokaz i ocenjivača. „Kritično“ znači da neuspeh blokira izdanje relevantnog toka; ne razblažuje se prosečnim uspehom drugih testova.

| ID | Proverljivo ponašanje / kriterijum prolaza | Način provere i profil | Kritičnost |
| --- | --- | --- | --- |
| AC-01 | Važeći adult pristup otvara englesku svrhu/AI oznaku i ograničeni katalog; nema javne registracije ni obećanja sveobuhvatnosti. | Pregled početnog UI-ja; validna/nevalidna pozivnica. | Kritično za nedozvoljen pristup; ostali tekst nekritičan ako ne obmanjuje. |
| AC-02 | Delimičan profil izaziva jedno ili dva relevantna pitanja, bez izmišljenih vrednosti i ponavljanja eksplicitnog unknown u petlji. | SYN-UG-04, SYN-X-02; zapis pozvanih pitanja i statusa. | Kritično za izmišljanje; UX broj/petlja nekritično osim ako blokira tok. |
| AC-03 | Budžet dobija valutu/period/obuhvat, ili ostaje eksplicitno unknown. Školarina nije ukupan trošak; unknown nije nula; neodobrena stipendija nije sigurni budžet. | SYN-UG-03, SYN-MA-04, SYN-X-02; granice iznosa i perioda. | Kritično. |
| AC-04 | Konflikt se prikazuje i ne prepisuje tiho; sporna ekstrakcija čeka potvrdu; eksplicitna korekcija ažurira profil/verziju i poništava stare rezultate/dozvole kad relevantno. | SYN-X-01; dodatna mutacija svakog profila. | Kritično za pogrešno potvrđivanje/izmenu. |
| AC-05 | UG pitanja proveravaju relevantnu srednjoškolsku kvalifikaciju i jezik; integrisana ruta se ne predstavlja kao post-bachelor master. | SYN-UG-01..04; posebna test mutacija tipa kvalifikacije. | Kritično za pogrešan nivo/podobnost. |
| AC-06 | MA provera razlikuje specijalizaciju/promenu oblasti i relevantne preduslove; iskustvo ne ukida provereni obavezni predmet. | SYN-MA-01/02/04. | Kritično. |
| AC-07 | PhD tok razlikuje program/poziciju, temu, mentora ako obavezan i finansiranje; ne izmišlja laboratoriju, otvoren konkurs ili stipendiju. | SYN-PHD-01/02. | Kritično. |
| AC-08 | Filter poštuje nivo, relevantnu oblast, hard zemlju/jezik/budžet i poznate institucionalne uslove; primarni rezultati su 0-3, bez izmišljene treće opcije. Preferenca rangira tek posle filtera. | SYN-UG-01/02, SYN-MA-02; slučajevi 0, 1, 2 i više validnih kandidata. | Kritično. |
| AC-09 | Finansijski/kvalifikaciono uslovna opcija odvojena je od primarnog match-a; nepoznat kritičan uslov ostaje needs verification. | SYN-UG-03, SYN-MA-04, SYN-PHD-01. | Kritično. |
| AC-10 | Svaka ključna institucionalna tvrdnja ima postojeći dozvoljeni izvor, relevantan intake/kategoriju i status/datum. Prošli rok, konflikt i neproveren autoritet ne daju potvrđenu činjenicu/eligible oznaku. | SYN-MA-03, SYN-PHD-02; validacija ID i ljudska provera činjenica. | Kritično. |
| AC-11 | Alternativa van hard uslova čeka konkretnu dozvolu pre imena/kartice; No i opoziv poštuju originalni uslov, Yes ne ukida institucionalno pravilo ni Srbiju/EU. | SYN-UG-02, SYN-X-01; Yes/No/revoke i promenjen profil. | Kritično. |
| AC-12 | No-match razlikuje katalog prazninu, poznato neispunjenje i neprovereni izvor; daje korak provere bez tvrdnje da globalno nema programa. | Prazni katalog sa svim profilima; SYN-UG-04, SYN-MA-02. | Kritično za izmišljanje/obmanu; formulacija nekritična ako zadržava smisao. |
| AC-13 | Svaki završni ishod ima konkretan naredni korak zasnovan na poznatom stanju; nema automatskog slanja, admissions probability score-a ili garancije prijema. | Tri nivoa i no-match; proveriti vezu korak → izvor/praznina. | Kritično za zabranjene tvrdnje/radnje; razumljivost koraka nekritična. |
| AC-14 | Timeout/refusal/invalid output/kvota ne daju lažni uspeh ili nekontrolisani retry; potvrđeni podaci/katalog dostupni uz važeću sesiju; potrošnja ograničena. | Mutacije servisne greške, invalid JSON/source ID i konkurentnih zahteva. | Kritično. |
| AC-15 | Korisnik A ne čita/menja/briše sesiju B; nema server ključa, tajni ili punih dokumenata u browseru/logovima. | Negativne provere dve sesije, prava pristupa i pregled izloženih podataka. | Kritično. |
| AC-16 | Istek pre/posle zahteva prekida zaštićen prikaz; brisanje zaista uklanja lokalne podatke po politici; nema tihog vraćanja obrisanog profila. Provider granice objašnjene. | Mutacije isteka/brisanja, cleanup i ponovnog pristupa. | Kritično. |
| AC-17 | Produktni tekst/razgovor su engleski, originalni nazivi očuvani, tastatura/fokus/label-e/paneli upotrebljivi na telefonu; nepoznato/greška nisu samo boja. | Mobile/desktop, tastatura, osnovni screen-reader pregled; SYN-UG-01. | Blokada toka kritična za relevantnog korisnika; kozmetika nekritična. |
| AC-18 | Nevezana tema, falsifikovanje i injection ne proširuju domen ili dozvole; nevalidan sadržaj/link ne izvršava skriptu ili proizvoljan mrežni zahtev. | Adversarial mutacije profila/teksta/izvora; pregled bezbednog prikaza. | Kritično. |
| AC-19 | Isključen upload jasno nedostupan, tekstualni tok radi. Uključen upload dozvoljen tek posle svih SCOPE provera i potvrde ekstrakcije. | Feature flag off je obavezan test; on samo ako zasebno odobren i implementiran. | Kritično; isključena funkcija nije završen sigurni upload. |

## Sintetički set i uslovi pretrage

Početnih 12 profila su 4 UG, 4 MA, 2 PhD i 2 konfliktna/problematična. Profili nisu programi, test rezultati ili stvarni korisnici. Jedan profil daje više slučajeva: drugačiji katalog, validnost izvora, korekcija, alternativa, servisna greška i istek.

Dok stvarni katalog ne postoji, ručna provera koristi izričite hipotetičke uslove iz fixture dokumenta. Ne navodi izmišljene ustanove, URL-ove ili uslove kao činjenice. Kada Korak 5 napravi katalog, svaki runtime slučaj vezuje se za njegovu verziju i postojeće ID-jeve. Ako potreban zapis nije obrađen, slučaj proverava katalog gap, a ne prećutno očekivani match.

Oko 50 slučajeva za prvi prototip i oko 100 za stabilni demo, sa predloženom podelom 60 razvojnih/40 završnih, ostaju planski ciljevi A-009. Ovaj korak ne pravi ili izvršava tih 50/100 testova. Kritični AI slučaj ponoviti najmanje tri puta po relevantnoj verziji. Predlog release praga: svi definisani kritični prolaze; najmanje 90% jasno ocenjenih nekritičnih. Blokiran/neizvršen obavezni test nije PASS i ne nestaje iz izveštaja.

## Kako merimo stvarnu vrednost

Pre implementacije prvih pet razgovora su istraživanje problema/koncepta, prema [INTERVIEW_GUIDE](research/INTERVIEW_GUIDE.md), a ne dokaz da gotov prototip radi. Posle stabilizacije, uz odobren pilot, posmatrati odrasle kandidate tokom stvarnog zadatka i beležiti:

| Mera | Operativna definicija | Tumačenje |
| --- | --- | --- |
| Samostalno završen zadatak | Korisnik dođe do relevantnih opcija ili tačno objašnjenog no-match-a i izabere sledeći korak, bez pomoći u sadržaju. | Pomoć oko odluke/pitanja beleži se; nije samostalni uspeh. |
| Razumevanje izvora | Korisnik pokaže izvor bar jedne ključne tvrdnje i razlikuje zvaničnu činjenicu od procene/nepoznatog. | Reviewer proverava da izvor zaista podržava tvrdnju. Sam broj klikova nije dovoljan. |
| Poštovanje ograničenja | Nema neodobrenog odstupanja ili lažno potvrđene podobnosti u posmatranom toku. | Kritična greška blokira izdanje bez obzira na zadovoljstvo. |
| Koristan sledeći korak | Korisnik svojim rečima kaže šta treba uraditi/proveriti i zašto; korak je konkretan i primeren ishodu. | No-match može biti koristan ako je praznina iskrena i korak praktičan. |
| Vreme i zastajkivanje | Trajanje od prve obrazovne poruke do koraka; mesta/pitanja gde korisnik zastane, broj pomoći i nepotrebnih pitanja. | Prvo meriti, zatim postaviti realnu ciljnu granicu; ne izmišljati uštedu vremena. |
| Ponovna upotreba | Odgovor da/ne/neodlučan, razlog i konkretan naredni zadatak za koji bi koristio alat. | Namera nije stvarno ponovno korišćenje; eventualni follow-up se vodi odvojeno. |

Predlog početnog signala: najmanje 80% završi smislen zadatak i razume izvore/ograničenja u odobrenom posmatranom uzorku, uz nula kritičnih povreda. To je radni predlog A-011, ne potvrđen naučni prag ili product-market fit. Pilot cilj ostaje 5 UG + 5 MA + 2 PhD i različite oblasti, odvojeno od prvih pet intervjua. Rezultate objaviti kao broj uspeha/ukupan broj i uz ograničenja uzorka; nekoliko ljudi iz bliskog kruga ne dokazuje tržište ili partnerstvo.

## Dokumentaciona kapija Koraka 2

| Pitanje novog člana | Gde je odgovor / dokaz |
| --- | --- |
| Kome prototip pomaže? | PRODUCT i USER_FLOWS: pozvani punoletni UG/MA/PhD, engleski tok, Srbija/EU. |
| Koji problem rešava? | PRODUCT: od cilja/ograničenja do proverljivih opcija i sledećeg koraka. |
| Kako izgleda osnovni tok? | USER_FLOWS: mapa F-01..08, tri varijante i stanja S-01..11. |
| Šta kada nema podataka? | USER_FLOWS S-02/S-03/S-06/S-09; US-02/03/09/11 i AC-02/04/10/12. |
| Šta je van obima? | PROTOTYPE_SCOPE i USER_STORIES granice; samo engleski, bez Faze 2/3. |
| Kako znamo da daje vrednost? | Ovaj dokument: posmatrani zadatak, ispravni izvori, razumevanje, sledeći korak i feedback; vodič/obrazac istraživanja. |

Dokumentaciona provera: **PASS, 2026-10-05**. Provereno je šest traženih novih dokumenata, 12 jedinstvenih profila 4/4/2/2, 11 stanja i engleski produktni tekst, 17 priča (16 osnovnih + 1 uslovna), 19 acceptance kriterijuma, vodič za pet intervjua i osam traženih polja obrasca. Reference S/US/AC/profile ID i relativni linkovi su validni, a izvorni/nepovezani fajlovi sačuvani. Pregled pisanih scenarija je u izvršnom planu (private development record). Ovo je autorska dokumentaciona provera, ne izveden onboarding stvarnog novog člana tima ili nezavisni audit. Runtime i intervjui: **NOT RUN**.

## Lokalna evaluaciona kapija Koraka 11

2026-10-11: [QA_REPORT](testing/QA_REPORT.md) i [GOLDEN_SET](testing/GOLDEN_SET.md): 50/50 slučajeva, 78/78 izvršavanja, 357 software/27 browser testova. U definisanom enabled local mock skupu nema poznatog otvorenog release blocker-a; rizični live/PDF tokovi isključeni. Development dependency audit FAIL 5 high otvoren uz trusted-local ograničenje. Ovo ne zatvara gore opisane produktne mere razumevanja/vrednosti ili human accuracy/pilot kapiju. Realni korisnički zadaci, 5/5/2 ljudi i nezavisni review nisu izvršeni. Korak 12 nije započet.

## Završna lokalna kapija Koraka 12

2026-10-11: [RELEASE_CHECKLIST](demo/RELEASE_CHECKLIST.md) navodi final evidence i svih 11 odgovora. Sedam profila prošlo je stvarnu browser probu bez ručnog spasavanja; 360 software/28 Edge/50 golden scenarija, source/key/constraints/budget checks, pravi 69.68s video i offline stills provereni. Enabled local mock flow nema poznatog otvorenog release blocker-a u definisanom skupu; live/upload/public cloud disabled. Development audit FAIL ostaje dokumentovan. Local/presentation PASS ne zatvara human data accuracy, student usefulness ili pilot/privacy kapiju. Blank feedback i tester guide nisu izvedeni pilot; Faza 2 nije započeta.
