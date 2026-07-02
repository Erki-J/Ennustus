/**
 * Prindib Kicktipp EM 2024 mängupäevade referentsi ülevaate.
 * Käivita: node scripts/verify-ec-2024-matchdays.mjs
 */

import {
  EC2024_EXPECTED_MATCH_COUNTS,
  EC2024_FINAL_GROUP_PAIRS,
  EC2024_LOGIC_SUMMARY,
  EC2024_MATCHES,
  EC2028_TEMPLATE,
  groupEuro2024ByMatchday,
} from "./ec-2024-matchdays.mjs";

const rounds = groupEuro2024ByMatchday();

console.log("=== Kicktipp EM 2024 mängupäevade referents ===\n");
console.log(`Alagrupi mänge: ${EC2024_MATCHES.length}`);
console.log(`Mängupäevi: ${rounds.size}\n`);

for (const [md, matches] of [...rounds.entries()].sort((a, b) => a[0] - b[0])) {
  const groups = [...new Set(matches.map((m) => m.group))].sort().join(", ");
  console.log(`── Mängupäev ${md} (${matches.length} mängu, grupid ${groups}) ──`);
  for (const m of matches) {
    console.log(
      `  ${m.kickoffEest}  ${m.home} – ${m.away}  (Gr ${m.group})`,
    );
  }
  console.log("");
}

let ok = true;

for (const [md, expected] of Object.entries(EC2024_EXPECTED_MATCH_COUNTS)) {
  const actual = rounds.get(Number(md))?.length ?? 0;
  if (actual !== expected) {
    console.log(`⚠️  MD ${md}: ${actual} mängu (oodatud ${expected})`);
    ok = false;
  }
}

if (EC2024_MATCHES.length !== 36) {
  console.log(`⚠️  Kokku ${EC2024_MATCHES.length} mängu (oodatud 36)`);
  ok = false;
}

for (const [md, pairs] of EC2024_FINAL_GROUP_PAIRS.entries()) {
  const matchday = md + 5;
  const groups = new Set(rounds.get(matchday)?.map((m) => m.group) ?? []);
  for (const code of pairs) {
    if (!groups.has(code)) {
      console.log(`⚠️  MD ${matchday}: grupp ${code} puudub (oodatud ${pairs.join("+")})`);
      ok = false;
    }
  }
}

if (ok) {
  console.log("✓ Kõik kontrollid OK\n");
}

console.log("── Loogika kokkuvõte ──");
for (const phase of EC2024_LOGIC_SUMMARY.phases) {
  console.log(`  MD ${phase.matchdays.join(", ")}: ${phase.label} — ${phase.pattern}`);
}

console.log("\n── EM 2028 mall ──");
for (const note of EC2028_TEMPLATE.notes) {
  console.log(`  • ${note}`);
}
