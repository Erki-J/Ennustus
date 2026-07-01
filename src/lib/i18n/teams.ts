import type { AppLocale } from "@/lib/settings/locale";
import { usesEnglishTeamNames, getTeamSortLocale } from "@/lib/settings/locale";

/** DB stores Estonian team names; map to English for display. */
export const TEAM_ET_TO_EN: Record<string, string> = {
  Mehhiko: "Mexico",
  "Lõuna-Aafrika": "South Africa",
  "Lõuna-Korea": "South Korea",
  Tšehhi: "Czech Republic",
  Kanada: "Canada",
  "Bosnia ja Hertsegoviina": "Bosnia and Herzegovina",
  Katar: "Qatar",
  Šveits: "Switzerland",
  Brasiilia: "Brazil",
  Maroko: "Morocco",
  Haiti: "Haiti",
  Šotimaa: "Scotland",
  USA: "United States",
  Paraguay: "Paraguay",
  Austraalia: "Australia",
  Türgi: "Türkiye",
  Saksamaa: "Germany",
  Curaçao: "Curaçao",
  Elevandiluurannik: "Ivory Coast",
  Ecuador: "Ecuador",
  Holland: "Netherlands",
  Jaapan: "Japan",
  Rootsi: "Sweden",
  Tuneesia: "Tunisia",
  Belgia: "Belgium",
  Egiptus: "Egypt",
  Iraan: "Iran",
  "Uus-Meremaa": "New Zealand",
  Hispaania: "Spain",
  Roheneemesaared: "Cape Verde",
  "Saudi Araabia": "Saudi Arabia",
  Uruguay: "Uruguay",
  Prantsusmaa: "France",
  Senegal: "Senegal",
  Iraak: "Iraq",
  Norra: "Norway",
  Argentina: "Argentina",
  Alžeeria: "Algeria",
  Austria: "Austria",
  Jordaania: "Jordan",
  Portugal: "Portugal",
  "Kongo DV": "DR Congo",
  Usbekistan: "Uzbekistan",
  Colombia: "Colombia",
  Inglismaa: "England",
  Horvaatia: "Croatia",
  Ghana: "Ghana",
  Panama: "Panama",
  Sudaan: "Sudan",
  Eesti: "Estonia",
  Tundmatu: "TBD",
};

export function translateTeamName(name: string, locale: AppLocale): string {
  if (usesEnglishTeamNames(locale)) {
    return TEAM_ET_TO_EN[name] ?? name;
  }
  return name;
}

export function translateTeamList(names: string[], locale: AppLocale): string[] {
  return names.map((name) => translateTeamName(name, locale));
}

export function sortTeamNames(names: string[], locale: AppLocale): string[] {
  const collator = new Intl.Collator(getTeamSortLocale(locale));
  return [...names].sort((a, b) =>
    collator.compare(translateTeamName(a, locale), translateTeamName(b, locale)),
  );
}

export function formatMatchTeams(
  homeTeam: string,
  awayTeam: string,
  locale: AppLocale,
): string {
  return `${translateTeamName(homeTeam, locale)} – ${translateTeamName(awayTeam, locale)}`;
}
