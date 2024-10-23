import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../utils/useAuthClient";
import check from "../../../public/assests-icon/check.png";
import cross from "../../../public/assests-icon/Cross.png";
import { idlFactory as ledgerIdlFactory } from "../../../../declarations/token_ledger";
import { Principal } from "@dfinity/principal";
import { useMemo } from "react";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/cketh.png";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import { useCallback } from "react";
import { toast } from "react-toastify"; // Import Toastify if not already done
import "react-toastify/dist/ReactToastify.css";
import useAssetData from "../Common/useAssets";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import useFormatNumber from "../customHooks/useFormatNumber";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import useUserData from "../customHooks/useUserData";

const UserInformationPopup = ({ onClose, mappedItem, principal }) => {
  const { backendActor, principal: currentUserPrincipal } = useAuth();

  console.log(
    "mappeditems",
    Number(mappedItem?.item[1]?.health_factor) / 10000000000
  );
  const [rewardAmount, setRewardAmount] = useState();
  const [amountToRepay, setAmountToRepay] = useState();
  const [isApproved, setIsApproved] = useState(false);
  const popupRef = useRef(null);
  const [isDebtInfo, setIsDebtInfo] = useState(false); // State to manage content view
  const [isCollateralOverlay, setIsCollateralOverlay] = useState(false); // New state for Collateral Overlay
  const [selectedAsset, setSelectedAsset] = useState(); // Default selected asset
  const [selectedDebtAsset, setSelectedDebtAsset] = useState(); // Default selected asset
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null); // State to handle transaction
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);

  const [userdata, setUserData] = useState();
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const fees = useSelector((state) => state.fees.fees);
  const normalizedAsset = selectedAsset
    ? selectedAsset.toLowerCase()
    : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }

  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);

  const { userData, healthFactorBackend, refetchUserData } = useUserData();

  function roundToDecimal(value, decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(value * factor) / factor;
  }

  const defaultAsset = "cketh";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleClickOutside = (e) => {
    if (popupRef.current && !popupRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNextClick = () => {
    if (isDebtInfo) {
      setIsCollateralOverlay(true); // Show Collateral Overlay on next click in Debt Info
    } else {
      setIsDebtInfo(true); // Switch to Debt Information view
    }
  };
  const [amountBorrowUSD, setAmountBorrowUSD] = useState(null);
  const [selectedAssetSupply, setSelectedAssetSupply] = useState(null);
  const [collateralRate, setCollateralRate] = useState(null);
  const [collateral, setCollateralRateAmount] = useState(null);

  const [isCollateralAssetSelected, setIsCollateralAssetSelected] =
    useState(false);
  const handleAssetSelection = (
    asset,
    collateralRate,
    assetSupply,
    collateralAmount
  ) => {
    setIsCollateralAssetSelected(true);
    setSelectedAsset(asset);
    setCollateralRate(collateralRate ? collateralRate : 0);
    // Set the selected asset (only one at a time)
    setSelectedAssetSupply(assetSupply);
    setCollateralRateAmount(collateralAmount ? collateralAmount : 0);
  };
  console.log("selectedAsstSUplly", selectedAssetSupply);
  console.log("Collateral in usd", collateral);
  const [isDebtAssetSelected, setIsDebtAssetSelected] = useState(false);
  const [amountToRepayUSD, setAmountToRepayUSD] = useState(null);

  const handleDebtAssetSelection = (
    asset,
    assetBorrowAmount,
    assetBorrowAmountInUSD
  ) => {
    setIsDebtAssetSelected(true);
    setSelectedDebtAsset(asset); // Set the selected asset (only one at a time)
    setAmountToRepay(assetBorrowAmount ? assetBorrowAmount : 0);
    setAmountToRepayUSD(assetBorrowAmountInUSD ? assetBorrowAmountInUSD : 0);

    console.log("Asset Borrow Amount to Repay:", assetBorrowAmount);
    console.log("Amount to Repay (after check):", amountToRepay);
  };

  const handleCheckboxClick = (e) => {
    setIsCheckboxChecked(e.target.checked);
  };

  const ledgerActors = useSelector((state) => state.ledger);
  console.log("ledgerActors", ledgerActors);

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    fetchBalance,
  } = useFetchConversionRate();

  const principalObj = useMemo(
    () => Principal.fromText(currentUserPrincipal),
    [currentUserPrincipal]
  );

  const [loading, setLoading] = useState();

  const handleApprove = async () => {
    let ledgerActor;
    if (selectedDebtAsset === "ckBTC") {
      ledgerActor = ledgerActors.ckBTC;
    } else if (selectedDebtAsset === "ckETH") {
      ledgerActor = ledgerActors.ckETH;
    } else if (selectedDebtAsset === "ckUSDC") {
      ledgerActor = ledgerActors.ckUSDC;
    } else if (selectedDebtAsset === "ICP") {
      ledgerActor = ledgerActors.ICP;
    }

    const transferfee = BigInt(100);
    // Convert amount and transferFee to numbers and add them
    const supplyAmount = BigInt(amountToRepay.toFixed(8) * 100000000);
    const totalAmount = supplyAmount + transferfee;

    try {
      setIsLoading(true);

      // Call the approval function
      const approval = await ledgerActor.icrc2_approve({
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: totalAmount,
        expected_allowance: [],
        expires_at: [],
        spender: {
          owner: Principal.fromText(process.env.CANISTER_ID_DFINANCE_BACKEND),
          subaccount: [],
        },
      });

      console.log("Approve", approval);
      setIsApproved(true);
      console.log("isApproved state after approval:", isApproved);

      // Show success notification
      toast.success(`Approval successful!`, {
        className: 'custom-toast',
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      // Log the error
      console.error("Approval failed:", error);

      // Show error notification using Toastify
      toast.error(`Error: ${error.message || "Approval failed!"}`, {
        className: 'custom-toast',
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsLoading(false); // Stop loading once the function is done
    }
  };

  const handleConfirmLiquidation = async () => {
    setIsLoading(true);
    try {
      const supplyAmount = BigInt(amountToRepay.toFixed(8) * 100000000);
      console.log("backend actor", backendActor);

      if (!backendActor) {
        throw new Error("Backend actor is not initialized");
      }

      const result = await backendActor.liquidation_call(
        selectedDebtAsset,
        selectedAsset,
        supplyAmount,
        mappedItem.principal
      );

      if ("Ok" in result) {
        toast.success(`Liquidation successful!`,  {
          className: 'custom-toast',
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        console.log("Liquidation call result:", result);
        setTransactionResult("success");
      } else if ("Err" in result) {
        // Handle the error returned in the result
        const errorMsg = result.Err;
        toast.error(`Liquidation failed: ${errorMsg}`, {
          className: 'custom-toast',
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        console.error("Liquidation call error:", errorMsg);
        setTransactionResult("failure");
      }

      setShowWarningPopup(false);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      console.error("Error during liquidation:", error);
      setTransactionResult("failure");
    } finally {
      setIsLoading(false); // Stop loading once the function is done
    }
  };

  const handleCloseWarningPopup = () => {
    setShowWarningPopup(false);
  };

  const handleCallLiquidation = () => {
    setShowWarningPopup(true);
  };

  const handleClosePopup = () => {
    setTransactionResult(null);
    onClose(); // Close the transaction result popup
  };

  useEffect(() => {
    if (ckBTCBalance && ckBTCUsdRate) {
      const balanceInUsd = (parseFloat(ckBTCBalance) * ckBTCUsdRate).toFixed(2);
      setCkBTCUsdBalance(balanceInUsd);
      console.log(`ckBTC Balance in USD: ${balanceInUsd}`);
    }
  }, [ckBTCBalance, ckBTCUsdRate]);

  useEffect(() => {
    if (ckETHBalance && ckETHUsdRate) {
      const balanceInUsd = (parseFloat(ckETHBalance) * ckETHUsdRate).toFixed(2);
      setCkETHUsdBalance(balanceInUsd);
      console.log(`ckETH Balance in USD: ${balanceInUsd}`);
    }
  }, [ckETHBalance, ckETHUsdRate]);

  useEffect(() => {
    if (ckUSDCBalance && ckUSDCUsdRate) {
      const balanceInUsd = (parseFloat(ckUSDCBalance) * ckUSDCUsdRate).toFixed(
        2
      );
      setCkUSDCUsdBalance(balanceInUsd);
      console.log(`ckUSDC Balance in USD: ${balanceInUsd}`);
    }
  }, [ckUSDCBalance, ckUSDCUsdRate]);

  useEffect(() => {
    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (parseFloat(ckICPBalance) * ckICPUsdRate).toFixed(2);
      setCkICPUsdBalance(balanceInUsd);
    }
  }, [ckICPBalance, ckICPUsdRate]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBalance("ckBTC"),
          fetchBalance("ckETH"),
          fetchBalance("ckUSDC"),
          fetchBalance("ICP"),
          fetchConversionRate(), // Fetch ckBTC and ckETH rates
        ]);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [
    fetchBalance,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
  ]);

  const renderDebtAssetDetails = (asset) => {
    switch (asset) {
      case "ckETH":
        return (
          <>
            <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 "></div>
            <div>
              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                My Section
              </h3>
              <div className="mb-4">
                <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm text-gray-900 ">
                  <p className="text-sm font-normal font-Poppins text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                    My Wallet Balance
                  </p>
                  <p className="text-xs font-medium text-[#2A1F9D] dark:text-darkText ">
                    {ckETHBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      case "ckBTC":
        return (
          <>
            <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 "></div>
            <div>
              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                My Section
              </h3>
              <div className="mb-4">
                <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm text-gray-900 ">
                  <p className="text-sm font-normal font-Poppins text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                    My Wallet Balance
                  </p>
                  <p className="text-xs font-medium text-[#2A1F9D] dark:text-darkText ">
                    {ckBTCBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      case "ckUSDC":
        return (
          <>
            <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 "></div>
            <div>
              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                My Section
              </h3>
              <div className="mb-4">
                <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm text-gray-900 ">
                  <p className="text-sm font-normal font-Poppins text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                    My Wallet Balance
                  </p>
                  <p className="text-xs font-medium text-[#2A1F9D] dark:text-darkText ">
                    {ckUSDCBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      case "ICP":
        return (
          <>
            <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 "></div>
            <div>
              <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                My Section
              </h3>
              <div className="mb-4">
                <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm text-gray-900 ">
                  <p className="text-sm font-normal font-Poppins text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                    My Wallet Balance
                  </p>
                  <p className="text-xs font-medium text-[#2A1F9D] dark:text-darkText ">
                    {ckICPBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };
  const renderAssetDetails = (asset) => {
    console.log("asset", asset);
    switch (asset) {
      case "ckETH":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckETH Price
              </p>
              <p className="text-sm font-medium">{Number(collateralRate).toLocaleString()}</p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckETH Liquidation Bonus %
              </p>
              <p className="text-sm font-medium"> {liquidation_bonus}%</p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500">
              {((collateral + collateral * (liquidation_bonus / 100)).toFixed(8)).toLocaleString()}
              </p>
            </div>
          </div>
        );

        return null;
      case "ckBTC":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckBTC Price
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
                {Number(collateralRate).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckBTC liquidation Bonus %
              </p>
              <p className="text-sm font-medium">{liquidation_bonus}%</p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500">
              {((collateral + collateral * (liquidation_bonus / 100)).toFixed(8)).toLocaleString()}
              </p>
            </div>
          </div>
        );

        return null;
      case "ckUSDC":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ckUSDC Price
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
                {Number(collateralRate).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ckUSDC Liquidation Bonus %
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
                {liquidation_bonus}%
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500">
                {(collateral + collateral * (liquidation_bonus / 100)).toFixed(
                  8
                )}
              </p>
            </div>
          </div>
        );

        return null;
      case "ICP":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ICP Price
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
                {Number(collateralRate).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ICP Liquidation Bonus %
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
                {liquidation_bonus}%
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500">
              {Number((collateral + collateral * (liquidation_bonus / 100)).toFixed(8)).toLocaleString()}
              </p>
            </div>
          </div>
        );

        return null;
      default:
        return null;
    }
  };

  const { filteredItems } = useAssetData();

  const formatNumber = useFormatNumber();
  let liquidation_bonus = "";

  const selectedItem = filteredItems.find((item) => {
    const assetName = item[1].Ok.asset_name
      ? item[1].Ok.asset_name[0]
      : "Unknown";
    return assetName === selectedAsset;
  });

  if (selectedItem && selectedItem[1]?.Ok) {
    const item = selectedItem[1].Ok;
    liquidation_bonus =
      Number(item?.configuration?.liquidation_bonus || "0") / 100000000;
  }

  useEffect(() => {
    const calculatedRewardAmount = Math.floor(
      collateral + collateral * (liquidation_bonus / 100)
    );
    setRewardAmount(calculatedRewardAmount);
  }, [collateral, liquidation_bonus]);
  const [selectedAssetBalance, setSelectedAssetBalance] = useState(0);

  useEffect(() => {
    switch (selectedDebtAsset) {
      case "ckETH":
        setSelectedAssetBalance(ckETHBalance);
        break;
      case "ckBTC":
        setSelectedAssetBalance(ckBTCBalance);
        break;
      case "ckUSDC":
        setSelectedAssetBalance(ckUSDCBalance);
        break;
      case "ICP":
        setSelectedAssetBalance(ckICPBalance);
        break;
      default:
        setSelectedAssetBalance(0);
    }
  }, [
    selectedDebtAsset,
    ckETHBalance,
    ckBTCBalance,
    ckUSDCBalance,
    ckICPBalance,
  ]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      {transactionResult ? (
        // Transaction result popup
        <div
          ref={popupRef}
          className="bg-white dark:bg-[#1D1B40] dark:text-darkText p-6 rounded-md w-full max-w-md mx-4 text-center"
        >
          <div className="flex flex-col items-center">
            {transactionResult === "success" ? (
              <>
                <img src={check} alt="Success" className="w-30 h-30" />
                <h2 className="text-2xl font-bold text-[#2A1F9D] dark:text-darkText mb-2">
                  Liquidation Successful
                </h2>
                <p className="text-gray-500 dark:text-darkText mb-4">
                  Check Your wallet balance
                </p>
                <button
                  className="bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
                  onClick={handleClosePopup}
                >
                  Close Now
                </button>
              </>
            ) : (
              <>
                <img src={cross} alt="Failure" className="w-30 h-30" />
                <h2 className="text-2xl font-bold text-[#2A1F9D] dark:text-darkText mb-4 -mt-6">
                  Liquidation Call Failed
                </h2>

                <button
                  className="bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
                  onClick={handleClosePopup}
                >
                  Close Now
                </button>
              </>
            )}
          </div>
        </div>
      ) : showWarningPopup ? (
        <div className="bg-white dark:bg-[#1D1B40] dark:text-darkText p-6 rounded-md w-full max-w-md mx-4">
          <h2 className="text-xl font-bold text-center text-[#2A1F9D] dark:text-indigo-300">
            Warning Pop Up
          </h2>
          <p className="text-sm text-[#989898] text-center dark:text-darkText mt-4 font-light">
            Are you sure you want to liquidate on behalf of "
            <strong className="font-bold">{principal}</strong>"?
            <strong className="font-bold">{amountToRepay} ICP</strong>
            will be <strong className="font-bold">deducted</strong> from your
            account &<strong className="font-bold">{rewardAmount}</strong> will
            be rewarded.
          </p>

          <div className="mt-4 flex justify-center">
            <label className="flex items-center text-[#989898]  ">
              <input
                type="checkbox"
                className="mr-2 h-4 w-4  appearance-none border-2 border-gray-300 rounded bg-white checked:bg-gray-400 checked:border-gray-400 checked:text-white focus:outline-none checked:after:content-['✔'] checked:after:text-white checked:after:text-xs checked:after:flex checked:after:justify-center checked:after:items-center"
                checked={isCheckboxChecked}
                onChange={handleCheckboxClick}
              />
              <p className="font-semibold">Yes, call Liquidation</p>
            </label>
          </div>

          <div className="flex justify-center mt-6 ">
            {isCheckboxChecked ? (
              // Button for "Call Liquidation"
              <button
                className={`bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleConfirmLiquidation}
                disabled={isLoading} // Disable the button while loading
              >
                {"Call Liquidation"}
              </button>
            ) : (
              // Button for "Cancel"
              <button
                className="bg-gray-400 dark:bg-gray-500 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2"
                onClick={handleCloseWarningPopup}
                disabled={isLoading} // Disable the button while loading
              >
                Cancel
              </button>
            )}

            {isLoading && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{
                  background: "rgba(0, 0, 0, 0.4)", // Dim background
                  backdropFilter: "blur(1px)", // Blur effect
                }}
              >
                <div className="loader"></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          ref={popupRef}
          className="bg-white shadow-xl rounded-xl top-1/2 left-1/2 -translate-x-1/6 -translate-y-1/10 p-6 text-[#2A1F9D] dark:bg-darkOverlayBackground dark:text-darkText font-poppins w-full max-w-md mx-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#2A1F9D] dark:text-darkText">
              {isCollateralOverlay
                ? "Collateral Information"
                : isDebtInfo
                ? "Debt Information"
                : "User Information"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-darkText hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {isCollateralOverlay ? (
            // Collateral Overlay Content with checkboxes for asset selection
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                  Collateral Asset
                </h3>
                {/* Collateral Asset selection with checkboxes */}

                <div className="flex items-center space-x-4 mb-4">
                  {mappedItem.reserves[0].map((item, index) => {
                    console.log("mappedItesm", mappedItem.reserves[0]);
                    const assetName = item[1]?.reserve;
                    const assetSupply = Number(item?.[1]?.asset_supply || 0n) / 100000000;
                    const assetBorrow = Number(item?.[1]?.asset_borrow || 0n) / 100000000;
                    const assetBorrowAmount = Math.floor(assetBorrow / 2);

                    let collateralRate = 0;
                    if (assetName === "ckBTC" && ckBTCUsdRate) {
                      collateralRate = ckBTCUsdRate;
                    } else if (assetName === "ckETH" && ckETHUsdRate) {
                      collateralRate = ckETHUsdRate;
                    } else if (assetName === "ckUSDC" && ckUSDCUsdRate) {
                      collateralRate = ckUSDCUsdRate;
                    } else if (assetName === "ICP" && ckICPUsdRate) {
                      collateralRate = ckICPUsdRate;
                    }

                    console.log("collateralRate", collateralRate);

                    const collateralAmount = amountToRepayUSD / collateralRate;

                    const assetBalance =
                      assetName === "ckBTC"
                        ? ckBTCBalance
                        : assetName === "ckETH"
                        ? ckETHBalance
                        : assetName === "ckUSDC"
                        ? ckUSDCBalance
                        : assetName === "ICP"
                        ? ckICPBalance
                        : 0;

                    if (assetSupply > 0) {
                      return (
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="asset"
                            className="form-radio text-[#EB8863]"
                            checked={selectedAsset === assetName}
                            onChange={() =>
                              handleAssetSelection(
                                assetName,
                                collateralRate,
                                assetSupply,
                                collateralAmount
                              )
                            }
                          />
                          <img
                            key={index}
                            src={
                              assetName === "ckBTC"
                                ? ckBTC
                                : assetName === "ckETH"
                                ? ckETH
                                : assetName === "ckUSDC"
                                ? ckUSDC
                                : assetName === "ICP"
                                ? icp
                                : undefined
                            }
                            alt={assetName}
                            className="rounded-[50%] w-7"
                          />{" "}
                        </label>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Render asset details based on selected checkboxes */}
                {renderAssetDetails(selectedAsset)}

                <div className="flex items-center mt-2">
                  <Fuel className="w-4 h-4 mr-1" />
                  <h1 className="text-lg font-semibold mr-1">{transferFee}</h1>
                  {selectedAsset === "ckBTC" && (
                    <img
                      src={ckBTC}
                      alt="ckBTC icon"
                      className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
                    />
                  )}

                  {selectedAsset === "ckETH" && (
                    <img
                      src={ckETH}
                      alt="ckETH icon"
                      className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
                    />
                  )}

                  {selectedAsset === "ckUSDC" && (
                    <img
                      src={ckUSDC}
                      alt="ckUSDC icon"
                      className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
                    />
                  )}
                  {selectedAsset === "ICP" && (
                    <img
                      src={icp}
                      alt="ICP icon"
                      className="object-cover w-5 h-5 rounded-full" // Ensure the image is fully rounded
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button
                  title="Back"
                  className="py-2 px-6 focus:outline-none box bg-transparent shadow-lg  sxs3:text-[12px] md:text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-darkText button2"
                  onClick={() => setIsCollateralOverlay(false)}
                >
                  Back
                </button>
                <button
                  className={`bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] sxs3:text-[12px] md:text-sm  px-6 py-2 sxs3:p-1 sxs3:px-4 relative ${isCollateralAssetSelected &&
                    amountToRepay + amountToRepay * (liquidation_bonus / 100) <
                      selectedAssetSupply
                      ? "opacity-100 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    console.log("Button clicked");
                    isApproved ? handleCallLiquidation() : handleApprove();
                  }}
                  disabled={
                    isLoading ||
                    !isCollateralAssetSelected ||
                    !(
                      collateral + collateral * (liquidation_bonus / 100) <
                      selectedAssetSupply
                    )
                  }
                >
                  {isApproved
                    ? `Call Liquidation ${selectedDebtAsset}`
                    : `Approve ${selectedDebtAsset} to continue`}
                </button>
                {isLoading && (
                  <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{
                      background: "rgba(0, 0, 0, 0.4)", // Dim background
                      backdropFilter: "blur(1px)", // Blur effect
                    }}
                  >
                    <div className="loader"></div>
                  </div>
                )}
              </div>
            </div>
          ) : isDebtInfo ? (
            // Debt Information Content
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                  Debt Asset
                </h3>
                <div className="flex items-center space-x-4 mb-4">
                  {mappedItem.reserves[0].map((item, index) => {
                    const assetName = item[1]?.reserve;

                    const assetBorrow = Number(item?.[1]?.asset_borrow || 0n) / 100000000; // or Math.pow(10, 8)
                    const assetBorrowAmount = Number(assetBorrow / 2);
                    console.log("assetBorrow", assetBorrow)
                    let assetBorrowAmountInUSD = 0;
                    if (assetName === "ckBTC" && ckBTCUsdRate) {
                      assetBorrowAmountInUSD = assetBorrowAmount * ckBTCUsdRate;
                    } else if (assetName === "ckETH" && ckETHUsdRate) {
                      assetBorrowAmountInUSD = assetBorrowAmount * ckETHUsdRate;
                    } else if (assetName === "ckUSDC" && ckUSDCUsdRate) {
                      assetBorrowAmountInUSD =
                        assetBorrowAmount * ckUSDCUsdRate;
                    } else if (assetName === "ICP" && ckICPUsdRate) {
                      assetBorrowAmountInUSD = assetBorrowAmount * ckICPUsdRate;
                    }
                    if (assetBorrow > 0) {
                      return (
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="asset"
                            className="form-radio text-[#EB8863]"
                            checked={selectedDebtAsset === assetName}
                            onChange={() =>
                              handleDebtAssetSelection(
                                assetName,
                                assetBorrowAmount,
                                assetBorrowAmountInUSD
                              )
                            }
                          />
                          <img
                            key={index}
                            src={
                              assetName === "ckBTC"
                                ? ckBTC
                                : assetName === "ckETH"
                                ? ckETH
                                : assetName === "ckUSDC"
                                ? ckUSDC
                                : assetName === "ICP"
                                ? icp
                                : undefined
                            }
                            alt={assetName}
                            className="rounded-[50%] w-7"
                          />{" "}
                        </label>
                      );
                    }
                    return null;
                  })}
                </div>

                <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm">
                  <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText dark:opacity-50">
                    Close Factor
                  </p>
                  <p className="text-lg font-bold text-[#2A1F9D] dark:text-darkText ">
                    50%
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-darkBackground/30   rounded-md p-2 text-sm text-[#c25252] mt-4 flex justify-between items-center">
                  <p className="text-base font-bold text-[#2A1F9D] dark:text-darkText ">
                    Amount to Repay
                  </p>
                  <p className="text-base font-bold">
                    {amountToRepay ? (
                      Number(amountToRepay).toLocaleString()
                    ) : (
                      <span className="text-gray-300 text-[11px] text-normal">
                        Select a debt asset to see repayment
                      </span>
                    )}
                  </p>
                </div>

                {renderDebtAssetDetails(selectedDebtAsset)}
              </div>
              <div className="flex justify-between mt-4">
                <button
                  title="Back"
                  className="py-2 px-6 focus:outline-none box bg-transparent shadow-lg  sxs3:text-[12px] md:text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white button2"
                  onClick={() => setIsDebtInfo(false)} // Go back to User Info view
                >
                  Back
                </button>
                <button
                  className={`bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040]  sxs3:text-[12px] md:text-sm px-6 py-2 relative ${isDebtAssetSelected && amountToRepay <= selectedAssetBalance
                    ? "opacity-100"
                    : "opacity-50 cursor-not-allowed"
                    }`}
                  onClick={handleNextClick}
                  disabled={
                    !isDebtAssetSelected ||
                    !(amountToRepay <= selectedAssetBalance)
                  }
                >
                  NEXT
                </button>
              </div>
            </div>
          ) : (
            // User Information Content
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D]  dark:text-darkText mb-2">
                  User Section
                </h3>
                <div className="mb-4">
                  <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm text-gray-900 ">
                    <p className="text-sm font-normal font-Poppins text-[#2A1F9D] opacity-50 dark:text-darkText mb-1 ">
                      User Principal
                    </p>
                    <p className="text-xs font-semibold text-[#2A1F9D] dark:text-darkText dark:opacity-100 ">
                      {` ${principal}`}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="bg-gray-100 dark:bg-darkBackground/30  rounded-md p-2 text-sm text-[#dc5959]">
                    <p className="text-sm font-normal text-[#2A1F9D] dark:text-darkText opacity-50 mb-1 ">
                      User Health Factor
                    </p>
                    <p className="text-xs font-medium ">
                      {parseFloat(
                        Number(mappedItem?.item[1]?.health_factor) / 10000000000
                      ) > 100
                        ? "Infinity"
                        : parseFloat(
                            Number(mappedItem?.item[1]?.health_factor) /
                              10000000000
                          ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleNextClick}
                  className="my-2 bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040]  sxs3:text-[12px] md:text-sm cursor-pointer px-6 py-2 relative"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserInformationPopup;
