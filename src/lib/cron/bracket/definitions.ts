import { englishTeamToEstonian } from "@/lib/cron/scores/team-names";

export const KNOCKOUT_PLACEHOLDER = "Tundmatu";

export type BracketSlot =
  | { type: "team"; name: string }
  | { type: "winner"; matchNum: number }
  | { type: "loser"; matchNum: number };

export type BracketMatchDef = {
  matchNum: number;
  home: BracketSlot;
  away: BracketSlot;
};

function parseBracketTeam(raw: string): BracketSlot {
  const winner = raw.match(/^W(\d+)$/);
  if (winner) {
    return { type: "winner", matchNum: Number(winner[1]) };
  }

  const loser = raw.match(/^L(\d+)$/);
  if (loser) {
    return { type: "loser", matchNum: Number(loser[1]) };
  }

  return { type: "team", name: englishTeamToEstonian(raw) };
}

function bracketMatch(
  matchNum: number,
  home: string,
  away: string,
): BracketMatchDef {
  return {
    matchNum,
    home: parseBracketTeam(home),
    away: parseBracketTeam(away),
  };
}

/** WC 2026 knockout bracket (openfootball worldcup.json, match nums 73–104). */
export const WC2026_KNOCKOUT_BRACKET: BracketMatchDef[] = [
  bracketMatch(73, "South Africa", "Canada"),
  bracketMatch(74, "Germany", "Paraguay"),
  bracketMatch(75, "Netherlands", "Morocco"),
  bracketMatch(76, "Brazil", "Japan"),
  bracketMatch(77, "France", "Sweden"),
  bracketMatch(78, "Ivory Coast", "Norway"),
  bracketMatch(79, "Mexico", "Ecuador"),
  bracketMatch(80, "England", "DR Congo"),
  bracketMatch(81, "United States", "Bosnia & Herzegovina"),
  bracketMatch(82, "Belgium", "Senegal"),
  bracketMatch(83, "Portugal", "Croatia"),
  bracketMatch(84, "Spain", "Austria"),
  bracketMatch(85, "Switzerland", "Algeria"),
  bracketMatch(86, "Argentina", "Cape Verde"),
  bracketMatch(87, "Colombia", "Ghana"),
  bracketMatch(88, "Australia", "Egypt"),
  bracketMatch(89, "W74", "W77"),
  bracketMatch(90, "Canada", "W75"),
  bracketMatch(91, "W76", "W78"),
  bracketMatch(92, "W79", "W80"),
  bracketMatch(93, "W83", "W84"),
  bracketMatch(94, "W81", "W82"),
  bracketMatch(95, "W86", "W88"),
  bracketMatch(96, "W85", "W87"),
  bracketMatch(97, "W89", "W90"),
  bracketMatch(98, "W93", "W94"),
  bracketMatch(99, "W91", "W92"),
  bracketMatch(100, "W95", "W96"),
  bracketMatch(101, "W97", "W98"),
  bracketMatch(102, "W99", "W100"),
  bracketMatch(103, "L101", "L102"),
  bracketMatch(104, "W101", "W102"),
];

export function isDynamicBracketSlot(slot: BracketSlot): boolean {
  return slot.type === "winner" || slot.type === "loser";
}

export function isTeamPlaceholder(name: string): boolean {
  return (
    name === KNOCKOUT_PLACEHOLDER ||
    /^W\d+$/.test(name) ||
    /^L\d+$/.test(name)
  );
}
