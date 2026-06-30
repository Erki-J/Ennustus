import type { BonusQuestion } from "@/lib/bonus/queries";

export function bonusQuestionAbbr(
  question: BonusQuestion,
  semifinalIndex?: number,
): string {
  switch (question.question_type) {
    case "tournament_winner":
      return "WC";
    case "top_scorer":
      return "Tor";
    case "group_winner":
      return `Gr ${question.group_code ?? "?"}`;
    case "semifinalist":
      return `SF${semifinalIndex ?? "?"}`;
    default:
      return "?";
  }
}

export function buildQuestionAbbrs(questions: BonusQuestion[]): string[] {
  let semifinalCounter = 0;
  return questions.map((question) => {
    if (question.question_type === "semifinalist") {
      semifinalCounter += 1;
      return bonusQuestionAbbr(question, semifinalCounter);
    }
    return bonusQuestionAbbr(question);
  });
}

export function abbreviateAnswer(answer: string): string {
  const trimmed = answer.trim();
  if (!trimmed) {
    return "—";
  }

  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map((word) => word.slice(0, 3).toUpperCase())
      .join("");
  }

  return trimmed.slice(0, 3).toUpperCase();
}
