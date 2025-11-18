interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxPagesToShow = 7;

  if (totalPages <= maxPagesToShow) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show first page, last page, current page and nearby pages
    pages.push(1);

    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    if (startPage > 2) {
      pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
      {totalItems !== undefined && itemsPerPage !== undefined && (
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-transparent text-gray-900 dark:text-gray-100"
          aria-label="Previous page"
        >
          ← Previous
        </button>

        <div className="flex gap-1">
          {pages.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded ${
                  currentPage === page
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-transparent text-gray-900 dark:text-gray-100"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
