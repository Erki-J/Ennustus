export type BonusTeamOptions = {
  allTeams: string[];
  teamsByGroup: Record<string, string[]>;
};

export type BonusQuestionTeamRef = {
  question_type: "group_winner" | "tournament_winner" | "top_scorer" | "semifinalist";
  group_code: string | null;
};

export function getTeamOptionsForQuestion(
  question: BonusQuestionTeamRef,
  teamOptions: BonusTeamOptions,
): string[] {
  if (question.question_type === "group_winner" && question.group_code) {
    return teamOptions.teamsByGroup[question.group_code] ?? [];
  }

  return teamOptions.allTeams;
}

export function teamOptionsWithCurrent(
  options: string[],
  currentValue: string | null | undefined,
): string[] {
  if (!currentValue || options.includes(currentValue)) {
    return options;
  }

  return [currentValue, ...options];
}
