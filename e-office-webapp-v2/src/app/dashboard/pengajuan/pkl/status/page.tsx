'use client';

import { useSearchParams } from 'next/navigation';
import Step5Status from "@/components/features/pkl/Step5Status";

export default function StatusPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  return <Step5Status id={id || undefined} />;
}
