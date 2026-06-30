export function matchdayParam(stage: string, matchday: number): string {
  return `${stage}-${matchday}`;
}

export function parseMatchdayParam(
  param: string,
): { stage: string; matchday: number } | null {
  const match = param.match(/^(.+)-(\d+)$/);
  if (!match) {
    return null;
  }
  return { stage: match[1], matchday: Number(match[2]) };
}

export function matchdayLabel(stage: string, matchday: number): string {
  switch (stage) {
    case "group":
      return `Mängupäev ${matchday}`;
    case "legacy":
      return "Testmängud";
    case "round_32":
      return "1/16 finaal";
    case "round_16":
      return "Kaheksandikfinaal";
    case "quarter":
      return "Veerandfinaal";
    case "semi":
      return "Poolfinaal";
    case "third":
      return "3. koha mäng";
    case "final":
      return "Finaal";
    default:
      return `${stage} ${matchday}`;
  }
}

export function stageLabel(stage: string): string {
  switch (stage) {
    case "group":
      return "Alagrupp";
    case "legacy":
      return "Testmängud";
    case "round_32":
      return "1/16 finaal";
    case "round_16":
      return "Kaheksandikfinaal";
    case "quarter":
      return "Veerandfinaal";
    case "semi":
      return "Poolfinaal";
    case "third":
      return "3. koha mäng";
    case "final":
      return "Finaal";
    default:
      return stage;
  }
}
