"use client";

import { useCallback, useMemo, useState } from "react";
import { SettingsMemberBonusEditor } from "@/components/settings/member-bonus-editor";
import { SettingsPredictionEditor } from "@/components/settings/prediction-editor";
import { formatDateTime } from "@/lib/i18n/format";
import { useLocale, useTranslations } from "@/lib/i18n/provider";
import { formatMatchTeams } from "@/lib/i18n/teams";
import type { BonusQuestion } from "@/lib/bonus/queries";
import type { BonusTeamOptions } from "@/lib/bonus/team-options";
import type { AdminBonusPanel } from "@/lib/settings/actions";
import {
  ADMIN_PREDICTIONS_BONUS_SECTION,
  buildAdminMatchPredictionsPanel,
  type AdminPredictionEntry,
  type AdminRoundMatches,
} from "@/lib/settings/predictions";

export type MemberOption = {
  user_id: string;
  nickname: string;
};

export type RoundOption = {
  key: string;
  label: string;
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
  roundsWithMatches: AdminRoundMatches[];
  predictionMap: Record<string, AdminPredictionEntry>;
  bonusPanelsByUser: Record<string, AdminBonusPanel>;
  initialUserId: string;
  initialSection: string;
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

const emptyBonusPanel: AdminBonusPanel = {
  bonusPredictions: [],
  bonusPoints: 0,
  teamOptions: { allTeams: [], teamsByGroup: {} },
};

export function SettingsMemberPredictions({
  groupId,
  members,
  rounds,
  roundsWithMatches,
  predictionMap: initialPredictionMap,
  bonusPanelsByUser,
  initialUserId,
  initialSection,
}: SettingsMemberPredictionsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [predictionMap, setPredictionMap] = useState(initialPredictionMap);
  const [activeUserId, setActiveUserId] = useState(initialUserId);
  const [selectedSection, setSelectedSection] = useState(initialSection);

  const isBonusSection = selectedSection === ADMIN_PREDICTIONS_BONUS_SECTION;

  const matchPanel = useMemo(() => {
    if (isBonusSection) {
      return null;
    }
    return buildAdminMatchPredictionsPanel(
      activeUserId,
      selectedSection,
      roundsWithMatches,
      predictionMap,
    );
  }, [activeUserId, isBonusSection, predictionMap, roundsWithMatches, selectedSection]);

  const bonusPanel = useMemo(
    () => bonusPanelsByUser[activeUserId] ?? emptyBonusPanel,
    [activeUserId, bonusPanelsByUser],
  );

  const syncUrl = useCallback(
    (userId: string, section: string) => {
      window.history.replaceState(
        null,
        "",
        buildPredictionsUrl(groupId, userId, section),
      );
    },
    [groupId],
  );

  const handlePredictionSaved = useCallback(
    (matchId: string, homeGoals: number, awayGoals: number) => {
      setPredictionMap((current) => ({
        ...current,
        [`${activeUserId}:${matchId}`]: {
          home_goals: homeGoals,
          away_goals: awayGoals,
        },
      }));
    },
    [activeUserId],
  );

  const predictionLookup = useMemo(
    () =>
      new Map(
        (matchPanel?.predictions ?? []).map((prediction) => [
          prediction.match_id,
          prediction,
        ]),
      ),
    [matchPanel?.predictions],
  );

  if (members.length === 0) {
    return <p className="text-sm text-zinc-500">{t("settings.noMembers")}</p>;
  }

  const activeMember = members.find((member) => member.user_id === activeUserId);

  function handleMemberChange(userId: string) {
    setActiveUserId(userId);
    syncUrl(userId, selectedSection);
  }

  function handleSectionChange(section: string) {
    setSelectedSection(section);
    syncUrl(activeUserId, section);
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
        <div className="space-y-2">
          <p className="text-sm text-zinc-600">
            {isBonusSection ? t("settings.bonusSection") : t("settings.predictionsSection")}{" "}
            <span className="font-medium text-zinc-900">{activeMember.nickname}</span>
          </p>

          {isBonusSection ? (
            bonusPanel.bonusPredictions.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("settings.noBonusQuestions")}</p>
            ) : (
              bonusPanel.bonusPredictions.map(({ question, answer }) => (
                <SettingsMemberBonusEditor
                  key={`${activeUserId}:${question.id}`}
                  groupId={groupId}
                  userId={activeUserId}
                  question={question}
                  answer={answer}
                  bonusPoints={bonusPanel.bonusPoints}
                  teamOptions={bonusPanel.teamOptions}
                />
              ))
            )
          ) : !matchPanel || matchPanel.matches.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("settings.noMatchesRound")}</p>
          ) : (
            matchPanel.matches.map((match) => {
              const prediction = predictionLookup.get(match.id);
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
                  onSaved={handlePredictionSaved}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
