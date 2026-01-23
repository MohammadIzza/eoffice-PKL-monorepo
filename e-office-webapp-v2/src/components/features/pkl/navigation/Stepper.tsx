import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  currentStep?: number;
}

export default function Stepper({ currentStep = 1 }: StepperProps) {
  const steps = [
    { id: 1, label: "Identitas", shortLabel: "Identitas" },
    { id: 2, label: "Detail Pengajuan", shortLabel: "Detail" },
    { id: 3, label: "Lampiran", shortLabel: "Lampiran" },
    { id: 4, label: "Review & Ajukan", shortLabel: "Review" },
  ];

  return (
    <div className="w-full relative mb-6 select-none py-2">
      {/* Steps Container */}
      <div className="relative z-10 flex justify-between w-full">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isPending = step.id > currentStep;

          return (
            <div 
              key={step.id} 
              className="flex flex-col items-center flex-1 relative"
            >
              {/* Connecting Line Segment - Individual for each step */}
              {index < steps.length - 1 && (
                <div className="absolute top-5 left-[50%] right-[-50%] h-[2.5px] z-0">
                  <div className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isCompleted || (isActive && index < currentStep - 1)
                      ? "bg-gradient-to-r from-[#0071E3] to-[#0A84FF]"
                      : "bg-[rgba(0,0,0,0.06)]"
                  )} />
                </div>
              )}

              {/* Step Circle with modern styling */}
              <div className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 border-2 z-10 backdrop-blur-sm",
                isActive && [
                  "border-[#0071E3] bg-gradient-to-br from-[#0071E3] to-[#0A84FF]",
                  "text-white scale-110",
                  "shadow-xl shadow-[#0071E3]/30",
                  "ring-4 ring-[#0071E3]/10"
                ],
                isCompleted && [
                  "border-[#0071E3] bg-gradient-to-br from-[#0071E3] to-[#0A84FF]",
                  "text-white shadow-md shadow-[#0071E3]/20"
                ],
                isPending && [
                  "border-[rgba(0,0,0,0.1)] bg-white/80",
                  "text-[#86868B] shadow-sm"
                ]
              )}>
                {isCompleted ? (
                  <Check className="h-6 w-6 stroke-[2.5] animate-in zoom-in duration-300" />
                ) : (
                  <span className={cn(
                    "font-bold text-base tracking-tight transition-all duration-300",
                    isActive && "text-white scale-110",
                    isPending && "text-[#86868B]"
                  )}>
                    {step.id}
                  </span>
                )}
                
                {/* Active step glow effect */}
                {isActive && (
                  <>
                    <div className="absolute -inset-2 rounded-full bg-[#0071E3]/10 animate-pulse blur-sm" />
                    <div className="absolute -inset-1 rounded-full border-2 border-[#0071E3]/30 animate-ping" />
                  </>
                )}

                {/* Completed step subtle shine */}
                {isCompleted && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                )}
              </div>
              
              {/* Step Label with modern typography */}
              <div className="mt-4 flex flex-col items-center w-full min-w-0">
                <span className={cn(
                  "text-xs font-semibold text-center transition-all duration-300 tracking-tight whitespace-nowrap",
                  isActive && [
                    "text-[#0071E3]",
                    "drop-shadow-sm"
                  ],
                  isCompleted && "text-[#0071E3]",
                  isPending && "text-[#86868B]"
                )}>
                  {step.label}
                </span>
                
                {/* Active step indicator - Modern underline with gradient */}
                {isActive && (
                  <div className="mt-2 h-[3px] w-14 bg-gradient-to-r from-[#0071E3] to-[#0A84FF] rounded-full shadow-sm shadow-[#0071E3]/30 animate-in slide-in-from-bottom-2 duration-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}