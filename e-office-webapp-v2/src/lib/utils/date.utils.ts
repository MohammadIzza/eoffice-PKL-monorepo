import { format, parse } from "date-fns";
import { id } from "date-fns/locale";

export const normalizeDateValue = (dateValue: string | null | undefined): string => {
  if (!dateValue || (typeof dateValue === 'string' && dateValue.trim() === "")) return "";
  try {
    let date: Date;
    const dateStr = String(dateValue).trim();
    
    if (dateStr.includes("T")) {
      date = new Date(dateStr);
    } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      date = new Date(dateStr + "T00:00:00");
    } else if (dateStr.match(/^\d{1,2}\s+\w+\s+\d{4}$/)) {
      try {
        date = parse(dateStr, "dd MMMM yyyy", new Date(), { locale: id });
      } catch {
        date = new Date(dateStr);
      }
    } else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    return "";
  }
};

export const formatTanggalLahir = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return format(date, "dd MMMM yyyy", { locale: id });
  } catch {
    return dateString;
  }
};

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  try {
    const d = date instanceof Date ? date : new Date(date);
    return format(d, 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  try {
    const d = date instanceof Date ? date : new Date(date);
    return format(d, 'dd MMMM yyyy, HH:mm:ss', { locale: id });
  } catch {
    return '-';
  }
};
