import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const numVisiblePages = 3;

  const getPageRange = () => {
    let startPage, endPage;

    if (totalPages <= numVisiblePages) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const halfVisiblePages = Math.floor(numVisiblePages / 2);

      if (currentPage <= halfVisiblePages + 1) {
        startPage = 1;
        endPage = numVisiblePages;
      } else if (currentPage >= totalPages - halfVisiblePages) {
        startPage = totalPages - numVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - halfVisiblePages;
        endPage = currentPage + halfVisiblePages;
      }
    }

    return { startPage, endPage };
  };

  const { startPage, endPage } = getPageRange();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <nav aria-label="Pagination Navigation">
      <ul className="inline-flex -space-x-px text-sm">
        {/* Previous Button */}
        <li>
          <button
            onClick={handlePreviousPage}
            className={`flex items-center justify-center px-3 h-8 leading-tight border border-e-0 rounded-l-lg ${
              currentPage === 1
                ? 'text-gray-300 bg-gray-100 dark:text-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
            }`}
            disabled={currentPage === 1}
          >
            PREV
          </button>
        </li>

        {/* Page Numbers */}
        {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
          const pageNum = startPage + index;
          return (
            <li key={pageNum}>
              <button
                onClick={() => onPageChange(pageNum)}
                aria-current={currentPage === pageNum ? 'page' : undefined}
                className={`flex items-center justify-center px-3 h-8 leading-tight border ${
                  currentPage === pageNum
                    ? 'text-blue-700 bg-blue-50 border-gray-300 dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                {pageNum}
              </button>
            </li>
          );
        })}

        {/* Next Button */}
        <li>
          <button
            onClick={handleNextPage}
            className={`flex items-center justify-center px-3 h-8 leading-tight border rounded-r-lg ${
              currentPage === totalPages
                ? 'text-gray-300 bg-gray-100 dark:text-white dark:bg-gray-700 cursor-not-allowed'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
            }`}
            disabled={currentPage === totalPages}
          >
            NEXT
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
