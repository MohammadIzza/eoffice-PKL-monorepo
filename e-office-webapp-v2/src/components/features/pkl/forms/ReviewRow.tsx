import React from 'react';

interface ReviewRowProps {
  label: string;
  value: string;
}

export const ReviewRow = React.memo(function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <div className="w-full flex justify-between items-center py-3 px-5 border-b border-border last:border-b-0">
      <div className="w-[30%] font-normal text-xs text-muted-foreground">
        {label}
      </div>
      <div className="w-[70%] font-medium text-xs text-foreground text-right sm:text-left">
        {value || '-'}
      </div>
    </div>
  );
});
