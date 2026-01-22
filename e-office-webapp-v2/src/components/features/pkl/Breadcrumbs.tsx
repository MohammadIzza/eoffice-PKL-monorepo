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
    <div className="w-full h-[68px] flex items-center justify-start pl-[60px] bg-transparent">
      <Breadcrumb>
        <BreadcrumbList className="sm:gap-2">
          <BreadcrumbItem>
            <BreadcrumbLink href="#" className="font-inter font-medium text-[16px] leading-[24px] text-[#617589] hover:text-[#111418] no-underline transition-colors">
              Form Pengajuan Surat
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator className="text-[#617589]">
            /
          </BreadcrumbSeparator>
          <BreadcrumbItem>
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