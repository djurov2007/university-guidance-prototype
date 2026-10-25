import {
  matchingFixture,
  syntheticProgram,
  syntheticProof,
  changeSyntheticProfile,
} from "../src/test-fixtures/matching.ts";
import {
  recommend,
  changeAlternativeConsent,
} from "../src/features/matching/engine.ts";
import { readPublishedMatchingCatalog } from "../src/server/matching/catalog-adapter.ts";
const cases = [];
const add = (id, input, expected) => {
  const output = recommend(input);
  if (output.status !== expected)
    throw new Error(`${id}: unexpected ${output.status}`);
  cases.push({
    id,
    synthetic: input.catalog.channel === "synthetic",
    expected,
    output,
  });
};
add("ONE-OPTION", matchingFixture(), "options_found");
add(
  "TWO-OPTIONS",
  matchingFixture([syntheticProgram("a"), syntheticProgram("b")]),
  "options_found",
);
add(
  "WRONG-LEVEL",
  matchingFixture([syntheticProgram("wrong", { level: "master" })]),
  "no_match",
);
add(
  "WRONG-FIELD",
  matchingFixture([syntheticProgram("wrong", { topics: ["psychology"] })]),
  "no_match",
);
add(
  "LANGUAGE-PERMISSION",
  matchingFixture([syntheticProgram("hidden", { languages: ["german"] })]),
  "permission_required",
);
const alternative = matchingFixture([
  syntheticProgram("synthetic-italy", {
    country: "IT",
    cost: {
      amount: 20000,
      currency: "EUR",
      period: "year",
      coverage: "tuition_and_living",
      proof: syntheticProof(),
    },
    funding: "possible",
  }),
]);
add("COUNTRY-BUDGET-BEFORE", alternative, "permission_required");
alternative.consents = changeAlternativeConsent(
  alternative,
  "alternative-1",
  "granted",
);
add("COUNTRY-BUDGET-AFTER", alternative, "needs_verification");
alternative.consents = changeAlternativeConsent(
  alternative,
  "alternative-1",
  "revoked",
);
add("COUNTRY-BUDGET-REVOKED", alternative, "no_match");
const requiredFunding = matchingFixture([
  syntheticProgram("funding", { funding: "possible" }),
]);
requiredFunding.profile = changeSyntheticProfile(
  requiredFunding,
  "scholarshipNeed",
  "required",
);
add("SCHOLARSHIP-CONDITIONAL", requiredFunding, "permission_required");
add(
  "UNKNOWN-INSTITUTION",
  matchingFixture([
    syntheticProgram("manual", {
      rules: [
        {
          id: "manual-rule",
          kind: "manual",
          label: "Recognition needs review",
          mandatory: true,
          proof: syntheticProof(),
        },
      ],
    }),
  ]),
  "needs_verification",
);
add(
  "KNOWN-INSTITUTION-FAILURE",
  matchingFixture([
    syntheticProgram("failed", {
      rules: [
        {
          id: "qualification-rule",
          kind: "qualification",
          accepted: ["master"],
          mandatory: true,
          proof: syntheticProof(),
        },
      ],
    }),
  ]),
  "no_match",
);
add(
  "SOURCE-CONFLICT",
  matchingFixture([
    syntheticProgram("conflict", {
      rules: [
        {
          id: "qualification-rule",
          kind: "qualification",
          accepted: ["secondary"],
          mandatory: true,
          proof: syntheticProof({ status: "conflicting" }),
        },
      ],
    }),
  ]),
  "needs_verification",
);
add("NO-PROGRAMS", matchingFixture([]), "catalog_empty");
const actual = matchingFixture();
actual.asOf = "2026-10-17";
actual.catalog = readPublishedMatchingCatalog(actual.asOf);
add("ACTUAL-PUBLISHED-COMPUTING-GAP", actual, "no_match");
if (process.argv.includes("--markdown")) {
  console.log(
    "# Izvršeni matching scenariji\n\nSintetički primeri zadržavaju datum 2026-10-06. Poslednji scenario proverava stvarni published katalog na 2026-10-17: odobreni Psychology nije computing opcija. Reprodukcija: `npm run matching:demo -- --markdown`. [Algoritam](ALGORITHM.md), [dokazi](VERIFICATION.md). Broj/status su stvarno izvršeni, nisu rezultati pilota.\n",
  );
  console.log(
    "| Scenario | Očekivano / izvršeno | Prikazane opcije | Zahtevi dozvole |\n| --- | --- | --- | --- |",
  );
  for (const c of cases)
    console.log(
      `| ${c.id} | ${c.expected} / ${c.output.status} | ${c.output.options.length} | ${c.output.permissionRequests.length} |`,
    );
  for (const c of cases) {
    console.log(
      `\n## ${c.id}\n\nMode: ${c.output.mode}.\n\n\`\`\`json\n${JSON.stringify(c.output, null, 2)}\n\`\`\`\n`,
    );
  }
} else console.log(JSON.stringify(cases, null, 2));
