import React, { useEffect, useState } from "react";
import Button from "../Common/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import Element from "../../../public/element/Elements.svg";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "react-router-dom";
import DebtStatus from "./DebtStatus";
import WalletModal from "../Dashboard/WalletModal";
import FreezeCanisterPopup from "../Dashboard/DashboardPopup/CanisterDrainPopup";
import useUserData from "../customHooks/useUserData";

/**
 * Liquidate Component
 *
 * This component allows users to check the debt status of others in the system.
 * If a user is not authenticated, they will be prompted to connect their wallet.
 * Upon authentication, they can access a list of users in debt.
 *
 * @returns {JSX.Element} - Returns the Liquidate component.
 */
const Liquidate = () => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isWalletCreated, isSwitchingWallet } = useSelector(
    (state) => state.utility
  );
  const { isAuthenticated } = useAuth();
  const { isFreezePopupVisible, setIsFreezePopupVisible } = useUserData();

  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */

  const [showDebtStatus, setShowDebtStatus] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  /* ===================================================================================
   *                                  EFFECTS & FUNCTIONS
   * =================================================================================== */

  useEffect(() => {
    if (isWalletCreated) {
      navigate("/dashboard/wallet-details");
    }

    if (isAuthenticated) {
      setShowWarning(false);
    }
  }, [isWalletCreated, isAuthenticated]);

  const handleLiquidateClick = () => {
    if (!isAuthenticated) {
      setShowWarning(true);
    } else {
      setShowDebtStatus(true);
    }
  };

  const handleBackClick = () => {
    setShowDebtStatus(false);
  };

  useEffect(() => {
    if (isFreezePopupVisible) {
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      document.body.style.overflow = "auto"; // Enable scrolling when popup closes
    }

    return () => {
      document.body.style.overflow = "auto"; // Cleanup function to reset scrolling
    };
  }, [isFreezePopupVisible]);

  return (
    <>
      <div className="full">
        <div className="flex h-[60px] justify-start align-center place-content-center -ml-2">
          <h1
            id="liquidation-guide"
            className="text-[#2A1F9D] text-[19px] md:text-2xl lg:text-2xl font-bold inline-flex items-center dark:text-darkText"
          >
            Liquidation
          </h1>
        </div>

        {!showDebtStatus ? (
          <div
            id="liquidation2"
            className="relative w-full md:w-11/12 mx-auto my-6 min-h-[450px] md:min-h-[500px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart"
          >
            <div
              id="liquidation1"
              className="absolute right-0 top-0 h-full w-full ss1:w-full lg:w-1/2 md:w-full pointer-events-none"
            >
              <img
                src={Element}
                alt="Elements"
                className="h-full w-full object-cover rounded-r-3xl opacity-60 dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"
              />
            </div>
            <h1
              id="liquidation"
              className="text-[#2A1F9D] font-bold my-2 text-xl dark:text-darkText mb-3"
            >
              Check Users in Debt
            </h1>

            {}
            {showWarning && (
              <div className="text-red-500 font-bold mb-4">
                Please connect your wallet to check the debt status.
              </div>
            )}

            <Button
              title="Get Debt Status"
              onClickHandler={handleLiquidateClick}
            />
          </div>
        ) : (
          <DebtStatus onBackClick={handleBackClick} />
        )}

        {isFreezePopupVisible && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
            <FreezeCanisterPopup
              onClose={() => setIsFreezePopupVisible(false)}
            />
          </div>
        )}
        {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
      </div>
    </>
  );
};

export default Liquidate;
