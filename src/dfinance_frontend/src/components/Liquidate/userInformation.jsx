import React, { useEffect, useRef, useState } from "react";
import { Info, X } from "lucide-react";
import { useAuth } from "../../utils/useAuthClient";
import cketh from "../../../public/assests-icon/cketh.png";
import ckbtc from '../../../public/assests-icon/ckbtc.png'
import icp from "../../../public/assests-icon/icpdark.png";
import Button from "../Common/Button";
import Vector from "../../../public/Helpers/Vector.png";
import check from "../../../public/assests-icon/check.png";
import cross from "../../../public/assests-icon/Cross.png";
import { idlFactory as ledgerIdlFactoryckETH } from "../../../../declarations/cketh_ledger"
import { idlFactory as ledgerIdlFactoryckBTC } from "../../../../declarations/ckbtc_ledger";
import { idlFactory as ledgerIdlFactory } from "../../../../declarations/token_ledger";
import { Principal } from "@dfinity/principal";
import { useMemo } from "react";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/cketh.png";
import { useCallback } from "react";
import { toast } from "react-toastify";  // Import Toastify if not already done
import "react-toastify/dist/ReactToastify.css";


const UserInformationPopup = ({ onClose, mappedItem, principal }) => {
  const {
    isAuthenticated,
    createLedgerActor, backendActor
  } = useAuth()
  console.log("mappeditems", mappedItem)
  const [rewardAmount, setRewardAmount] = useState(10);
  const [amountToRepay, setAmountToRepay] = useState();
  const [isApproved, setIsApproved] = useState(false);
  const popupRef = useRef(null);
  const [isDebtInfo, setIsDebtInfo] = useState(false); // State to manage content view
  const [isCollateralOverlay, setIsCollateralOverlay] = useState(false); // New state for Collateral Overlay
  const [selectedAsset, setSelectedAsset] = useState(); // Default selected asset
  const [selectedDebtAsset, setSelectedDebtAsset] = useState(); // Default selected asset
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null); // State to handle transaction result
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  const [userdata, setUserData] = useState();
  const [userHealthFactor, setUserHealthFactor] = useState();

  const [ckBTCBalance, setCkBTCBalance] = useState(null);
  const [ckETHBalance, setCkETHBalance] = useState(null);
  const [ckUSDCBalance, setCKUSDCBalance] = useState(null);
  const [ckBTCUsdBalance, setCkBTCUsdBalance] = useState(null);
  const [ckETHUsdBalance, setCkETHUsdBalance] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (backendActor) {
        try {
          const result = await getUserData(principal.toString());
          console.log("get_user_data:", result);
          setUserData(result);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.error("Backend actor initialization failed.");
      }
    };
    fetchUserData();
  }, [principal, backendActor]);

  const getUserData = async (user) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.get_user_data(user);
      console.log("get_user_data in mysupply:", result);
      setUserHealthFactor(result.Ok.health_factor)
      return result;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  function roundToDecimal(value, decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(value * factor) / factor;
  }

  console.log("health factor", roundToDecimal(userHealthFactor, 2));

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


  const handleAssetSelection = (asset) => {
    setSelectedAsset(asset); // Set the selected asset (only one at a time)
    const assetRewardAmounts = {
      cketh: 0.0032560,
      ckbtc: 0.0010250,
      icp: 5.032560,
    };

    setRewardAmount(assetRewardAmounts[asset] || 10);
  };

  const handleDebtAssetSelection = (asset, assetBorrowAmount) => {
    setSelectedDebtAsset(asset); // Set the selected asset (only one at a time)
    setAmountToRepay(assetBorrowAmount ? assetBorrowAmount : 0);

    console.log("Asset Borrow Amount to Repay:", assetBorrowAmount);
    console.log("Amount to Repay (after check):", amountToRepay);
    // const assetRewardAmounts = {
    //   cketh: 0.0032560,
    //   ckbtc: 0.0010250,
    //   icp: 5.032560,
    // };

    // setRewardAmount(assetRewardAmounts[asset] || 10);
  };
 
  const handleCheckboxClick = (e) => {
    setIsCheckboxChecked(e.target.checked);
  };

  const [assetPrincipal, setAssetPrincipal] = useState({});

  useEffect(() => {
    const fetchAssetPrinciple = async () => {
      if (backendActor) {
        try {
          const assets = ["ckBTC", "ckETH", "ckUSDC"];
          for (const asset of assets) {
            const result = await getAssetPrinciple(asset);
            console.log(`get_asset_principle (${asset}):`, result);
            setAssetPrincipal((prev) => ({
              ...prev,
              [asset]: result,
            }));
          }
        } catch (error) {
          console.error("Error fetching asset principal:", error);
        }
      } else {
        console.error("Backend actor initialization failed.");
      }
    };

    fetchAssetPrinciple();
  }, [backendActor]);

  console.log("fecthAssteprincCKUSDC", assetPrincipal.ckUSDC)
  console.log("fecthAssteprincCKBTC", assetPrincipal.ckBTC)
  console.log("fecthAssteprincCKETH", assetPrincipal.ckETH)

  const getAssetPrinciple = async (asset) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      let result;
      switch (asset) {
        case "ckBTC":
          result = await backendActor.get_asset_principal("ckBTC");
          break;
        case "ckETH":
          result = await backendActor.get_asset_principal("ckETH");
          break;
        case "ckUSDC":
          result = await backendActor.get_asset_principal("ckUSDC");
          break;
        default:
          throw new Error(`Unknown asset: ${asset}`);
      }
      console.log(`get_asset_principle in mysupply (${asset}):`, result);
      return result.Ok.toText();
    } catch (error) {
      console.error(`Error fetching asset principal for ${asset}:`, error);
      throw error;
    }
  };

  const ledgerActorckBTC = useMemo(
    () =>
      assetPrincipal.ckBTC
        ? createLedgerActor(
          assetPrincipal.ckBTC, // Use the dynamic principal instead of env variable
          ledgerIdlFactory
        )
        : null, // Return null if principal is not available yet
    [createLedgerActor, assetPrincipal.ckBTC] // Re-run when principal changes
  );

  // Memoized actor for ckETH using dynamic principal
  const ledgerActorckETH = useMemo(
    () =>
      assetPrincipal.ckETH
        ? createLedgerActor(
          assetPrincipal.ckETH, // Use the dynamic principal instead of env variable
          ledgerIdlFactory
        )
        : null, // Return null if principal is not available yet
    [createLedgerActor, assetPrincipal.ckETH] // Re-run when principal changes
  );

  const ledgerActorckUSDC = useMemo(
    () =>
      assetPrincipal.ckUSDC
        ? createLedgerActor(
          assetPrincipal.ckUSDC, // Use the dynamic principal instead of env variable
          ledgerIdlFactory
        )
        : null, // Return null if principal is not available yet
    [createLedgerActor, assetPrincipal.ckUSDC] // Re-run when principal changes
  );


  const principalObj = useMemo(() => Principal.fromText(principal), [principal]);

  const fetchBalance = useCallback(
    async (assetType) => {
      if (isAuthenticated && principalObj) {
        try {
          const account = { owner: principalObj, subaccount: [] };
          let balance;
  
          if (assetType === "ckBTC") {
            if (!ledgerActorckBTC) {
              console.warn("Ledger actor for ckBTC not initialized yet");
              return;
            }
            balance = await ledgerActorckBTC.icrc1_balance_of(account);
          setCkBTCBalance(balance.toString()); // Set ckBTC balance
          } else if (assetType === "ckETH") {
            if (!ledgerActorckETH) {
              console.warn("Ledger actor for ckETH not initialized yet");
              return;
            }
            balance = await ledgerActorckETH.icrc1_balance_of(account);
            setCkETHBalance(balance.toString()); // Set ckETH balance
          } else if (assetType === "ckUSDC") {
            if (!ledgerActorckUSDC) {
              console.warn("Ledger actor for ckUSDC not initialized yet");
              return;
            }
            balance = await ledgerActorckUSDC.icrc1_balance_of(account);
            setCKUSDCBalance(balance.toString()); // Set ckUSDC balance
          } else {
            throw new Error(
              "Unsupported asset type or ledger actor not initialized"
            );
          }
          console.log(`Fetched Balance for ${assetType}:`, balance.toString());
        } catch (error) {
          console.error(`Error fetching balance for ${assetType}:`, error);
          setError(error);
        }
      }
    },
    [isAuthenticated, ledgerActorckBTC, ledgerActorckETH, ledgerActorckUSDC, principalObj] // Added ledgerActorckUSDC to dependencies
  );

  const [loading, setLoading] = useState()

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBalance('ckBTC'),
          fetchBalance('ckETH'),
          fetchBalance('ckUSDC'),
        ]);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAllData();
  }, [fetchBalance]);

  const handleApprove = async () => {
    let ledgerActor;
    if (selectedDebtAsset === "ckBTC") {
      ledgerActor = ledgerActorckBTC;
    } else if (selectedDebtAsset === "ckETH") {
      ledgerActor = ledgerActorckETH;
    }

    const transferfee = BigInt(100);
    // Convert amount and transferFee to numbers and add them
    const supplyAmount = BigInt(amountToRepay);
    const totalAmount = supplyAmount + transferfee;


    try {
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
      toast.success("Approval successful!");
    } catch (error) {
      // Log the error
      console.error("Approval failed:", error);
  
      // Show error notification using Toastify
      toast.error(`Error: ${error.message || "Approval failed!"}`);
    }
  };

  const handleConfirmLiquidation = async () => {
    try {
      const supplyAmount = BigInt(amountToRepay);
      console.log("backend actor", backendActor);

      const isSuccess = isCheckboxChecked;
      setTransactionResult(isSuccess ? "success" : "failure");

      if (!backendActor) {
        throw new Error("Backend actor is not initialized");
      }

      const result = await backendActor.liquidation_call(selectedDebtAsset, selectedAsset, supplyAmount, mappedItem.principal);
      toast.success("Liquidation successful!");
      console.log("Liquidation call result:", result);
      setTransactionResult("success");
      setShowWarningPopup(false);
    } catch (error) {
      console.error("Error during liquidation:", error);
  
    }
  };


  const handleCloseWarningPopup = () => {
    setShowWarningPopup(false);
  };

  const handleCallLiquidation = () => {
    setShowWarningPopup(true);

  };

  const handleCancelOrConfirm = () => {
    if (isCheckboxChecked) {
      handleConfirmLiquidation();
    } else {
      handleCloseWarningPopup();
    }
  };

  const handleClosePopup = () => {
    setTransactionResult(null);
    onClose(); // Close the transaction result popup
  };


  const handleRetry = () => {
    setTransactionResult(null); // Reset the transaction result and show warning popup
    setShowWarningPopup(true);
  };

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
                  {ckETHBalance}
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
                  {ckBTCBalance}
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
                  {ckUSDCBalance}
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
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText  rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckETH Price
              </p>
              <p className="text-sm font-medium">
                0.0032560
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckETH Liquidation Bonus %
              </p>
              <p className="text-smsm font-medium">10%</p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30  rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500">{rewardAmount}</p>
            </div>
          </div>
        );
      case "ckBTC":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckBTC Price
              </p>
              <p className="text-sm font-medium text-[#2A1F9D]  dark:text-darkText ">
                0.0010250
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                ckBTC liquidation Bonus %
              </p>
              <p className="text-sm font-medium">15%</p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30  rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] mb-1 dark:text-darkText opacity-50">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500">{rewardAmount}</p>
            </div>
          </div>
        );
      case "icp":
        return (
          <div className="mt-4">
            <div className="bg-gray-100 dark:bg-darkBackground/30  rounded-md p-2 text-sm">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ICP Price
              </p>
              <p className="text-sm font-medium text-[#2A1F9D]   dark:text-darkText ">
                5.032560
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30  rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                ICP Liquidation Bonus %
              </p>
              <p className="text-sm font-medium text-[#2A1F9D]   dark:text-darkText ">12%</p>
            </div>
            <div className="bg-gray-100 dark:bg-darkBackground/30 dark:text-darkText rounded-md p-2 text-sm mt-4">
              <p className="text-sm font-normal text-[#2A1F9D] opacity-80 mb-1 dark:text-darkText dark:opacity-80">
                Reward Amount
              </p>
              <p className="text-sm font-medium text-green-500   ">{rewardAmount}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      {transactionResult ? (
        // Transaction result popup
        <div ref={popupRef}
          className="bg-white dark:bg-[#1D1B40] dark:text-darkText p-6 rounded-md w-full max-w-md mx-4 text-center">
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
                <h2 className="text-2xl font-bold text-[#2A1F9D] dark:text-darkText mb-2">
                  Liquidation Call Failed
                </h2>

                <button
                  className="bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
                  onClick={handleRetry}
                >
                  Try Again
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
          <p className="text-sm text-[#989898] text-center dark:text-darkText mt-4">
            Are you sure you want to liquidate on behalf of "<strong>{principal}</strong>"? <strong>{amountToRepay} ICP</strong> will be <strong>deducted</strong> from your account & <strong>{rewardAmount}</strong> will be rewarded.
          </p>
          <div className="mt-4 flex justify-center">
            <label className="flex items-center text-[#989898]">
              <input
                type="checkbox"
                className="mr-2 h-4 w-4 appearance-none border-2 border-gray-300 rounded bg-white checked:bg-gray-400 checked:border-gray-400 checked:text-white focus:outline-none checked:after:content-['✔'] checked:after:text-white checked:after:text-xs checked:after:flex checked:after:justify-center checked:after:items-center"
                checked={isCheckboxChecked}
                onChange={handleCheckboxClick}
              />
              Yes, call Liquidation
            </label>
          </div>


          <div className="flex justify-center mt-6">
            <button
              className="bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
              onClick={handleCancelOrConfirm}
            >
              {isCheckboxChecked ? "Call Liquidation" : "Cancel"}
            </button>
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
                    const assetName = item[1]?.reserve
                    const assetSupply = item[1]?.asset_supply
                    if (assetSupply > 0) {
                      return (
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="asset"
                            className="form-radio text-[#EB8863]"
                            checked={selectedAsset === assetName}
                            onChange={() => handleAssetSelection(assetName)}
                          />
                          <img
                            key={index}
                            src={assetName === "ckBTC" ? ckBTC : assetName === "ckETH" ? ckETH : null}
                            alt={assetName}
                            className="rounded-[50%] w-7"
                          />    </label>


                      );
                    }
                    return null;
                  })}

                </div>

                {/* Render asset details based on selected checkboxes */}
                {renderAssetDetails(selectedAsset)}
                <div className="flex items-center mt-2">
                  <img
                    src={Vector}
                    alt="Vector Image"
                    className="w-4 h-4 mr-1"
                  />
                  <h1 className="text-xs  text-[#233D63] dark:text-darkText font-medium">100 ICP</h1>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button
                  title="Back"
                  className="py-2 px-6 focus:outline-none box bg-transparent shadow-lg text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-darkText"
                  onClick={() => setIsCollateralOverlay(false)}
                >
                  Back
                </button>
                <button
                  className="bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
                  onClick={() => {
                    console.log("Button clicked");
                    isApproved ? handleCallLiquidation() : handleApprove();
                  }}
                >
                  {isApproved ? `Call Liquidation ${selectedDebtAsset}` : `Approve ${selectedDebtAsset} to continue`}
                </button>
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
                    const assetName = item[1]?.reserve
                    const assetBorrow = item[1]?.asset_borrow
                    const assetBorrowAmount = Math.floor(assetBorrow / 2);

                    if (assetBorrow > 0) {
                      return (
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="asset"
                            className="form-radio text-[#EB8863]"
                            checked={selectedDebtAsset === assetName}
                            onChange={() => handleDebtAssetSelection(assetName, assetBorrowAmount)}
                          />
                          <img
                            key={index}
                            src={assetName === "ckBTC" ? ckBTC : assetName === "ckETH" ? ckETH : null}
                            alt={assetName}
                            className="rounded-[50%] w-7"
                          />    </label>


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
                <div className="bg-gray-100 dark:bg-darkBackground/30   rounded-md p-2 text-sm text-[#F30606] mt-4 flex justify-between items-center">
                  <p className="text-base font-bold text-[#2A1F9D] dark:text-darkText ">
                    Amount to Repay
                  </p>
                  <p className="text-base font-bold">{amountToRepay}</p>
                </div>

                {renderDebtAssetDetails(selectedDebtAsset)}
              </div>
              <div className="flex justify-between mt-4">
                <button
                  title="Back"
                  className="py-2 px-6 focus:outline-none box bg-transparent shadow-lg text-sm font-light rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white"
                  onClick={() => setIsDebtInfo(false)} // Go back to User Info view
                >
                  Back
                </button>
                <button
                  className="bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"
                  onClick={handleNextClick}
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
                  <div className="bg-gray-100 dark:bg-darkBackground/30  rounded-md p-2 text-sm text-[#F30606]">
                    <p className="text-sm font-normal text-[#2A1F9D] dark:text-darkText opacity-50 mb-1 ">
                      User Health Factor
                    </p>
                    <p className="text-xs font-medium text-[#F30606] ">{roundToDecimal(userHealthFactor, 2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleNextClick}
                  className="my-2 bg-gradient-to-tr from-[#EB8863] to-[#81198E] dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20 shadow-[#00000040] text-sm cursor-pointer px-6 py-2 relative"   >
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
