import { useState, useMemo } from 'react';

interface UseTableFiltersOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  searchFunction?: (item: T, query: string) => boolean;
  filterFunction?: (item: T, filter: string) => boolean;
  itemsPerPage?: number;
}

export function useTableFilters<T>({
  data,
  searchFields = [],
  searchFunction,
  filterFunction,
  itemsPerPage = 10,
}: UseTableFiltersOptions<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search filter
      let matchesSearch = true;
      
      if (searchQuery) {
        if (searchFunction) {
          matchesSearch = searchFunction(item, searchQuery);
        } else {
          matchesSearch = searchFields.some(field => {
            const value = item[field];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(searchQuery.toLowerCase());
          });
        }
      }

      // Status filter
      const matchesStatus = !filterFunction || filterFunction(item, statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter, searchFields, searchFunction, filterFunction]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    filteredData,
    paginatedData,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    resetFilters,
  };
}
