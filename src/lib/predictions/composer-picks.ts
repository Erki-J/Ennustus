/** Composeri (AI) ennustuste loogika — Brasiilia MM favoriit. */

const TEAM_STRENGTH: Record<string, number> = {
  Brasiilia: 10,
  Argentina: 9,
  Prantsusmaa: 9,
  Inglismaa: 8,
  Hispaania: 8,
  Saksamaa: 8,
  Portugal: 7,
  Holland: 7,
  Belgia: 7,
  Horvaatia: 6,
  Uruguay: 6,
  Colombia: 6,
  Mehhiko: 5,
  USA: 5,
  Jaapan: 5,
  Maroko: 5,
  Šveits: 5,
  Norra: 5,
  Senegal: 5,
  Elevandiluurannik: 4,
  Kanada: 4,
  Ecuador: 4,
  Austria: 4,
  Roheneemesaared: 3,
  Egiptus: 3,
  Austraalia: 3,
  Paraguay: 3,
  Kongo: 3,
  "Kongo DV": 3,
  "Bosnia ja Hertsegoviina": 3,
  Ghana: 3,
  Alžeeria: 3,
  Rootsi: 4,
};

const GROUP_WINNERS: Record<string, string> = {
  A: "Mehhiko",
  B: "Šveits",
  C: "Brasiilia",
  D: "USA",
  E: "Saksamaa",
  F: "Holland",
  G: "Belgia",
  H: "Hispaania",
  I: "Prantsusmaa",
  J: "Argentina",
  K: "Colombia",
  L: "Inglismaa",
};

export function composerMatchPrediction(
  homeTeam: string,
  awayTeam: string,
): [number, number] {
  const home = TEAM_STRENGTH[homeTeam] ?? 4;
  const away = TEAM_STRENGTH[awayTeam] ?? 4;

  if (homeTeam === "Brasiilia") {
    return away <= 4 ? [3, 0] : [2, 1];
  }

  if (awayTeam === "Brasiilia") {
    return home <= 4 ? [0, 2] : [1, 2];
  }

  if (home >= away + 3) {
    return [2, 0];
  }

  if (away >= home + 3) {
    return [0, 2];
  }

  if (home > away) {
    return [2, 1];
  }

  if (away > home) {
    return [1, 2];
  }

  return [1, 1];
}

export function composerBonusAnswer(
  questionType: string,
  groupCode: string | null,
  semifinalIndex: number,
): string | null {
  if (questionType === "group_winner" && groupCode) {
    return GROUP_WINNERS[groupCode] ?? null;
  }

  if (questionType === "tournament_winner") {
    return "Brasiilia";
  }

  if (questionType === "top_scorer") {
    return "Brasiilia";
  }

  if (questionType === "semifinalist") {
    const picks = ["Brasiilia", "Argentina", "Prantsusmaa", "Inglismaa"];
    const index = Math.max(0, semifinalIndex - 1);
    return picks[index] ?? "Brasiilia";
  }

  return null;
}

export function isPredictableTeamName(name: string): boolean {
  return (
    name.length > 0 &&
    name !== "Tundmatu" &&
    !/^W\d+$/.test(name) &&
    !/^L\d+$/.test(name)
  );
}
