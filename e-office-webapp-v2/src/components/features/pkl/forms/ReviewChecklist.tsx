import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ReviewChecklistProps {
  items: Array<{
    label: string;
    checked: boolean;
  }>;
}

export const ReviewChecklist = React.memo(function ReviewChecklist({ items }: ReviewChecklistProps) {
  return (
    <div className="w-full bg-success/10 border border-success/20 rounded-xl p-5 flex flex-col gap-3">
      <h3 className="font-semibold text-base text-success">
        Checklist Kesiapan
      </h3>
      <div className="flex flex-col gap-2.5">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <CheckCircle2
              className={`w-4 h-4 ${
                item.checked ? 'text-success' : 'text-muted-foreground'
              }`}
            />
            <span className="font-medium text-xs text-success">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
