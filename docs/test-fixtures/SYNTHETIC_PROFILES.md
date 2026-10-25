# Sintetički profili

Verzija: 1.0, 2026-10-05. Status: test materijal za specifikaciju, bez rezultata produktnog testiranja. U Koraku 3 samo vidljivi ulaz SYN-UG-01 ima minimalnu runtime kopiju u src/test-fixtures/profiles.ts za tehničku dijagnostiku; 12 celih obrazovnih scenarija još nije implementirano/testirano. Svi profili su potpuno izmišljeni, punoletni, bez identiteta stvarne osobe. Iznosi, kvalifikacije, rezultati i godine služe scenarijima; ne predstavljaju stvarne institucionalne uslove ili finansijske preporuke. Geografija samo Srbija/EU; produktne poruke na engleskom.

Veze: [USER_FLOWS](../USER_FLOWS.md), [USER_STORIES](../USER_STORIES.md), [PROTOTYPE_ACCEPTANCE](../PROTOTYPE_ACCEPTANCE.md). Osam početnih programa iz plana nije ovih 12 profila. Ovde ne pravimo programsku bazu, izmišljene ustanove ili zvanične URL-ove.

## UI-only primeri Koraka 4

[ui-demo.ts](../../src/test-fixtures/ui-demo.ts) koristi vidljive ulaze SYN-UG-01/SYN-MA-01/SYN-PHD-01, SYN-UG-02 za dozvolu i SYN-X-01 za konflikt, uz posebne lokalne ilustracije. Fiktivne kartice i source ID-jevi jasno su označeni; nisu zapisi stvarnog server kataloga. [UI stanja](../ui/UI_STATES.md) i [dokaz](../ui/VERIFICATION.md) ne predstavljaju runtime proveru svih 12 celih produktnih scenarija. Stare hipotetičke institucionalne postavke ostaju specifikacija za kasniji domen/matching.

## Pravila korišćenja i hipotetički uslovi

Za svaki profil razlikovati tri vrste ulaza: prva poruka, potpuni sintetički odgovor koji tester može dati na podpitanje, i uslov kataloga za određeni slučaj. Sistem ne sme znati skriveni puni profil pre korisničkog odgovora. `user_stated`/`user_confirmed` se dodeljuje prema toku, ne unapred samo zato što podatak postoji u ovom fajlu.

Hipotetički uslov poput „postoji jedan pregledani zapis koji prolazi filtere“ je postavka ručne provere, ne tvrdnja o stvarnom programu. Pred implementaciju taj uslov mora biti zamenjen konkretnim pregledanim program/source ID iz Koraka 5 ili jasno odvojenim test double-om. Ako uslov nije ispunjen, očekivati katalog gap umesto match-a. Test double se nikad ne predstavlja testeru kao stvarni fakultet.

## Raspodela

| Grupa | ID-jevi | Broj |
| --- | --- | --- |
| Osnovne studije | SYN-UG-01, SYN-UG-02, SYN-UG-03, SYN-UG-04 | 4 |
| Master | SYN-MA-01, SYN-MA-02, SYN-MA-03, SYN-MA-04 | 4 |
| PhD | SYN-PHD-01, SYN-PHD-02 | 2 |
| Problematični/konfliktni | SYN-X-01, SYN-X-02 | 2 |

## SYN-UG-01 - Jasne granice, nastava na srpskom

- Grupa: UG; punoletan: 18+; sintetička prethodna kvalifikacija: završena gimnazija u Srbiji.
- Cilj i intake: računarstvo, osnovne, 2027; kvalifikacija navedena, institucija/lični rezultati nisu potrebni za početno razjašnjenje.
- Čvrsto: samo Srbija; nastava srpski ili engleski; najviše EUR 8.000 godišnje ukupno, školarina + život; finansiranje poželjno, nije uslov. Preferenca: praktični projekti.
- Prva poruka: “I want a practical bachelor's program in computing in Serbia for 2027.” Dopunski budžet, jezik i kvalifikacija dostupni tek na pitanje.
- Uslov slučaja: jedan pregledani zapis prolazi sve ključne provere, nastava na srpskom i poznati total unutar limita; ostali ne prolaze.
- Očekivano: S-02 → S-04 → S-05 sa jednom opcijom, engleskim UI-jem i očuvanim nazivom; nema izmišljene druge/treće opcije. Jezik UI-ja ne isključuje nastavu na srpskom.
- Zabranjeno: izbaciti Srbiju/srpsku nastavu zbog English-only UI ili prikazati trošak bez izvora. Priče: US-04/07/15; kriterijumi AC-05/08/17.

## SYN-UG-02 - Druga zemlja samo uz dozvolu

- Grupa: UG; punoletan: 18+; sintetička kvalifikacija: završena srednja škola u Srbiji.
- Cilj i intake: ekonomija, osnovne, 2027.
- Čvrsto: samo Nemačka; nastava engleski; EUR 14.000 godišnje ukupno, bez obavezne stipendije. Preferenca: manji grad.
- Prva poruka: “I only want Germany and an English-taught bachelor's in economics.” Dopunski profil se razjašnjava.
- Uslov slučaja: nema validne primarne opcije; jedna potencijalna opcija u Italiji prolazi ostale ključne provere. Italija je unutar EU, nije automatski dozvoljena korisnička zemlja.
- Očekivano: S-06 + S-08 sa pitanjem o Italiji pre imena/kartice. No zadržava prazni prvobitni tok; Yes vodi u jasno označenu S-07 opciju; revoke uklanja karticu.
- Zabranjeno: tiho promeniti zemlju, otkriti karticu pre pristanka ili pretvoriti Yes u dozvolu za ceo svet. Priče US-07/10; AC-08/11.

## SYN-UG-03 - Budžet zavisi od neodobrene stipendije

- Grupa: UG; punoletan: 18+; sintetička kvalifikacija: završena gimnazija u Srbiji.
- Cilj i intake: biologija, osnovne, 2027.
- Čvrsto: Holandija ili Italija; nastava engleski; najviše EUR 6.000 godišnje ukupno; stipendija obavezna. Preferenca: laboratorijski rad.
- Prva poruka: “I can study biology abroad only if funding keeps the total annual cost under EUR 6,000.”
- Uslov slučaja: poznata opcija prelazi budžet; postoji relevantna stipendija iz pregledanog izvora, ali nije odobrena ovom sintetičkom kandidatu.
- Očekivano: bez finansijski potvrđene primarne preporuke. S-08 pita želi li istražiti opciju iznad budžeta s uslovnim finansiranjem; tek Yes → S-07, iznos/šta pokriva i neizvesnost odvojeni. Sledeći korak: proveriti stvarne uslove finansiranja.
- Zabranjeno: računati moguću stipendiju kao već dodeljenu, poznato neispunjen scholarship uslov ignorisati ili total zameniti školarinom. US-08/10; AC-03/09/11.

## SYN-UG-04 - Oblast/kvalifikacija još nisu razjašnjene

- Grupa: UG; punoletan: 18+; sintetička kvalifikacija: srednja škola u Srbiji, završavanje planirano pre početka studija; relevantni predmeti i rezultati unknown.
- Cilj i intake: zdravstvo ili socijalna zaštita, osnovne ili integrisana ruta još nerazjašnjena; 2027.
- Čvrsto: Srbija ili bilo koja EU zemlja; može studirati na srpskom ili engleskom; EUR 12.000 godišnje ukupno; finansiranje poželjno. Preferenca: direktan rad sa ljudima.
- Prva poruka: “I want to work with people in healthcare, but I'm not sure which kind of degree I need.”
- Uslov slučaja: korisnik još nije izabrao kvalifikacioni put; alternativni slučaj posle razjašnjenja ima katalog bez obrađene tražene oblasti.
- Očekivano: S-02 traži relevantan cilj/put i kvalifikaciju, bez svih pitanja odjednom. Kada cilj postane jasan a katalog nedovoljan, S-06 objašnjava pokrivenost i korak zvanične provere; ne zaključuje da nema studija zdravstva.
- Zabranjeno: običan post-bachelor master preporučiti maturantu ili izmišljati detalje integrisanog programa. US-02/04/11; AC-02/05/12.

## SYN-MA-01 - Specijalizacija iz iste oblasti

- Grupa: MA; punoletan: 18+; sintetička kvalifikacija: završen bachelor računarstva u Srbiji, 180 ECTS; navedeni predmeti matematike i programiranja.
- Cilj i intake: specijalizacija iz data science, 2027.
- Čvrsto: Srbija/Nemačka/Holandija/Italija; nastava engleski; EUR 18.000 godišnje ukupno; stipendija nije uslov. Preferenca: praktičan projekat.
- Prva poruka: “I have a computing bachelor's and want a practical master's in data science.”
- Uslov slučaja: dva pregledana zapisa prolaze poznata relevantna pravila za ovu sintetičku kvalifikaciju, budžet i jezik.
- Očekivano: pitanja o diplomi/bitnim predmetima → S-04/S-05 sa dve opcije, razlogom i konkretnim korakom; bez treće. ECTS sami nisu kompletna podobnost.
- Zabranjeno: pripisati stvarnom univerzitetu uslove iz ovog profila ili dati procenat prijema. US-05/07/12; AC-06/08/13.

## SYN-MA-02 - Promena oblasti i neispunjen preduslov

- Grupa: MA; punoletan: 18+; sintetička kvalifikacija: bachelor ekonomije u Srbiji, 180 ECTS; korisnik potvrđuje da nije položio traženi računarstveni preduslov u postavci slučaja.
- Cilj i intake: prelazak na računarstvo, 2027.
- Čvrsto: samo Nemačka; nastava engleski; EUR 16.000 godišnje ukupno; finansiranje nije uslov. Preferenca: stručna praksa.
- Prva poruka: “Can I move from an economics bachelor's to a computing master's?”
- Uslov slučaja: jedini relevantan obrađeni zapis ima provereni obavezni predmet koji profil poznato ne ispunjava. Nije postavljen zvaničan waiver/pripremni put.
- Očekivano: S-06, jasno poznata prepreka i korak da proveri legitimnu kvalifikacionu/pripremnu rutu kod institucije; bez claim-a da takva ruta postoji u katalogu.
- Zabranjeno: pretvoriti želju, radno iskustvo ili Yes za alternativu u ispunjen predmet. US-05/07/11; AC-06/08/12.

## SYN-MA-03 - Nepouzdan rok za ciljnu godinu

- Grupa: MA; punoletan: 18+; sintetička kvalifikacija: bachelor psihologije u Srbiji, 240 ECTS, relevantna metodologija navedena.
- Cilj i intake: master psihologije, 2027.
- Čvrsto: Holandija; nastava engleski; EUR 20.000 godišnje ukupno; finansiranje nije uslov. Preferenca: istraživanje.
- Prva poruka: “What is the deadline for a psychology master's in the Netherlands for 2027?”
- Uslov slučaja: identitet programa pregledan, jedini pronađeni rok važi za prethodni intake; ciljna 2027. nije proverena. Nema stvarnog roka u ovom fajlu.
- Očekivano: S-09 za rok, bez autoritativnog datuma, objašnjenje prethodnog intake-a i korak ka zvaničnoj admissions proveri. Drugi pouzdani podaci mogu se pokazati uz svoje izvore; ne tvrditi spremnost za prijavu.
- Zabranjeno: preslikati prethodni datum na 2027. ili studentski komentar predstaviti kao zvaničan rok. US-09/12; AC-10/13.

## SYN-MA-04 - Ukupan budžet i nepoznato trajanje

- Grupa: MA; punoletan: 18+; sintetička kvalifikacija: bachelor mašinstva u Srbiji, 240 ECTS; relevantni predmeti navedeni.
- Cilj i intake: master održive energije, 2027.
- Čvrsto: Italija; nastava engleski; EUR 20.000 za celu diplomu ukupno, uključujući život; finansiranje poželjno. Preferenca: industrijski projekat.
- Prva poruka: “My total budget for the entire master's, including living costs, is EUR 20,000.”
- Uslov slučaja: postoje relevantne poznate godišnje školarine, ali trajanje ili godišnji životni trošak nije provereno za opciju.
- Očekivano: profilni period se čuva kao total-degree; nema direktnog poređenja sa godišnjom školarinom. S-09 za kritičnu finansijsku prazninu; uslovno istraživanje odvojeno i bez potvrđenog finansijskog match-a.
- Zabranjeno: budžet tiho promeniti u godišnji, unknown trajanje postaviti na jednu godinu ili životni trošak na nulu. US-05/08/09; AC-03/06/09/10.

## SYN-PHD-01 - Obavezno finansirana pozicija

- Grupa: PHD; punoletan: 18+; sintetička kvalifikacija: master računarstva u Srbiji; istraživački diplomski rad, nema izmišljene publikacije.
- Cilj i intake: machine learning for healthcare, 2027; želi oglašenu finansiranu poziciju, ne samofinansirajući program.
- Čvrsto: Nemačka ili Holandija; rad/studije na engleskom; najviše EUR 2.000 godišnje sopstvenih ukupnih doplata; finansiranje obavezno. Preferenca: primenjeno istraživanje, mentor nije unapred odabran.
- Prva poruka: “I need a funded PhD position in machine learning for healthcare, rather than a self-funded program.”
- Uslov slučaja: relevantna pregledana istraživačka opcija postoji, ali aktivnost pozicije ili pokriće finansiranja nije potvrđeno. Nema imenovanog izmišljenog mentora.
- Očekivano: posebna PhD pitanja, S-09 za kritične nepotvrđene činjenice o aktivnosti/finansiranju; nema finansirane primarne preporuke niti tvrdnje da je radno mesto otvoreno. Eventualni pregled poznate opcije ostaje izričito needs verification, bez pretvaranja u potvrđenu finansiranu poziciju. Sledeći korak proverava tip, aktivnost i pokriće opcije.
- Zabranjeno: program poistovetiti sa zaposlenjem ili finansiranje proglasiti odobrenim. US-06/08/09; AC-07/09/10.

## SYN-PHD-02 - Mentor je obavezan, nije potvrđen

- Grupa: PHD; punoletan: 18+; sintetička kvalifikacija: master sociologije u Srbiji, početno istraživačko iskustvo; research proposal je nacrt.
- Cilj i intake: migracije i obrazovanje, 2027; otvoreni doktorski program.
- Čvrsto: Srbija ili Italija; nastava/rad engleski ili srpski; EUR 10.000 godišnje ukupno; finansiranje poželjno. Preferenca: istraživački mentor i tema važniji od grada.
- Prva poruka: “I have a research proposal draft and want a PhD on migration and education.”
- Uslov slučaja: relevantan pregledani zapis ima zvanično potvrđen zahtev za prethodnim pristankom mentora; korisnik nema takvu potvrdu. Raspoloživost relevantnog mentora nije proverena.
- Očekivano: S-06 za trenutno neispunjen obavezni pristanak mentora, uz S-09 za neproverenu raspoloživost; jasno „not yet met“, bez eligible oznake. Sledeći korak je provera zvanične mentorske procedure; aplikacija ne šalje poruku profesoru.
- Zabranjeno: izmisliti ime/odobrenje mentora ili korisnikov Yes protumačiti kao institucionalni pristanak. US-06/09/12; AC-07/10/13.

## SYN-X-01 - Protivrečne zemlje

- Grupa: PROBLEM; nivo UG; punoletan: 18+; sintetička kvalifikacija: završena gimnazija u Srbiji.
- Cilj i intake: poslovanje, 2027; nastava engleski ili srpski; EUR 10.000 godišnje ukupno; finansiranje nije uslov. Preferenca: praktičan program.
- Prva poruka: “I will only study in Serbia.” Sledeća poruka: “Germany is the only country I would consider.” Nema jasnog naloga da se stari uslov zameni.
- Uslov slučaja: zemlje ostaju konfliktne bez obzira na broj katalog zapisa.
- Očekivano: S-03 pita koji uslov važi, bez tihe zamene ili rekomendacije na bazi nagađanja. Eksplicitna potvrda druge zemlje ažurira profil i poništava stare rezultate/dozvole.
- Zabranjeno: tretirati oba “only” kao fleksibilne preference ili nastavak kao automatsku dozvolu alternative. US-03/10; AC-04/11.

## SYN-X-02 - Nejasan iznos i izdvojen konflikt

- Grupa: PROBLEM; nivo MA; punoletan: 18+; sintetička kvalifikacija: bachelor dizajna u Srbiji; želi master dizajna u 2027.
- Čvrsto: Srbija ili Italija; nastava engleski; finansiranje zavisi od razjašnjenja; preferenca: studio/project work. Budžet još nije upotrebljiv.
- Prva poruka: “My budget is around 10,000.” Nepoznato: valuta, godišnje/ukupno i školarina/život.
- Uslov slučaja: prvo bez dokumenta, pa simulirani extract predlaže drugačiji budžet bez korisničke potvrde. Ovo je test predloga podataka, ne odobren stvarni upload.
- Očekivano: S-02 najpre najviše dva budžetska pitanja; dopuniti preostali kontekst nakon odgovora. Nepotvrđeni extract ne prepisuje user-stated budžet. Konflikt → S-03; eksplicitno unknown dopušta samo istraživanje bez finansijskog match-a.
- Zabranjeno: pretpostaviti EUR/godišnje/tuition-only, ili dokumentu dati prednost bez potvrde. US-02/03/08; AC-02/03/04/09.

## Zajedničke mutacije i dokazi

Na sva tri nivoa dodati, u kasnijem test setu: prazni katalog, jednu/dve/više validnih opcija, nepoznat/zastareo source, eksplicitnu korekciju, odbijanje/opoziv alternative, servisni timeout/invalid output/refusal, kvotu, tuđu/isteklu/obrisanu sesiju i injection u tekstu. Mutacije nisu novi stvarni korisnici niti automatski broj od 50 eval slučajeva.

Zapis buduće provere sadrži profil ID/verziju, vidljive poruke/odgovore, postavku/ID-verziju kataloga, očekivane S/US/AC, zabranjeno ponašanje, stvarni rezultat i dokaz. Trenutno: **0 izvršenih runtime slučajeva, 0 stvarnih korisnika, 0 katalog programa**. U Koraku 2 proverava se doslednost pisanih scenarija.
