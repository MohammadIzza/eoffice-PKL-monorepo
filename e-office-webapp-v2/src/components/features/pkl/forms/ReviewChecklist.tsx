import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface ReviewChecklistProps {
  items: Array<{
    label: string;
    checked: boolean;
  }>;
  onToggle?: (index: number) => void;
}

export const ReviewChecklist = React.memo(function ReviewChecklist({ items, onToggle }: ReviewChecklistProps) {
  const allChecked = items.every(item => item.checked);
  
  return (
    <div className="w-full bg-white rounded-xl border border-[rgba(0,0,0,0.08)] shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base text-[#1D1D1F]">
          Checklist Kesiapan
        </h3>
        {allChecked && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            Siap diajukan
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <label 
            key={index} 
            className="flex items-center gap-3 cursor-pointer group hover:bg-[rgba(0,0,0,0.02)] -mx-3 px-3 py-2.5 rounded-lg transition-all duration-200"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggle?.(index)}
              className="sr-only"
            />
            <div className="relative flex-shrink-0">
              {item.checked ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 transition-all duration-200" />
              ) : (
                <Circle className="w-5 h-5 text-[#86868B] group-hover:text-green-500 transition-all duration-200" />
              )}
            </div>
            <span className={`text-sm font-medium transition-all duration-200 ${
              item.checked ? 'text-[#1D1D1F]' : 'text-[#86868B] group-hover:text-[#1D1D1F]'
            }`}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
      {!allChecked && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-1">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <p className="text-xs text-amber-800 leading-relaxed">
            Pastikan semua item sudah dicentang sebelum melanjutkan pengajuan.
          </p>
        </div>
      )}
    </div>
  );
});
