import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";

export default function Navbar() {
  return (
    <header className="w-full h-[75px] bg-[#0079BD] flex items-center justify-between px-[60px] py-[10px]">
      
      {/* KIRI: Logo Image */}
      <div className="w-[235px] h-[55px] flex items-center">
         {/* UPDATE PATH: Langsung '/logofsm.svg' karena file ada di root folder public */}
         <img 
            src="/logofsm.svg" 
            alt="FSM Undip" 
            className="h-full w-auto object-contain"
         />
      </div>

      {/* KANAN: User & Alert */}
      <div className="w-[727px] flex items-center justify-end gap-[23px]">
        <div className="relative w-[31px] h-[31px] flex items-center justify-center cursor-pointer">
           <Bell className="w-[24px] h-[24px] text-white stroke-[2]" /> 
           <div className="absolute top-[2px] right-[2px] w-[8px] h-[8px] bg-red-500 rounded-full border border-[#0079BD]"></div>
        </div>

        <div className="min-w-[222px] h-[45px] flex items-center justify-end gap-[12px]">
          <span className="text-white font-semibold text-[16px] text-right">
            Ahmad Douglas
          </span>
          <Avatar className="w-[45px] h-[45px] border-[2px] border-white shadow-sm cursor-pointer">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-blue-200 text-[#0079BD]">AD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}