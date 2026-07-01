import type { AppLocale } from "@/lib/settings/locale";
import { getMessageLocale } from "@/lib/settings/locale";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";

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

function labels(locale: AppLocale) {
  return createTranslator(getMessages(getMessageLocale(locale)));
}

export function matchdayLabel(
  stage: string,
  matchday: number,
  locale: AppLocale = "et",
): string {
  const t = labels(locale);

  switch (stage) {
    case "group":
      return t("matchdays.matchday", { n: matchday });
    case "legacy":
      return t("matchdays.testMatches");
    case "round_32":
      return t("matchdays.round32");
    case "round_16":
      return t("matchdays.round16");
    case "quarter":
      return t("matchdays.quarter");
    case "semi":
      return t("matchdays.semi");
    case "third":
      return t("matchdays.third");
    case "final":
      return t("matchdays.final");
    default:
      return `${stage} ${matchday}`;
  }
}

export function stageLabel(stage: string, locale: AppLocale = "et"): string {
  const t = labels(locale);

  switch (stage) {
    case "group":
      return t("matchdays.groupStage");
    case "legacy":
      return t("matchdays.testMatches");
    case "round_32":
      return t("matchdays.round32");
    case "round_16":
      return t("matchdays.round16");
    case "quarter":
      return t("matchdays.quarter");
    case "semi":
      return t("matchdays.semi");
    case "third":
      return t("matchdays.third");
    case "final":
      return t("matchdays.final");
    default:
      return stage;
  }
}
