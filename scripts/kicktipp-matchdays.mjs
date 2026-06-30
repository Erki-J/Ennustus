/**
 * Kicktipp kasutab alagrupis 10 mängupäeva (mitte 17 openfootball päeva).
 * Iga mängupäev on mitme kalendripäeva mängude kogum.
 *
 * MD1  → OF 1–3   (8 mängu)
 * MD2  → OF 4–5   (8)
 * MD3  → OF 6–7   (8)
 * MD4  → OF 8–9   (8)
 * MD5  → OF 10–11 (8)
 * MD6  → OF 12–13 (8)
 * MD7  → OF 14    (6)
 * MD8  → OF 15    (6)
 * MD9  → OF 16    (6)
 * MD10 → OF 17    (6)
 */
export function openfootballMatchday(round) {
  const match = round.match(/Matchday\s+(\d+)/i);
  return match ? Number(match[1]) : 1;
}

export function kicktippGroupMatchday(openfootballDay) {
  if (openfootballDay <= 3) return 1;
  if (openfootballDay <= 5) return 2;
  if (openfootballDay <= 7) return 3;
  if (openfootballDay <= 9) return 4;
  if (openfootballDay <= 11) return 5;
  if (openfootballDay <= 13) return 6;
  if (openfootballDay === 14) return 7;
  if (openfootballDay === 15) return 8;
  if (openfootballDay === 16) return 9;
  return 10;
}

export function stageSortOrder(stage) {
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
