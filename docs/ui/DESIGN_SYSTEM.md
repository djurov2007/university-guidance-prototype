# Dizajn sistem statičkog prototipa

Datum: 2026-10-05. Obim: Korak 4, UI plan (private development record). Produktni tekst je na engleskom. `studyguide.` je radna oznaka interfejsa, bez odluke o konačnom brendu. Implementacija: [study.css](../../src/app/study.css), [UI komponente](../../src/components/ui/) i [study komponente](../../src/components/study/).

## Vizuelni pravac

Mirna papirna pozadina, bela površina, tamnozelene akcije i serifni naslovi za početak/kartice. Kratak početni panel vodi u razgovor; nema dugog landing page-a, lažnih statistika ili spoljnog fonta/slike. Lokalni SVG simboli su dekorativni uz vidljiv tekst. Jedina animacija je loading indikator; `prefers-reduced-motion` isključuje animaciju.

## Osnovni tokeni

| Uloga                                 | Vrednost                                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Pozadina / površina                   | `#f7f8f5` / `#ffffff`                                                                              |
| Glavni tekst / sekundarni tekst       | `#243830` / `#59665f`                                                                              |
| Brand / blaga brand površina          | `#214d40` / `#edf3ef`                                                                              |
| Dekorativna linija / granica kontrole | `#dde3dc` / `#7e8b83`                                                                              |
| Fokus                                 | `#166a55`, 3 px solid outline, offset 3 px                                                         |
| Success / warning / error / unknown   | `#245f43` / `#795114` / `#9a332c` / `#58636e`                                                      |
| Radius                                | Panel/kartica 18 px, manje kontrole 8–10 px                                                        |
| Senka                                 | `0 3px 16px rgb(35 52 39 / 3%)`; izraženija samo za scenario picker                                |
| Razmaci                               | 4/8 px za male grupe, 12/16 px za kontrole, 20/24 px za panele; 21 px desktop razmak kolona        |
| Tipografija                           | Arial/Helvetica za poruke/kontrole; Georgia za uvod i naslove kartica                              |
| Veličine                              | Glavna poruka 13 px, kartica 21 px, desktop uvod 45 px; pomoćni tekst 10–12 px uz veći line-height |

Desktop prikazuje profil, razgovor i opcije u tri kolone. Ispod 940 px prikazuje se jedan panel sa dugmadima Conversation / Study brief / Options; izbor koristi native button i `aria-pressed`. Na 480/350 px prilagođavaju se padding i tipografija. Testirane širine: 1280, 390 i 320 px. Paneli i tekst mogu da rastu; nema fiksnog odsecanja poruka ili kartica.

## Komponente i semantika

| Komponenta    | Pravila                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Button        | Primary/secondary/ghost; native type=button podrazumevano; disabled je stvarno onemogućen; postojeći Radix Slot samo za kompoziciju.          |
| Input         | Vidljiv label sa id/for, hint i error povezani preko aria-describedby, aria-invalid za grešku. Neispravan iznos fokusira problematično polje. |
| Notice        | Tekstualni naslov i simbol uz boju; info/success/warning/error/unknown. Dinamičke poruke koriste status/alert prema značenju.                 |
| ProfilePanel  | `dl/dt/dd`, eksplicitni You stated / Please confirm / Confirmed / Unknown / Conflict statusi. Potvrda nije dokaz institucionalne podobnosti.  |
| ProgramCard   | Naslov, broj, Fictional institution, razlog, trošak, nepoznato, izvori i sledeći korak. Do tri kartice; bez procenta prijema.                 |
| SourceDetails | Native details/summary, Fictional source, reference ID, simulirani datum i odsustvo stvarnog URL-a.                                           |
| Razgovor      | Semantička lista poruka; korisnički tekst se prikazuje kao tekst, bez HTML izvršavanja. Composer ima label, limit i pristupačnu grešku.       |

Skip link je prvi fokusabilni element i vidljiv pri fokusu. `main` prima fokus nakon aktivacije; sve akcije rade tastaturom. Save/Cancel vraća fokus na Edit brief. Statusi se ne razlikuju samo bojom. Sakriveni mobilni panel nije fokusabilan. Semantika nije zamena za kompletan screen-reader pregled.

## Kontrast i granica provere

Izračunat relativni sRGB luminance kontrast stvarnih CSS parova: body/page 11.70:1; muted/white 6.02:1; muted/page 5.64:1; white/primary 9.54:1; info 8.48:1; success 6.81:1; warning 6.48:1; error 6.57:1; unknown 5.51:1; focus/white 6.51:1; input-border/white 3.55:1. Proverene tekstualne kombinacije prelaze 4.5:1, a navedene kontrole/fokus 3:1. Dekorativne linije nisu granice interaktivnih kontrola.

WCAG 2.2 AA je cilj; primenjeni kriterijumi uključuju kontrast, tastaturu, fokus, oznake i identifikaciju greške iz [zvaničnog W3C vodiča](https://www.w3.org/WAI/WCAG22/quickref/). Ovaj obračun i osnovne browser provere nisu puna revizija pristupačnosti. Nisu provereni svi screen reader-i, OS/browser kombinacije, tekst na 200% i sve kombinacije zoom-a; nema tvrdnje o sertifikatu/usaglašenosti celog proizvoda.
