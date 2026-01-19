import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbsProps {
  pageName?: string; 
}

export default function Breadcrumbs({ pageName = "Identitas Pemohon" }: BreadcrumbsProps) {
  return (
    // Container Layout: Padding Left 60px
    <div className="w-full h-[68px] flex items-center justify-start pl-[60px] bg-transparent">
      
      <Breadcrumb>
        <BreadcrumbList className="sm:gap-2">
          
          {/* 1. Form Pengajuan Surat (Abu-abu) */}
          <BreadcrumbItem>
            <BreadcrumbLink href="#" className="font-inter font-medium text-[16px] leading-[24px] text-[#617589] hover:text-[#111418] no-underline transition-colors">
              Form Pengajuan Surat
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator className="text-[#617589]">
            /
          </BreadcrumbSeparator>

          {/* 2. PKL (YANG DI-UPDATE) */}
          <BreadcrumbItem>
            {/* SPECS BARU:
                - Font: Inter (font-inter)
                - Weight: 500 Medium (font-medium)
                - Size: 16px (text-[16px])
                - Line Height: 24px (leading-[24px])
                - Color: #111418 (text-[#111418])
            */}
            <BreadcrumbLink 
              href="#" 
              className="font-inter font-medium text-[16px] leading-[24px] text-[#111418] hover:underline no-underline"
            >
              PKL
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator className="text-[#617589]">
            /
          </BreadcrumbSeparator>

          {/* 3. Page Name (Identitas Pemohon / Detail Pengajuan) */}
          <BreadcrumbItem>
            <BreadcrumbPage className="font-inter font-medium text-[16px] leading-[24px] text-[#111418]">
              {pageName}
            </BreadcrumbPage>
          </BreadcrumbItem>

        </BreadcrumbList>
      </Breadcrumb>
      
    </div>
  );
}