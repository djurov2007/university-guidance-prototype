import {
  profileConversations,
  replayConversation,
} from "../src/test-fixtures/profile-conversations.ts";
import { goldenQuestionConfig } from "../src/features/profiles/questions.ts";
import { fieldKeys } from "../src/features/profiles/schema.ts";

const cell = (value) =>
  String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const config = goldenQuestionConfig;
if (
  process.argv.slice(2).length > 1 ||
  (process.argv[2] && process.argv[2] !== "--questions")
) {
  console.error("Usage: npm run profile:report -- [--questions]");
  process.exitCode = 1;
} else if (process.argv[2] === "--questions") {
  console.log("# Zlatna pitanja — verzija " + config.version + "\n");
  console.log(
    "Izvor: [questions.ts](../../src/features/profiles/questions.ts). Izveštaj: `npm run profile:report -- --questions`. Deterministički ugovor Prompta 6, [model](PROFILE_MODEL.md), [razgovori](CONVERSATIONS.md), [dokazi](VERIFICATION.md).\n",
  );
  console.log(
    `Konfiguracija sadrži ${config.questions.length} stabilnih ID-jeva u devet grupa. Svi produktni promptovi su na engleskom. Najviše ${config.maxQuestionsPerTurn} pitanja po turn-u, ${config.maxAttemptsPerContext} prikazivanja po nepromenjenom kontekstu i ${config.maxPresentations} ukupno. Ovo su implementacioni pragovi D-016, a ne empirijski pilot rezultat.\n`,
  );
  console.log(
    "`always` označava aktivno polje; `levels` odgovarajući nivo; `master_change` master sa promenom oblasti; `budget_known` makar zabeležen amount, uz obaveznu potvrdu ako je izdvojen; `review` aktivno polje sa predlogom; `conflict` konkretan konflikt. Required se primenjuje samo ako važi requiredWhen. Opcioni missing podatak se ne pita kada je profil već dovoljno popunjen. Prioritet 0 → country conflict, 1 → druga razrešenja, 2 → predlog, 10+ → potrebni odgovori. Follow-up ne prikazuje novo pitanje automatski i ne zaobilazi limit.\n",
  );
  console.log(
    "`profile.FIELD` zahteva njegovu Zod vrednost kroz user_answer; `proposal_choice` traži confirm sa proposalId ili reject/correction; `candidate_choice` traži resolve postojećeg kandidata ili eksplicitni replace; `country_lists` zahteva atomski resolve_countries. Semantic clarify ima `profile.FIELD` i zahteva eksplicitni replace. Generated confirmation/resolution templates nasleđuju required/requiredWhen osnovnog polja.\n",
  );
  console.log(
    "| ID | v | Grupa | Svrha | when | Tip odgovora | Polje | Required / when | Podpitanje | Konflikt | Prioritet | English prompt |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const q of config.questions)
    console.log(
      "| " +
        [
          q.id,
          q.version,
          q.group,
          q.purpose,
          JSON.stringify(q.when),
          q.answerType,
          q.field,
          `${q.requiredForRecommendations} / ${JSON.stringify(q.requiredWhen)}`,
          q.followUp ?? "—",
          q.conflictRule,
          q.priority,
          q.prompt,
        ]
          .map(cell)
          .join(" | ") +
        " |",
    );
} else {
  console.log("# Izvršivi sintetički razgovori — Korak 6\n");
  console.log(
    "Datum referentne godine: 2026. Svi primeri su izmišljeni i označeni 18+; nema stvarnih ljudi, programa ili dokumenata. Izvor: [fixtures](../../src/test-fixtures/profile-conversations.ts); reprodukcija: `npm run profile:report` ili pun JSON/history `npm run profile:demo -- PROFILE-ID`. [Model](PROFILE_MODEL.md), [pitanja](GOLDEN_QUESTIONS.md), [verifikacija](VERIFICATION.md).\n",
  );
  console.log(
    "Poruke ispod služe pregledu scenarija. Njihova eksplicitna structured commands lista je deterministički ulaz, ne rezultat NLP-a. Izveštaj za svaki turn prikazuje te stvarno primenjene vrednosti; nijedna prikazana pitanje/reakcija nije generisana modelom. Spremnost ne znači izračunate opcije ili ispunjene uslove ustanove.\n",
  );
  for (const fixture of profileConversations) {
    const result = replayConversation(fixture),
      final = result.trace.at(-1).turn;
    if (final.status !== fixture.expected)
      throw new Error(`Unexpected status: ${fixture.id}`);
    console.log(`## ${fixture.id} — ${fixture.title}\n`);
    console.log(
      `Očekivano: **${fixture.expected}**. Izvršeno: **${final.status}**.\n`,
    );
    result.trace.forEach((item, i) => {
      console.log(`### Turn ${i}\n\n${item.message}\n`);
      if (item.events.length) {
        console.log(
          "Primenjeni strukturisani ulazi:\n\n| Događaj | Polje | Vrednost / izabrani predlog | Poreklo |\n| --- | --- | --- | --- |",
        );
        for (const e of item.events)
          console.log(
            "| " +
              [
                e.type + (e.mode ? "/" + e.mode : ""),
                e.field ?? "country lists",
                JSON.stringify(
                  e.value ??
                    e.proposalId ?? {
                      preferredCountries: e.preferredCountries,
                      excludedCountries: e.excludedCountries,
                    },
                ),
                e.sourceRef ?? "Direct synthetic user answer",
              ]
                .map(cell)
                .join(" | ") +
              " |",
          );
        console.log("");
      }
      console.log("Pitanja:\n");
      if (!item.turn.questions.length) console.log("Nema dodatnih pitanja.\n");
      for (const q of item.turn.questions) {
        console.log(`- **${q.id}**: ${q.prompt} Reason: ${q.reason}`);
        if (q.proposals.length)
          console.log(
            "  Predlozi za pregled: `" + JSON.stringify(q.proposals) + "`.",
          );
        if (q.candidates.length)
          console.log(
            "  Sačuvani kandidati: `" + JSON.stringify(q.candidates) + "`.",
          );
      }
      console.log(
        `\nStatus: **${item.turn.status}**. ${item.turn.explanation}\n`,
      );
      console.log(
        `Potrebne dopune: ${item.turn.readiness.requiredMissing.join(", ") || "nema"}. Nepoznato/nepotvrđeno: ${item.turn.readiness.unknownFields.join(", ") || "nema"}.\n`,
      );
      console.log(
        `Nepoznati detalji unetih kvalifikacija/rezultata: ${item.turn.readiness.unknownDetails.join(", ") || "nema dodatno unetih nepoznatih detalja"}.\n`,
      );
      if (item.turn.readiness.conflicts.length)
        console.log(
          "Konflikti: " +
            item.turn.readiness.conflicts.map((c) => c.message).join(" ") +
            "\n",
        );
    });
    console.log(
      "### Završno stanje polja\n\n| Polje | Status | Vrednost | Pending predlozi |\n| --- | --- | --- | --- |",
    );
    for (const key of fieldKeys) {
      const f = result.state.fields[key];
      console.log(
        `| ${key} | ${f.status} | ${cell(JSON.stringify(f.value))} | ${f.proposals.length} |`,
      );
    }
    console.log(
      `\nPrikazano ${result.state.progress.presentations} pitanja; ${result.state.history.length} history stavki, profil revision ${result.state.revision}. Country conflict se računa kao derived effective status; originalne korisničke liste ostaju sačuvane do potvrde.\n`,
    );
  }
}
