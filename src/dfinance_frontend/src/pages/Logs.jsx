import React, { useState, useEffect } from "react";
import { useAuth } from "../utils/useAuthClient";
import Pagination from "../components/Common/pagination";
import Error from "./Error";

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [like, setLike] = useState(false);
  const { backendActor } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 200;
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedLogs, setPaginatedLogs] = useState([]);

  const getAllLogs = async () => {
    if (!backendActor) {
      console.error("Backend actor not initialized");
      return;
    }

    try {
      const result = await backendActor.get_all_logs();
      if (result?.Ok && Array.isArray(result.Ok)) {
        setLogs(result.Ok);
        setFilteredLogs(result.Ok);
        setTotalPages(Math.ceil(result.Ok.length / logsPerPage));
      } else {
        console.error("Unexpected logs format:", result);
        setLogs([]);
        setFilteredLogs([]);
      }
    } catch (error) {
      console.error("Error getting logs:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkControllerStatus = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }

    try {
      const result = await backendActor.guard_admin_only();

      const responseData = result;

      if ("Ok" in responseData) {
        setLike(true);
      } else {
        console.warn("Not an admin:", responseData.Err);
        setLike(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error.message);
      setError(error.message);
      setLike(false);

      if (error.message.toLowerCase().includes("freeze canister")) {
        setIsFreezePopupVisible(true);
      }
    }
  };

  useEffect(() => {
    getAllLogs();
  }, [backendActor]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter((log) =>
        log.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogs(filtered);
    }
    setCurrentPage(1);
    setTotalPages(Math.ceil(filteredLogs.length / logsPerPage));
  }, [searchTerm, logs]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    setPaginatedLogs(filteredLogs.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filteredLogs.length / logsPerPage));
  }, [filteredLogs, currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    checkControllerStatus();
  }, [backendActor]);

  const getLogLevelColor = (logText) => {
    if (logText.includes("[DEBUG]")) return "text-blue-500 dark:text-blue-400";
    if (logText.includes("[INFO]")) return "text-green-600 dark:text-green-400";
    if (logText.includes("[TRACE]"))
      return "text-purple-600 dark:text-purple-400";
    if (logText.includes("[ERROR]")) return "text-red-600 dark:text-red-500";
    if (logText.includes("[WARN]"))
      return "text-yellow-600 dark:text-yellow-500";
    return "text-gray-600 dark:text-gray-400";
  };

  const getLogCounts = () => {
    return {
      total: logs.length,
      debug: logs.filter((log) => log.includes("[DEBUG]")).length,
      info: logs.filter((log) => log.includes("[INFO]")).length,
      trace: logs.filter((log) => log.includes("[TRACE]")).length,
      warn: logs.filter((log) => log.includes("[WARN]")).length,
      error: logs.filter((log) => log.includes("[ERROR]")).length,
    };
  };

  const logCounts = getLogCounts();

  return like ? (
    <div className=" min-h-screen text-[#4036A8] dark:text-white rounded-2xl">
      <h1 className="text-2xl md:text-[2xl] font-bold mb-4 sm:mb-5 text-[#4036A8] dark:text-white mt-1">
        Logs
      </h1>

      {/* Stats Cards */}
      <div className="w-full mb-6 sm:mb-8 p-3 sm:p-4 bg-gray-50 dark:bg-[#131330] rounded-xl shadow border border-gray-200 dark:border-gray-900">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <div className="p-2 sm:p-3">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              Total Logs
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-lg sm:text-2xl font-bold">
              {logCounts.total}
            </p>
          </div>
          <div className="p-2 sm:p-3">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              Debug Logs
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-lg sm:text-2xl font-bold">
              {logCounts.debug}
            </p>
          </div>
          <div className="p-2 sm:p-3">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              Info Logs
            </p>
            <p className="text-green-600 dark:text-green-400 text-lg sm:text-2xl font-bold">
              {logCounts.info}
            </p>
          </div>
          <div className="p-2 sm:p-3">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              Trace Logs
            </p>
            <p className="text-purple-600 dark:text-purple-400 text-lg sm:text-2xl font-bold">
              {logCounts.trace}
            </p>
          </div>
          <div className="p-2 sm:p-3">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              Warn Logs
            </p>
            <p className="text-yellow-600 dark:text-yellow-500 text-lg sm:text-2xl font-bold">
              {logCounts.warn}
            </p>
          </div>
          <div className="p-2 sm:p-3">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              Error Logs
            </p>
            <p className="text-red-600 dark:text-red-500 text-lg sm:text-2xl font-bold">
              {logCounts.error}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3 sm:gap-0 mt-10">
        <h2 className="text-lg sm:text-xl font-semibold text-[#4036A8] dark:text-white">
          System Logs
        </h2>
        <div className="relative flex items-center w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-8 pr-4 py-2 bg-white dark:bg-[#131330] border border-gray-200 dark:border-gray-900 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 absolute left-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Logs Display */}
      {isLoading ? (
        <div className="w-full bg-gray-100 bg-opacity-50 dark:bg-[#131330] dark:bg-opacity-20 backdrop-blur-sm rounded-xl p-4 mt-10 shadow">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading logs...
          </p>
        </div>
      ) : logs.length === 0 ? (
        <div className="w-full bg-gray-100 bg-opacity-50 dark:bg-[#131330] dark:bg-opacity-20 backdrop-blur-sm rounded-xl p-4 mt-10 shadow">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No logs available
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="w-full bg-gray-100 bg-opacity-50 dark:bg-[#131330] dark:bg-opacity-20 backdrop-blur-sm rounded-xl p-4 mt-10 shadow">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No logs match your search
          </p>
        </div>
      ) : (
        <div className="w-full bg-gray-50 dark:bg-[#131330] rounded-xl py-3 px-2 overflow-y-auto shadow border border-gray-200 dark:border-gray-900">
          <div className="font-mono text-xs sm:text-sm">
            {paginatedLogs.map((log, index) => (
              <div
                key={index}
                className="py-1 border-b border-gray-200 dark:border-gray-800 flex"
              >
                <span className="text-gray-500 dark:text-gray-500 mr-2 flex-shrink-0 text-right w-6 sm:w-10">
                  {(currentPage - 1) * logsPerPage + index}:
                </span>
                <pre
                  className={`${getLogLevelColor(
                    log
                  )} whitespace-pre-wrap break-words w-full`}
                >
                  {log}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination Component */}
      {filteredLogs.length > 0 && (
        <div className="w-full flex justify-center mt-10">
          <div id="pagination" className="flex gap-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  ) : (
    <Error />
  );
};

export default Logs;
