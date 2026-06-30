"use client";

import { useRouter } from "next/navigation";
import { SettingsPredictionEditor } from "@/components/settings/prediction-editor";

export type MemberOption = {
  user_id: string;
  nickname: string;
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

type SettingsMemberPredictionsProps = {
  groupId: string;
  members: MemberOption[];
  matches: MatchOption[];
  predictions: PredictionOption[];
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

export function SettingsMemberPredictions({
  groupId,
  members,
  matches,
  predictions,
  selectedUserId,
}: SettingsMemberPredictionsProps) {
  const router = useRouter();
  const predictionMap = new Map(
    predictions.map((prediction) => [prediction.match_id, prediction]),
  );

  function handleMemberChange(userId: string) {
    router.push(`/groups/${groupId}/settings/predictions?player=${userId}`);
  }

  if (members.length === 0) {
    return <p className="text-sm text-zinc-500">Grupis pole mängijaid.</p>;
  }

  const activeUserId = selectedUserId ?? members[0].user_id;
  const activeMember = members.find((member) => member.user_id === activeUserId);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="prediction-member" className="mb-1 block text-sm font-medium text-zinc-700">
          Mängija
        </label>
        <select
          id="prediction-member"
          value={activeUserId}
          onChange={(event) => handleMemberChange(event.target.value)}
          className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.nickname}
            </option>
          ))}
        </select>
      </div>

      {activeMember && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-600">
            Ennustused: <span className="font-medium text-zinc-900">{activeMember.nickname}</span>
          </p>
          {matches.map((match) => {
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
          })}
        </div>
      )}
    </div>
  );
}
