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
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import { useCallback } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAssetData from "../Common/useAssets";
import { Fuel } from "lucide-react";
import { useSelector } from "react-redux";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import useFormatNumber from "../customHooks/useFormatNumber";
import useFetchConversionRate from "../customHooks/useFetchConversionRate";
import useUserData from "../customHooks/useUserData";
import { trackEvent } from "../../utils/googleAnalytics";

const UserInformationPopup = ({
  onClose,
  mappedItem,
  principal,
  userAccountData,
}) => {
  const { backendActor, principal: currentUserPrincipal } = useAuth();

  const [rewardAmount, setRewardAmount] = useState();
  const [amountToRepay, setAmountToRepay] = useState();
  const [isApproved, setIsApproved] = useState(false);
  const popupRef = useRef(null);
  const [isDebtInfo, setIsDebtInfo] = useState(false);
  const [isCollateralOverlay, setIsCollateralOverlay] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState();
  const [selectedDebtAsset, setSelectedDebtAsset] = useState();
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  const [userdata, setUserData] = useState();
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);
  const [ckUSDCUsdBalance, setCkUSDCUsdBalance] = useState(null);
  const [ckICPUsdBalance, setCkICPUsdBalance] = useState(null);
  const [ckUSDTUsdBalance, setCkUSDTUsdBalance] = useState(null);

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
  const {
    assets,
    reserveData,
    filteredItems,
    asset_supply,
    asset_borrow,
    fetchAssetBorrow,
    fetchAssetSupply,
  } = useAssetData();

  useEffect(() => {
    const fetchData = async () => {
      for (const asset of assets) {
        fetchAssetSupply(asset);
        fetchAssetBorrow(asset);
      }
    };

    fetchData();
  }, [assets]);

  const getAssetSupplyValue = (asset) => {
    if (asset_supply[asset] !== undefined) {
      const supplyValue = Number(asset_supply[asset]) / 1e8;
      return supplyValue;
    }
    return `no assets suplied`;
  };
  const getAssetBorrowValue = (asset) => {
    if (asset_supply[asset] !== undefined) {
      const borrowValue = Number(asset_borrow[asset]) / 1e8;
      return borrowValue; // Format as a number with 2 decimals
    }
    return `no assets borrowed`;
  };
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
      setIsCollateralOverlay(true);
    } else {
      setIsDebtInfo(true);
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

    setSelectedAssetSupply(assetSupply);
    setCollateralRateAmount(collateralAmount ? collateralAmount : 0);
  };
  const [isDebtAssetSelected, setIsDebtAssetSelected] = useState(false);
  const [amountToRepayUSD, setAmountToRepayUSD] = useState(null);

  const handleDebtAssetSelection = (
    asset,
    assetBorrowAmount,
    assetBorrowAmountInUSD
  ) => {
    setIsDebtAssetSelected(true);
    setSelectedDebtAsset(asset);
    setAmountToRepay(assetBorrowAmount ? assetBorrowAmount : 0);
    setAmountToRepayUSD(assetBorrowAmountInUSD ? assetBorrowAmountInUSD : 0);
  };

  const handleCheckboxClick = (e) => {
    setIsCheckboxChecked(e.target.checked);
  };

  const ledgerActors = useSelector((state) => state.ledger);

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
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
    } else if (selectedDebtAsset === "ckUSDT") {
      ledgerActor = ledgerActors.ckUSDT;
    }

    const transferfee = BigInt(100);

    const supplyAmount = BigInt(amountToRepay.toFixed(8) * 100000000);
    const totalAmount = supplyAmount + transferfee;

    try {
      setIsLoading(true);

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

      setIsApproved(true);

      toast.success(`Approval successful!`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      toast.error(`Error: ${error.message || "Approval failed!"}`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLiquidation = async () => {
    setIsLoading(true);
    try {
      const supplyAmount = BigInt(amountToRepay.toFixed(8) * 100000000);

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
        trackEvent(
          "Liq:" +
            selectedDebtAsset +
            "," +
            selectedAsset +
            "," +
            Number(amountToRepay).toLocaleString() +
            "," +
            mappedItem.principal.toString(),
          "Assets",
          "Liq:" +
            selectedDebtAsset +
            "," +
            selectedAsset +
            "," +
            Number(amountToRepay).toLocaleString() +
            "," +
            mappedItem.principal.toString()
        );
        toast.success(`Liquidation successful!`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setTransactionResult("success");
      } else if ("Err" in result) {
        const errorMsg = result.Err;
        toast.error(`Liquidation failed: ${errorMsg}`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setTransactionResult("failure");
      }

      setShowWarningPopup(false);
    } catch (error) {
      toast.error(`Error: ${error.message}`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setTransactionResult("failure");
    } finally {
      setIsLoading(false);
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
    onClose();
  };

  useEffect(() => {
    if (ckBTCBalance && ckBTCUsdRate) {
      const balanceInUsd = (parseFloat(ckBTCBalance) * ckBTCUsdRate).toFixed(2);
      setCkBTCUsdBalance(balanceInUsd);
    }
  }, [ckBTCBalance, ckBTCUsdRate]);

  useEffect(() => {
    if (ckETHBalance && ckETHUsdRate) {
      const balanceInUsd = (parseFloat(ckETHBalance) * ckETHUsdRate).toFixed(2);
      setCkETHUsdBalance(balanceInUsd);
    }
  }, [ckETHBalance, ckETHUsdRate]);

  useEffect(() => {
    if (ckUSDCBalance && ckUSDCUsdRate) {
      const balanceInUsd = (parseFloat(ckUSDCBalance) * ckUSDCUsdRate).toFixed(
        2
      );
      setCkUSDCUsdBalance(balanceInUsd);
    }
  }, [ckUSDCBalance, ckUSDCUsdRate]);

  useEffect(() => {
    if (ckICPBalance && ckICPUsdRate) {
      const balanceInUsd = (parseFloat(ckICPBalance) * ckICPUsdRate).toFixed(2);
      setCkICPUsdBalance(balanceInUsd);
    }
  }, [ckICPBalance, ckICPUsdRate]);

  useEffect(() => {
    if (ckUSDTBalance && ckUSDTUsdRate) {
      const balanceInUsd = (parseFloat(ckUSDTBalance) * ckUSDTUsdRate).toFixed(
        2
      );
      setCkUSDTUsdBalance(balanceInUsd);
    }
  }, [ckUSDTBalance, ckUSDTUsdRate]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBalance("ckBTC"),
          fetchBalance("ckETH"),
          fetchBalance("ckUSDC"),
          fetchBalance("ICP"),
          fetchBalance("ckUSDT"),
          fetchConversionRate(),
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
      case "ckUSDT":
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
                    {ckUSDTBalance?.toLocaleString() || "0.00"} {}
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
    switch (asset) {
      case "ckETH":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckETH Price
              </p>
              <p className="text-sm font-medium">
                {Number(collateralRate).toLocaleString()}
              </p>
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
                {(collateral + collateral * (liquidation_bonus / 100))
                  .toFixed(8)
                  .toLocaleString()}
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
                {(collateral + collateral * (liquidation_bonus / 100))
                  .toFixed(8)
                  .toLocaleString()}
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
                {Number(
                  (collateral + collateral * (liquidation_bonus / 100)).toFixed(
                    8
                  )
                ).toLocaleString()}
              </p>
            </div>
          </div>
        );

        return null;
      case "ckUSDT":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ckUSDT Price
              </p>
              <p className="text-sm font-medium text-[#2A1F9D] dark:text-darkText ">
                {Number(collateralRate).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ckUSDT Liquidation Bonus %
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
                {(collateral + collateral * (liquidation_bonus / 100))
                  .toFixed(8)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        );
        return null;
      default:
        return null;
    }
  };

  const value = Number(userAccountData?.Ok?.[4]);

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
    const calculatedRewardAmount =
      collateral + collateral * (liquidation_bonus / 100);
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
      case "ckUSDT":
        setSelectedAssetBalance(ckUSDTBalance);
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
    ckUSDTBalance,
  ]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      {transactionResult ? (
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
          <p className="text-md text-[#989898] text-center dark:text-darkText mt-4 font-light">
            Are you sure you want to liquidate on behalf of "
            <strong className="font-bold">{principal}</strong>"?{" "}
            <strong className="font-bold text-red-500">{amountToRepay} </strong>{" "}
            <span className="font-bold">{selectedDebtAsset}</span> will be{" "}
            <strong className="underline">deducted</strong> from your account &{" "}
            <strong className="font-bold text-green-500">
              {rewardAmount.toFixed(8)}{" "}
            </strong>
            <span className="font-bold">{selectedAsset}</span> will be rewarded.
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
              <button
                className={`bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleConfirmLiquidation}
                disabled={isLoading}
              >
                {"Call Liquidation"}
              </button>
            ) : (
              <button
                className="bg-gray-400 dark:bg-gray-500 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2"
                onClick={handleCloseWarningPopup}
                disabled={isLoading}
              >
                Cancel
              </button>
            )}

            {isLoading && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(1px)",
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
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                  Collateral Asset
                </h3>
                {}

                <div className="flex items-center space-x-4 mb-4">
                  {mappedItem.reserves[0].map((item, index) => {
                    const assetName = item[0];
                    const assetSupply =
                      Number(item?.[1]?.asset_supply || 0n) / 100000000;
                    const assetBorrow =
                      Number(item?.[1]?.asset_borrow || 0n) / 100000000;
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
                    } else if (assetName === "ckUSDT" && ckUSDTUsdRate) {
                      collateralRate = ckUSDTUsdRate;
                    }
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
                        : assetName === "ckUSDT"
                        ? ckUSDTBalance
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
                                : assetName === "ckUSDT"
                                ? ckUSDT
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

                {}
                {renderAssetDetails(selectedAsset)}

                <div className="flex items-center mt-2"></div>
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
                  className={`bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] sxs3:text-[12px] md:text-sm  px-6 py-2 sxs3:p-1 sxs3:px-4 relative ${
                    isCollateralAssetSelected &&
                    collateral + collateral * (liquidation_bonus / 100) <
                      selectedAssetSupply
                      ? "opacity-100 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => {
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
                      background: "rgba(0, 0, 0, 0.4)",
                      backdropFilter: "blur(1px)",
                    }}
                  >
                    <div className="loader"></div>
                  </div>
                )}
              </div>
            </div>
          ) : isDebtInfo ? (
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-normal font-Poppins text-[#2A1F9D] dark:text-darkText mb-2">
                  Debt Asset
                </h3>
                <div className="flex items-center space-x-4 mb-4">
                  {Array.isArray(mappedItem?.reserves?.[0]) &&
                    mappedItem.reserves[0].map((item, index) => {
                      const assetName = item?.[0];

                      const assetBorrow =
                        Number(item?.[1]?.asset_borrow || 0n) / 100000000;
                      const assetBorrowAmount = Math.floor(assetBorrow / 2);

                      let assetBorrowAmountInUSD = 0;
                      if (assetName === "ckBTC" && ckBTCUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * ckBTCUsdRate;
                      } else if (assetName === "ckETH" && ckETHUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * ckETHUsdRate;
                      } else if (assetName === "ckUSDC" && ckUSDCUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * ckUSDCUsdRate;
                      } else if (assetName === "ICP" && ckICPUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * ckICPUsdRate;
                      } else if (assetName === "ckUSDT" && ckUSDTUsdRate) {
                        assetBorrowAmountInUSD =
                          assetBorrowAmount * ckUSDTUsdRate;
                      }

                      if (assetBorrow > 0) {
                        return (
                          <label
                            key={index}
                            className="flex items-center space-x-2"
                          >
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
                              src={
                                assetName === "ckBTC"
                                  ? ckBTC
                                  : assetName === "ckETH"
                                  ? ckETH
                                  : assetName === "ckUSDC"
                                  ? ckUSDC
                                  : assetName === "ICP"
                                  ? icp
                                  : assetName === "ckUSDT"
                                  ? ckUSDT
                                  : undefined
                              }
                              alt={assetName}
                              className="rounded-[50%] w-7"
                            />
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
                <div className="flex justify-end mt-3">
                  {!amountToRepay && (
                    <span className="text-red-500 text-[11px] text-normal mb-0">
                      Select a debt asset to see repayment
                    </span>
                  )}
                </div>

                <div className="bg-gray-100 dark:bg-darkBackground/30   rounded-md p-2 text-sm text-[#c25252] mt-2 flex justify-between items-center">
                  <p className="text-base font-bold text-[#2A1F9D] dark:text-darkText ">
                    Amount to Repay
                  </p>
                  <p className="text-base font-bold">
                    {amountToRepay ? (
                      Number(amountToRepay).toLocaleString()
                    ) : (
                      <span className="text-gray-300 text-[11px] text-normal">
                        --
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
                  onClick={() => setIsDebtInfo(false)}
                >
                  Back
                </button>
                <button
                  className={`bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040]  sxs3:text-[12px] md:text-sm px-6 py-2 relative ${
                    isDebtAssetSelected && amountToRepay <= selectedAssetBalance
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
                      {Number(userAccountData?.Ok?.[4]) / 10000000000 > 100
                        ? "Infinity"
                        : parseFloat(
                            Number(userAccountData?.Ok?.[4]) / 10000000000
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
