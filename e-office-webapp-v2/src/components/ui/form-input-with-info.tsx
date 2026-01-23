"use client";

import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FormInputWithInfoProps {
  children: React.ReactNode;
  info?: string;
  className?: string;
  hasOtherIcon?: boolean;
}

export const FormInputWithInfo = React.forwardRef<HTMLDivElement, FormInputWithInfoProps>(
  ({ children, info, className, hasOtherIcon = false, ...props }, ref) => {
    if (!info) {
      return <>{children}</>;
    }

    const rightOffset = hasOtherIcon ? 'right-12' : 'right-3';

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {children}
        <div className={cn("absolute top-1/2 -translate-y-1/2 pointer-events-none", rightOffset)}>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.04)] transition-colors focus:outline-none p-0.5 pointer-events-auto"
                  onClick={(e) => e.preventDefault()}
                >
                  <Info className="w-3.5 h-3.5 text-[#86868B] hover:text-[#0071E3] transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="max-w-xs text-xs p-3 rounded-xl shadow-lg bg-[#1D1D1F] text-white border-0"
                sideOffset={8}
              >
                <p className="leading-relaxed">{info}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }
);
FormInputWithInfo.displayName = "FormInputWithInfo";
