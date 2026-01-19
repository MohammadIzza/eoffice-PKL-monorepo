import Step5Status from "@/components/features/pkl/Step5Status";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Step5Status id={id} />;
}
