import { redirect } from "next/navigation";

type LegacyBonusPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function LegacyBonusPage({ params }: LegacyBonusPageProps) {
  const { groupId } = await params;
  redirect(`/groups/${groupId}/prediction-centre/bonus`);
}
