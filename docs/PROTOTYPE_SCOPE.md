# Obim prototipa Faze 1

Aktuelno 17. oktobra 2026, D-043/D-044: Faza 1 je zatvorena za ovaj lokalni scope. Published 1.0.3 ima osam ljudski odobrenih programa, 31 zvanični izvor, 145 činjenica, 128 evidence veza i 26 prihvaćenih visible unknown. [Završni status](PHASE_1_CLOSEOUT.md). Stariji odeljci ovog dokumenta čuvaju razvojnu hronologiju; njihove tvrdnje `published=0/1/2` nisu aktuelni inventar. Faza 2, pravi pilot, cloud i dokumenti nisu otvoreni.

Status: radna osnova Prompta 2 (D-007); Prompt 3 dodaje tehnički kostur (D-008), a Prompt 4 statički sintetički UI (D-011). Prompt 5 dodaje realni lokalni staging katalog/model (D-013/D-014), bez objave/AI/matchinga/sesija. Datum: 8. oktobar 2026. Osnova: Prompt 1, nastavak Promptom 2 i privatni Master plan, str. 5-23, 33-47 i 80-84. Ovde se definiše budući prototip; Korak 2 pravi samo dokumentaciju. Konkretno ponašanje: [USER_FLOWS](USER_FLOWS.md); priče: [USER_STORIES](USER_STORIES.md); provere: [PROTOTYPE_ACCEPTANCE](PROTOTYPE_ACCEPTANCE.md).

## Istorijsko stanje posle Koraka 7

Lokalni UI sada omogućava sintetički razgovor, korekciju/potvrdu, ilustrativne opcije, dozvolu, izvore i sledeći korak. [Matrica UI stanja](ui/UI_STATES.md) i [verifikacija](ui/VERIFICATION.md) razlikuju ovaj demo od budućeg proizvoda. Korak 5 priprema osam stvarnih programa (4/3/1, četiri zemlje) u odvojenom staging katalogu, sa pojedinačnim izvorima i unknown. Published i mock dijagnostički katalog ostaju prazni; UI koristi fiktivne primere. Nema pravih korisnika, cloud pohrane, AI potrošnje, human approval-a ili pilot provera. Dokaz: [data VERIFICATION](data/VERIFICATION.md). Veći brojevi/pilot ostaju ciljevi.

Prompt 6 otvara D-015/D-016: [profilni domen](profile/PROFILE_MODEL.md), verzionisana engleska pitanja, eksplicitne potvrde/ispravke i bounded readiness, sa deset izvršivih sintetičkih razgovora. [Dokaz](profile/VERIFICATION.md). Nema stvarnog NLP/extractor-a, matching-a, AI API-ja, sesija ili povezivanja domena sa browser UI-jem. Profilna readiness ne znači katalog coverage, podobnost ili već izračunatu preporuku. Pri završetku Koraka 6 Korak 7 nije bio započet. Naknadni Prompt 7 (D-017/D-018) implementira [matching/ranking](matching/ALGORITHM.md), structured conditions/reasons i scoped alternative, sa [dokazima](matching/VERIFICATION.md). Published/staging/UI granice ostaju, bez realnog AI-ja, sesija ili integracije. Pri završetku Koraka 7 Korak 8 nije bio započet. Dostavljeni Prompt 8 (D-019/D-020) sada dodaje [serverski AI adapter](ai/AI_CONTRACT.md) i [fake/mock dokaz](ai/VERIFICATION.md), bez live poziva ili slobodnih AI činjenica. Naknadni Prompt 9 (D-021/D-022) otvara lokalnu UI/profile/matching/mock AI integraciju i ephemeral sesije; [ugovor](integration/CONTRACT.md), [dokazi](integration/VERIFICATION.md). Pozivnice/produkcione sesije/distribuirane kvote (10), realni API i pravi dokumenti ostaju na svojim kapijama.

## IN SCOPE

- Jedna web aplikacija: obrazovni razgovor, strukturisan profil, kartice programa, izvori, nepoznati podaci i naredni korak.
- Srbija i EU kao okvir, sve oblasti u strukturi; stvarna pokrivenost ograničena na pregledane zapise.
- Osnovne i master gotovo ravnopravno, blag početni fokus na osnovne; zaseban PhD tok sa manjim početnim katalogom.
- Samo engleski interfejs i razgovor u početnom prototipu (D-002); očuvani izvorni nazivi programa; desktop i mobilni osnovni tok. Jezik nastave je zasebno polje, pa katalog nije ograničen samo na programe na engleskom.
- Postepena pitanja, potvrda spornih podataka, korisnička korekcija profila i razjašnjavanje budžeta.
- Ručno pregledan katalog sa odvojenim program/fact/source podacima, važenjem, statusom, datumom i proveravačem. Radni ciljevi: najmanje osam dubinskih zapisa za prvi demo (oko 4 osnovna, 3 master, 1 PhD), zatim oko 60 osnovnih/30 dubinskih za stabilni demo (oko 14/12/4 dubinska po nivou). Brojevi su ciljevi, ne već uneti podaci; kvalitet ima prednost.
- Deterministički filteri i objašnjivo rangiranje, do tri početna rezultata, dozvola za konkretno odstupanje i odvojeno označene uslovne opcije.
- Podaci o stipendijama koji su direktno relevantni za katalog, uz poznate uslove i bez obećanja dodele; nije zaseban pretraživač svih prilika.
- Jedan AI dobavljač preko zamenljivog serverskog adaptera, uz validaciju, normalizovane greške i evidenciju potrošnje. Prva razvojna stanja mogu koristiti simulirani adapter i sintetičke podatke.
- Pozivnice i zaštićene sesije bez naloga; istecanje/brisanje, kvote, ograničen ulaz/izlaz, jedan aktivan AI zahtev po sesiji i kontrola troška pre pravog pilota.
- Prikaz početnog, učitavajućeg, praznog, uspešnog, nepoznatog, konfliktnog, odbijenog i neuspešnog stanja, isteka sesije, kvote i nedostupnog API-ja. Osnovni pregled kataloga dostupan i kada AI ne radi.
- Sintetički profili za razvoj/javni demo; redigovan tekst za pozvane punoletne testere tek nakon pilot kapije.

### Uslovna obrada dokumenata

Master plan predviđa tekst, redigovan CV/pregled ocena, relevantnu sliku i kontrolisani PDF tok (str. 19-20). Ovde ga čuvamo kao uslovni deo Faze 1, iza isključene zastavice dok ne prođe sve provere. Nije preduslov da osnovni tekstualni prototip proradi.

Za uključivanje pravih fajlova potrebni su provera stvarnog formata/veličine/broja strana, odbijanje nepodržanih dokumenata, izolovana obrada, provera štetnog sadržaja, zabrana javnog originala, minimizacija, potvrda ekstrakcije, provereno brisanje i obaveštenje o dobavljačkoj obradi. Predlog 4 MB/10 PDF strana nije konačan limit dok se ne proveri konkretan hosting i tok. Ako uslovi nisu završeni, samo sintetički demo dokumenti i redigovan tekst; nedovršena funkcija mora biti vidljiva.

## OUT OF SCOPE

- Srpski i drugi jezici interfejsa/razgovora, javna registracija i korisnički nalozi, naplata/pretplate i family plan.
- Maloletnički tok i roditeljski pristup podacima studenta.
- Automatsko slanje prijava ili poruka, predviđanje procentualne šanse prijema i admissions odluke u ime institucije.
- Masovna/otvorena zajednica, masovno prikupljanje sa društvenih mreža i neproverena iskustva kao pravila ustanove.
- Autonomni agentski sistem, agentski framework, sopstveni trenirani LLM, vektorska baza i mikroservisi.
- Globalna pokrivenost, mobilna aplikacija, veliki marketinški sajt, formalna institucionalna partnerstva.
- Saved workspace, tracker, automatizovani podsetnici, CV/pismo editor, zaseban opportunity finder, admin publishing proizvod i druge funkcije Faze 2/3.
- Obrada pasoša, ličnih karata, bankovnih/medicinskih podataka, lozinki, nepotrebnih identifikatora ili podataka drugih osoba.

UAE/MBZUAI primer iz plana, str. 69, nije prećutno proširenje Srbije/EU. Čeka posebnu odluku i proveru, bez favorizovanja ili tvrdnje o partnerstvu.

## PRIMARY USER FLOW

1. Korisnik vidi da je ovo AI prototip s ograničenim katalogom i njegovim stvarnim granicama; za pravi pilot aktivira pozivnicu i potvrđuje punoletni tok.
2. Unosi obrazovni cilj. Sistem sa jednim ili dva pitanja razjašnjava potrebne podatke prema nivou studija.
3. Profil prikazuje potvrđene, nepoznate i sporne stavke. Korisnik ispravlja ili potvrđuje predloge; budžet dobija valutu, period i obuhvat.
4. Pravila filtriraju pregledani katalog po nivou, oblasti, čvrstim ograničenjima i poznatim institucionalnim uslovima; nedostatak ključnih podataka se ne pretvara u pozitivan rezultat.
5. Korisnik dobija do tri odgovarajuće opcije sa razlozima, izvorima, datumima, uslovima, troškovima, prazninama i narednim korakom. Ako nema opcija, dobija iskren razlog i moguće pitanje/proveru.
6. Alternativa van čvrstog ograničenja čeka posebnu dozvolu. Nepotvrđeno finansiranje i podobnost ostaju uslovni i posle dozvole.
7. Korisnik bira sledeći korak, prijavljuje grešku ili briše/završava sesiju. Nema automatske prijave ili slanja poruke.

## SUCCESS CRITERIA

- Osnovni tok se ponovljivo završava bez ručnog spašavanja, uz osnovni, master i zaseban PhD demonstracioni profil.
- Nema izmišljenih programa, ključnih tvrdnji bez poznatog izvora ili svesnog kršenja čvrstih ograničenja u definisanom test setu; ključne praznine su vidljive.
- Neispravan/odbijen/nepotpun AI odgovor i nedostupan API daju razumljivu degradaciju, uz moguć pregled kataloga.
- Izolacija sesija, zaštita server ključa, brisanje i finansijske kvote prolaze negativne provere pre pravog pilota.
- Planirana evaluacija iz Master plana: oko 50 slučajeva za prvi prototip i oko 100 za stabilni demo; predlog podele 60 razvojnih/40 završnih. Kritični AI slučajevi ponavljaju se najmanje tri puta. Predloženi prag za nekritične je najmanje 90%; kritični zahtevaju pun prolaz. Brojevi i metod se potvrđuju u Koraku 2/11, nisu rezultati već sprovedenih testova.
- Pilot cilj iz plana: najmanje 5 osnovnih, 5 master i 2 PhD korisnika, različite oblasti i ljudi van bliskog kruga; posmatrati samostalni zadatak, razumevanje izvora/ograničenja i sledeći korak. Nema izmišljene traction.
- Postoje ponovljiv demo, rezervni snimak, lista ograničenja i evidencija provera. Datumski cilj ne zamenjuje kvalitet.

## NON-NEGOTIABLE SAFETY REQUIREMENTS

1. Ključevi samo na serveru; validacija svih ulaza i izlaza, bez izvršavanja modelskog HTML-a/skripti ili proizvoljnog pristupa URL-ovima/alatu.
2. Dokumenti i web sadržaj su nepouzdani podaci; prompt injection ne menja instrukcije, dozvole ili profil bez potvrde.
3. Izolovane sesije, zaštićene pozivnice, ograničeno trajanje i dokaz brisanja; nepotrebni podaci i pun chat se ne loguju podrazumevano.
4. Izvori moraju pripadati dozvoljenom katalogu, a programi moraju postojati u njemu. Zvanični uslov ima prednost nad anegdotom.
5. Serverska kontrola obrazovnog domena, troška i konkurentnih zahteva; model ne odobrava sopstvenu akciju.
6. Pravi pilot čeka definisanog rukovaoca/operativnog vlasnika, mapu podataka i pristupa (uključujući mogući UAE pristup), obaveštenje, pravno/operativno pregledanu obradu i čuvanje, testiranu izolaciju i odobren budžet. Ovo su projektne kapije, ne tvrdnja o potvrđenim pravnim zaključcima.
7. Pravi dokumenti ostaju isključeni dok ne prođu zasebnu kapiju. Ne pretpostavljati da lokalno brisanje briše dobavljačku evidenciju.
8. Poznato curenje, izložen ključ, kritično kršenje ograničenja, izmišljeni ključni uslovi ili odsustvo kontrole troška zaustavljaju izdanje. Bez obećanja potpune bezbednosti.

## KNOWN LIMITATIONS

- Danas postoje dokumentacija, izvorni PDF, lokalna aplikacija, sintetički obrazovni UI i published 1.0.3 sa osam kontrolisanih programa. Profil/matching tok ostaje deterministički, produktni AI mock, a lokalne pozivnice/sesije/kvote nisu produkciona infrastruktura. Tehnički testovi i human catalog review nisu dokaz stvarne korisničke vrednosti ili individualne admissions podobnosti; završni status je u [PHASE_1_CLOSEOUT](PHASE_1_CLOSEOUT.md).
- Prethodno istraživanje iz plana nije dostupno u projektu; njegovi nalazi nisu nezavisno provereni.
- Katalog neće predstavljati sve programe Srbije/EU. Nepoznati uslovi, rokovi i troškovi su očekivana stanja.
- OpenAI modeli/cene/Responses/auth za adapter provereni 2026-10-06 u [AI_CONTRACT](ai/AI_CONTRACT.md). Ostale cene, zakoni i platforme iz PDF-a nisu ponovo potvrđeni kao aktuelni; proveriti ih kada konkretan korak zavisi od njih. Korak 3 proverava konkretne verzije tehničkog kostura; nije provera realnog AI modela/cena, cloud usluga ili prava.
- Raspored od 1. oktobra nije izvršen u ovom folderu; cilj 10. oktobra je rizičan i zahteva novu procenu kapaciteta. Nema tihog pomeranja cilja ili označavanja prošlih zadataka kao završenih.
- Uspeh na test setu ne dokazuje odsustvo svih grešaka; podrška kvalifikacijama i PhD finansiranju biće ograničena podacima.

## OPEN DECISIONS

Obim je korišćen za dokumentacioni nastavak po dostavljenom Promptu 2, D-007/O-001. Engleski, tri nivoa, ograničeni katalog i uslovni dokumenti su sačuvani; specifične pretpostavke i odobrenja pilota nisu prećutno potvrđeni. Realni kapacitet/rok i eventualno smanjenje cilja zapisa ostaju otvoreni; ne menjamo te prioritete samostalno.

Pre kasnijih koraka: konačne dubinske zemlje i prvi programi (5), konkretna arhitektura/čuvanje sesija (3/10), AI model i budžet (8), pilot i hosting (12), uključenje pravih dokumenata (posebna kapija). Potpuni spisak sa vlasnicima i rizicima: OPEN_QUESTIONS (private development record). Statusi: DECISIONS (private development record).


## Aktuelni Korak 10 — 2026-10-11

Root zahteva bounded pozivnicu, ličnu 18+/notice potvrdu, izolovan HttpOnly session i serverske token/cost kvote. Lokalni SQLite kontrolni registar je trajan, profil je RAM/30min; reset ne menja rok/brojače. [Osnova](security/SECURITY_PRIVACY_BASELINE.md), [čuvanje](security/LOGGING_RETENTION.md), [dokazi](security/VERIFICATION.md). Raniji opis `published prazan/human review PENDING` predstavlja stanje Koraka 10; D-043 sada objavljuje katalog 1.0.3. Live/upload/hosting/pilot ostaju zatvoreni. Ovo nije produkciona ili pravna potvrda.

## Aktuelni Korak 11 — 2026-10-11

D-025/D-026: nove funkcije zamrznute; 50 development golden scenarija/78 izvršavanja, 357 software i 27 browser provera, pet testing izveštaja. [QA](testing/QA_REPORT.md) potvrđuje samo ponovljiv lokalni synthetic mock tok; [known issues](testing/KNOWN_ISSUES.md) odvaja development dependency FAIL, human/model/pilot BLOCKED i basic a11y NOT RUN delove. Nema proizvodnog proširenja, live troška, publikacije kataloga ili stvarnih dokumenata. Korak 12 nije započet. Ranije zabrane Koraka 11 važe za istorijske naloge, ovaj nalog otvara samo njegov jasno ograničen QA obim.

## Aktuelni Korak 12 — 2026-10-11

Nastavak 2026-10-17, D-039: izričito odobrena samo lokalna objava jednog pregledanog Twente Psychology zapisa, verzija 1.0.1, sa stvarnim human review i dve prihvaćene unknown. [Dokaz i granice](data/TWENTE_PSYCHOLOGY_FINAL_REVIEW_2026-10-17.md). Published=0 u prethodnim izveštajima je istorijski; trenutni published ima jedan program. Minimalno usklađena postojeća published/source UI putanja razlikuje stvarne i synthetic izvore, zadržava nepoznatu individualnu cenu/podobnost i ne preliva ostalih sedam staging programa. Bez novog AI troška, stvarnih korisnika, cloud-a ili opšte Faze 2.

Nastavak 2026-10-17, D-041: Viktor zatim odobrava sve predstavljene podatke za [Twente Biomedical Engineering 1.0.2](data/TWENTE_BME_FINAL_REVIEW_2026-10-17.md) i dve visible unknown. Published 1.0.2 sada ima dva programa; oba ostavljaju individualnu cenu, kvalifikacije i finansiranje manual/unknown gde nisu dokazani. Ostalih šest staging programa, live AI autoritet, pilot, cloud i Faza 2 nisu otvoreni ovim odobrenjem.

Nastavak 2026-10-17, D-043/D-044: Viktor potvrđuje tačan kombinovani digest i svih 26 unknown; published 1.0.3 sada sadrži svih osam programa i osam human approval zapisa. [Završni katalog pregled](data/ALL_PROGRAMS_FINAL_REVIEW_2026-10-17.md). Individualni fee/qualification/funding bindings ostaju manual/unresolved, a pilot/cloud/live/document kapije ostaju zatvorene. [Phase 1 closeout](PHASE_1_CLOSEOUT.md).

D-027/D-028: lokalna alternativa bez odobrenog cloud-a, sedam synthetic profila i deset demo dokumenata, stvarni browser backup/stills/offline viewer. Uska fixture/master editor/check label stabilizacija; bez novog velikog feature-a ili pravog institutional data uslova. [Release kapija](demo/RELEASE_CHECKLIST.md) PASS samo za local mock/presentation paket; 360/28/50 golden dokazi ne znače realne studente ili stvarni model. Actual participant/notes/pilot i data/model/hosting/privacy kapije ostaju uslovne. Historical zabrane Koraka 12 pripadaju ranijim nalozima; ovaj nalog otvara samo demo/paket. Faza 2 nije otvorena.
