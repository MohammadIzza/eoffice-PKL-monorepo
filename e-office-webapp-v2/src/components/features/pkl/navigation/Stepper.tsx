interface StepperProps {
  currentStep?: number;
}

export default function Stepper({ currentStep = 1 }: StepperProps) {
  const steps = [
    { id: 1, label: "Info Pengajuan" },
    { id: 2, label: "Detail Pengajuan" },
    { id: 3, label: "Lampiran" },
    { id: 4, label: "Review & Ajukan" },
  ];

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-5xl mx-auto relative mb-8 select-none">
      <div className="absolute top-[15px] left-[42.5px] right-[42.5px] h-[2px] bg-muted z-0">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercentage}%` }} 
        />
      </div>
      <div className="relative z-10 flex justify-between w-full">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          let circleBg = "bg-muted";
          let circleText = "text-muted-foreground"; 
          let labelClass = "text-muted-foreground font-medium";

          if (isActive || isCompleted) {
            circleBg = "bg-primary";
            circleText = "text-primary-foreground";
            labelClass = "text-primary font-semibold";
          }

          return (
            <div key={step.id} className="flex flex-col items-center w-[85px]">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 border-2 ${isActive || isCompleted ? 'border-primary' : 'border-muted'} ${circleBg} ${circleText}`}>
                <span className="font-bold text-[15px] leading-6">
                  {step.id}
                </span>
              </div>
              <div className="mt-2 flex justify-center w-max">
                <span className={`text-center text-sm leading-5 whitespace-nowrap ${labelClass}`}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}