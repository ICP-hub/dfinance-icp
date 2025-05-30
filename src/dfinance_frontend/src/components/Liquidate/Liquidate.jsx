import React, { useEffect, useState } from "react";
import Button from "../Common/button";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import Element from "../../../public/element/elements.svg";
import DebtStatus from "./LiquidationList";
import WalletModal from "../Dashboard/WalletModal";
import FreezeCanisterPopup from "../Dashboard/DashboardPopup/CanisterDrainPopup";
import useUserData from "../CustomHooks/useUserData";
import { useLocation } from "react-router-dom";

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
   *                                  HOOKS & STATES
   * =================================================================================== */

  const navigate = useNavigate();
  const location = useLocation();
  const { isWalletCreated, isSwitchingWallet } = useSelector(
    (state) => state.utility
  );
  const { isAuthenticated } = useAuth();
  const { isFreezePopupVisible, setIsFreezePopupVisible } = useUserData();
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

  // Function to handle the click event for the "Get Debt Status" button
  const handleLiquidateClick = () => {
    if (!isAuthenticated) {
      setShowWarning(true);
    } else {
      navigate("/Liquidate/debt-users-list");
    }
  };

  useEffect(() => {
    if (isFreezePopupVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isFreezePopupVisible]);

  const isDebtStatusRoute = location.pathname === "/Liquidate/debt-users-list";

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

        {!isDebtStatusRoute ? (
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
          <DebtStatus />
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
