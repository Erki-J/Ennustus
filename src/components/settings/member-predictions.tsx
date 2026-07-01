"use client";

import { useCallback, useState, useTransition } from "react";
import { SettingsMemberBonusEditor } from "@/components/settings/member-bonus-editor";
import { SettingsPredictionEditor } from "@/components/settings/prediction-editor";
import { formatDateTime } from "@/lib/i18n/format";
import { useLocale, useTranslations } from "@/lib/i18n/provider";
import { formatMatchTeams } from "@/lib/i18n/teams";
import type { BonusQuestion } from "@/lib/bonus/queries";
import type { BonusTeamOptions } from "@/lib/bonus/team-options";
import { loadAdminMemberPredictionsPanel } from "@/lib/settings/actions";
import { ADMIN_PREDICTIONS_BONUS_SECTION } from "@/lib/settings/predictions";

export type MemberOption = {
  user_id: string;
  nickname: string;
};

export type RoundOption = {
  key: string;
  label: string;
};

export type MatchOption = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
};

export type PredictionOption = {
  match_id: string;
  home_goals: number;
  away_goals: number;
};

export type BonusPredictionOption = {
  question: BonusQuestion;
  answer: string | null;
  points: number;
};

type SettingsMemberPredictionsProps = {
  groupId: string;
  members: MemberOption[];
  rounds: RoundOption[];
  initialUserId: string;
  initialSection: string;
  initialMatches: MatchOption[];
  initialPredictions: PredictionOption[];
  initialBonusPredictions: BonusPredictionOption[];
  initialBonusPoints: number;
  initialTeamOptions: BonusTeamOptions;
};

function buildPredictionsUrl(
  groupId: string,
  playerId: string,
  section: string,
) {
  const params = new URLSearchParams();
  params.set("player", playerId);
  params.set("section", section);
  return `/groups/${groupId}/settings/predictions?${params.toString()}`;
}

export function SettingsMemberPredictions({
  groupId,
  members,
  rounds,
  initialUserId,
  initialSection,
  initialMatches,
  initialPredictions,
  initialBonusPredictions,
  initialBonusPoints,
  initialTeamOptions,
}: SettingsMemberPredictionsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [activeUserId, setActiveUserId] = useState(initialUserId);
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [matches, setMatches] = useState(initialMatches);
  const [predictions, setPredictions] = useState(initialPredictions);
  const [bonusPredictions, setBonusPredictions] = useState(initialBonusPredictions);
  const [bonusPoints, setBonusPoints] = useState(initialBonusPoints);
  const [teamOptions, setTeamOptions] = useState(initialTeamOptions);

  const predictionMap = new Map(
    predictions.map((prediction) => [prediction.match_id, prediction]),
  );
  const isBonusSection = selectedSection === ADMIN_PREDICTIONS_BONUS_SECTION;

  const loadPanel = useCallback(
    (userId: string, section: string) => {
      startTransition(async () => {
        const data = await loadAdminMemberPredictionsPanel(groupId, userId, section);
        if (!data) {
          return;
        }

        setSelectedSection(data.selectedSection);
        setMatches(data.matches);
        setPredictions(data.predictions);
        setBonusPredictions(data.bonusPredictions);
        setBonusPoints(data.bonusPoints);
        setTeamOptions(data.teamOptions);
        window.history.replaceState(
          null,
          "",
          buildPredictionsUrl(groupId, userId, data.selectedSection),
        );
      });
    },
    [groupId],
  );

  if (members.length === 0) {
    return <p className="text-sm text-zinc-500">{t("settings.noMembers")}</p>;
  }

  const activeMember = members.find((member) => member.user_id === activeUserId);

  function handleMemberChange(userId: string) {
    setActiveUserId(userId);
    loadPanel(userId, selectedSection);
  }

  function handleSectionChange(section: string) {
    setSelectedSection(section);
    loadPanel(activeUserId, section);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="prediction-member"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            {t("common.player")}
          </label>
          <select
            id="prediction-member"
            value={activeUserId}
            onChange={(event) => handleMemberChange(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.nickname}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="prediction-section"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            {t("settings.section")}
          </label>
          <select
            id="prediction-section"
            value={selectedSection}
            onChange={(event) => handleSectionChange(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {rounds.map((round) => (
              <option key={round.key} value={round.key}>
                {round.label}
              </option>
            ))}
            <option value={ADMIN_PREDICTIONS_BONUS_SECTION}>
              {t("settings.bonusSection")}
            </option>
          </select>
        </div>
      </div>

      {activeMember && (
        <div
          key={`${activeUserId}:${selectedSection}`}
          className={`space-y-2 ${isPending ? "opacity-60" : ""}`}
        >
          <p className="text-sm text-zinc-600">
            {isBonusSection ? t("settings.bonusSection") : t("settings.predictionsSection")}{" "}
            <span className="font-medium text-zinc-900">{activeMember.nickname}</span>
          </p>

          {isBonusSection ? (
            bonusPredictions.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("settings.noBonusQuestions")}</p>
            ) : (
              bonusPredictions.map(({ question, answer }) => (
                <SettingsMemberBonusEditor
                  key={`${activeUserId}:${question.id}`}
                  groupId={groupId}
                  userId={activeUserId}
                  question={question}
                  answer={answer}
                  bonusPoints={bonusPoints}
                  teamOptions={teamOptions}
                />
              ))
            )
          ) : matches.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("settings.noMatchesRound")}</p>
          ) : (
            matches.map((match) => {
              const prediction = predictionMap.get(match.id);
              return (
                <SettingsPredictionEditor
                  key={`${activeUserId}:${match.id}`}
                  groupId={groupId}
                  userId={activeUserId}
                  matchId={match.id}
                  matchLabel={formatMatchTeams(match.home_team, match.away_team, locale)}
                  kickoffLabel={formatDateTime(match.kickoff_at, locale)}
                  homeGoals={prediction?.home_goals ?? null}
                  awayGoals={prediction?.away_goals ?? null}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
