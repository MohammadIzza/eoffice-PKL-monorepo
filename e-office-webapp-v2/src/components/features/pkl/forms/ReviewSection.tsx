import React from 'react';
import { ReviewRow } from './ReviewRow';

interface ReviewSectionProps {
  title: string;
  children: React.ReactNode;
}

export const ReviewSection = React.memo(function ReviewSection({ title, children }: ReviewSectionProps) {
  const cardBaseClass = "w-full bg-white rounded-3xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden";
  const headerSectionClass = "w-full px-5 py-3 border-b border-[rgba(0,0,0,0.08)] bg-white";
  const headerTitleClass = "font-semibold text-base text-[#1D1D1F]";

  return (
    <div className={cardBaseClass}>
      <div className={headerSectionClass}>
        <h3 className={headerTitleClass}>{title}</h3>
      </div>
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );
});
