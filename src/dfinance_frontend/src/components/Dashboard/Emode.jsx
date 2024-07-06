import React, { useState } from "react";
import { FaCog } from "react-icons/fa";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { Info } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EModeButton = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showInitialPopup, setShowInitialPopup] = useState(false);
  const [showFinalPopup, setShowFinalPopup] = useState(false);

  const handleSettingClick = () => {
    setShowInitialPopup(!showInitialPopup);
  };

  const handleEnableClick = () => {
    setShowFinalPopup(true);
    setShowInitialPopup(false);
  };

  const handleFinalEnableClick = () => {
    setIsEnabled(true);
    setShowFinalPopup(false);
    toast.info("E-Mode enabled successfully!");
  };

  const handleDisableClick = () => {
    setIsEnabled(false);
    setShowInitialPopup(false);
    toast.info("E-Mode disabled successfully!");
  };

  const handleClickAway = () => {
    setShowInitialPopup(false);
    setShowFinalPopup(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div className="relative">
        <button
          onClick={isEnabled ? handleDisableClick : handleSettingClick}
          className="px-4 py-0.5 text-xs rounded bg-gray-400 opacity-80 text-white flex items-center"
        >
          {isEnabled ? "Enable" : "Disable"}
          <FaCog className="ml-2 cursor-pointer" />
        </button>

        {showInitialPopup && (
          <div className="absolute mt-2 w-80 flex items-center justify-center md:right-0 md:top-auto md:bottom-auto md:left-auto md:translate-x-0 left-0 translate-x-full">
            <div className="bg-white border rounded-lg shadow-lg p-6 relative w-full flex flex-col justify-between dark:bg-darkBackground dark:text-darkText">
              <button
                onClick={handleClickAway}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
              <div className="dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd dark:text-darkText">
                <h2 className="text-xl font-semibold mb-4 dark:text-darkText">
                  Efficiency mode (E-Mode)
                </h2>
                <p className="text-gray-700 mb-4 dark:text-darkText">
                  E-Mode increases your LTV for a selected category of assets up to 97%.{" "}
                  <a
                    href="https://docs.aave.com/faq/aave-v3-features#high-efficiency-mode-e-mode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Learn more
                  </a>
                </p>
              </div>
              <button
                onClick={handleEnableClick}
                className="w-full my-2 bg-gradient-to-r text-white from-[#EB8863] to-[#81198E] rounded-md p-3 shadow-lg font-semibold text-sm"
              >
                Enable E-Mode
              </button>
            </div>
          </div>
        )}

        {showFinalPopup && (
          <ClickAwayListener onClickAway={handleClickAway}>
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="absolute inset-0 bg-gray-800 opacity-50" />
              <div className="bg-white dark:bg-gradient dark:bg-darkBackground rounded-lg shadow-lg p-6 relative w-96 flex flex-col">
                <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
                  Enable E-Mode
                </h1>
                <button
                  onClick={handleClickAway}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-300"
                >
                  &times;
                </button>
                <div className="flex flex-col gap-2 mt-5 text-sm dark:text-darkText">
                  <div className="w-full">
                    <div className="w-full flex bg-[#96d6f1] dark:bg-[#59588C] p-1 rounded">
                      <div className="w-1/12 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="w-4 h-4 mr-1 text-blue dark:text-[#96d6f1]"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01m-6.938 4h13.856c.72 0 1.392-.386 1.732-1l6.939-12a2 2 0 00-1.732-3H4.134a2 2 0 00-1.732 3l6.939 12c.34.614 1.012 1 1.732 1z"
                          />
                        </svg>
                      </div>
                      <div className="w-11/12 text-xs text-[#2A1F9D] dark:text-darkText flex items-center ml-1">
                        Enabling E-Mode only allows you to borrow assets belonging to the selected category. Please visit our FAQ guide to learn more about how it works and the applied restrictions.
                      </div>
                    </div>
                    <div className="w-full text-[#2A1F9D] dark:text-darkText flex justify-between my-2">
                      <h1>Transaction overview</h1>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-[#1D1B40] hover:bg-gray-200 dark:hover:bg-[#3a3772] cursor-pointer p-3 rounded-md text-sm">
                      <div className="w-full flex flex-col my-1">
                        <div className="w-full flex justify-between items-center">
                          <p className="text-nowrap text-[#2A1F9D] dark:text-darkText">
                            E-mode Category
                          </p>
                          <p>
                            <span className="ml-1 text-[#2A1F9D] dark:text-darkText">
                              None
                            </span>
                            <span className="text-[#2A1F9D] dark:text-darkText mx-1">
                              →
                            </span>
                            <span className="text-[#2A1F9D] dark:text-darkText">
                              Stable Coins
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="w-full flex flex-col my-1">
                        <div className="w-full flex justify-between items-center text-[#2A1F9D] dark:text-darkText">
                          <p>Available Assets</p>
                          <p>
                            <span className="text-[#2A1F9D] dark:text-darkText">
                              All Assets
                            </span>
                            <span className="text-[#2A1F9D] dark:text-darkText">
                              →
                            </span>
                            <span className="break-all">
                              abc,xyz,jkl,
                              <br />
                              stu,mno
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="w-full mt-3">
                      <div className="flex items-center">
                        <img
                          src="/Vector.png"
                          alt="Vector Image"
                          className="w-4 h-4 mr-1 dark:text-darkText"
                        />
                        <h1 className="">&lt;$1.23</h1>
                        <div className="warning-icon-container">
                          <Info
                            size={16}
                            className="text-[#120f34] dark:text-darkText ml-1"
                          />
                        </div>
                      </div>
                      <div className="w-full">
                        <button
                          onClick={handleFinalEnableClick}
                          className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4"
                        >
                          Enable E-mode
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ClickAwayListener>
        )}
      </div>
    </ClickAwayListener>
  );
};

export default EModeButton;
