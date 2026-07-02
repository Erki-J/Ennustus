import { TEAM_ET_TO_EN } from "@/lib/i18n/teams";

const ENGLISH_ALIASES: Record<string, string> = {
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Côte d'Ivoire": "Ivory Coast",
  "Ivory Coast": "Ivory Coast",
  "Democratic Republic of Congo": "DR Congo",
  "DR Congo": "DR Congo",
  "Congo DR": "DR Congo",
  Curacao: "Curaçao",
  Curaçao: "Curaçao",
  Turkey: "Türkiye",
  Türkiye: "Türkiye",
  Czechia: "Czech Republic",
  "Czech Republic": "Czech Republic",
  "United States": "United States",
  USA: "United States",
  "South Korea": "South Korea",
  "New Zealand": "New Zealand",
  "Saudi Arabia": "Saudi Arabia",
  "South Africa": "South Africa",
  "Cape Verde": "Cape Verde",
  "Cabo Verde": "Cape Verde",
  "Korea Republic": "South Korea",
  "IR Iran": "Iran",
};

const EN_TO_ET = Object.fromEntries(
  Object.entries(TEAM_ET_TO_EN).map(([et, en]) => [en, et]),
) as Record<string, string>;

function normalizeEnglishName(name: string): string {
  return ENGLISH_ALIASES[name] ?? name;
}

export function englishTeamToEstonian(name: string): string {
  const normalized = normalizeEnglishName(name);
  return EN_TO_ET[normalized] ?? name;
}

export function matchesTeamName(dbName: string, englishName: string): boolean {
  return englishTeamToEstonian(englishName) === dbName;
}
