"use client";

import { useRouter } from "next/navigation";
import { SettingsMemberBonusEditor } from "@/components/settings/member-bonus-editor";
import { SettingsPredictionEditor } from "@/components/settings/prediction-editor";
import type { BonusQuestion } from "@/lib/bonus/queries";
import type { BonusTeamOptions } from "@/lib/bonus/team-options";

export const ADMIN_PREDICTIONS_BONUS_SECTION = "bonus";

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
  selectedSection: string;
  matches: MatchOption[];
  predictions: PredictionOption[];
  bonusPredictions: BonusPredictionOption[];
  bonusPoints: number;
  teamOptions: BonusTeamOptions;
  selectedUserId: string | null;
};

function formatKickoff(kickoffAt: string) {
  return new Intl.DateTimeFormat("et-EE", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(kickoffAt));
}

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
  selectedSection,
  matches,
  predictions,
  bonusPredictions,
  bonusPoints,
  teamOptions,
  selectedUserId,
}: SettingsMemberPredictionsProps) {
  const router = useRouter();
  const predictionMap = new Map(
    predictions.map((prediction) => [prediction.match_id, prediction]),
  );
  const isBonusSection = selectedSection === ADMIN_PREDICTIONS_BONUS_SECTION;

  if (members.length === 0) {
    return <p className="text-sm text-zinc-500">Grupis pole mängijaid.</p>;
  }

  const activeUserId = selectedUserId ?? members[0].user_id;
  const activeMember = members.find((member) => member.user_id === activeUserId);

  function handleMemberChange(userId: string) {
    router.push(buildPredictionsUrl(groupId, userId, selectedSection));
  }

  function handleSectionChange(section: string) {
    router.push(buildPredictionsUrl(groupId, activeUserId, section));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="prediction-member"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Mängija
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
            Jaotus
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
            <option value={ADMIN_PREDICTIONS_BONUS_SECTION}>Boonus</option>
          </select>
        </div>
      </div>

      {activeMember && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-600">
            {isBonusSection ? "Boonused" : "Ennustused"}:{" "}
            <span className="font-medium text-zinc-900">{activeMember.nickname}</span>
          </p>

          {isBonusSection ? (
            bonusPredictions.length === 0 ? (
              <p className="text-sm text-zinc-500">Boonusküsimusi pole.</p>
            ) : (
              bonusPredictions.map(({ question, answer }) => (
                <SettingsMemberBonusEditor
                  key={question.id}
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
            <p className="text-sm text-zinc-500">Sellel mängupäeval mänge pole.</p>
          ) : (
            matches.map((match) => {
              const prediction = predictionMap.get(match.id);
              return (
                <SettingsPredictionEditor
                  key={match.id}
                  groupId={groupId}
                  userId={activeUserId}
                  matchId={match.id}
                  matchLabel={`${match.home_team} – ${match.away_team}`}
                  kickoffLabel={formatKickoff(match.kickoff_at)}
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
