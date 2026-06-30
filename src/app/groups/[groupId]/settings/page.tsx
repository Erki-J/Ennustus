import { redirect } from "next/navigation";

type SettingsIndexPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function SettingsIndexPage({ params }: SettingsIndexPageProps) {
  const { groupId } = await params;
  redirect(`/groups/${groupId}/settings/scoring`);
}
