import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  TAB_CARD_DATA,
  WALLET_DETAILS_TABS,
  WALLET_DETAIL_TAB,
} from "../../utils/constants";
import { useSelector } from "react-redux";
import RiskPopup from "./RiskDetails";
import { X } from "lucide-react";
import { useAuth } from "../../utils/useAuthClient";
import { ChevronLeft } from 'lucide-react';
import icplogo from '../../../public/icp.png'

const DashboardNav = () => {
  const { isAuthenticated } = useAuth();

  const { state, pathname } = useLocation();
  const navigate = useNavigate();
  const { isWalletConnected } = useSelector((state) => state.utility);
  const theme = useSelector((state) => state.theme.theme);

  const [isDrop, setIsDrop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentValueIndex, setCurrentValueIndex] = useState(state?.id || 0);
  const [currentValueData, setCurrentValueData] = useState(
    state || TAB_CARD_DATA[0]
  );
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDrop(false);
      document.removeEventListener("mousedown", handleClickOutside);
    }
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
      document.removeEventListener("mousedown", handleClickOutside);
    }
  };

  const toggleDropdown = () => {
    if (!isDrop) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    setIsDrop(!isDrop);
  };

  const toggleMenu = () => {
    if (!isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const asset = TAB_CARD_DATA.find((item) => item.id === currentValueIndex);
    setCurrentValueData(asset);
  }, [currentValueIndex]);

  useEffect(() => {
    if (state && state.id !== undefined) {
      setCurrentValueIndex(state.id);
    }
  }, [state]);

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  // Determine if it's dashboard supply or main based on pathname
  const isDashboardSupplyOrMain = pathname === "/dashboard";

  const handleAssetSelect = (index) => {
    setCurrentValueIndex(index);
    setIsDrop(false);
  };

  // Dynamic title based on pathname
  const dashboardTitle = pathname.includes("/market") ? "Market" : "Dashboard";

  // Determine if Risk Details button should be rendered
  const shouldRenderRiskDetailsButton =
    !pathname.includes("/market") &&
    !pathname.includes("/governance") &&
    !pathname.includes("/dashboard/transaction-history");

  const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";

  const shouldRenderTransactionHistoryButton = pathname === "/dashboard";

  return (
    <div className="w-full ">
      {['/dashboard', '/market', '/governance'].includes(pathname) && (
        <h1 className="text-[#2A1F9D] font-bold font-poppins text-2xl md:text-2xl lg:text-2xl mb-8 dark:text-darkText">
          {dashboardTitle}
        </h1>
      )}

      <div className="flex h-[60px] gap-5 -ml-3">
        {!['/dashboard', '/market', '/governance'].includes(pathname) && (
          <div className="-mt-1 cursor-pointer" onClick={() => navigate(-1)}>
            <ChevronLeft size={40} color={chevronColor} />
          </div>
        )}
        <h1 className="text-[#2A1F9D] text-xl inline-flex items-center mb-8 dark:text-darkText ml-1">
          <img src={icplogo} alt="Icp Logo" className="mx-2 w-9 h-9 mr-3 border-2 border-[#2A1F9D] rounded-[50%]" />
          ICP Market
        </h1>

        {/* Menu Button */}
        <div className="md:hidden flex ml-auto -mt-10">
          <button onClick={toggleMenu} className="p-4 mt-4 rounded-md">
            <img
              src={
                theme === "dark"
                  ? "/wallet-details-menu-dark.svg"
                  : "/wallet-details-menu-light.svg"
              }
              className="w-7 h-7"
              alt="toggle"
            />
          </button>
        </div>
      </div>

      <div className="w-full flex flex-wrap justify-start items-center gap-2 mb-8 lg:mb-2">
        <div className="flex">
          {/* <div className="flex items-center gap-2">
            <div className="rounded-full border overflow-hidden shrink-0">
              <img
                src={currentValueData ? currentValueData.image : ""}
                alt={currentValueData ? currentValueData.title : ""}
                className="w-[30px] h-[30px] md:w-8 md:h-8 shrink-0"
              />
            </div>

            <h1 className="text-[#3739b4] font-semibold dark:text-darkText">
              {currentValueData ? currentValueData.title : ""}
            </h1>

            <div className="relative" ref={dropdownRef}>
              <span
                className="block p-1 rounded-full bg-[#8CC0D770] text-[#3739b4] cursor-pointer dark:text-darkText"
                onClick={toggleDropdown}
              >
                {!isDrop ? (
                  <ChevronRight size={16} color={chevronColor} />
                ) : (
                  <ChevronDown size={16} color={chevronColor} />
                )}
              </span>
              {isDrop && (
                <div className="w-fit z-50 absolute overflow-hidden animate-fade-down animate-duration-500 top-full mt-3 bg-[#0C5974] text-white rounded-2xl">
                  {TAB_CARD_DATA.map((data, index) => (
                    <div
                      key={index}
                      className={`flex whitespace-nowrap hover:bg-[#2a6980] ${currentValueIndex === index ? "bg-[#347c96]" : ""
                        } items-center text-white p-3 px-4 gap-3`}
                      onClick={() => {
                        setCurrentValueIndex(index);
                        setIsDrop(false);
                        document.removeEventListener(
                          "mousedown",
                          handleClickOutside
                        );
                        handleAssetSelect(index);
                      }}
                    >
                      <div className="w-5 h-5 rounded-full border overflow-hidden">
                        <img
                          src={data.image}
                          alt={data.title}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <h1 className="text-xs">{data.title}</h1>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div> */}
          {/* Menu button for small screens */}
          <div className="relative">


            {/* Menu Items */}
            <div
              className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${isMenuOpen ? "block" : "hidden"
                } md:hidden`}
            >
              <div
                className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-[#2A1F9D] mt-5  font-bold  border shadow-sm  border-gray-400 dark:border-none  dark:bg-darkOverlayBackground hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2 my-1
                         bg-white px-3 py-7 rounded-lg w-11/12 max-w-md  dark:text-darkText"
                ref={menuRef}
              >
                <div className="flex justify-between items-center mb-4">
                  <div
                    className=" h-6 absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6 "
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="text-black dark:text-darkText w-6 h-6" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {(isDashboardSupplyOrMain
                    ? WALLET_DETAIL_TAB
                    : WALLET_DETAILS_TABS
                  ).map((data, index) => (
                    <div
                      key={index}
                      className="relative group text-[#2A1F9D] p-3 font-light dark:text-darkTextSecondary rounded-lg shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out"
                      style={{ minWidth: "220px", flex: "1 0 220px" }} // Adjust minWidth and flex properties
                    >
                      <button className="relative w-full text-left flex justify-between items-center">
                        <span>{data.title}</span>
                        <span className="font-bold">{data.count}</span>
                        <hr className="absolute bottom-0 left-0 ease-in-out duration-500 bg-[#8CC0D7] h-[2px] w-[20px] group-hover:w-full" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-14 md:mt-0">
                  <button
                    className=" w-full py-3 px-3 bg-[#FFC1C1] shadow-xl text-red-600 text-xl rounded-md dark:bg-[#BA5858] dark:text-darkText"
                    onClick={handleOpenPopup}
                    style={{ minWidth: "220px" }} // Ensure button has consistent width
                  >
                    Risk Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isAuthenticated && <div className="hidden md:flex items-center flex-wrap text-[#4659CF] font-semibold gap-8 dark:text-darkText mb-5">
            {pathname !== "/dashboard/transaction-history" &&
              (isDashboardSupplyOrMain
                ? WALLET_DETAIL_TAB
                : WALLET_DETAILS_TABS
              ).map((data, index) => (
                <div key={index} className="relative group">
                  <button className="relative font-light text-sm text-left min-w-[80px] dark:opacity-80">
                    {data.title}
                    <hr className="ease-in-out duration-500 bg-[#8CC0D7] h-[2px] w-[20px] group-hover:w-full" />
                    <span className="absolute top-full mt-1 left-0 font-bold py-1 opacity-100 transition-opacity text-[20px] text-[#2A1F9D] dark:text-darkBlue dark:opacity-100">
                      {data.count}
                    </span>
                  </button>
                </div>
              ))}
            {isAuthenticated && shouldRenderRiskDetailsButton && (
              <button
                className="-mt-2 py-1 px-2 border dark:border-white border-blue-500 text-[#2A1F9D] text-[11px] rounded-md font-normal dark:text-darkTextSecondary"
                onClick={handleOpenPopup}
              >
                Risk Details
              </button>
            )}
          </div>}
          {isPopupOpen && <RiskPopup onClose={handleClosePopup} />}

        </div>
        <div className="ml-auto hidden lg:flex">
          {isAuthenticated && shouldRenderTransactionHistoryButton && (
            <a href="/dashboard/transaction-history" className="block">
              <button className=" text-nowrap px-2 py-2 md:px-4 md:py-2 border border-[#2A1F9D] text-[#2A1F9D] bg-[#ffff] rounded-md shadow-md hover:shadow-[#00000040] font-medium text-sm cursor-pointer relative dark:bg-darkOverlayBackground dark:text-darkText dark:border-none sxs3:mt-4 sxs3:ml-0 md:ml-4 md:mt-0">
                Transaction History
              </button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardNav;
