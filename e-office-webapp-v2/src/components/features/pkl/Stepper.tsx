import React from "react";

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

  // Hitung persentase progress (0%, 33%, 66%, 100%)
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-[1085px] mx-auto relative mb-8 select-none">
      
      {/* === 1. CONTAINER TRACK (WADAH GARIS) === */}
      {/* Posisi: Absolute, dari titik tengah item pertama (left-42.5px) sampai item terakhir (right-42.5px) */}
      {/* Ini kuncinya! Wadah ini panjangnya sudah pas 'Center-to-Center'. */}
      <div className="absolute top-[15px] left-[42.5px] right-[42.5px] h-[2px] bg-[#D1D5DB] z-0">
        
        {/* GARIS BIRU (PROGRESS) */}
        {/* Kita taruh DI DALAM wadah abu-abu. Width % akan ngikutin panjang wadah ini. */}
        <div 
          className="h-full bg-[#137FEC] transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercentage}%` }} 
        />
      </div>

      {/* === 2. ITEM STEPS (LINGKARAN) === */}
      {/* Z-10 supaya mengapung di atas garis */}
      <div className="relative z-10 flex justify-between w-full">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          // Logic Warna
          let circleBg = "bg-[#D1D5DB]"; // Abu
          let circleText = "text-[#6B7280]"; 
          let labelClass = "text-[#6B7280] font-medium";

          if (isActive || isCompleted) {
            circleBg = "bg-[#137FEC]"; // Biru
            circleText = "text-white";
            labelClass = "text-[#137FEC] font-semibold";
          }

          return (
            <div key={step.id} className="flex flex-col items-center w-[85px]">
              
              {/* LINGKARAN */}
              {/* BG Color wajib ada buat nutupin garis di belakangnya */}
              <div className={`flex h-[32px] w-[32px] items-center justify-center rounded-full transition-colors duration-300 border-[2px] ${isActive || isCompleted ? 'border-[#137FEC]' : 'border-[#D1D5DB]'} ${circleBg} ${circleText}`}>
                 {/* Border ditambahkan sedikit biar lingkarannya lebih 'tegas' nutupin garis */}
                <span className="font-inter font-bold text-[15px] leading-[24px]">
                  {step.id}
                </span>
              </div>

              {/* LABEL */}
              <div className="mt-[8px] flex justify-center w-max">
                <span className={`text-center font-inter text-[14px] leading-[20px] whitespace-nowrap ${labelClass}`}>
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