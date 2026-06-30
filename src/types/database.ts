export type UserRole = "user" | "admin";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
};

export type ScoringSettings = {
  exact_score: number;
  goal_diff: number;
  tendency: number;
  bonus_points: number;
};

export type Tournament = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type GroupMemberRole = "admin" | "member";

export type PredictionGroup = {
  id: string;
  name: string;
  tournament_id: string;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  nickname: string;
  joined_at: string;
};

export type GroupInvitation = {
  id: string;
  group_id: string;
  email: string;
  token: string;
  invited_by: string;
  status: "pending" | "accepted" | "revoked";
  expires_at: string;
  created_at: string;
};

export type GroupWithMeta = PredictionGroup & {
  tournament: Pick<Tournament, "name" | "slug">;
  my_role: GroupMemberRole;
  my_nickname: string;
  member_count: number;
};

export type InvitationPreview = {
  id: string;
  group_id: string;
  group_name: string;
  tournament_name: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  expires_at: string;
};

export type MatchStatus = "scheduled" | "live" | "finished";

export type Match = {
  id: string;
  tournament_id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  stage: string;
  matchday: number;
  group_code: string | null;
  sort_order: number;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
};

export type MatchPrediction = {
  id: string;
  group_id: string;
  user_id: string;
  match_id: string;
  home_goals: number;
  away_goals: number;
  points: number;
  modified_by_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type GroupSettings = {
  group_id: string;
  scoring: ScoringSettings;
  updated_at: string;
};
