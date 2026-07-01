import { TEAM_ET_TO_EN } from "@/lib/i18n/teams";

const ENGLISH_ALIASES: Record<string, string> = {
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Côte d'Ivoire": "Ivory Coast",
  "Ivory Coast": "Ivory Coast",
  "Democratic Republic of Congo": "DR Congo",
  "DR Congo": "DR Congo",
  Curacao: "Curaçao",
  Curaçao: "Curaçao",
  Turkey: "Türkiye",
  Türkiye: "Türkiye",
  Czechia: "Czech Republic",
  "Czech Republic": "Czech Republic",
  "United States": "United States",
  "South Korea": "South Korea",
  "New Zealand": "New Zealand",
  "Saudi Arabia": "Saudi Arabia",
  "South Africa": "South Africa",
  "Cape Verde": "Cape Verde",
};

const EN_TO_ET = Object.fromEntries(
  Object.entries(TEAM_ET_TO_EN).map(([et, en]) => [en, et]),
) as Record<string, string>;

export function englishTeamToEstonian(name: string): string {
  const normalized = ENGLISH_ALIASES[name] ?? name;
  return EN_TO_ET[normalized] ?? name;
}
