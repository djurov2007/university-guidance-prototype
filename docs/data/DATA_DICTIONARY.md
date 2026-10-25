# Rečnik podataka

Verzija 1, 2026-10-06. Normativni izvršivi ugovor: [schema.ts](../../src/features/catalog/schema.ts). ID je stabilan slug, ne URL niti browser redni broj. Nepoznato nije prazna string vrednost, nula, lažni datum ili odsustvo obaveznog fact-a.

| Entitet / polje                       | Tip i značenje                                                      | Pravilo                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| snapshot.schemaVersion / version      | 1 / semver                                                          | Promena ugovora odvojena od promene sadržaja.                                                              |
| snapshot.channel / preparedOn         | staging/published; ISO datum                                        | Kanali su odvojeni; datum pripreme nije budući.                                                            |
| institution                           | id, name, country, officialHosts                                    | RS/DE/NL/IT su trenutni ograničeni katalog; proširenje nije automatsko.                                    |
| program.institutionId                 | FK                                                                  | Institucija mora postojati i zemlja se poklapati.                                                          |
| program.name / level / country / city | text; undergraduate/master/phd; country code; campus                | Moraju imati matching identity facts i dokaze. Integrisani/profesionalni master nije običan master.        |
| program.field / subfield              | tekst                                                               | `classificationBasis=editorial`; taksonomija, ne tvrdnja ustanove.                                         |
| program.verification                  | partial/fully_verified                                              | Fully_verified se ponovo računa kroz sve assertions i dokaze.                                              |
| program.notes                         | tekst                                                               | Urednička granica/poznata praznina, ne potkrepljena pozitivna tvrdnja.                                     |
| intake                                | id, programId, academicYear, label, scope                           | Godina YYYY/YYYY, uzastopne godine; general_policy može imati null.                                        |
| source                                | URL, publisher, institutionId, programIds, intakeIds                | HTTPS bez credentials; reviewed host i scoped veze.                                                        |
| source.authority / authorityReason    | official/unofficial; razlog                                         | Domena nije samostalni dokaz; identitet publisher-a i ovlašćenje se ručno proveravaju.                     |
| source.status                         | pet statusa ispod                                                   | Verified source znači provereno poreklo/scope, ne sva moguća polja.                                        |
| accessedOn / checkedOn                | ISO YYYY-MM-DD                                                      | Stvarni Gregorian datum; check nije pre pristupa, niti u budućnosti.                                       |
| fact.programId / intakeId             | FK / nullable FK                                                    | Opšta struktura može biti programme-wide; godina/novac/rok/funding zahtevaju intake/policy context.        |
| fact.predicate / qualifier            | enum / tekst                                                        | Predicate grupa, qualifier razlikuje tvrdnje iste grupe.                                                   |
| fact.candidateCategory                | eksplicitni tekst uslova                                            | Non-EU, statutory eligibility, first-year self-funded itd. Još nije izvršivi candidate filter iz Koraka 7. |
| fact.nature                           | institutional/estimate/experience                                   | Zvanični uslov, procena ili iskustvo. Official izvor može sadržati procenu, i tada nature ostaje estimate. |
| fact.value / unknownReason            | typed value ili null / razlog                                       | Unknown mora imati null i konkretan razlog. Known ima sačuvanu vrednost i supports evidence.               |
| fact.status / checkedBy               | pet statusa / agent-human                                           | Agent verified nije human approval.                                                                        |
| evidence                              | factId, sourceId, relation, locator, paraphrase, checkedOn          | Many-to-many; supports/contradicts/context; scoped i datirana veza.                                        |
| review                                | programId, reviewer/kind, decision, date, digest, checklistComplete | Approval samo za tačan sadržaj; agent ne zadovoljava publication gate.                                     |
| review.acceptedUnknownFactIds         | ID niz                                                              | Mora navoditi unknown facts tog programa; acceptance ne popunjava vrednosti.                               |

## Polja koja svaki program pokriva

`institution_name`, `name`, `level`, `country`, `city`, `language`, `duration`, `academic_year`, `intake_start`, `tuition`, `other_cost`, `application_requirement`, `application_deadline`, `scholarship`, `institutional_requirement`. `credits` je opcioni fact. Svaka grupa je poznata uz evidence ili eksplicitno unknown. Više grupa može biti unknown i program ostaje partial; `fully_verified` bez svih potvrda se odbija.

| Value kind | Polja / units                         | Napomena                                                                                                   |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| text       | text                                  | Jedna assertion; npr. jedan uslov prijave.                                                                 |
| list       | items                                 | Jezici, uz očuvane kvalifikatore poput Usually English.                                                    |
| duration   | amount, years/semesters               | Pozitivno; nije automatska pretpostavka cene celih studija.                                                |
| number     | amount, unit                          | Nenegativno; credits npr. ECTS.                                                                            |
| money      | amount, currency, period, basis, note | EUR/RSD/USD/GBP/CHF; year/semester/month/one_time; tuition/fee/estimate/scholarship_gross/scholarship_net. |
| date       | date, nullable time/timezone, note    | Rok bez potvrđenog vremena ili zone ostaje s null komponentom; ne tvrditi precizni instant.                |

Currency lista je svesno mala ISO lista za ovaj prototip. Dodavanje validne nove valute zahteva usklađenu šemu/test/dokumentaciju. Novac nikada nema implicitnu valutu/period. `tuition` ne prima fee ili living estimate; stipendija eksplicitno gross/net. Maksimalni varijabilni doprinos Bolonje nije kandidatov stvarni račun; 157.04 EUR fixed charge je zaseban fact. Passau housing niža granica 300 EUR ima eksplicitnu 300–550 range napomenu i `estimate`; ukupni cost ostaje unknown. To nije total-budget dokaz.

| Status      | Značenje                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------- |
| verified    | Assertion i scoped evidence provereni; zavisi od svežine, nije potvrda prijema ili ljudske objave. |
| unverified  | Sačuvana sourced tvrdnja koja traži dodatnu proveru (`needs_verification` iz prompta).             |
| unknown     | Vrednost nije potvrđena; null plus razlog.                                                         |
| conflicting | Dve različite sourced tvrdnje u istom kontekstu, obe sačuvane; ne izabrati povoljniju.             |
| stale       | Provera prestara ili izvor označen stale; originalna vrednost se ne prepisuje.                     |

Ugovor je strict: nepoznata polja se odbijaju. Sintetički profili i UI-only opcije nisu deo stvarnog kataloga.
