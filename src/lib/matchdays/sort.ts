export function stageSortOrder(stage: string): number {
  switch (stage) {
    case "group":
      return 0;
    case "legacy":
      return 0;
    case "round_32":
      return 1;
    case "round_16":
      return 2;
    case "quarter":
      return 3;
    case "semi":
      return 4;
    case "third":
      return 5;
    case "final":
      return 6;
    default:
      return 99;
  }
}

export function compareMatchdayRounds(
  a: { stage: string; matchday: number; sort_order: number },
  b: { stage: string; matchday: number; sort_order: number },
): number {
  const stageDiff = stageSortOrder(a.stage) - stageSortOrder(b.stage);
  if (stageDiff !== 0) {
    return stageDiff;
  }
  if (a.matchday !== b.matchday) {
    return a.matchday - b.matchday;
  }
  return a.sort_order - b.sort_order;
}
