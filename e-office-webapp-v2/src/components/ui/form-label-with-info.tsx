"use client";

import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FormLabelWithInfoProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  label: string;
  info?: string;
  className?: string;
}

export const FormLabelWithInfo = React.forwardRef<HTMLLabelElement, FormLabelWithInfoProps>(
  ({ label, info, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5", className)}
        {...props}
      >
        {label}
        {info && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs p-2 rounded-md shadow-md bg-white text-foreground border border-[rgba(0,0,0,0.1)]">
                {info}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </label>
    );
  }
);
FormLabelWithInfo.displayName = "FormLabelWithInfo";
