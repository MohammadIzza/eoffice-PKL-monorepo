'use client';

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function FilterSurat() {
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();

  return (
    <div className="w-auto bg-[#FFFFFF] rounded-[16px] border border-[#E2E8F0] p-[24px]">
      <h2 className="font-lexend font-bold text-[18px] leading-[24px] text-[#0F172A] mb-[16px]">
        Filter Pencarian
      </h2>
      
      <Card className="w-full max-w-[400px] overflow-hidden border-[#E2E8F0]">
        {/* Header Biru */}
        <CardHeader className="bg-[#0B7BB5] px-[20px] py-[14px] rounded-t-[12px]">
          <h3 className="text-white text-[14px] font-medium">Informasi Pemohon</h3>
        </CardHeader>
        
        {/* Content */}
        <CardContent className="p-[20px] space-y-[20px]">
          {/* Nama Pengirim */}
          <div className="space-y-[8px]">
            <Label htmlFor="nama-pengirim" className="text-[14px] font-normal text-[#0F172A]">
              Nama Pengirim
            </Label>
            <Input
              id="nama-pengirim"
              type="text"
              placeholder="Masukkan nama pemohon"
              className="h-auto px-[14px] py-[10px] text-[14px] border-[#CBD5E1] rounded-[8px] placeholder:text-[#94A3B8]"
            />
          </div>
          
          {/* Tanggal Diterima */}
          <div className="space-y-[8px]">
            <Label className="text-[14px] font-normal text-[#0F172A]">
              Tanggal Diterima
            </Label>
            <div className="flex items-center gap-[10px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-auto px-[14px] py-[10px] text-[14px] justify-start text-left font-normal border-[#CBD5E1] rounded-[8px]",
                      !startDate && "text-[#0F172A]"
                    )}
                  >
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-[#64748B] text-[18px]">→</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-auto px-[14px] py-[10px] pr-[40px] text-[14px] justify-start text-left font-normal border-[#CBD5E1] rounded-[8px]",
                      !endDate && "text-[#0F172A]"
                    )}
                  >
                    <span className="flex-1">{endDate ? format(endDate, "PPP") : "End date"}</span>
                    <CalendarIcon className="h-[18px] w-[18px] text-[#64748B] ml-auto" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-[10px] mt-[16px]">
        <Button 
          variant="outline" 
          className="px-[20px] py-[10px] h-auto text-[14px] font-medium text-[#334155] border-[#CBD5E1] hover:bg-[#F8FAFC]"
        >
          Reset
        </Button>
        <Button 
          className="px-[20px] py-[10px] h-auto text-[14px] font-medium bg-[#0B7BB5] hover:bg-[#0968A0]"
        >
          Cari
        </Button>
      </div>
    </div>
  );
}
