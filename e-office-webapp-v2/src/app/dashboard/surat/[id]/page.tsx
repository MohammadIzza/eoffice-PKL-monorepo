import LetterDetail from "@/components/features/pkl/display/LetterDetail";

export default async function SuratDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <LetterDetail id={id} />;
}
