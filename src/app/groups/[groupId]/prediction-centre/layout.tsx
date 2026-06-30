import { PredictionCentreTabs } from "@/components/prediction-centre/prediction-centre-tabs";

export default async function PredictionCentreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  return (
    <div className="space-y-4">
      <PredictionCentreTabs groupId={groupId} />
      {children}
    </div>
  );
}
