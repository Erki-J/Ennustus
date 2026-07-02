/**
 * Kicktipp EM 2024 mängupäevade referents (6 gruppi, 36 alagrupi mängu).
 *
 * Allikas: Kicktipp UI (grupp „Jalgpalli EM 2024“, 2024).
 * See EI ole ametlik Kicktipp API dokumentatsioon — reverse-engineered vaatlusest.
 *
 * Erinevus MM 2026 loogikast (scripts/kicktipp-matchdays.mjs):
 * - MM: openfootball Matchday 1–17 → 10 Kicktipp MD-d
 * - EM: kalendripõhised plokid + viimased 3 MD-d = 2 grupi viimane voor (4 mängu/MD)
 *
 * EM 2028 jaoks: uuenda EC2024_MATCHES struktuuri või lisa ec-2028-matchdays.mjs,
 * kui Kicktipp avaldab uue ajakava.
 */

/** @typedef {{ matchday: number, home: string, away: string, group: string, kickoffEest: string }} Euro2024Match */

/**
 * Kicktipp EM 2024 mängupäevade jaotus (ootused kontrollskriptile).
 * @type {Record<number, number>}
 */
export const EC2024_EXPECTED_MATCH_COUNTS = {
  1: 7,
  2: 5,
  3: 6,
  4: 6,
  5: 4,
  6: 4,
  7: 4,
};

/** Viimased alagrupi MD-d: 2 grupi viimane voor samal MD-l. */
export const EC2024_FINAL_GROUP_PAIRS = [
  ["A", "B"],
  ["C", "D"],
  ["E", "F"],
];

/**
 * EM 2028 mall (6 gruppi, sarnane formaat 2024-ga).
 * Täida matchday ja kickoff, kui ajakava on teada.
 */
export const EC2028_TEMPLATE = {
  slug: "ec-2028",
  groupCount: 6,
  groupStageMatchdays: 7,
  expectedGroupMatches: 36,
  expectedFinalRoundPattern: EC2024_FINAL_GROUP_PAIRS,
  notes: [
    "Esimesed MD-d: kalendripõhised plokid (mitte UEFA voor 1/2/3).",
    "Viimased 3 MD-d: grupipaaride viimane voor, 4 mängu/MD.",
    "Knockout: iga voor eraldi vahekaart (nagu MM-il).",
  ],
};

/**
 * Kõik 36 alagrupi mängu Kicktipp MD järgi.
 * kickoffEest = Kicktippis nähtud aeg (EEST, UTC+3).
 * @type {Euro2024Match[]}
 */
export const EC2024_MATCHES = [
  // ── MD 1 (14.–16.06, 7 mängu) ──
  { matchday: 1, home: "Germany", away: "Scotland", group: "A", kickoffEest: "2024-06-14 22:00" },
  { matchday: 1, home: "Hungary", away: "Switzerland", group: "A", kickoffEest: "2024-06-15 16:00" },
  { matchday: 1, home: "Spain", away: "Croatia", group: "B", kickoffEest: "2024-06-15 19:00" },
  { matchday: 1, home: "Italy", away: "Albania", group: "B", kickoffEest: "2024-06-15 22:00" },
  { matchday: 1, home: "Poland", away: "Netherlands", group: "D", kickoffEest: "2024-06-16 16:00" },
  { matchday: 1, home: "Slovenia", away: "Denmark", group: "C", kickoffEest: "2024-06-16 19:00" },
  { matchday: 1, home: "Serbia", away: "England", group: "C", kickoffEest: "2024-06-16 22:00" },

  // ── MD 2 (17.–18.06, 5 mängu) ──
  { matchday: 2, home: "Romania", away: "Ukraine", group: "E", kickoffEest: "2024-06-17 16:00" },
  { matchday: 2, home: "Belgium", away: "Slovakia", group: "E", kickoffEest: "2024-06-17 19:00" },
  { matchday: 2, home: "Austria", away: "France", group: "D", kickoffEest: "2024-06-17 22:00" },
  { matchday: 2, home: "Türkiye", away: "Georgia", group: "F", kickoffEest: "2024-06-18 19:00" },
  { matchday: 2, home: "Portugal", away: "Czech Republic", group: "F", kickoffEest: "2024-06-18 22:00" },

  // ── MD 3 (19.–20.06, 6 mängu) ──
  { matchday: 3, home: "Croatia", away: "Albania", group: "B", kickoffEest: "2024-06-19 16:00" },
  { matchday: 3, home: "Germany", away: "Hungary", group: "A", kickoffEest: "2024-06-19 19:00" },
  { matchday: 3, home: "Scotland", away: "Switzerland", group: "A", kickoffEest: "2024-06-19 22:00" },
  { matchday: 3, home: "Slovenia", away: "Serbia", group: "C", kickoffEest: "2024-06-20 16:00" },
  { matchday: 3, home: "Denmark", away: "England", group: "C", kickoffEest: "2024-06-20 19:00" },
  { matchday: 3, home: "Spain", away: "Italy", group: "B", kickoffEest: "2024-06-20 22:00" },

  // ── MD 4 (21.–22.06, 6 mängu) ──
  { matchday: 4, home: "Slovakia", away: "Ukraine", group: "E", kickoffEest: "2024-06-21 16:00" },
  { matchday: 4, home: "Poland", away: "Austria", group: "D", kickoffEest: "2024-06-21 19:00" },
  { matchday: 4, home: "Netherlands", away: "France", group: "D", kickoffEest: "2024-06-21 22:00" },
  { matchday: 4, home: "Georgia", away: "Czech Republic", group: "F", kickoffEest: "2024-06-22 16:00" },
  { matchday: 4, home: "Türkiye", away: "Portugal", group: "F", kickoffEest: "2024-06-22 19:00" },
  { matchday: 4, home: "Belgium", away: "Romania", group: "E", kickoffEest: "2024-06-22 22:00" },

  // ── MD 5 (23.–24.06, 4 mängu) — grupp A + B viimane voor ──
  { matchday: 5, home: "Switzerland", away: "Germany", group: "A", kickoffEest: "2024-06-23 22:00" },
  { matchday: 5, home: "Scotland", away: "Hungary", group: "A", kickoffEest: "2024-06-23 22:00" },
  { matchday: 5, home: "Croatia", away: "Italy", group: "B", kickoffEest: "2024-06-24 22:00" },
  { matchday: 5, home: "Albania", away: "Spain", group: "B", kickoffEest: "2024-06-24 22:00" },

  // ── MD 6 (25.06, 4 mängu) — grupp C + D viimane voor ──
  { matchday: 6, home: "Netherlands", away: "Austria", group: "D", kickoffEest: "2024-06-25 19:00" },
  { matchday: 6, home: "France", away: "Poland", group: "D", kickoffEest: "2024-06-25 19:00" },
  { matchday: 6, home: "Denmark", away: "Serbia", group: "C", kickoffEest: "2024-06-25 22:00" },
  { matchday: 6, home: "England", away: "Slovenia", group: "C", kickoffEest: "2024-06-25 22:00" },

  // ── MD 7 (26.06, 4 mängu) — grupp E + F viimane voor ──
  { matchday: 7, home: "Ukraine", away: "Belgium", group: "E", kickoffEest: "2024-06-26 19:00" },
  { matchday: 7, home: "Slovakia", away: "Romania", group: "E", kickoffEest: "2024-06-26 19:00" },
  { matchday: 7, home: "Czech Republic", away: "Türkiye", group: "F", kickoffEest: "2024-06-26 22:00" },
  { matchday: 7, home: "Georgia", away: "Portugal", group: "F", kickoffEest: "2024-06-26 22:00" },
];

const MATCH_KEY = (home, away) => `${home}\0${away}`;

/** @type {Map<string, number>} */
const matchdayByPair = new Map(
  EC2024_MATCHES.map((m) => [MATCH_KEY(m.home, m.away), m.matchday]),
);

/**
 * Leia Kicktipp mängupäev meeskondade paari järgi (EM 2024).
 * @returns {number | null}
 */
export function kicktippEuro2024Matchday(home, away) {
  return matchdayByPair.get(MATCH_KEY(home, away)) ?? null;
}

/**
 * Grupeeri mängud mängupäevade kaupa.
 * @returns {Map<number, Euro2024Match[]>}
 */
export function groupEuro2024ByMatchday() {
  /** @type {Map<number, Euro2024Match[]>} */
  const rounds = new Map();

  for (const match of EC2024_MATCHES) {
    const list = rounds.get(match.matchday) ?? [];
    list.push(match);
    rounds.set(match.matchday, list);
  }

  for (const list of rounds.values()) {
    list.sort((a, b) => a.kickoffEest.localeCompare(b.kickoffEest));
  }

  return rounds;
}

/**
 * Kirjeldus EM 2024 Kicktipp loogikast (inimese loetav kokkuvõte).
 */
export const EC2024_LOGIC_SUMMARY = {
  totalGroupMatches: 36,
  matchdayCount: 7,
  phases: [
    {
      matchdays: [1, 2],
      label: "Turniiri ava",
      pattern: "Järjestikused kalendripäevad, erinev arv mänge (7 + 5)",
    },
    {
      matchdays: [3, 4],
      label: "Keskmine faas",
      pattern: "~2 kalendripäeva = 6 mängu/MD",
    },
    {
      matchdays: [5, 6, 7],
      label: "Viimane alagrupi voor",
      pattern: "2 gruppi/MD, 4 mängu/MD (A+B, C+D, E+F)",
    },
  ],
};
