import React, { useState, lazy, Suspense } from "react";
import Button from "../../components/Common/Button";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../utils/useAuthClient";
import Element from "../../../public/element/Elements.svg";
import { setWalletModalOpen } from "../../redux/reducers/utilityReducer";
import MiniLoader from "../../components/Common/MiniLoader";
const RewardDetails = lazy(() =>
  import("../../components/Reward/RewardDetails")
);
const WalletModal = lazy(() =>
  import("../../components/Dashboard/WalletModal")
);

/**
 * Reward component allows users to receive testnet assets for testing purposes.
 * Users must connect their wallet to receive assets.
 *
 * @returns {JSX.Element} - Returns the Faucet component.
 */
const Reward = () => {
  const dispatch = useDispatch();
  const { isWalletModalOpen, isSwitchingWallet } = useSelector(
    (state) => state.utility
  );
  const { isAuthenticated } = useAuth();
  const [isTestnetMode, setIsTestnetMode] = useState(true);

  const handleWalletConnect = () => {
    dispatch(
      setWalletModalOpen({ isOpen: !isWalletModalOpen, isSwitching: false })
    );
  };

  const handleTestnetModeToggle = () => {
    setIsTestnetMode((prevMode) => !prevMode);
  };

  return (
    <>
      {isTestnetMode && (
        <>
          <div className="mb-3">
            <p className="font-weight-500 text-gray-600 dark:text-gray-300 text-[12px] sm:text-[13px] md:text-[14px] xs:text-[11px] text-justify ml-1 mt-7">
              You can earn rewards by locking your LP tokens after supplying
              liquidity on the DEX. To qualify, you must lock at least 5% of
              your supplied liquidity. The longer you lock, the higher your
              rewards: 1X for 1 month, 4X for 3 months, 10X for 6 months, and
              25X for 12 months.
            </p>
          </div>
          {isAuthenticated ? (
            <Suspense
              fallback={
                <div className="flex justify-center items-center min-h-[50vh]">
                  <MiniLoader />
                </div>
              }
            >
              <RewardDetails />
            </Suspense>
          ) : (
            <div className="relative w-full md:w-10/12 mx-auto my-6 min-h-[300px] md:min-h-[450px] xl3:min-h-[600px] xl4:min-h-[850px] flex flex-col items-center justify-center mt-16 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl p-6 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientStart">
              <div className="absolute right-0 top-0 h-full w-full md:w-1/2 pointer-events-none">
                <img
                  src={Element}
                  alt="Elements"
                  className="h-full w-full object-cover rounded-r-3xl opacity-60 dark:opacity-40 dark:filter dark:drop-shadow-[0_0_0_#0000ff]"
                />
              </div>
              <h1 className="text-[#2A1F9D] font-semibold my-2 text-lg dark:text-darkText">
                Please, connect your wallet
              </h1>
              <p className="text-[#737373] my-2 font-medium text-center dark:text-darkTextSecondary">
                Please connect your wallet to get free testnet assets
              </p>

              <Button
                title="Connect Wallet"
                onClickHandler={handleWalletConnect}
              />

              <Suspense
                fallback={
                  <div className="flex justify-center items-center min-h-[50vh]">
                    <MiniLoader />
                  </div>
                }
              >
                {(isSwitchingWallet || !isAuthenticated) && <WalletModal />}
              </Suspense>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Reward;
