import { Info, Check, X } from "lucide-react";
import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../../../utils/useAuthClient";
import { useMemo } from "react";
import { Principal } from "@dfinity/principal";
import { useEffect } from "react";
import { toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";
import coinSound from "../../../../public/sound/caching_duck_habbo.mp3";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";
import { trackEvent } from "../../../utils/googleAnalytics";

const Repay = ({asset, image, supplyRateAPR, balance, liquidationThreshold, reserveliquidationThreshold, assetSupply, assetBorrow, totalCollateral, totalDebt, currentCollateralStatus, Ltv, borrowableValue, borrowableAssetValue, isModalOpen, handleModalOpen, setIsModalOpen, onLoadingChange 
}) => {
  const {  backendActor, principal } = useAuth();
  
  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  const [amount, setAmount] = useState(null);
  const modalRef = useRef(null); 
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState("");
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [usdValue, setUsdValue] = useState(0);
  const [maxUsdValue, setMaxUsdValue] = useState(0);
  const ledgerActors = useSelector((state) => state.ledger);
  const isSoundOn = useSelector((state) => state.sound.isSoundOn);

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);

  const value = 5.23;

  const handleAmountChange = (e) => {
    let inputAmount = e.target.value.replace(/,/g, ""); 

    if (inputAmount.includes(".")) {
      const [integerPart, decimalPart] = inputAmount.split(".");

      if (decimalPart.length > 8) {
        inputAmount = `${integerPart}.${decimalPart.slice(0, 8)}`;
        e.target.value = inputAmount; 
      }
    }

    updateAmountAndUsdValue(inputAmount);
  };

  const updateAmountAndUsdValue = (inputAmount) => {

    const numericAmount = parseFloat(inputAmount);

    if (!isNaN(numericAmount) && numericAmount >= 0) {
      if (numericAmount <= assetBorrow) {

        const formattedAmount = formatAmountWithCommas(inputAmount);
        const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);

        const convertedValue = Number(numericAmount) * adjustedConversionRate;
        setUsdValue(convertedValue.toFixed(2)); 
        setAmount(formattedAmount); 
        setError("");
      } else {
        setError("Amount exceeds the supply balance");
      }
    } else if (inputAmount === "") {

      setAmount("");
      setUsdValue(0);
      setError("");
    } else {
      setError("Amount must be a positive number");
    }
  };

  const formatAmountWithCommas = (amount) => {
    const parts = amount.split(".");

    parts[0] = parseInt(parts[0], 10).toLocaleString("en-US");

    return parts.length > 1 ? parts.join(".") : parts[0];
  };
  const { conversionRate, error: conversionError } =
    useRealTimeConversionRate(asset);
  useEffect(() => {
    if (amount && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedValue =
        Number(amount.replace(/,/g, "")) * adjustedConversionRate;
      setUsdValue(convertedValue); 
    } else {
      setUsdValue(0); 
    }
  }, [amount, conversionRate]);
  useEffect(() => {
    if (assetBorrow && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedMaxValue = Number(assetBorrow) * adjustedConversionRate;
      setMaxUsdValue(convertedMaxValue);
    } else {
      setMaxUsdValue(0);
    }
  }, [amount, conversionRate]);

  const fees = useSelector((state) => state.fees.fees);
 
  const normalizedAsset = asset ? asset.toLowerCase() : "default";

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }
  const numericBalance = parseFloat(balance);
  const transferFee = fees[normalizedAsset] || fees.default;
  const transferfee = Number(transferFee);
  const supplyBalance = numericBalance - transferfee;
  const amountAsNat64 = Number(amount);
  const scaledAmount = amountAsNat64 * Number(10 ** 8);
  const handleApprove = async () => {
    let ledgerActor;
    if (asset === "ckBTC") {
      ledgerActor = ledgerActors.ckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActors.ckETH;
    } else if (asset === "ckUSDC") {
      ledgerActor = ledgerActors.ckUSDC;
    } else if (asset === "ICP") {
      ledgerActor = ledgerActors.ICP;
    } else if (asset === "ckUSDT") {

      ledgerActor = ledgerActors.ckUSDT;
    }
    const safeAmount = Number(amount.replace(/,/g, "")) || 0;
    let amountAsNat64 = Math.round(amount.replace(/,/g, "") * Math.pow(10, 8));
    
    const scaledAmount = amountAsNat64;

    const totalAmount = scaledAmount + transferfee;

    try {

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
    }
  };

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleRepayETH = async () => {

    let ledgerActor;
    if (asset === "ckBTC") {
      ledgerActor = ledgerActors.ckBTC;
    } else if (asset === "ckETH") {
      ledgerActor = ledgerActors.ckETH;
    } else if (asset === "ckUSDC") {
      ledgerActor = ledgerActors.ckUSDC;
    } else if (asset === "ICP") {
      ledgerActor = ledgerActors.ICP;
    } else if (asset === "ckUSDT") {

      ledgerActor = ledgerActors.ckUSDT;
    }

    try {
      const safeAmount = Number(amount.replace(/,/g, "")) || 0;
      let amountAsNat64 = Math.round(
        amount.replace(/,/g, "") * Math.pow(10, 8)
      );
     
      const scaledAmount = amountAsNat64;

      const repayResult = await backendActor.repay(asset, scaledAmount, [])

      if ("Ok" in repayResult) {
        trackEvent(
          "Repay," +
            asset +
            "," +
            scaledAmount / 100000000 +
            "," +
            principalObj.toString(),
          "Assets",
          "Repay," +
            asset +
            "," +
            scaledAmount / 100000000 +
            ", " +
            principalObj.toString()
        );
        if (isSoundOn) {
          const sound = new Audio(coinSound);
          sound.play();
        }
        toast.success("Repay successful!", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setIsPaymentDone(true);
        setIsVisible(false);
      } else if ("Err" in repayResult) {
        const errorMsg = repayResult.Err;
        toast.error(`Repay failed: ${errorMsg}`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
       
      }
    } catch (error) {
      
      toast.error(`Error: ${error.message || "Repay action failed!"}`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
    window.location.reload();
  };
  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isApproved) {
        await handleRepayETH();
      } else {
        await handleApprove();
      }
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        !isLoading
      ) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isModalOpen, isLoading, setIsModalOpen]);

  useEffect(() => {
    const healthFactor = calculateHealthFactor(
      totalCollateral,
      totalDebt,
      liquidationThreshold
    );
    const amountTaken = 0;
    const amountAdded = usdValue || 0;
    const totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountTaken);
    const totalDeptValue = parseFloat(totalDebt) - parseFloat(amountAdded);
    const ltv = calculateLTV(totalCollateralValue, totalDeptValue);
    setPrevHealthFactor(currentHealthFactor);
    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : healthFactor.toFixed(2)
    );
  }, [
    asset,liquidationThreshold,reserveliquidationThreshold,assetSupply,assetBorrow,amount,usdValue,]);

  const calculateHealthFactor = (totalCollateral,totalDebt,liquidationThreshold) => {
    const amountTaken = 0;
    const amountAdded = usdValue || 0;
    const totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountTaken);
    const totalDeptValue = parseFloat(totalDebt) - parseFloat(amountAdded);
    if (totalDeptValue === 0) {
      return Infinity;
    }
    return (
      (totalCollateralValue * (liquidationThreshold / 100)) / totalDeptValue
    );
  };

  const calculateLTV = (totalCollateralValue, totalDeptValue) => {
    if (totalCollateralValue === 0) {
      return 0;
    }
    return totalDeptValue / totalCollateralValue;
  };

  const { userData, healthFactorBackend, refetchUserData } = useUserData();

  const handleMaxClick = () => {
    let asset_borrow = assetBorrow
      ? assetBorrow >= 1e-8 && assetBorrow < 1e-7
        ? Number(assetBorrow).toFixed(8)
        : assetBorrow >= 1e-7 && assetBorrow < 1e-6
        ? Number(assetBorrow).toFixed(7)
        : assetBorrow
      : "0";
    const maxAmount = asset_borrow.toString();

    updateAmountAndUsdValue(maxAmount);
  };

  return (
    <>
      {isVisible && (
        <div className="repay-popup" ref={modalRef}>
          <h1 className="font-semibold text-xl">Repay {asset} </h1>

          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Amount</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-[50%]">
                  <input
                    type="text" 
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={supplyBalance === 0}
                    className="lg:text-lg  placeholder:text-xs focus:outline-none bg-gray-100 rounded-md p-2 w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder={`Enter Amount ${asset}`}
                  />
                  <p className="text-xs text-gray-500 px-2">
                    {usdValue
                      ? `$${usdValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} USD`
                      : "$0.00 USD"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2">
                    <img
                      src={image}
                      alt="Item Image"
                      className="object-fill w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p
                    className={`text-xs mt-4 p-2 py-1 rounded-md button1 ${
                      assetBorrow === 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "cursor-pointer bg-blue-100 dark:bg-gray-700/45"
                    }`}
                    onClick={() => {
                      if (assetBorrow > 0) {
                        handleMaxClick();
                      }
                    }}
                  >
                    {}
                    {assetBorrow}{" "}
                    Max
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full ">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100 hover:bg-gray-200 cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-full flex flex-col my-1">
                  <div className="w-full flex justify-between items-center ">
                    <p className="text-nowrap">Remaining debt</p>
                    <div className="w-4/12 flex flex-col items-end">
                      <p className="text-xs mt-2">
                        {(
                          assetBorrow - (amount?.replace(/,/g, "") || "")
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        Max
                      </p>
                    </div>
                  </div>

                  <div className="w-full flex justify-between items-center mt-1">
                    <p>Health Factor</p>
                    <p>
                      <span
                        className={`${
                          healthFactorBackend > 3
                            ? "text-green-500"
                            : healthFactorBackend <= 1
                            ? "text-red-500"
                            : healthFactorBackend <= 1.5
                            ? "text-orange-600"
                            : healthFactorBackend <= 2
                            ? "text-orange-400"
                            : "text-orange-300"
                        }`}
                      >
                        {parseFloat(
                          healthFactorBackend > 100
                            ? "Infinity"
                            : parseFloat(healthFactorBackend).toFixed(2)
                        )}
                      </span>
                      <span className="text-gray-500 mx-1">→</span>
                      <span
                        className={`${
                          currentHealthFactor > 3
                            ? "text-green-500"
                            : currentHealthFactor <= 1
                            ? "text-red-500"
                            : currentHealthFactor <= 1.5
                            ? "text-orange-600"
                            : currentHealthFactor <= 2
                            ? "text-orange-400"
                            : "text-orange-300"
                        }`}
                      >
                        {currentHealthFactor}
                      </span>
                    </p>
                  </div>

                  <div className="w-full flex justify-end items-center mt-1">
                    <p className="text-[#909094]">liquidation at &lt;1</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full mt-3">
              <div className="w-full">
                {}
                {balance <= 0 && (
                  <div className="w-full flex flex-col my-3 space-y-2">
                    <div className="w-full flex bg-[#6e3d17] p-2 rounded-md">
                      <div className="w-1/12 flex items-center justify-center">
                        <div className="warning-icon-container">
                          <Info className=" text-[#f6ba43]" />
                        </div>
                      </div>
                      <div className="w-11/12 text-[11px] flex items-center text-white ml-2">
                        You do not have enough {asset} in your account to pay
                        for transaction fees on Ethereum Sepolia network. Please
                        deposit {asset} from another account.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleClick}
                className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm mt-4 ${
                  isLoading || amount <= 0 || isButtonDisabled || supplyBalance<=0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={isLoading || amount <= 0 || supplyBalance<=0}
              >
                {isApproved ? `Repay ${asset}` : `Approve ${asset} to continue`}
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
        </div>
      )}
      {isPaymentDone && (
        <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleClosePaymentPopup}
              className="text-gray-400 hover:text-gray-600 focus:outline-none self-end"
            >
              <X size={24} />
            </button>
            <div className="border rounded-full p-2 my-3 text-green-500 border-green-500">
              <Check />
            </div>
            <h1 className="font-semibold text-xl">All done!</h1>
            <center>
              <p className="mt-2">
                Your Debt was{" "}
                <strong>
                  {" "}
                  {assetBorrow
                    ? assetBorrow >= 1e-8 && assetBorrow < 1e-7
                      ? Number(assetBorrow).toFixed(8)
                      : assetBorrow >= 1e-7 && assetBorrow < 1e-6
                      ? Number(assetBorrow).toFixed(7)
                      : assetBorrow
                    : "0"}
                </strong>{" "}
                <strong>{asset}</strong> and you have repayed{" "}
                <strong>
                  {scaledAmount / 100000000
                    ? scaledAmount / 100000000 >= 1e-8 &&
                      scaledAmount / 100000000 < 1e-7
                      ? Number(scaledAmount / 100000000).toFixed(8)
                      : scaledAmount / 100000000 >= 1e-7 &&
                        scaledAmount / 100000000 < 1e-6
                      ? Number(scaledAmount / 100000000).toFixed(7)
                      : scaledAmount / 100000000
                    : "0"}
                </strong>{" "}
                <strong>{asset}</strong> after{" "}
                {supplyRateAPR < 0.1
                  ? "<0.01%"
                  : `${supplyRateAPR.toFixed(2)}%`}{" "}
                borrow rate
              </p>
            </center>
            <button
              onClick={handleClosePaymentPopup}
              className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-max text-white rounded-md p-2 px-6 shadow-md font-semibold text-sm mt-4 mb-5"
            >
              Close Now
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Repay;