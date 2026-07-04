/**
 * Kicktipp knockout scoring: extra-time goals + converted penalties (combined).
 * Example: 1:1 after ET, penalties 3:4 → stored as 4:5.
 */
export function combineKnockoutScore(
  afterExtraTime: { home: number; away: number },
  penalties: { home: number; away: number },
): { home: number; away: number } {
  return {
    home: afterExtraTime.home + penalties.home,
    away: afterExtraTime.away + penalties.away,
  };
}

export function isKnockoutStage(stage: string): boolean {
  return stage !== "group";
}
