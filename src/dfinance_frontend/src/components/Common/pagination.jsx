import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const numVisiblePages = 3; // Number of visible page numbers

  // Calculate the range of page numbers to display
  const getPageRange = () => {
    let startPage, endPage;

    if (totalPages <= numVisiblePages) {
      // Show all pages if there are fewer pages than the number to display
      startPage = 1;
      endPage = totalPages;
    } else {
      // Center the window around the current page, but adjust for edges
      const halfVisiblePages = Math.floor(numVisiblePages / 2);

      if (currentPage <= halfVisiblePages + 1) {
        // If close to the beginning, show starting pages
        startPage = 1;
        endPage = numVisiblePages;
      } else if (currentPage >= totalPages - halfVisiblePages) {
        // If close to the end, show ending pages
        startPage = totalPages - numVisiblePages + 1;
        endPage = totalPages;
      } else {
        // Show the current page in the middle of the range
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
    <nav aria-label="Page navigation example">
      <ul className="inline-flex -space-x-px text-sm">
        <li>
          <button
            onClick={handlePreviousPage}
            className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            disabled={currentPage === 1}
          >
           Previous
          </button>
        </li>
        {Array.from({ length: numVisiblePages }, (_, index) => {
          const pageNum = startPage + index;
          if (pageNum <= totalPages) {
            return (
              <li key={pageNum}>
                <button
                  onClick={() => onPageChange(pageNum)}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                  className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${
                    currentPage === pageNum
                      ? 'text-blue-600 border border-gray-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white'
                      : ''
                  }`}
                >
                  {pageNum}
                </button>
              </li>
            );
          }
          return null;
        })}
        <li>
          <button
            onClick={handleNextPage}
            className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            disabled={currentPage === totalPages}
          >
           Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
