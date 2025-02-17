import React, { useEffect } from "react";
import { X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TestnetModePopup = ({ onClose, handleTestnetModeToggle }) => {
  /* ===================================================================================
   *                                  FUNCTION
   * =================================================================================== */

  const handleDisableTestnetClick = () => {
    handleTestnetModeToggle(false);
    localStorage.removeItem("isTestnetMode");
    onClose();
    toast.dismiss();
    toast.info("Testnet mode disabled successfully!");
  };

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <>
      <div
        className="fixed inset-0 bg-black opacity-40 z-40"
        onClick={onClose}
      ></div>
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-lg p-6 relative w-80 flex flex-col justify-between dark:bg-darkOverlayBackground dark:text-darkText"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="h-6 absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6"
            onClick={onClose}
          >
            <X className="text-black w-6 h-6 dark:text-darkText cursor-pointer" />
          </div>
          <div className="dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd dark:text-darkText">
            <h2 className="text-xl font-semibold mb-4 dark:text-darkText">
              Testnet Mode is ON
            </h2>
            <p className="text-gray-700 mb-4 text-sm dark:text-darkText">
              Testnet Mode will be disabled before <b>Phase 1 launch</b>.
              Testnet Mode will end soon, use the platform to earn rewards and
              provide feedback.
            </p>
          </div>
          {}
        </div>
        <ToastContainer />
      </div>
    </>
  );
};

export default TestnetModePopup;
