'use client';

import { useSearchParams } from 'next/navigation';
import LetterDetail from "@/components/features/pkl/display/LetterDetail";

export default function StatusPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  return <LetterDetail id={id || undefined} />;
}
