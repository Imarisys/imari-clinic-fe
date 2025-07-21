import React from 'react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  isLoading?: boolean;
  showInfo?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  showInfo = true,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Always show pagination info, but only show navigation if there are multiple pages
  const showNavigation = totalPages > 1;

  // Show pagination info even for single page, but return null if no items
  if (totalItems === 0) {
    return null;
  }

  const getVisiblePages = () => {
    const pages = [];
    const maxVisiblePages = 10;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      // Adjust if we're near the beginning or end
      if (currentPage <= 3) {
        endPage = Math.min(totalPages, 5);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pageSizeOptions = [5, 10, 20, 50, 100];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mt-6">
      <div className="flex items-center space-x-4">
        {showInfo && (
          <div className="text-sm text-neutral-600">
            Showing {startItem} to {endItem} of {totalItems} patients
          </div>
        )}

        {onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-600">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-3 py-1 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-neutral-600">per page</span>
          </div>
        )}
      </div>

      {showNavigation && (
        <div className="flex items-center space-x-2">
          {/* Previous button */}
          <Button
            variant="secondary"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-2"
          >
            <span className="material-icons-round text-sm">chevron_left</span>
          </Button>

          {/* First page */}
          {visiblePages[0] > 1 && (
            <>
              <Button
                variant={1 === currentPage ? 'primary' : 'secondary'}
                onClick={() => onPageChange(1)}
                disabled={isLoading}
                className="px-3 py-2 min-w-[40px]"
              >
                1
              </Button>
              {visiblePages[0] > 2 && (
                <span className="px-2 text-neutral-400">...</span>
              )}
            </>
          )}

          {/* Visible page numbers */}
          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'primary' : 'secondary'}
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              className="px-3 py-2 min-w-[40px]"
            >
              {page}
            </Button>
          ))}

          {/* Last page */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2 text-neutral-400">...</span>
              )}
              <Button
                variant={totalPages === currentPage ? 'primary' : 'secondary'}
                onClick={() => onPageChange(totalPages)}
                disabled={isLoading}
                className="px-3 py-2 min-w-[40px]"
              >
                {totalPages}
              </Button>
            </>
          )}

          {/* Next button */}
          <Button
            variant="secondary"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="px-3 py-2"
          >
            <span className="material-icons-round text-sm">chevron_right</span>
          </Button>
        </div>
      )}
    </div>
  );
};
