import { matchdayParam } from "@/lib/matchdays/labels";

export type OverviewColumnDef = {
  key: string;
  header: string;
  stage: string;
  matchday: number;
};

/** Kicktipp „General overview” tulbad: 1–10, Si, 16, Qu, Se, Fi */
export const OVERVIEW_COLUMN_DEFS: OverviewColumnDef[] = [
  ...Array.from({ length: 10 }, (_, index) => ({
    key: matchdayParam("group", index + 1),
    header: String(index + 1),
    stage: "group",
    matchday: index + 1,
  })),
  {
    key: matchdayParam("round_32", 1),
    header: "Si",
    stage: "round_32",
    matchday: 1,
  },
  {
    key: matchdayParam("round_16", 1),
    header: "16",
    stage: "round_16",
    matchday: 1,
  },
  {
    key: matchdayParam("quarter", 1),
    header: "Qu",
    stage: "quarter",
    matchday: 1,
  },
  {
    key: matchdayParam("semi", 1),
    header: "Se",
    stage: "semi",
    matchday: 1,
  },
  {
    key: matchdayParam("final", 1),
    header: "Fi",
    stage: "final",
    matchday: 1,
  },
];
