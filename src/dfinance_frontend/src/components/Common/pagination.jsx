import React, { useState } from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const [jumpToPage, setJumpToPage] = useState("");
  const numVisiblePages = 5;

  const getPageRange = () => {
    let startPage, endPage;

    if (totalPages <= numVisiblePages) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const halfVisiblePages = Math.floor(numVisiblePages / 2);

      if (currentPage <= halfVisiblePages + 1) {
        startPage = 1;
        endPage = Math.min(numVisiblePages, totalPages);
      } else if (currentPage >= totalPages - halfVisiblePages) {
        startPage = Math.max(1, totalPages - numVisiblePages + 1);
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

  const handleFirstPage = () => {
    onPageChange(1);
  };

  const handleLastPage = () => {
    onPageChange(totalPages);
  };

  const handleJumpToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpToPage("");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <nav aria-label="Page navigation" className="flex items-center">
        <ul className="inline-flex -space-x-px text-sm">
          <li>
            <button
              onClick={handleFirstPage}
              className={`hidden sm:flex items-center justify-center px-3 h-8 ms-0 leading-tight bg-white border border-e-0 border-gray-300 rounded-s-lg dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ${currentPage === 1
                  ? "text-gray-300 bg-gray-100 dark:text-gray-700 dark:bg-gray-700 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                }`}
              disabled={currentPage === 1}
              aria-label="Go to first page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </li>
          <li>
            <button
              onClick={handlePreviousPage}
              className={`flex items-center justify-center px-3 h-8 leading-tight bg-white border border-e-0 border-gray-300 ${!startPage === 1 ? "rounded-s-lg" : ""} dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ${currentPage === 1
                  ? "text-gray-300 bg-gray-100 dark:text-gray-700 dark:bg-gray-700 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                }`}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              PREV
            </button>
          </li>

          {startPage > 1 && (
            <li>
              <span className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                ...
              </span>
            </li>
          )}
          {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
            const pageNum = startPage + index;
            return (
              <li key={pageNum}>
                <button
                  onClick={() => onPageChange(pageNum)}
                  aria-current={currentPage === pageNum ? "page" : undefined}
                  className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${currentPage === pageNum
                      ? "font-medium text-blue-600 border border-gray-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                      : ""
                    }`}
                >
                  {pageNum}
                </button>
              </li>
            );
          })}

          {endPage < totalPages && (
            <li>
              <span className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                ...
              </span>
            </li>
          )}

          <li>
            <button
              onClick={handleNextPage}
              className={`flex items-center justify-center px-3 h-8 leading-tight bg-white border border-gray-300 ${endPage === totalPages ? "rounded-e-lg" : ""} dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ${currentPage === totalPages
                  ? "text-gray-300 bg-gray-100 dark:text-gray-700 dark:bg-gray-700 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                }`}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              NEXT
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </li>

          <li>
            <button
              onClick={handleLastPage}
              className={`hidden sm:flex items-center justify-center px-3 h-8 leading-tight bg-white border border-gray-300 rounded-e-lg dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ${currentPage === totalPages
                  ? "text-gray-300 bg-gray-100 dark:text-gray-700 dark:bg-gray-700 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                }`}
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </li>
        </ul>
      </nav>

      <div className="hidden sm:flex items-center">
        <form onSubmit={handleJumpToPage} className="flex items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">Page {currentPage} of {totalPages}</span>
          <div className="flex items-center">
            <input
              type="text"
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              placeholder="Go to"
              className="w-16 h-8 px-2 text-xs border border-gray-300 rounded-l-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Jump to page"
            />
            <button
              type="submit"
              className="h-8 px-2 text-xs bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              Go
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Pagination;