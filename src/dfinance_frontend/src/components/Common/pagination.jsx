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
    <nav aria-label="Page navigation example">
      <ul className="inline-flex -space-x-px text-sm">
        <li>
        <button
            onClick={handlePreviousPage}
            className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight bg-white border border-e-0 border-gray-300 rounded-s-lg dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ${
              currentPage === 1
                ? 'text-gray-300 bg-gray-100 dark:text-gray-700 dark:bg-gray-700 cursor-not-allowed'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
            }`}
            disabled={currentPage === 1}
          >
              PREV
          </button>
        </li>
        {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
          const pageNum = startPage + index;
          return (
            <li key={pageNum}>
              <button
                onClick={() => onPageChange(pageNum)}
                aria-current={currentPage === pageNum ? 'page' : undefined}
                className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${
                  currentPage === pageNum
                    ? 'text-black border border-gray-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white'
                    : ''
                }`}
              >
                {pageNum}
              </button>
            </li>
          );
        })}
        <li>
        <button
            onClick={handleNextPage}
            className={`flex items-center justify-center px-3 h-8 leading-tight bg-white border border-gray-300 rounded-e-lg dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ${
              currentPage === totalPages
                ? 'text-gray-300 bg-gray-100 dark:text-gray-700 dark:bg-gray-700 cursor-not-allowed'
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
