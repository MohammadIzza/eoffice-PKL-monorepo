'use client';

export default function VolumeChart() {
  return (
    <div className="w-full bg-[#FFFFFF] rounded-[16px] border border-[#E2E8F0] p-[24px] flex flex-col gap-[16px]">
       {/* Judul Chart */}
       <div className="font-lexend font-semibold text-[16px] leading-[24px] text-[#0F172A]">
         Tren Volume 30 Hari
       </div>

       {/* Area Chart Placehodler */}
       <div className="w-full h-[192px] relative flex">
           
           {/* Y Axis Labels */}
           <div className="flex flex-col justify-between h-full pr-4 text-[12px] text-[#94A3B8] font-lexend pb-[20px]">
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
           </div>

           {/* Chart Area */}
           <div className="relative flex-1 h-full border-b border-l border-none"> 
               {/* Grid Lines Dotted - positioned to match labels */}
               <div className="absolute top-[0%] w-full border-t border-dashed border-gray-200"></div>
               <div className="absolute top-[33%] w-full border-t border-dashed border-gray-200"></div>
               <div className="absolute top-[66%] w-full border-t border-dashed border-gray-200"></div>
               <div className="absolute top-[99%] w-full border-t border-dashed border-gray-200"></div>

               {/* Curve Line SVG */}
               <svg className="absolute inset-0 h-full w-full pointer-events-none overflow-visible pl-2" preserveAspectRatio="none">
                     <path 
                       d="M0,130 C150,130 250,90 400,100 S650,40 800,50 S1000,30 1200,30" 
                       fill="none" 
                       stroke="#2563EB" 
                       strokeWidth="3"
                       strokeLinecap="round"
                     />
                     {/* Area under curve gradient fake */}
                     <path 
                       d="M0,130 C150,130 250,90 400,100 S650,40 800,50 S1000,30 1200,30 V192 H0 Z" 
                       fill="url(#gradient-blue)" 
                       fillOpacity="0.05" 
                     />
                     <defs>
                        <linearGradient id="gradient-blue" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                     </defs>
               </svg>

                {/* Labels X Axis */}
               <div className="absolute bottom-[-25px] flex justify-between w-full px-4 text-[12px] text-[#94A3B8] font-lexend pl-2">
                   <span>1-7</span>
                   <span>8-15</span>
                   <span>16-23</span>
                   <span>24-30</span>
               </div>
           </div>
       </div>
    </div>
  );
}
