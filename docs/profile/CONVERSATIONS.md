# Izvršivi sintetički razgovori — Korak 6

Datum referentne godine: 2026. Svi primeri su izmišljeni i označeni 18+; nema stvarnih ljudi, programa ili dokumenata. Izvor: [fixtures](../../src/test-fixtures/profile-conversations.ts); reprodukcija: `npm run profile:report` ili pun JSON/history `npm run profile:demo -- PROFILE-ID`. [Model](PROFILE_MODEL.md), [pitanja](GOLDEN_QUESTIONS.md), [verifikacija](VERIFICATION.md).

Poruke ispod služe pregledu scenarija. Njihova eksplicitna structured commands lista je deterministički ulaz, ne rezultat NLP-a. Izveštaj za svaki turn prikazuje te stvarno primenjene vrednosti; nijedna prikazana pitanje/reakcija nije generisana modelom. Spremnost ne znači izračunate opcije ili ispunjene uslove ustanove.

## PROFILE-UG — Bachelor's profile

Očekivano: **ready_limited**. Izvršeno: **ready_limited**.

### Turn 0

Start: no profile values are assumed.

Pitanja:

- **ask-studyLevel**: Which level are you looking for: a bachelor's, master's or PhD? Reason: This answer is needed for a useful limited search.
- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: studyLevel, fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 1

I am an adult seeking a computer science bachelor's for software engineering work in Germany or the Netherlands, starting in 2027.

Primenjeni strukturisani ulazi:

| Događaj            | Polje              | Vrednost / izabrani predlog             | Poreklo                      |
| ------------------ | ------------------ | --------------------------------------- | ---------------------------- |
| user_answer/assert | studyLevel         | "undergraduate"                         | Direct synthetic user answer |
| user_answer/assert | fieldOfStudy       | "Computer science"                      | Direct synthetic user answer |
| user_answer/assert | studyGoal          | "Prepare for software engineering work" | Direct synthetic user answer |
| user_answer/assert | preferredCountries | ["DE","NL"]                             | Direct synthetic user answer |
| user_answer/assert | startYear          | 2027                                    | Direct synthetic user answer |

Pitanja:

- **ask-teachingLanguages**: Which teaching languages can you study in? The interface language does not decide this. Reason: This answer is needed for a useful limited search.
- **ask-budgetAmount**: What budget amount can you afford? We will clarify its currency, period and living-cost coverage separately. Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: interests, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 2

I am an adult. Here are my structured answers: a computer science bachelor's, software engineering goal, Germany or the Netherlands only, English teaching only, EUR 10,000 per year including living costs as a firm maximum, a scholarship preferred, 2027 start, completed Serbian general secondary education in 2026. No additional hard requirements.

Primenjeni strukturisani ulazi:

| Događaj            | Polje                 | Vrednost / izabrani predlog                                                                                                                                | Poreklo                      |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| user_answer/assert | teachingLanguages     | ["english"]                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | budgetAmount          | 10000                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetCurrency        | "EUR"                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetPeriod          | "year"                                                                                                                                                     | Direct synthetic user answer |
| user_answer/assert | budgetIncludesLiving  | true                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | scholarshipNeed       | "preferred"                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | previousQualification | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | Direct synthetic user answer |
| user_answer/assert | hardConstraints       | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | Direct synthetic user answer |

Pitanja:

Nema dodatnih pitanja.

Status: **ready_limited**. Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed.

Potrebne dopune: nema. Nepoznato/nepotvrđeno: interests, excludedCountries, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Završno stanje polja

| Polje                  | Status      | Vrednost                                                                                                                                                   | Pending predlozi |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| studyLevel             | user_stated | "undergraduate"                                                                                                                                            | 0                |
| fieldOfStudy           | user_stated | "Computer science"                                                                                                                                         | 0                |
| interests              | missing     | null                                                                                                                                                       | 0                |
| studyGoal              | user_stated | "Prepare for software engineering work"                                                                                                                    | 0                |
| preferredCountries     | user_stated | ["DE","NL"]                                                                                                                                                | 0                |
| excludedCountries      | missing     | null                                                                                                                                                       | 0                |
| teachingLanguages      | user_stated | ["english"]                                                                                                                                                | 0                |
| budgetAmount           | user_stated | 10000                                                                                                                                                      | 0                |
| budgetCurrency         | user_stated | "EUR"                                                                                                                                                      | 0                |
| budgetPeriod           | user_stated | "year"                                                                                                                                                     | 0                |
| budgetIncludesLiving   | user_stated | true                                                                                                                                                       | 0                |
| scholarshipNeed        | user_stated | "preferred"                                                                                                                                                | 0                |
| startYear              | user_stated | 2027                                                                                                                                                       | 0                |
| previousQualification  | user_stated | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | 0                |
| relevantSubjects       | missing     | null                                                                                                                                                       | 0                |
| languageResults        | missing     | null                                                                                                                                                       | 0                |
| professionalExperience | missing     | null                                                                                                                                                       | 0                |
| researchExperience     | missing     | null                                                                                                                                                       | 0                |
| orientation            | missing     | null                                                                                                                                                       | 0                |
| masterIntent           | missing     | null                                                                                                                                                       | 0                |
| phdTopic               | missing     | null                                                                                                                                                       | 0                |
| phdFunding             | missing     | null                                                                                                                                                       | 0                |
| phdPositionType        | missing     | null                                                                                                                                                       | 0                |
| phdFocus               | missing     | null                                                                                                                                                       | 0                |
| researchProposal       | missing     | null                                                                                                                                                       | 0                |
| hardConstraints        | user_stated | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | 0                |
| flexiblePreferences    | missing     | null                                                                                                                                                       | 0                |

Prikazano 4 pitanja; 15 history stavki, profil revision 15. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.

## PROFILE-MASTER-CHANGE — Master's field change

Očekivano: **ready_limited**. Izvršeno: **ready_limited**.

### Turn 0

Start: no profile values are assumed.

Pitanja:

- **ask-studyLevel**: Which level are you looking for: a bachelor's, master's or PhD? Reason: This answer is needed for a useful limited search.
- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: studyLevel, fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 1

I am an adult switching from economics to data science for a master's. These structured answers include the same stated budget, countries, language and start year as the synthetic bachelor's example, and my completed economics bachelor's: 180 self-reported ECTS in Serbia in 2025.

Primenjeni strukturisani ulazi:

| Događaj            | Polje                 | Vrednost / izabrani predlog                                                                                                                                                                    | Poreklo                      |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| user_answer/assert | studyLevel            | "master"                                                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | fieldOfStudy          | "Data science"                                                                                                                                                                                 | Direct synthetic user answer |
| user_answer/assert | studyGoal             | "Change from economics to data science"                                                                                                                                                        | Direct synthetic user answer |
| user_answer/assert | preferredCountries    | ["DE","NL"]                                                                                                                                                                                    | Direct synthetic user answer |
| user_answer/assert | teachingLanguages     | ["english"]                                                                                                                                                                                    | Direct synthetic user answer |
| user_answer/assert | budgetAmount          | 10000                                                                                                                                                                                          | Direct synthetic user answer |
| user_answer/assert | budgetCurrency        | "EUR"                                                                                                                                                                                          | Direct synthetic user answer |
| user_answer/assert | budgetPeriod          | "year"                                                                                                                                                                                         | Direct synthetic user answer |
| user_answer/assert | budgetIncludesLiving  | true                                                                                                                                                                                           | Direct synthetic user answer |
| user_answer/assert | scholarshipNeed       | "preferred"                                                                                                                                                                                    | Direct synthetic user answer |
| user_answer/assert | startYear             | 2027                                                                                                                                                                                           | Direct synthetic user answer |
| user_answer/assert | previousQualification | {"kind":"bachelor","field":"Economics","institution":null,"country":"RS","completion":"completed","completionYear":2025,"credits":{"amount":180,"system":"ECTS","label":"Self-reported ECTS"}} | Direct synthetic user answer |
| user_answer/assert | hardConstraints       | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                                                    | Direct synthetic user answer |
| user_answer/assert | masterIntent          | "change_field"                                                                                                                                                                                 | Direct synthetic user answer |

Pitanja:

- **ask-relevantSubjects**: Which relevant subjects have you studied before changing field? Include results or credits only if known; you can explicitly report none. Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: relevantSubjects. Nepoznato/nepotvrđeno: interests, excludedCountries, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution.

### Turn 2

I studied statistics and linear algebra; credits and results are not available here.

Primenjeni strukturisani ulazi:

| Događaj            | Polje            | Vrednost / izabrani predlog                                                                                 | Poreklo                      |
| ------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------- |
| user_answer/assert | relevantSubjects | [{"name":"Statistics","result":null,"credits":null},{"name":"Linear algebra","result":null,"credits":null}] | Direct synthetic user answer |

Pitanja:

Nema dodatnih pitanja.

Status: **ready_limited**. Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed.

Potrebne dopune: nema. Nepoznato/nepotvrđeno: interests, excludedCountries, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, relevantSubjects[0].result, relevantSubjects[0].credits, relevantSubjects[1].result, relevantSubjects[1].credits.

### Završno stanje polja

| Polje                  | Status      | Vrednost                                                                                                                                                                                       | Pending predlozi |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| studyLevel             | user_stated | "master"                                                                                                                                                                                       | 0                |
| fieldOfStudy           | user_stated | "Data science"                                                                                                                                                                                 | 0                |
| interests              | missing     | null                                                                                                                                                                                           | 0                |
| studyGoal              | user_stated | "Change from economics to data science"                                                                                                                                                        | 0                |
| preferredCountries     | user_stated | ["DE","NL"]                                                                                                                                                                                    | 0                |
| excludedCountries      | missing     | null                                                                                                                                                                                           | 0                |
| teachingLanguages      | user_stated | ["english"]                                                                                                                                                                                    | 0                |
| budgetAmount           | user_stated | 10000                                                                                                                                                                                          | 0                |
| budgetCurrency         | user_stated | "EUR"                                                                                                                                                                                          | 0                |
| budgetPeriod           | user_stated | "year"                                                                                                                                                                                         | 0                |
| budgetIncludesLiving   | user_stated | true                                                                                                                                                                                           | 0                |
| scholarshipNeed        | user_stated | "preferred"                                                                                                                                                                                    | 0                |
| startYear              | user_stated | 2027                                                                                                                                                                                           | 0                |
| previousQualification  | user_stated | {"kind":"bachelor","field":"Economics","institution":null,"country":"RS","completion":"completed","completionYear":2025,"credits":{"amount":180,"system":"ECTS","label":"Self-reported ECTS"}} | 0                |
| relevantSubjects       | user_stated | [{"name":"Statistics","result":null,"credits":null},{"name":"Linear algebra","result":null,"credits":null}]                                                                                    | 0                |
| languageResults        | missing     | null                                                                                                                                                                                           | 0                |
| professionalExperience | missing     | null                                                                                                                                                                                           | 0                |
| researchExperience     | missing     | null                                                                                                                                                                                           | 0                |
| orientation            | missing     | null                                                                                                                                                                                           | 0                |
| masterIntent           | user_stated | "change_field"                                                                                                                                                                                 | 0                |
| phdTopic               | missing     | null                                                                                                                                                                                           | 0                |
| phdFunding             | missing     | null                                                                                                                                                                                           | 0                |
| phdPositionType        | missing     | null                                                                                                                                                                                           | 0                |
| phdFocus               | missing     | null                                                                                                                                                                                           | 0                |
| researchProposal       | missing     | null                                                                                                                                                                                           | 0                |
| hardConstraints        | user_stated | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                                                    | 0                |
| flexiblePreferences    | missing     | null                                                                                                                                                                                           | 0                |

Prikazano 3 pitanja; 17 history stavki, profil revision 17. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.

## PROFILE-PHD-FUNDED — Funded PhD position

Očekivano: **ready_limited**. Izvršeno: **ready_limited**.

### Turn 0

Start: no profile values are assumed.

Pitanja:

- **ask-studyLevel**: Which level are you looking for: a bachelor's, master's or PhD? Reason: This answer is needed for a useful limited search.
- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: studyLevel, fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 1

I am an adult. My structured answers seek machine learning research, full funding and an employed PhD position; a scholarship is required. My topic is robustness of learning systems and I have a synthetic master's research project. My completed master's in computer science is from Serbia in 2026. Other budget, teaching-language, country and start-year requirements are explicitly the same as this fixture's baseline.

Primenjeni strukturisani ulazi:

| Događaj            | Polje                 | Vrednost / izabrani predlog                                                                                                                  | Poreklo                      |
| ------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| user_answer/assert | studyLevel            | "phd"                                                                                                                                        | Direct synthetic user answer |
| user_answer/assert | fieldOfStudy          | "Machine learning"                                                                                                                           | Direct synthetic user answer |
| user_answer/assert | studyGoal             | "Research reliable learning systems"                                                                                                         | Direct synthetic user answer |
| user_answer/assert | preferredCountries    | ["DE","NL"]                                                                                                                                  | Direct synthetic user answer |
| user_answer/assert | teachingLanguages     | ["english"]                                                                                                                                  | Direct synthetic user answer |
| user_answer/assert | budgetAmount          | 10000                                                                                                                                        | Direct synthetic user answer |
| user_answer/assert | budgetCurrency        | "EUR"                                                                                                                                        | Direct synthetic user answer |
| user_answer/assert | budgetPeriod          | "year"                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | budgetIncludesLiving  | true                                                                                                                                         | Direct synthetic user answer |
| user_answer/assert | scholarshipNeed       | "required"                                                                                                                                   | Direct synthetic user answer |
| user_answer/assert | startYear             | 2027                                                                                                                                         | Direct synthetic user answer |
| user_answer/assert | previousQualification | {"kind":"master","field":"Computer science","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | Direct synthetic user answer |
| user_answer/assert | hardConstraints       | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                  | Direct synthetic user answer |
| user_answer/assert | phdTopic              | "Robustness of learning systems"                                                                                                             | Direct synthetic user answer |
| user_answer/assert | phdFunding            | "fully_funded"                                                                                                                               | Direct synthetic user answer |
| user_answer/assert | phdPositionType       | "employed_position"                                                                                                                          | Direct synthetic user answer |
| user_answer/assert | researchExperience    | ["Synthetic master's research project"]                                                                                                      | Direct synthetic user answer |

Pitanja:

Nema dodatnih pitanja.

Status: **ready_limited**. Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed.

Potrebne dopune: nema. Nepoznato/nepotvrđeno: interests, excludedCountries, relevantSubjects, languageResults, professionalExperience, orientation, phdFocus, researchProposal, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Završno stanje polja

| Polje                  | Status      | Vrednost                                                                                                                                     | Pending predlozi |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| studyLevel             | user_stated | "phd"                                                                                                                                        | 0                |
| fieldOfStudy           | user_stated | "Machine learning"                                                                                                                           | 0                |
| interests              | missing     | null                                                                                                                                         | 0                |
| studyGoal              | user_stated | "Research reliable learning systems"                                                                                                         | 0                |
| preferredCountries     | user_stated | ["DE","NL"]                                                                                                                                  | 0                |
| excludedCountries      | missing     | null                                                                                                                                         | 0                |
| teachingLanguages      | user_stated | ["english"]                                                                                                                                  | 0                |
| budgetAmount           | user_stated | 10000                                                                                                                                        | 0                |
| budgetCurrency         | user_stated | "EUR"                                                                                                                                        | 0                |
| budgetPeriod           | user_stated | "year"                                                                                                                                       | 0                |
| budgetIncludesLiving   | user_stated | true                                                                                                                                         | 0                |
| scholarshipNeed        | user_stated | "required"                                                                                                                                   | 0                |
| startYear              | user_stated | 2027                                                                                                                                         | 0                |
| previousQualification  | user_stated | {"kind":"master","field":"Computer science","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | 0                |
| relevantSubjects       | missing     | null                                                                                                                                         | 0                |
| languageResults        | missing     | null                                                                                                                                         | 0                |
| professionalExperience | missing     | null                                                                                                                                         | 0                |
| researchExperience     | user_stated | ["Synthetic master's research project"]                                                                                                      | 0                |
| orientation            | missing     | null                                                                                                                                         | 0                |
| masterIntent           | missing     | null                                                                                                                                         | 0                |
| phdTopic               | user_stated | "Robustness of learning systems"                                                                                                             | 0                |
| phdFunding             | user_stated | "fully_funded"                                                                                                                               | 0                |
| phdPositionType        | user_stated | "employed_position"                                                                                                                          | 0                |
| phdFocus               | missing     | null                                                                                                                                         | 0                |
| researchProposal       | missing     | null                                                                                                                                         | 0                |
| hardConstraints        | user_stated | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                  | 0                |
| flexiblePreferences    | missing     | null                                                                                                                                         | 0                |

Prikazano 2 pitanja; 18 history stavki, profil revision 18. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.

## PROFILE-BUDGET — Ambiguous 10.000 budget

Očekivano: **ready_limited**. Izvršeno: **ready_limited**.

### Turn 0

Start: no profile values are assumed.

Pitanja:

- **ask-studyLevel**: Which level are you looking for: a bachelor's, master's or PhD? Reason: This answer is needed for a useful limited search.
- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: studyLevel, fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 1

I give the baseline structured answers, except that my budget is just '10.000'. I have not specified its currency, period or whether it includes living costs.

Primenjeni strukturisani ulazi:

| Događaj            | Polje                 | Vrednost / izabrani predlog                                                                                                                                | Poreklo                                                           |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| user_answer/assert | studyLevel            | "undergraduate"                                                                                                                                            | Direct synthetic user answer                                      |
| user_answer/assert | fieldOfStudy          | "Computer science"                                                                                                                                         | Direct synthetic user answer                                      |
| user_answer/assert | studyGoal             | "Prepare for software engineering work"                                                                                                                    | Direct synthetic user answer                                      |
| user_answer/assert | preferredCountries    | ["DE","NL"]                                                                                                                                                | Direct synthetic user answer                                      |
| user_answer/assert | teachingLanguages     | ["english"]                                                                                                                                                | Direct synthetic user answer                                      |
| user_answer/assert | scholarshipNeed       | "preferred"                                                                                                                                                | Direct synthetic user answer                                      |
| user_answer/assert | startYear             | 2027                                                                                                                                                       | Direct synthetic user answer                                      |
| user_answer/assert | previousQualification | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | Direct synthetic user answer                                      |
| user_answer/assert | hardConstraints       | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | Direct synthetic user answer                                      |
| propose            | budgetAmount          | 10000                                                                                                                                                      | Synthetic typed interpretation of '10.000'; no NLP parser was run |

Pitanja:

- **confirm-budgetAmount**: Review the proposed value for budgetAmount. Confirm a specific proposal, reject it or give your own correction. Reason: Review this extracted value before using it.
  Predlozi za pregled: `[{"id":"PROFILE-BUDGET-10","value":10000,"sourceRef":"Synthetic typed interpretation of '10.000'; no NLP parser was run"}]`.
- **ask-budgetCurrency**: What currency is that budget in: EUR, RSD, USD, GBP or CHF? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving. Nepoznato/nepotvrđeno: interests, excludedCountries, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Turn 2

Yes, by '10.000' I mean the amount 10000. Confirm that proposal.

Primenjeni strukturisani ulazi:

| Događaj | Polje        | Vrednost / izabrani predlog | Poreklo                      |
| ------- | ------------ | --------------------------- | ---------------------------- |
| confirm | budgetAmount | "PROFILE-BUDGET-10"         | Direct synthetic user answer |

Pitanja:

- **ask-budgetCurrency**: What currency is that budget in: EUR, RSD, USD, GBP or CHF? Reason: This answer is needed for a useful limited search.
- **ask-budgetPeriod**: Is that amount per month, per year or for the whole degree? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: budgetCurrency, budgetPeriod, budgetIncludesLiving. Nepoznato/nepotvrđeno: interests, excludedCountries, budgetCurrency, budgetPeriod, budgetIncludesLiving, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Turn 3

EUR, per year, including living costs.

Primenjeni strukturisani ulazi:

| Događaj            | Polje                | Vrednost / izabrani predlog | Poreklo                      |
| ------------------ | -------------------- | --------------------------- | ---------------------------- |
| user_answer/assert | budgetCurrency       | "EUR"                       | Direct synthetic user answer |
| user_answer/assert | budgetPeriod         | "year"                      | Direct synthetic user answer |
| user_answer/assert | budgetIncludesLiving | true                        | Direct synthetic user answer |

Pitanja:

Nema dodatnih pitanja.

Status: **ready_limited**. Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed.

Potrebne dopune: nema. Nepoznato/nepotvrđeno: interests, excludedCountries, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Završno stanje polja

| Polje                  | Status      | Vrednost                                                                                                                                                   | Pending predlozi |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| studyLevel             | user_stated | "undergraduate"                                                                                                                                            | 0                |
| fieldOfStudy           | user_stated | "Computer science"                                                                                                                                         | 0                |
| interests              | missing     | null                                                                                                                                                       | 0                |
| studyGoal              | user_stated | "Prepare for software engineering work"                                                                                                                    | 0                |
| preferredCountries     | user_stated | ["DE","NL"]                                                                                                                                                | 0                |
| excludedCountries      | missing     | null                                                                                                                                                       | 0                |
| teachingLanguages      | user_stated | ["english"]                                                                                                                                                | 0                |
| budgetAmount           | confirmed   | 10000                                                                                                                                                      | 0                |
| budgetCurrency         | user_stated | "EUR"                                                                                                                                                      | 0                |
| budgetPeriod           | user_stated | "year"                                                                                                                                                     | 0                |
| budgetIncludesLiving   | user_stated | true                                                                                                                                                       | 0                |
| scholarshipNeed        | user_stated | "preferred"                                                                                                                                                | 0                |
| startYear              | user_stated | 2027                                                                                                                                                       | 0                |
| previousQualification  | user_stated | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | 0                |
| relevantSubjects       | missing     | null                                                                                                                                                       | 0                |
| languageResults        | missing     | null                                                                                                                                                       | 0                |
| professionalExperience | missing     | null                                                                                                                                                       | 0                |
| researchExperience     | missing     | null                                                                                                                                                       | 0                |
| orientation            | missing     | null                                                                                                                                                       | 0                |
| masterIntent           | missing     | null                                                                                                                                                       | 0                |
| phdTopic               | missing     | null                                                                                                                                                       | 0                |
| phdFunding             | missing     | null                                                                                                                                                       | 0                |
| phdPositionType        | missing     | null                                                                                                                                                       | 0                |
| phdFocus               | missing     | null                                                                                                                                                       | 0                |
| researchProposal       | missing     | null                                                                                                                                                       | 0                |
| hardConstraints        | user_stated | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | 0                |
| flexiblePreferences    | missing     | null                                                                                                                                                       | 0                |

Prikazano 6 pitanja; 17 history stavki, profil revision 17. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.

## PROFILE-COUNTRY-CONFLICT — Conflicting country lists

Očekivano: **ready_limited**. Izvršeno: **ready_limited**.

### Turn 0

Start: no profile values are assumed.

Pitanja:

- **ask-studyLevel**: Which level are you looking for: a bachelor's, master's or PhD? Reason: This answer is needed for a useful limited search.
- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: studyLevel, fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 1

I am an adult. Here are my structured answers: a computer science bachelor's, software engineering goal, Germany or the Netherlands only, English teaching only, EUR 10,000 per year including living costs as a firm maximum, a scholarship preferred, 2027 start, completed Serbian general secondary education in 2026. No additional hard requirements.

Primenjeni strukturisani ulazi:

| Događaj            | Polje                 | Vrednost / izabrani predlog                                                                                                                                | Poreklo                      |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| user_answer/assert | studyLevel            | "undergraduate"                                                                                                                                            | Direct synthetic user answer |
| user_answer/assert | fieldOfStudy          | "Computer science"                                                                                                                                         | Direct synthetic user answer |
| user_answer/assert | studyGoal             | "Prepare for software engineering work"                                                                                                                    | Direct synthetic user answer |
| user_answer/assert | preferredCountries    | ["DE","NL"]                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | teachingLanguages     | ["english"]                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | budgetAmount          | 10000                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetCurrency        | "EUR"                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetPeriod          | "year"                                                                                                                                                     | Direct synthetic user answer |
| user_answer/assert | budgetIncludesLiving  | true                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | scholarshipNeed       | "preferred"                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | startYear             | 2027                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | previousQualification | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | Direct synthetic user answer |
| user_answer/assert | hardConstraints       | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | Direct synthetic user answer |

Pitanja:

Nema dodatnih pitanja.

Status: **ready_limited**. Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed.

Potrebne dopune: nema. Nepoznato/nepotvrđeno: interests, excludedCountries, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Turn 2

Exclude Germany. I also still prefer Germany in my earlier answer.

Primenjeni strukturisani ulazi:

| Događaj            | Polje             | Vrednost / izabrani predlog | Poreklo                      |
| ------------------ | ----------------- | --------------------------- | ---------------------------- |
| user_answer/assert | excludedCountries | ["DE"]                      | Direct synthetic user answer |

Pitanja:

- **clarify-countries**: Some preferred countries are also excluded. Confirm both lists so that they do not overlap. Reason: A country appears in both your preferred and excluded lists. Confirm which countries to keep in each list.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: preferredCountries. Nepoznato/nepotvrđeno: interests, preferredCountries, excludedCountries, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

Konflikti: A country appears in both your preferred and excluded lists. Confirm which countries to keep in each list.

### Turn 3

Keep only the Netherlands as preferred, and exclude Germany.

Primenjeni strukturisani ulazi:

| Događaj           | Polje         | Vrednost / izabrani predlog                              | Poreklo                      |
| ----------------- | ------------- | -------------------------------------------------------- | ---------------------------- |
| resolve_countries | country lists | {"preferredCountries":["NL"],"excludedCountries":["DE"]} | Direct synthetic user answer |

Pitanja:

Nema dodatnih pitanja.

Status: **ready_limited**. Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed.

Potrebne dopune: nema. Nepoznato/nepotvrđeno: interests, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Završno stanje polja

| Polje                  | Status      | Vrednost                                                                                                                                                   | Pending predlozi |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| studyLevel             | user_stated | "undergraduate"                                                                                                                                            | 0                |
| fieldOfStudy           | user_stated | "Computer science"                                                                                                                                         | 0                |
| interests              | missing     | null                                                                                                                                                       | 0                |
| studyGoal              | user_stated | "Prepare for software engineering work"                                                                                                                    | 0                |
| preferredCountries     | confirmed   | ["NL"]                                                                                                                                                     | 0                |
| excludedCountries      | confirmed   | ["DE"]                                                                                                                                                     | 0                |
| teachingLanguages      | user_stated | ["english"]                                                                                                                                                | 0                |
| budgetAmount           | user_stated | 10000                                                                                                                                                      | 0                |
| budgetCurrency         | user_stated | "EUR"                                                                                                                                                      | 0                |
| budgetPeriod           | user_stated | "year"                                                                                                                                                     | 0                |
| budgetIncludesLiving   | user_stated | true                                                                                                                                                       | 0                |
| scholarshipNeed        | user_stated | "preferred"                                                                                                                                                | 0                |
| startYear              | user_stated | 2027                                                                                                                                                       | 0                |
| previousQualification  | user_stated | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | 0                |
| relevantSubjects       | missing     | null                                                                                                                                                       | 0                |
| languageResults        | missing     | null                                                                                                                                                       | 0                |
| professionalExperience | missing     | null                                                                                                                                                       | 0                |
| researchExperience     | missing     | null                                                                                                                                                       | 0                |
| orientation            | missing     | null                                                                                                                                                       | 0                |
| masterIntent           | missing     | null                                                                                                                                                       | 0                |
| phdTopic               | missing     | null                                                                                                                                                       | 0                |
| phdFunding             | missing     | null                                                                                                                                                       | 0                |
| phdPositionType        | missing     | null                                                                                                                                                       | 0                |
| phdFocus               | missing     | null                                                                                                                                                       | 0                |
| researchProposal       | missing     | null                                                                                                                                                       | 0                |
| hardConstraints        | user_stated | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | 0                |
| flexiblePreferences    | missing     | null                                                                                                                                                       | 0                |

Prikazano 3 pitanja; 17 history stavki, profil revision 17. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.

## PROFILE-MISSING-LANGUAGE — Teaching language missing

Očekivano: **asking**. Izvršeno: **asking**.

### Turn 0

Start: no profile values are assumed.

Pitanja:

- **ask-studyLevel**: Which level are you looking for: a bachelor's, master's or PhD? Reason: This answer is needed for a useful limited search.
- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: studyLevel, fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 1

I give all the baseline structured answers except a teaching language. Do not infer it from the English interface.

Primenjeni strukturisani ulazi:

| Događaj            | Polje                 | Vrednost / izabrani predlog                                                                                                                                | Poreklo                      |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| user_answer/assert | studyLevel            | "undergraduate"                                                                                                                                            | Direct synthetic user answer |
| user_answer/assert | fieldOfStudy          | "Computer science"                                                                                                                                         | Direct synthetic user answer |
| user_answer/assert | studyGoal             | "Prepare for software engineering work"                                                                                                                    | Direct synthetic user answer |
| user_answer/assert | preferredCountries    | ["DE","NL"]                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | budgetAmount          | 10000                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetCurrency        | "EUR"                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetPeriod          | "year"                                                                                                                                                     | Direct synthetic user answer |
| user_answer/assert | budgetIncludesLiving  | true                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | scholarshipNeed       | "preferred"                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | startYear             | 2027                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | previousQualification | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | Direct synthetic user answer |
| user_answer/assert | hardConstraints       | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | Direct synthetic user answer |

Pitanja:

- **ask-teachingLanguages**: Which teaching languages can you study in? The interface language does not decide this. Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: teachingLanguages. Nepoznato/nepotvrđeno: interests, excludedCountries, teachingLanguages, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Završno stanje polja

| Polje                  | Status      | Vrednost                                                                                                                                                   | Pending predlozi |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| studyLevel             | user_stated | "undergraduate"                                                                                                                                            | 0                |
| fieldOfStudy           | user_stated | "Computer science"                                                                                                                                         | 0                |
| interests              | missing     | null                                                                                                                                                       | 0                |
| studyGoal              | user_stated | "Prepare for software engineering work"                                                                                                                    | 0                |
| preferredCountries     | user_stated | ["DE","NL"]                                                                                                                                                | 0                |
| excludedCountries      | missing     | null                                                                                                                                                       | 0                |
| teachingLanguages      | missing     | null                                                                                                                                                       | 0                |
| budgetAmount           | user_stated | 10000                                                                                                                                                      | 0                |
| budgetCurrency         | user_stated | "EUR"                                                                                                                                                      | 0                |
| budgetPeriod           | user_stated | "year"                                                                                                                                                     | 0                |
| budgetIncludesLiving   | user_stated | true                                                                                                                                                       | 0                |
| scholarshipNeed        | user_stated | "preferred"                                                                                                                                                | 0                |
| startYear              | user_stated | 2027                                                                                                                                                       | 0                |
| previousQualification  | user_stated | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | 0                |
| relevantSubjects       | missing     | null                                                                                                                                                       | 0                |
| languageResults        | missing     | null                                                                                                                                                       | 0                |
| professionalExperience | missing     | null                                                                                                                                                       | 0                |
| researchExperience     | missing     | null                                                                                                                                                       | 0                |
| orientation            | missing     | null                                                                                                                                                       | 0                |
| masterIntent           | missing     | null                                                                                                                                                       | 0                |
| phdTopic               | missing     | null                                                                                                                                                       | 0                |
| phdFunding             | missing     | null                                                                                                                                                       | 0                |
| phdPositionType        | missing     | null                                                                                                                                                       | 0                |
| phdFocus               | missing     | null                                                                                                                                                       | 0                |
| researchProposal       | missing     | null                                                                                                                                                       | 0                |
| hardConstraints        | user_stated | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | 0                |
| flexiblePreferences    | missing     | null                                                                                                                                                       | 0                |

Prikazano 3 pitanja; 14 history stavki, profil revision 14. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.

## PROFILE-PREFERENCE-CHANGE — Explicit country preference change

Očekivano: **ready_limited**. Izvršeno: **ready_limited**.

### Turn 0

Start: no profile values are assumed.

Pitanja:

- **ask-studyLevel**: Which level are you looking for: a bachelor's, master's or PhD? Reason: This answer is needed for a useful limited search.
- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: studyLevel, fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 1

I am an adult. Here are my structured answers: a computer science bachelor's, software engineering goal, Germany or the Netherlands only, English teaching only, EUR 10,000 per year including living costs as a firm maximum, a scholarship preferred, 2027 start, completed Serbian general secondary education in 2026. No additional hard requirements.

Primenjeni strukturisani ulazi:

| Događaj            | Polje                 | Vrednost / izabrani predlog                                                                                                                                | Poreklo                      |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| user_answer/assert | studyLevel            | "undergraduate"                                                                                                                                            | Direct synthetic user answer |
| user_answer/assert | fieldOfStudy          | "Computer science"                                                                                                                                         | Direct synthetic user answer |
| user_answer/assert | studyGoal             | "Prepare for software engineering work"                                                                                                                    | Direct synthetic user answer |
| user_answer/assert | preferredCountries    | ["DE","NL"]                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | teachingLanguages     | ["english"]                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | budgetAmount          | 10000                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetCurrency        | "EUR"                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetPeriod          | "year"                                                                                                                                                     | Direct synthetic user answer |
| user_answer/assert | budgetIncludesLiving  | true                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | scholarshipNeed       | "preferred"                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | startYear             | 2027                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | previousQualification | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | Direct synthetic user answer |
| user_answer/assert | hardConstraints       | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | Direct synthetic user answer |

Pitanja:

Nema dodatnih pitanja.

Status: **ready_limited**. Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed.

Potrebne dopune: nema. Nepoznato/nepotvrđeno: interests, excludedCountries, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Turn 2

Correct my preferred countries to Italy only. Keep the other requirements.

Primenjeni strukturisani ulazi:

| Događaj             | Polje              | Vrednost / izabrani predlog | Poreklo                      |
| ------------------- | ------------------ | --------------------------- | ---------------------------- |
| user_answer/replace | preferredCountries | ["IT"]                      | Direct synthetic user answer |

Pitanja:

Nema dodatnih pitanja.

Status: **ready_limited**. Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed.

Potrebne dopune: nema. Nepoznato/nepotvrđeno: interests, excludedCountries, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Završno stanje polja

| Polje                  | Status      | Vrednost                                                                                                                                                   | Pending predlozi |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| studyLevel             | user_stated | "undergraduate"                                                                                                                                            | 0                |
| fieldOfStudy           | user_stated | "Computer science"                                                                                                                                         | 0                |
| interests              | missing     | null                                                                                                                                                       | 0                |
| studyGoal              | user_stated | "Prepare for software engineering work"                                                                                                                    | 0                |
| preferredCountries     | user_stated | ["IT"]                                                                                                                                                     | 0                |
| excludedCountries      | missing     | null                                                                                                                                                       | 0                |
| teachingLanguages      | user_stated | ["english"]                                                                                                                                                | 0                |
| budgetAmount           | user_stated | 10000                                                                                                                                                      | 0                |
| budgetCurrency         | user_stated | "EUR"                                                                                                                                                      | 0                |
| budgetPeriod           | user_stated | "year"                                                                                                                                                     | 0                |
| budgetIncludesLiving   | user_stated | true                                                                                                                                                       | 0                |
| scholarshipNeed        | user_stated | "preferred"                                                                                                                                                | 0                |
| startYear              | user_stated | 2027                                                                                                                                                       | 0                |
| previousQualification  | user_stated | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | 0                |
| relevantSubjects       | missing     | null                                                                                                                                                       | 0                |
| languageResults        | missing     | null                                                                                                                                                       | 0                |
| professionalExperience | missing     | null                                                                                                                                                       | 0                |
| researchExperience     | missing     | null                                                                                                                                                       | 0                |
| orientation            | missing     | null                                                                                                                                                       | 0                |
| masterIntent           | missing     | null                                                                                                                                                       | 0                |
| phdTopic               | missing     | null                                                                                                                                                       | 0                |
| phdFunding             | missing     | null                                                                                                                                                       | 0                |
| phdPositionType        | missing     | null                                                                                                                                                       | 0                |
| phdFocus               | missing     | null                                                                                                                                                       | 0                |
| researchProposal       | missing     | null                                                                                                                                                       | 0                |
| hardConstraints        | user_stated | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | 0                |
| flexiblePreferences    | missing     | null                                                                                                                                                       | 0                |

Prikazano 2 pitanja; 15 history stavki, profil revision 15. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.

## PROFILE-DOCUMENT-UNCONFIRMED — Unconfirmed document change

Očekivano: **asking**. Izvršeno: **asking**.

### Turn 0

Start: no profile values are assumed.

Pitanja:

- **ask-studyLevel**: Which level are you looking for: a bachelor's, master's or PhD? Reason: This answer is needed for a useful limited search.
- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: studyLevel, fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 1

I am an adult. Here are my structured answers: a computer science bachelor's, software engineering goal, Germany or the Netherlands only, English teaching only, EUR 10,000 per year including living costs as a firm maximum, a scholarship preferred, 2027 start, completed Serbian general secondary education in 2026. No additional hard requirements.

Primenjeni strukturisani ulazi:

| Događaj            | Polje                 | Vrednost / izabrani predlog                                                                                                                                | Poreklo                      |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| user_answer/assert | studyLevel            | "undergraduate"                                                                                                                                            | Direct synthetic user answer |
| user_answer/assert | fieldOfStudy          | "Computer science"                                                                                                                                         | Direct synthetic user answer |
| user_answer/assert | studyGoal             | "Prepare for software engineering work"                                                                                                                    | Direct synthetic user answer |
| user_answer/assert | preferredCountries    | ["DE","NL"]                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | teachingLanguages     | ["english"]                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | budgetAmount          | 10000                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetCurrency        | "EUR"                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetPeriod          | "year"                                                                                                                                                     | Direct synthetic user answer |
| user_answer/assert | budgetIncludesLiving  | true                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | scholarshipNeed       | "preferred"                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | startYear             | 2027                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | previousQualification | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | Direct synthetic user answer |
| user_answer/assert | hardConstraints       | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | Direct synthetic user answer |

Pitanja:

Nema dodatnih pitanja.

Status: **ready_limited**. Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed.

Potrebne dopune: nema. Nepoznato/nepotvrđeno: interests, excludedCountries, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Turn 2

Synthetic document fixture suggests EUR 25,000 as the budget amount. The user has not confirmed this change; no real document was uploaded.

Primenjeni strukturisani ulazi:

| Događaj | Polje        | Vrednost / izabrani predlog | Poreklo                      |
| ------- | ------------ | --------------------------- | ---------------------------- |
| propose | budgetAmount | 25000                       | SYNTHETIC-DOCUMENT-01/budget |

Pitanja:

- **confirm-budgetAmount**: Review the proposed value for budgetAmount. Confirm a specific proposal, reject it or give your own correction. Reason: Your current answer is kept; the proposed change needs your confirmation.
  Predlozi za pregled: `[{"id":"PROFILE-DOCUMENT-UNCONFIRMED-14","value":25000,"sourceRef":"SYNTHETIC-DOCUMENT-01/budget"}]`.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: budgetAmount. Nepoznato/nepotvrđeno: interests, excludedCountries, budgetAmount, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Završno stanje polja

| Polje                  | Status      | Vrednost                                                                                                                                                   | Pending predlozi |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| studyLevel             | user_stated | "undergraduate"                                                                                                                                            | 0                |
| fieldOfStudy           | user_stated | "Computer science"                                                                                                                                         | 0                |
| interests              | missing     | null                                                                                                                                                       | 0                |
| studyGoal              | user_stated | "Prepare for software engineering work"                                                                                                                    | 0                |
| preferredCountries     | user_stated | ["DE","NL"]                                                                                                                                                | 0                |
| excludedCountries      | missing     | null                                                                                                                                                       | 0                |
| teachingLanguages      | user_stated | ["english"]                                                                                                                                                | 0                |
| budgetAmount           | user_stated | 10000                                                                                                                                                      | 1                |
| budgetCurrency         | user_stated | "EUR"                                                                                                                                                      | 0                |
| budgetPeriod           | user_stated | "year"                                                                                                                                                     | 0                |
| budgetIncludesLiving   | user_stated | true                                                                                                                                                       | 0                |
| scholarshipNeed        | user_stated | "preferred"                                                                                                                                                | 0                |
| startYear              | user_stated | 2027                                                                                                                                                       | 0                |
| previousQualification  | user_stated | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | 0                |
| relevantSubjects       | missing     | null                                                                                                                                                       | 0                |
| languageResults        | missing     | null                                                                                                                                                       | 0                |
| professionalExperience | missing     | null                                                                                                                                                       | 0                |
| researchExperience     | missing     | null                                                                                                                                                       | 0                |
| orientation            | missing     | null                                                                                                                                                       | 0                |
| masterIntent           | missing     | null                                                                                                                                                       | 0                |
| phdTopic               | missing     | null                                                                                                                                                       | 0                |
| phdFunding             | missing     | null                                                                                                                                                       | 0                |
| phdPositionType        | missing     | null                                                                                                                                                       | 0                |
| phdFocus               | missing     | null                                                                                                                                                       | 0                |
| researchProposal       | missing     | null                                                                                                                                                       | 0                |
| hardConstraints        | user_stated | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | 0                |
| flexiblePreferences    | missing     | null                                                                                                                                                       | 0                |

Prikazano 3 pitanja; 16 history stavki, profil revision 16. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.

## PROFILE-ENOUGH — Enough for limited search with unknowns

Očekivano: **ready_limited**. Izvršeno: **ready_limited**.

### Turn 0

Start: no profile values are assumed.

Pitanja:

- **ask-studyLevel**: Which level are you looking for: a bachelor's, master's or PhD? Reason: This answer is needed for a useful limited search.
- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: studyLevel, fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 1

I am an adult. Here are my structured answers: a computer science bachelor's, software engineering goal, Germany or the Netherlands only, English teaching only, EUR 10,000 per year including living costs as a firm maximum, a scholarship preferred, 2027 start, completed Serbian general secondary education in 2026. No additional hard requirements.

Primenjeni strukturisani ulazi:

| Događaj            | Polje                 | Vrednost / izabrani predlog                                                                                                                                | Poreklo                      |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| user_answer/assert | studyLevel            | "undergraduate"                                                                                                                                            | Direct synthetic user answer |
| user_answer/assert | fieldOfStudy          | "Computer science"                                                                                                                                         | Direct synthetic user answer |
| user_answer/assert | studyGoal             | "Prepare for software engineering work"                                                                                                                    | Direct synthetic user answer |
| user_answer/assert | preferredCountries    | ["DE","NL"]                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | teachingLanguages     | ["english"]                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | budgetAmount          | 10000                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetCurrency        | "EUR"                                                                                                                                                      | Direct synthetic user answer |
| user_answer/assert | budgetPeriod          | "year"                                                                                                                                                     | Direct synthetic user answer |
| user_answer/assert | budgetIncludesLiving  | true                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | scholarshipNeed       | "preferred"                                                                                                                                                | Direct synthetic user answer |
| user_answer/assert | startYear             | 2027                                                                                                                                                       | Direct synthetic user answer |
| user_answer/assert | previousQualification | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | Direct synthetic user answer |
| user_answer/assert | hardConstraints       | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | Direct synthetic user answer |

Pitanja:

Nema dodatnih pitanja.

Status: **ready_limited**. Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed.

Potrebne dopune: nema. Nepoznato/nepotvrđeno: interests, excludedCountries, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: previousQualification.institution, previousQualification.credits.

### Završno stanje polja

| Polje                  | Status      | Vrednost                                                                                                                                                   | Pending predlozi |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| studyLevel             | user_stated | "undergraduate"                                                                                                                                            | 0                |
| fieldOfStudy           | user_stated | "Computer science"                                                                                                                                         | 0                |
| interests              | missing     | null                                                                                                                                                       | 0                |
| studyGoal              | user_stated | "Prepare for software engineering work"                                                                                                                    | 0                |
| preferredCountries     | user_stated | ["DE","NL"]                                                                                                                                                | 0                |
| excludedCountries      | missing     | null                                                                                                                                                       | 0                |
| teachingLanguages      | user_stated | ["english"]                                                                                                                                                | 0                |
| budgetAmount           | user_stated | 10000                                                                                                                                                      | 0                |
| budgetCurrency         | user_stated | "EUR"                                                                                                                                                      | 0                |
| budgetPeriod           | user_stated | "year"                                                                                                                                                     | 0                |
| budgetIncludesLiving   | user_stated | true                                                                                                                                                       | 0                |
| scholarshipNeed        | user_stated | "preferred"                                                                                                                                                | 0                |
| startYear              | user_stated | 2027                                                                                                                                                       | 0                |
| previousQualification  | user_stated | {"kind":"secondary","field":"General secondary education","institution":null,"country":"RS","completion":"completed","completionYear":2026,"credits":null} | 0                |
| relevantSubjects       | missing     | null                                                                                                                                                       | 0                |
| languageResults        | missing     | null                                                                                                                                                       | 0                |
| professionalExperience | missing     | null                                                                                                                                                       | 0                |
| researchExperience     | missing     | null                                                                                                                                                       | 0                |
| orientation            | missing     | null                                                                                                                                                       | 0                |
| masterIntent           | missing     | null                                                                                                                                                       | 0                |
| phdTopic               | missing     | null                                                                                                                                                       | 0                |
| phdFunding             | missing     | null                                                                                                                                                       | 0                |
| phdPositionType        | missing     | null                                                                                                                                                       | 0                |
| phdFocus               | missing     | null                                                                                                                                                       | 0                |
| researchProposal       | missing     | null                                                                                                                                                       | 0                |
| hardConstraints        | user_stated | {"countries":"only_preferred","languages":"only_listed","budget":"hard_maximum","other":[]}                                                                | 0                |
| flexiblePreferences    | missing     | null                                                                                                                                                       | 0                |

Prikazano 2 pitanja; 14 history stavki, profil revision 14. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.

## PROFILE-NOT-ENOUGH — Not enough information

Očekivano: **asking**. Izvršeno: **asking**.

### Turn 0

Start: no profile values are assumed.

Pitanja:

- **ask-studyLevel**: Which level are you looking for: a bachelor's, master's or PhD? Reason: This answer is needed for a useful limited search.
- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints. Nepoznato/nepotvrđeno: studyLevel, fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Turn 1

I am an adult looking for a master's, but I am not sure of the field or budget yet.

Primenjeni strukturisani ulazi:

| Događaj            | Polje      | Vrednost / izabrani predlog | Poreklo                      |
| ------------------ | ---------- | --------------------------- | ---------------------------- |
| user_answer/assert | studyLevel | "master"                    | Direct synthetic user answer |

Pitanja:

- **ask-fieldOfStudy**: Which subject or study field would you like to explore? Reason: This answer is needed for a useful limited search.
- **ask-studyGoal**: What would you like this degree to help you do? Reason: This answer is needed for a useful limited search.

Status: **asking**. Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.

Potrebne dopune: fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, hardConstraints, masterIntent. Nepoznato/nepotvrđeno: fieldOfStudy, interests, studyGoal, preferredCountries, excludedCountries, teachingLanguages, budgetAmount, budgetCurrency, budgetPeriod, budgetIncludesLiving, scholarshipNeed, startYear, previousQualification, relevantSubjects, languageResults, professionalExperience, researchExperience, orientation, masterIntent, hardConstraints, flexiblePreferences.

Nepoznati detalji unetih kvalifikacija/rezultata: nema dodatno unetih nepoznatih detalja.

### Završno stanje polja

| Polje                  | Status      | Vrednost | Pending predlozi |
| ---------------------- | ----------- | -------- | ---------------- |
| studyLevel             | user_stated | "master" | 0                |
| fieldOfStudy           | missing     | null     | 0                |
| interests              | missing     | null     | 0                |
| studyGoal              | missing     | null     | 0                |
| preferredCountries     | missing     | null     | 0                |
| excludedCountries      | missing     | null     | 0                |
| teachingLanguages      | missing     | null     | 0                |
| budgetAmount           | missing     | null     | 0                |
| budgetCurrency         | missing     | null     | 0                |
| budgetPeriod           | missing     | null     | 0                |
| budgetIncludesLiving   | missing     | null     | 0                |
| scholarshipNeed        | missing     | null     | 0                |
| startYear              | missing     | null     | 0                |
| previousQualification  | missing     | null     | 0                |
| relevantSubjects       | missing     | null     | 0                |
| languageResults        | missing     | null     | 0                |
| professionalExperience | missing     | null     | 0                |
| researchExperience     | missing     | null     | 0                |
| orientation            | missing     | null     | 0                |
| masterIntent           | missing     | null     | 0                |
| phdTopic               | missing     | null     | 0                |
| phdFunding             | missing     | null     | 0                |
| phdPositionType        | missing     | null     | 0                |
| phdFocus               | missing     | null     | 0                |
| researchProposal       | missing     | null     | 0                |
| hardConstraints        | missing     | null     | 0                |
| flexiblePreferences    | missing     | null     | 0                |

Prikazano 4 pitanja; 3 history stavki, profil revision 3. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.
