# AI ugovor i bezbednosne granice — Korak 8

D-037 (2026-10-15): aktuelna instructions verzija je `education-instructions-2`. Server sada daje task responseContract i sužava stvarnu strict transport šemu na dozvoljeni tip i postojeće question ID-jeve; kad pitanja nema questionId je null i type question nije dozvoljen. Objašnjenje ne može nositi answer/question/proposals; postojeće semantic/ID/source provere i dalje rade. Usage ima opciono bounded cacheWriteTokens (read+write≤total), datiranu cenu i worst-case rezervaciju. Log čita istorijske instructions-1 i aktuelne instructions-2 zapise. [Dokaz i precizne live/offline granice](FULL_FLOW_AI_VERIFICATION.md): final v2 šema samo offline proverena, ne predstavlja novi live PASS. Stari Korak 8 opis ispod je istorijski.

Dopuna D-034 (2026-10-15): javni zahtev/selection/result oblik ostaje isti; uska grounding ispravka prepoznaje izričite English periode budžeta (npr. annual → year) preko fiksnog rečnika, uz doslovan citat, bez konverzije iznosa ili inferencije nedostajućih podataka. [Offline dokaz i granice](SEMANTIC_GROUNDING_VERIFICATION.md). Privatna dijagnostika ima fiksni rule/field/index, ne sadržaj odgovora. Ostatak opisa Koraka 8 je istorijski; aktuelni lokalni/live status je u [LOCAL_LIVE_AI_VERIFICATION](LOCAL_LIVE_AI_VERIFICATION.md).

Datum 2026-10-06. Izvršni plan (private development record), D-019/D-020 u DECISIONS (private development record), [dokazi](VERIFICATION.md), [izvršeni scenariji](SCENARIOS.md). Master plan str. 33–38/47, uz English-only D-002.

## Šta je implementirano

Neutralni `EducationAiAdapter.run`, strict Zod zahtev/selection/public result, serverska kontrola zadatka i konteksta, OpenAI Responses HTTP provider, lokalni selection mock i fake transport testovi. Postojeća dijagnostika `/api/mock`, profil, matching, katalog i statički UI nisu menjani. Nema nove `/api/chat` rute, live poziva, novog paketa ili logovanja razgovora.

| Sloj                  | Ulaz/izlaz i odgovornost                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Neutralni zahtev      | `requestId`, `profileRevision`, task i poruka do 8.000 znakova; bez modela, ključa, alata, URL-a, kataloga ili dokument payload-a.                                                                                             |
| Trusted server caller | Vlasnik validiranog `MatchingInput`, uključujući serverske grants. Adapter snima kopiju za jedan profil revision; promena traži novu instancu. Ovo nije sesijska autorizacija.                                                 |
| Task                  | `interpret_message`, `explain_recommendations`; `analyze_document` rezervisan ali zatvoren.                                                                                                                                    |
| Model selection       | type, do osam proposals sa field/valueJson/exact quote, nullable questionId/answerKey, do tri program/intake/reason/source selections, permission request IDs. Svih šest polja obavezno, object root, extra fields zabranjeni. |
| Public rezultat       | Sedam tipova, engleski serverski message, nepotvrđeni predlozi, kontrolisano pitanje, postojeći matching payload ili neutralna greška, metadata. UI ne dobija provider response body.                                          |
| Provider port         | `generate` sa kontrolisanim context/instructions/output/timeout/cost limitom i AbortSignal; completed/refused/incomplete ili normalizovana greška. Jedan pravi dobavljač, OpenAI.                                              |

## Tipovi odgovora

`question` bira samo pitanje koje je dozvolio postojeći selector; tekst pitanja dolazi sa servera. `answer` bira education_help/source_transparency/profile_review sa fiksnim engleskim tekstom. `recommendations` sadrži postojeće opcije u istom poretku, uz sve uslove/upozorenja. `alternative_permission` traži postojeću konkretnu dozvolu i ne prikazuje skrivenu opciju. `needs_verification` ne pretvara unknown u met; može označiti i prazni katalog. `out_of_scope` koristi engleski obrazovni scope odgovor. `error` generiše server; model ne dodeljuje operativne kodove.

Namerno nema slobodne modelske proze za činjenice o programu. Objašnjenje se dobija izborom postojećih reason/source veza, dok server hidrira kompletan provereni rezultat sa upozorenjima. Time su novi deadline/tuition/eligibility/admission-percent fields odbijeni čak i kada je JSON sintaksno validan. Ovo ograničava stil AI objašnjenja; slobodna faktografska generacija nije otvorena.

## Profilni predlozi

Svako predloženo polje prolazi postojeći profileValueSchemas i mora pripadati aktivnoj grani. Quote mora biti doslovni deo poruke; brojevi/tekst/skalarni enum imaju dodatnu sintaksnu proveru, a boolean eksplicitnu reč. Kompleksan quoted JSON/objekat nije dokaz tačnosti ekstrakcije. Svi predlozi ostaju `extracted_unconfirmed`, vezani za baseRevision.

Za budgetPeriod od D-034 važi fiksni rečnik eksplicitnih month/year/total_degree oznaka; samo normalizovana vrednost ne mora doslovno stajati u citatu. Tačno jedan period mora biti naveden; negirani/mešani/nepoznati periodi se odbijaju. Druga skalarna grounding pravila nisu proširena.

`stageAiProposals` pravi samo postojeće `propose` događaje i radi atomski; stale revision ili nevalidna tranzicija čuvaju početno stanje. Ne pravi confirm/resolve/user_answer ni grant. Potvrđeni budžet ostaje aktivan dok korisnik odobri predlog. Staging helper je interni serverski ugovor; buduća ruta mora da proveri vlasništvo i poreklo izlaza. Mock nije NLP parser; stvarna extraction kvalitet evaluacija nije izvršena.

## Scope, kontekst i izlazna provera

Server prvo proverava strict zahtev/revision/dužinu, zatim heuristički klasifikuje obrazovni/nevezani/nejasni/rizični tekst. Prepoznati injection, skripte, zahtevi za tajne i nepotrebni osetljivi identifikatori se odbijaju pre provider-a. Nejasan tekst prolazi samo kao kratak odgovor na stvarno pending pitanje ili usko objašnjenje već postojećih opcija. Task oznaka sama ne odobrava nevezan zahtev. Screening na engleskom je konzervativna heuristika, sa mogućim promašajima i lažnim odbijanjem; nije semantička garancija.

Odbrane ne zavise samo od instrukcije: task allowlist, minimalni kontekst, zatvoren document task, fiksni provider endpoint, bez alata, strict output i semantička grounding provera ostaju serverske granice. Sam input/podatak/institucionalni naziv ne menja instrukcije. Nema shell-a, web search-a, URL fetch-a ili modelskog upisa u bazu/profil.

Kontekst nema istoriju razgovora, seenEvents, source URLs, kandidatovu instituciju, ceo katalog, privatni score ili scopeKey. Profil je aktivna potvrđena projekcija; nepregledani proposals nisu potvrđene vrednosti. Za explanation server ponovo izvršava matching, a pre dozvole daje samo javni permission request bez identiteta alternative. Maksimum context JSON-a je 64.000 UTF-8 bajtova. Svaki program/intake i selected reason/source ID mora postojati baš u vidljivom rezultatu, ne samo negde u katalogu. Izlaz ne menja nivo, cenu, rok, redosled, institutional status ili upozorenje; source ID sam po sebi ne potvrđuje istinu.

## Responses transport i konfiguracija

`AI_PROVIDER=mock` je default; `APP_MODE=mock` i dijagnostika ostaju isti. Model se bira samo na serveru: allowlist `gpt-6-luna` ili `gpt-6.1-sol`, bez automatskog fallback-a. Aktuelni kandidat iz plana je Luna, ali nema empirijske potvrde kvaliteta. Provider vrati stvarni model/snapshot u metadata; schema/instruction/HTTP adapter verzije se beleže odvojeno.

OpenAI provider koristi samo `https://api.openai.com/v1/responses`, Bearer credential u serverskoj closure, `text.format` strict JSON schema, `store:false`, bez streaming/background/tools, `tool_choice:none`, bez truncation-a i bez prethodnog provider conversation-a. HTTP redirects su odbijeni. Responses envelope je provider-specific samo unutar modula; reasoning nije prikazni tekst, refusal/incomplete su odvojeni, neočekivani tool call ili višestruki text output se odbijaju. Response body je limitiran na 65.536 bajtova; selection text na 32.000 znakova. [Zvanični Responses reference](https://developers.openai.com/api/reference/typescript/resources/responses/methods/create), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

Ključ se eventualno postavlja u server secret storage ili `.env.local`, nikad kroz chat, `NEXT_PUBLIC_*`, commit, fixture ili aplikacioni log. U ovom nalogu nije tražen/pročitan pravi ključ. `store:false` ne dokazuje zero retention dobavljača; O-005/pilot obrada ostaje otvorena. [Zvanična autentikacija i request ID](https://developers.openai.com/api/reference/overview#authentication).

## Timeout, retry i potrošnja

Default timeout za ceo adapter turn je 12 s, output do 1.600 tokena, jedan pokušaj. Server config ograničava timeout do 30 s, output do 4.000, retry najviše jedan i delay do 1 s. Samo eksplicitni HTTP 429 sme jednom da se ponovi ako server to uključi; nema automatskog retry-a za timeout/network/5xx/refusal/incomplete/invalid JSON. Request IDs po pokušaju i provider `x-request-id` su odvojeni; nema raw payload/exception echo-a.

Live slanje traži `AI_LIVE_APPROVED=true`, validan ključ i obavezni interni `SpendGuard`. Bez implementiranog guard-a podrazumevani factory ne šalje. Guard mora rezervisati ceo konservativni maximum pre svakog pokušaja i poravnati uspeh ili unknown trošak; nepoznato se ne oslobađa kao nula. Ovaj korak definiše port, ne distribuirane rate/session/global budget kvote Koraka 10. Ni approval env ni plan sami nisu ljudska dozvola za trošak.

Procena maximum-a koristi UTF-8 byte bound + framing allowance i max output tokens, ne optimistični tokenizer prosečan odnos. Procena stvarnog odgovora koristi input/cached/output usage i dated text-only Standard short-context USD snapshot. Nepoznat usage/trošak ostaje null; retry sa nepotpunom evidencijom ostavlja usageComplete=false. Mock ima dokazano nula API troška i nije modelska tokenizacija. Guard settlement je interni operativni dokaz, ne potvrda konačne fakture.

| Model       | Input / milion | Cached input / milion | Output / milion |
| ----------- | -------------- | --------------------- | --------------- |
| gpt-6-luna  | USD 0,10       | USD 0,01              | USD 0,50        |
| gpt-6.1-sol | USD 2,00       | USD 0,10              | USD 10,00       |

Provereno 2026-10-06 u [zvaničnom cenovniku](https://developers.openai.com/api/docs/pricing); samo Standard short-context tekst, bez cache writes/alata/slika/regional processing-a. Snapshot ističe posle sedam dana; stale/unknown cena blokira live slanje i traži novu proveru, bez nagađanja. Ovo nije odobren budžet ili API account access. [Model katalog](https://developers.openai.com/api/docs/models), [Luna mogućnosti](https://developers.openai.com/api/docs/models/gpt-6-luna).

## Dokumenti i sledeće kapije

`AI_DOCUMENT_ANALYSIS=false` je zatvorena konfiguraciona zastavica. True se odbija; sam analyze_document task vraća DOCUMENT_DISABLED. Nema upload-a, PDF/slika parsera ili prenosa dokumenta. Otvaranje zahteva poseban odobren tok/pregled; zadatak i provider-neutral ugovor tada se proširuju, bez proizvoljnog alata.

Istorijski Korak 8 završio je sa praznim published katalogom i pending human review-om. D-043 naknadno objavljuje katalog 1.0.3, bez promene AI ugovora. Lokalni fake/mock PASS i human catalog review nisu live-model evaluacija, naučna validacija matching-a, sigurnost sesije ili pilot.
