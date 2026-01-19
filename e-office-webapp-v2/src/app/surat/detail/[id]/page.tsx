import React from "react";
import Step5Status from "@/components/features/surat-keterangan/Step5Status";

// Next.js 15+ Page props
// FS-040: Accessible via public URL
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Step5Status id={id} />;
}
