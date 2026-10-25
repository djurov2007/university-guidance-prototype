import { readFile } from "node:fs/promises";
import {
  validateCatalog,
  deadlineState,
  catalogDigest,
} from "../src/server/catalog/validation.ts";

const dateIndex = process.argv.indexOf("--as-of");
const asOf =
  dateIndex >= 0
    ? process.argv[dateIndex + 1]
    : new Date().toISOString().slice(0, 10);
const result = validateCatalog(
  JSON.parse(
    await readFile(
      new URL("../data/catalog/staging/catalog.v1.json", import.meta.url),
      "utf8",
    ),
  ),
  asOf,
);
if (!result.ok) {
  console.error(JSON.stringify(result.issues));
  process.exitCode = 1;
} else {
  const c = result.catalog;
  const clean = (v) => String(v).replaceAll("|", "\\|").replaceAll("\n", " ");
  const display = (v) =>
    !v
      ? "unknown (null)"
      : v.kind === "text"
        ? v.text
        : v.kind === "list"
          ? v.items.join(", ")
          : v.kind === "date"
            ? `${v.date} ${v.time ?? "time unknown"} ${v.timezone ?? "timezone unknown"}`
            : v.kind === "money"
              ? `${v.amount} ${v.currency}/${v.period} (${v.basis}); ${v.note}`
              : `${v.amount} ${v.unit}`;
  console.log(
    `# Početni katalog — pregled tvrdnji\n\nVerzija ${c.version}, staging; pregled na ${asOf}. Osam stvarnih programa, bez human approval i bez objave. Individualna podobnost nije potvrđena. Procene su odvojene od institucionalnih činjenica. Oblast/podoblast su uredničke oznake.\n\nDigest sadržaja: \`${catalogDigest(c)}\`. Izveštaj je izveden iz [JSON kataloga](../../data/catalog/staging/catalog.v1.json); promena podataka zahteva nov izveštaj i pregled.\n\n| Program | Nivo | Zemlja / grad | Kontekst |\n| --- | --- | --- | --- |`,
  );
  for (const p of c.programs)
    console.log(
      `| ${clean(p.name)} | ${p.level} | ${p.country} / ${p.city} | ${clean(c.intakes.find((i) => i.programId === p.id).label)} |`,
    );
  for (const p of c.programs) {
    console.log(
      `\n## ${p.name}\n\nID: ${p.id}. Oblast: ${p.field} / ${p.subfield} (editorial). ${p.notes}\n\n| Fact ID / polje | Vrednost / nepoznato | Kandidat i intake | Status na dan pregleda | Dokaz za ovu tvrdnju | Poslednja provera |\n| --- | --- | --- | --- | --- | --- |`,
    );
    for (const f of c.facts.filter((f) => f.programId === p.id)) {
      const evidence =
        c.evidence
          .filter((e) => e.factId === f.id)
          .map((e) => {
            const s = c.sources.find((s) => s.id === e.sourceId);
            return `[${s.id}](${s.url}) (${s.authority}, ${e.relation}; ${e.locator}; pristup ${s.accessedOn})`;
          })
          .join("<br>") || "Nema potvrdnog dokaza";
      const state =
        f.predicate === "application_deadline"
          ? `; ${deadlineState(f, c, asOf)}`
          : "";
      console.log(
        `| ${f.id} / ${f.predicate} | ${clean(display(f.value))}; ${clean(f.unknownReason ?? f.note)} | ${clean(f.candidateCategory)}; ${f.intakeId ?? "programme-wide"} | ${result.effectiveStatuses[f.id]}${state}; ${f.nature} | ${clean(evidence)} | ${f.checkedOn}, ${f.checkedBy}; human pending |`,
      );
    }
    console.log(
      `\nPreostalo unknown: ${c.facts
        .filter((f) => f.programId === p.id && f.status === "unknown")
        .map((f) => `${f.predicate} (${f.qualifier}): ${f.unknownReason}`)
        .join(
          "; ",
        )}\n\nDodatna ograničenja: ${p.notes} Troškovi su komponente, ne zbir; potvrđen uslov nije potvrđena podobnost kandidata.\n`,
    );
  }
}
