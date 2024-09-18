import React, { useState, useEffect } from "react";
import { FaCog } from "react-icons/fa";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { Info, Fuel, X, TriangleAlert } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EModeButton = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showInitialPopup, setShowInitialPopup] = useState(false);
  const [showFinalPopup, setShowFinalPopup] = useState(false);
  const [currentToastId, setCurrentToastId] = useState(null);

  const handleSettingClick = () => {
    setShowInitialPopup(!showInitialPopup);
  };

  const handleEnableClick = () => {
    setShowFinalPopup(true);
    setShowInitialPopup(false);
  };

  const theme = useSelector((state) => state.theme.theme);
  const fuelcolor = theme === "dark" ? "#8CC0D7" : "#233D63";

  useEffect(() => {
    if (showInitialPopup || showFinalPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showInitialPopup, showFinalPopup]);

  const handleFinalEnableClick = () => {
    setIsEnabled(true);
    setShowFinalPopup(false);

    if (currentToastId) {
      toast.dismiss(currentToastId);
    }

    const toastId = toast.info("E-Mode enabled successfully!", {
      className: 'custom-toast',
      position: "top-center",
      autoClose: 3000,
    });
    setCurrentToastId(toastId);
  };

  const handleDisableClick = () => {
    setIsEnabled(false);
    setShowInitialPopup(false);

    if (currentToastId) {
      toast.dismiss(currentToastId);
    }

    const toastId = toast.info("E-Mode disabled successfully!", {
      className: 'custom-toast',
      position: "top-center",
      autoClose: 3000,
    });
    setCurrentToastId(toastId);
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
          <>
            <div className="fixed inset-0 bg-black opacity-40 z-40" onClick={handleClickAway}></div>
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-white border rounded-lg shadow-lg p-6 relative w-80 flex flex-col justify-between dark:border-none dark:bg-darkOverlayBackground dark:text-darkText">
                <div
                  className="h-6 absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6"
                  onClick={handleClickAway}
                >
                  <X className="text-black dark:text-darkText w-6 h-6" />
                </div>
                <div className="dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd dark:text-darkText">
                  <h2 className="text-xl font-semibold mb-4 text-[#2A1F9D] dark:text-darkText">
                    Efficiency mode (E-Mode)
                  </h2>
                  <p className="text-[#2A1F9D] mb-4 dark:text-darkText">
                    E-Mode increases your LTV for a selected category of assets up to 97%.{" "}
                    <span className="text-[#2A1F9D] underline dark:text-darkText">Learn more</span>
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
          </>
        )}

        {showFinalPopup && (
          <ClickAwayListener onClickAway={handleClickAway}>
            <div className="fixed inset-0 flex items-center justify-center  z-50">
              <div className="absolute inset-0 bg-black opacity-40 " />
              <div className="bg-white dark:bg-gradient dark:bg-darkOverlayBackground rounded-lg shadow-lg p-6 relative w-80 lg1:w-96 flex flex-col ">
                <h1 className="text-[#2A1F9D] font-bold dark:text-darkText">
                  Enable E-Mode
                </h1>
                <div
                  className=" h-6 absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6 "
                  onClick={handleClickAway}
                >
                  <X className="text-black w-6 h-6 dark:text-darkText" />
                </div>
                <div className="flex flex-col gap-2 mt-5 text-sm dark:text-darkText">
                  <div className="w-full">
                    <div className="w-full flex bg-[#D7F1FC] dark:bg-[#59588C] p-1 rounded">
                      <div className="w-1/12 flex items-center justify-center">
                        <TriangleAlert />
                      </div>
                      <div className="w-11/12 text-xs text-[#2A1F9D] dark:text-darkText flex items-center ml-1 ">
                        Enabling E-Mode only allows you to borrow assets belonging to the selected category. Please visit our FAQ guide to learn more about how it works and the applied restrictions.
                      </div>
                    </div>
                    <div className="w-full text-[#2A1F9D] dark:text-darkText flex justify-between my-2">
                      <h1>Transaction overview</h1>
                    </div>
                    <div className="w-full bg-[#F6F6F6] dark:bg-[#1D1B40] hover:bg-gray-200 dark:hover:bg-[#3a3772] cursor-pointer p-3 rounded-md text-sm">
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
                        <Fuel className="mt-[-4px] mr-2" size={18} color={fuelcolor} />
                        <h1 className="text-[#233D63] dark:text-darkTextSecondary1">&lt;$1.23</h1>
                        <div className="warning-icon-container">
                          <Info
                            size={16}
                            className="text-[#120f34] dark:text-darkTextSecondary1 ml-1"
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
