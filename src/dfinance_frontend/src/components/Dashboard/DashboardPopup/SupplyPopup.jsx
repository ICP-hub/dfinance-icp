import React, { useState, useRef } from "react";
import { Check, Info, X } from "lucide-react";
import { useAuth } from "../../../utils/useAuthClient";
import { Principal } from "@dfinity/principal";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import coinSound from "../../../../public/sound/caching_duck_habbo.mp3";
import useRealTimeConversionRate from "../../customHooks/useRealTimeConversionRate";
import useUserData from "../../customHooks/useUserData";
import { trackEvent } from "../../../utils/googleAnalytics";
import { useMemo } from "react";
import { toggleDashboardRefresh } from "../../../redux/reducers/dashboardDataUpdateReducer";
import useFunctionBlockStatus from "../../customHooks/useFunctionBlockStatus";
import useTransferFee from "../../customHooks/useTransferFee";
import dfin from "../../../../public/Helpers/Dfinance Coin 2D.svg"
import Button from "../../Common/Button";
/**
 * SupplyPopup Component
 *
 * This component is a popup modal that allows users to supply an asset to a platform, taking into account factors like collateral,
 * debt, liquidation thresholds, and the user's current health factor.
 * It calculates the USD equivalent of the supplied amount, manages user input for supply amounts, and handles approval
 * and supply transactions.
 *
 * @returns {JSX.Element} - Returns the SupplyPopup component.
 */

const SupplyPopup = ({
  asset,
  image,
  supplyRateAPR,
  balance,
  liquidationThreshold,
  reserveliquidationThreshold,
  assetSupply,
  assetBorrow,
  totalCollateral,
  totalDebt,
  currentCollateralStatus,
  Ltv,
  borrowableValue,
  borrowableAssetValue,
  isModalOpen,
  handleModalOpen,
  setIsModalOpen,
  onLoadingChange,
}) => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const { isBlocked } = useFunctionBlockStatus("execute_supply");
  const transferFeRetrive = useTransferFee(asset);
  const transferFee = transferFeRetrive?.transferFee;
  const approveButtonRef = useRef(null);
  const supplyButtonRef = useRef(null);
  const currentLiquidityRef = useRef(null);
  const closeButtonRef = useRef(null);
  const showPopupref = useRef(null);
  const tokenLockref = useRef(null);
  const { healthFactorBackend } = useUserData();
  const { backendActor, principal } = useAuth();
  const { conversionRate, error: conversionError } =
    useRealTimeConversionRate(asset);

  /* ===================================================================================
   *                                 STATE MANAGEMENT
   * =================================================================================== */

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentHealthFactor, setCurrentHealthFactor] = useState(null);
  const [prevHealthFactor, setPrevHealthFactor] = useState(null);
  const [collateral, setCollateral] = useState(currentCollateralStatus);
  const [maxUsdValue, setMaxUsdValue] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [minAmountUsdValue, setMinAmountUsdValue] = useState(0);
  const [lpUsdValue, setLpUsdValue] = useState(0);
  const [amount, setAmount] = useState(null);
  const [minAmount, setMinAmount] = useState(null);
  const [maxAmount, setMaxAmount] = useState(null);
  const [lpBalance, setLpBalance] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [issLiquidityDone, setIsLiquidityDone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [Loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPanicPopup, setShowPanicPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isTokenLocked, setIsTokenLocked] = useState(false);
  const [liquidityMessage, setLiquidityMessage] = useState("");
  const [shouldFetchLpBalance, setShouldFetchLpBalance] = useState(false);
  const [isLPPopupOpen, setIsLPPopupOpen] = useState(false);
  const [selectedLock, setSelectedLock] = useState("1X"); // Default selected
  const lockOptions = [
    { label: "25X", duration: "12 months" },
    { label: "10X", duration: "6 months" },
    { label: "4X", duration: "3 months" },
    { label: "1X", duration: "1 month" },
  ];
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  /* ===================================================================================
   *                                  REDUX-SELECTER
   * =================================================================================== */

  const isSoundOn = useSelector((state) => state.sound.isSoundOn);
  const fees = useSelector((state) => state.fees.fees);
  const dispatch = useDispatch();
  const ledgerActors = useSelector((state) => state.ledger);

  /* ===================================================================================
   *                                  MEMOIZATION
   * =================================================================================== */

  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );

  /* ===================================================================================
   *                                  HELPERS
   * =================================================================================== */

  const transactionFee = 0;
  const normalizedAsset = asset ? asset.toLowerCase() : "default";

  const errorMessages = {
    NoReserveDataFound:
      "The reserve data for the selected asset could not be found. Please check the asset or try again later.",
    FailedToUpdatePrice:
      "Failed to update the reserve prices. Please try again later.",
    ValidationError:
      "The supply validation failed. Ensure your inputs are correct.",
    InterestRateUpdateFailed:
      "Unable to update interest rates. Please retry the operation.",
    ErrorMintTokens:
      "Minting of tokens failed. Your account state has been rolled back. Try again later.",
    Default: "An unexpected error occurred. Please try again later.",
  };

  if (!fees) {
    return <p>Error: Fees data not available.</p>;
  }

  const numericBalance = parseFloat(balance);
  const supplyBalance = Math.max(numericBalance - transferFee, 0);

  console.log(numericBalance, "numericBalance");
  const hasEnoughBalance = balance >= transferFee;
  const value = currentHealthFactor;

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  const paymentModalRef = useRef(null);
  const openModalRef = useRef(null);
  const lpModalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openModalRef.current &&
        !openModalRef.current.contains(event.target)
      ) {
        setIsPaymentDone(false);
        setIsOpen(false);
        setIsVisible(false);
        setIsModalOpen(false);
      }
    };

    if (isPaymentDone) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isPaymentDone]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openModalRef.current &&
        !openModalRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setIsVisible(false);
        setIsModalOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        lpModalRef.current &&
        !lpModalRef.current.contains(event.target)
      ) {
        setIsVisible(false);
        setIsModalOpen(false);
        setIsLPPopupOpen(false);
      }
    };

    if (isLPPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isLPPopupOpen]);
  // Handles user input for supply amount
  const handleCheckboxChange = (e) => {
    setIsCheckboxChecked(e.target.checked);
  };
  const handleLockLiquidity = async () => {
    if (!isCheckboxChecked) {
      toast.error("Please confirm to lock LP tokens.");
      return;
    }

    setLoading(true);
    setLiquidityMessage("Please wait while we add liquidity in the pool. This might take a while, please do not close the tab.");

    try {
      const response = await handleLock();

      if (response?.Ok) {
        setLiquidityMessage("Liquidity added . Now let's lock LP token.");
        setIsTokenLocked(true);
        setShowPopup(false);
        setIsVisible(false);

        setTimeout(() => {
          setShouldFetchLpBalance(true);
        }, 2000);

        toast.success("LP tokens locked successfully!"); //  Show success message

      } else {
        setLiquidityMessage("Liquidity creation failed. Please try again.");
        toast.error("Liquidity creation failed.");
      }
    } catch (error) {
      setLiquidityMessage("An error occurred while adding liquidity.");
      toast.error("An error occurred while adding liquidity.");
    } finally {
      setLoading(false);
    }
  };


  //  Track state updates
  useEffect(() => {
    console.log("Updated isTokenLocked:", isTokenLocked);
  }, [isTokenLocked]);



  const handleAmountChange = (e) => {
    let inputAmount = e.target.value;

    inputAmount = inputAmount.replace(/[^0-9.]/g, "");
    if (inputAmount.indexOf(".") !== inputAmount.lastIndexOf(".")) {
      inputAmount = inputAmount.slice(0, inputAmount.lastIndexOf("."));
    }

    if (inputAmount === "") {
      setAmount("");
      updateAmountAndUsdValue("");
      setError("");
      return;
    }

    if (inputAmount === "." || inputAmount === "0.") {
      setAmount(inputAmount);
      updateAmountAndUsdValue(inputAmount);
      setError("");
      return;
    }

    // Convert to number only if it's valid
    const numericAmount = parseFloat(inputAmount);
    if (!isNaN(numericAmount) && numericAmount > supplyBalance) {
      setError(
        `Amount cannot exceed your available supply balance of ${supplyBalance.toLocaleString(
          "en-US"
        )}`
      );
      return;
    } else {
      setError("");
    }

    let formattedAmount;
    if (inputAmount.includes(".")) {
      const [integerPart, decimalPart] = inputAmount.split(".");
      formattedAmount = `${parseInt(integerPart || "0").toLocaleString(
        "en-US"
      )}.${decimalPart.slice(0, 8)}`;
    } else {
      formattedAmount = parseInt(inputAmount || "0").toLocaleString("en-US");
    }

    setAmount(formattedAmount);
    updateAmountAndUsdValue(inputAmount);
  };

  // Updates the USD equivalent of the supply amount
  const updateAmountAndUsdValue = (inputAmount) => {
    const numericAmount = parseFloat(inputAmount.replace(/,/g, ""));
    if (inputAmount === "") {
      setAmount("");
      setUsdValue(0);
      return;
    }
    if (!isNaN(numericAmount) && numericAmount >= 0) {
      if (numericAmount <= supplyBalance) {
        const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
        const convertedValue = numericAmount * adjustedConversionRate;
        setUsdValue(convertedValue.toFixed(8));
        setError("");
      } else {
        setError("Amount exceeds the supply balance");
      }
    } else {
      setError("Amount must be a positive number");
    }
  };

  // Approves the supply transaction
  const handleApprove = async () => {
    if (isBlocked) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
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
    const transferFeeBigInt = Math.round(transferFee * Math.pow(10, 8));
    const totalAmount = scaledAmount + transferFeeBigInt;
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

  const isCollateral = true;
  const safeAmount = Number((amount || "").replace(/,/g, "")) || 0;
  let amountAsNat64 = Math.round(safeAmount * Math.pow(10, 8));
  const transferFeeBigInt = Math.round(transferFee * Math.pow(10, 8));
  const scaledAmount = amountAsNat64;

  const totalAmount = transferFeeBigInt
    ? scaledAmount + transferFeeBigInt
    : scaledAmount;

  console.log(
    "transacyionFee",
    transferFee,
    "transferFeeBigInt",
    transferFeeBigInt,
    "scaledAmount",
    scaledAmount,
    "totalAmount",
    totalAmount
  );

  // Executes the supply transaction
  const handleSupplyETH = async () => {
    if (isBlocked) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return; // Prevent function execution
    }

    try {
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

      const supplyParams = {
        asset: asset,
        is_collateral: currentCollateralStatus,
        amount: totalAmount,
      };

      const response = await backendActor.execute_supply(supplyParams);
      dispatch(toggleDashboardRefresh());

      if ("Ok" in response) {
        trackEvent(
          `Supply,${asset},${scaledAmount / 100000000
          },${currentCollateralStatus},${principalObj.toString()}`,
          "Assets",
          `Supply,${asset},${scaledAmount / 100000000
          },${currentCollateralStatus},${principalObj.toString()}`,
          "Assets"
        );
        setIsPaymentDone(true);
        setIsVisible(false);

        if (isSoundOn) {
          const sound = new Audio(coinSound);
          sound.play();
        }

        toast.success(`Supply successful!`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else if ("Err" in response) {
        const errorKey = response.Err;
        const errorMsg = errorKey?.toString() || "An unexpected error occurred";
        console.error("Error:", errorKey);
        if (errorMsg.toLowerCase().includes("panic")) {
          console.error("Panic error detected.");
          setShowPanicPopup(true);
          setIsVisible(false);
        } else if (
          errorMsg.toLowerCase().includes("out of cycles") ||
          errorMsg.includes("Reject text: Canister")
        ) {
          console.error("Canister is out of cycles.");
          toast.error("Canister is out of cycles. Admin has been notified.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else if (errorMsg.toLowerCase().includes("SupplyCapExceeded")) {
          console.error("Supply cap exceeded error.");
          toast.error("Supply cap is exceeded.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else {
          const errorKey = response.Err;
          const errorMsg =
            errorKey?.toString() || "An unexpected error occurred";

          if (errorKey && "BLOCKEDFORONEHOUR" in errorKey) {
            console.error(
              "You are temporarily blocked from using this function"
            );

            toast.error(
              "You are temporarily blocked from using this function",
              {
                className: "custom-toast",
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
              }
            );
            handleClosePaymentPopup();
            setIsLoading(false);
          } else if (errorMsg.toLowerCase().includes("panic")) {
            setShowPanicPopup(true);
            setIsVisible(false);
          } else if (
            errorMsg.toLowerCase().includes("out of cycles") ||
            errorMsg.includes("Reject text: Canister")
          ) {
            toast.error("Canister is out of cycles. Admin has been notified.", {
              className: "custom-toast",
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          } else if (errorMsg.toLowerCase().includes("SupplyCapExceeded")) {
            toast.error("Supply cap is exceeded.", {
              className: "custom-toast",
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          } else {
            const userFriendlyMessage =
              errorMessages[errorKey] || errorMessages.Default;
            console.error("Error:", errorKey);

            toast.error(`Supply failed: ${userFriendlyMessage}`, {
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
        }
      }
    } catch (error) {
      console.error(`Error: ${error.message || "Supply action failed!"}`);

      const message = error.message || "Supply action failed!";
      const isPanicError = message.toLowerCase().includes("panic");
      const isOutOfCyclesError =
        message.toLowerCase().includes("out of cycles") ||
        message.includes("Reject text: Canister");
      const isSupplyCapExceeded = message
        .toLowerCase()
        .includes("SupplyCapExceeded");

      if (isPanicError) {
        setShowPanicPopup(true);
        setIsVisible(false);
      } else if (isOutOfCyclesError) {
        toast.error("Canister is out of cycles. Admin has been notified.", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else if (isSupplyCapExceeded) {
        toast.error("Supply cap is exceeded.", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        toast.error(`Error: ${message}`, {
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
    }
  };

  const handleCreateLiquidity = async () => {
    if (isBlocked) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    try {
      // TODO: Replace this with actual backend API call
      const response = await new Promise((resolve) =>
        setTimeout(() => resolve({ Ok: true }), 2000) // Simulated delay
      );

      if (response?.Ok) {
        console.log("Liquidity added . Now let's lock LP token.");
        toast.success("Liquidity added successfully!", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        return { Ok: true }; // Ensure function returns success response
      } else if (response?.Err) {
        const errorMsg = response.Err?.toString() || "An unexpected error occurred";
        console.error("Error:", errorMsg);

        if (errorMsg.toLowerCase().includes("panic")) {
          console.error("Panic error detected.");
          setShowPanicPopup(true);
        } else if (
          errorMsg.toLowerCase().includes("out of cycles") ||
          errorMsg.includes("Reject text: Canister")
        ) {
          console.error("Canister is out of cycles.");
          toast.error("Canister is out of cycles. Admin has been notified.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else {
          toast.error(`Liquidity creation failed: ${errorMsg}`, {
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

        return { Err: errorMsg }; // Ensure function returns error response
      }
    } catch (error) {
      console.error(`Error: ${error.message || "Liquidity creation failed!"}`);
      toast.error(`Error: ${error.message || "Liquidity creation failed!"}`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      return { Err: error.message || "Liquidity creation failed!" };
    }
  };
  const handleLock = async () => {
    if (isBlocked) {
      toast.error("You are temporarily blocked from using this function", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    try {
      // TODO: Replace this with actual backend API call
      const response = await new Promise((resolve) =>
        setTimeout(() => resolve({ Ok: true }), 2000) // Simulated delay
      );

      if (response?.Ok) {
        console.log("Liquidity added . Now let's lock LP token.");
        toast.success("Liquidity added successfully!", {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        return { Ok: true }; // Ensure function returns success response
      } else if (response?.Err) {
        const errorMsg = response.Err?.toString() || "An unexpected error occurred";
        console.error("Error:", errorMsg);

        if (errorMsg.toLowerCase().includes("panic")) {
          console.error("Panic error detected.");
          setShowPanicPopup(true);
        } else if (
          errorMsg.toLowerCase().includes("out of cycles") ||
          errorMsg.includes("Reject text: Canister")
        ) {
          console.error("Canister is out of cycles.");
          toast.error("Canister is out of cycles. Admin has been notified.", {
            className: "custom-toast",
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else {
          toast.error(`Liquidity creation failed: ${errorMsg}`, {
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

        return { Err: errorMsg }; // Ensure function returns error response
      }
    } catch (error) {
      console.error(`Error: ${error.message || "Liquidity creation failed!"}`);
      toast.error(`Error: ${error.message || "Liquidity creation failed!"}`, {
        className: "custom-toast",
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      return { Err: error.message || "Liquidity creation failed!" };
    }
  };
  const selectedLockOption = lockOptions.find(option => option.label === selectedLock);
  const selectedLockDuration = selectedLockOption ? selectedLockOption.duration : "N/A"; // Default if not found


  const handleClosePaymentPopup = () => {
    setIsPaymentDone(false);
    setIsModalOpen(false);
  };
  const handleClose = () => {
    setIsLiquidityDone(false)
    setIsLPPopupOpen(true)
  };

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isApproved) {
        await handleSupplyETH();
      } else {
        await handleApprove();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLpclick = () => {
    setShowPopup(true); // Open confirmation popup

  };
  useEffect(() => {
    if (showPopup) {
      setIsLPPopupOpen(false);
    }
  }, [showPopup]);

  const confirmLock = () => {
    setShowPopup(false);
    // Call your function to lock liquidity here
    console.log(`Locking ${lpBalance} LP tokens for ${selectedLock}`);
  };
  const handleCreateLiquidityClick = async () => {
    setIsLoading(true);
    setLiquidityMessage(
      "Please wait while we add liquidity in the pool. This might take a while, please do not close the tab."
    );

    try {
      const response = await handleCreateLiquidity();

      if (response?.Ok) {
        //  Keep "Please wait..." message visible for 4 seconds
        setTimeout(() => {
          setLiquidityMessage("Liquidity added . Now let's lock LP token.");
          setIsLiquidityDone(true);
          setIsOpen(false);
          setIsVisible(false);

          //  Keep "Liquidity added..." message visible for 5 seconds
          setTimeout(() => {
            setShouldFetchLpBalance(true);
          }, 6000);

        }, 4000); // Adjusted to 4 seconds for the first message
      } else {
        setLiquidityMessage("Liquidity creation failed. Please try again.");
      }
    } catch (error) {
      setLiquidityMessage("An error occurred while adding liquidity.");
    } finally {
      // Keep the loader visible for max 4 seconds and then hide it
      setTimeout(() => {
        setIsLoading(false);
      }, 4000); // Loader will disappear after 4 seconds
    }
  };


  // Effect to fetch LP balance when `shouldFetchLpBalance` becomes true
  useEffect(() => {
    if (shouldFetchLpBalance) {
      console.log("Fetching LP token balance from backend...");

      setIsLiquidityDone(false);

      // Show a loading indicator to prevent flickering

      setTimeout(() => {
        console.log("LP Balance fetched:", 100);
        setLpBalance(100);
        setIsLPPopupOpen(true);
      }, 10);
    }
  }, [shouldFetchLpBalance]);







  const calculateHealthFactor = (
    totalCollateral,
    totalDebt,
    liquidationThreshold,
    reserveliquidationThreshold
  ) => {
    const amountAdded = collateral ? usdValue || 0 : 0;
    let totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountAdded);
    if (totalCollateralValue < 0) {
      totalCollateralValue = 0;
    }
    let totalDeptValue = parseFloat(totalDebt);
    if (totalDeptValue < 0) {
      totalDeptValue = 0;
    }
    if (totalDeptValue === 0) {
      return Infinity;
    }
    let avliq = liquidationThreshold * totalCollateral;
    let tempLiq =
      (avliq + amountAdded * reserveliquidationThreshold) /
      totalCollateralValue;
    let result = (totalCollateralValue * (tempLiq / 100)) / totalDeptValue;
    result = Math.round(result * 1e8) / 1e8;
    return result;
  };

  const calculateLTV = (totalCollateralValue, totalDeptValue) => {
    if (totalCollateralValue === 0) {
      return 0;
    }
    return (totalDeptValue / totalCollateralValue) * 100;
  };

  const handleMaxClick = () => {
    const maxAmount = formatValue(supplyBalance);
    console.log("type pf maxAmount", typeof maxAmount);
    const [integerPart, decimalPart] = maxAmount.split(".");
    const formattedAmount = `${parseInt(integerPart).toLocaleString(
      "en-US"
    )}.${decimalPart}`;
    setAmount(formattedAmount);
    updateAmountAndUsdValue(maxAmount);
  };

  const formatValue = (value) => {
    if (!value) return "0";
    return Number(value)
      .toFixed(8)
      .replace(/\.?0+$/, "");
  };
  const truncateToDecimals = (num, decimals) => {
    const factor = Math.pow(10, decimals);
    return (Math.floor(num * factor) / factor).toFixed(decimals); // Ensures "2.20" format
  };

  const truncatedValue = truncateToDecimals(Number(healthFactorBackend), 2);

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent accidental double triggering

        if (closeButtonRef.current && !closeButtonRef.current.disabled) {
          closeButtonRef.current.click();
        } else if (
          approveButtonRef.current &&
          !approveButtonRef.current.disabled
        ) {
          approveButtonRef.current.click();
        } else if (
          supplyButtonRef.current &&
          !supplyButtonRef.current.disabled
        ) {
          supplyButtonRef.current.click();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent accidental double triggering

        if (closeButtonRef.current && !closeButtonRef.current.disabled) {
          closeButtonRef.current.click();
        } else if (
          currentLiquidityRef.current &&
          !currentLiquidityRef.current.disabled
        ) {
          currentLiquidityRef.current.click();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
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
    const handleClickOutside = (event) => {
      if (
        tokenLockref.current &&
        !tokenLockref.current.contains(event.target) &&
        !isLoading
      ) {
        setIsTokenLocked(false);
        setIsVisible(false);
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
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent accidental double triggering

        if (closeButtonRef.current && !closeButtonRef.current.disabled) {
          closeButtonRef.current.click();
        } else if (
          showPopupref.current &&
          !showPopupref.current.disabled
        ) {
          showPopupref.current.click();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent accidental double triggering

        if (closeButtonRef.current && !closeButtonRef.current.disabled) {
          closeButtonRef.current.click();
        } else if (
          tokenLockref.current &&
          !tokenLockref.current.disabled
        ) {
          tokenLockref.current.click();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  useEffect(() => {
    const healthFactor = calculateHealthFactor(
      totalCollateral,
      totalDebt,
      liquidationThreshold,
      reserveliquidationThreshold
    );

    const amountAdded = collateral ? usdValue || 0 : 0;
    let totalCollateralValue =
      parseFloat(totalCollateral) + parseFloat(amountAdded);
    if (totalCollateralValue < 0) {
      totalCollateralValue = 0;
    }
    let totalDeptValue = parseFloat(totalDebt);
    if (totalDeptValue < 0) {
      totalDeptValue = 0;
    }

    const ltv = calculateLTV(totalCollateralValue, totalDeptValue);
    setPrevHealthFactor(currentHealthFactor);
    const truncateToDecimals = (num, decimals) => {
      const factor = Math.pow(10, decimals);
      return (Math.floor(num * factor) / factor).toFixed(decimals);
    };

    setCurrentHealthFactor(
      healthFactor > 100 ? "Infinity" : truncateToDecimals(healthFactor, 2)
    );
  }, [
    asset,
    liquidationThreshold,
    reserveliquidationThreshold,
    assetSupply,
    assetBorrow,
    amount,
    usdValue,
  ]);

  useEffect(() => {
    if (amount && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedValue =
        Number(amount.replace(/,/g, "")) * adjustedConversionRate;
      setUsdValue(convertedValue.toFixed(8));
    } else {
      setUsdValue(0);
    }
  }, [amount, conversionRate]);
  useEffect(() => {
    if (minAmount && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedValue =
        Number(minAmount.replace(/,/g, "")) * adjustedConversionRate;

      // Truncate instead of rounding
      const truncatedValue = Math.floor(convertedValue * 100) / 100;

      setMinAmountUsdValue(truncatedValue.toFixed(2));
    } else {
      setMinAmountUsdValue("0.00");
    }
  }, [minAmount, conversionRate]);

  useEffect(() => {
    if (lpBalance && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedValue =
        Number(lpBalance) * adjustedConversionRate;
      setLpUsdValue(convertedValue ? convertedValue.toFixed(8) : 0);
    } else {
      setLpUsdValue(0);
    }
  }, [lpBalance, conversionRate]);
  useEffect(() => {
    if (balance && conversionRate) {
      const adjustedConversionRate = Number(conversionRate) / Math.pow(10, 8);
      const convertedMaxValue = balance * adjustedConversionRate;

      setMaxUsdValue(convertedMaxValue);
    } else {
      setMaxUsdValue(0);
    }
  }, [amount, conversionRate]);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    if (supplyBalance === 0) {
      toast.dismiss();
      toast.warning("You do not have enough transaction fees to supply.");
    }
  }, [supplyBalance]);

  console.log(assetSupply, "assetSupply");
  useEffect(() => {
    setMinAmount(assetSupply ? ((assetSupply) * 0.05).toFixed(8) : 0);
  }, [assetSupply]);
  useEffect(() => {
    setMaxAmount(assetSupply ? ((assetSupply) * 0.75).toFixed(8) : 0);
  }, [assetSupply]);
  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <>
      {isVisible && (
        <div className="supply-popup" ref={modalRef}>
          <h1 className="font-semibold text-xl">Supply {asset}</h1>
          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2 dark:text-darkText">
                <h1>Amount</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer p-2 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                <div className="w-[50%]">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={supplyBalance === 0 || isApproved}
                    className="lg:text-lg   mb-2 placeholder:text-xs lg:placeholder:text-sm focus:outline-none bg-gray-100 rounded-md p-1 w-full dark:bg-darkBackground/5 dark:text-darkText"
                    placeholder={`Enter ${asset} Amount`}
                  />

                  <p className="text-xs text-gray-500 px-2 mt-2 mb-1">
                    {usdValue
                      ? `$${usdValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} USD`
                      : "$0.00 USD"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2 mt-1">
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p
                    className={`text-xs mt-4 p-2 py-1 rounded-md button1 ${supplyBalance === 0 || isApproved
                      ? "text-gray-400 cursor-not-allowed"
                      : "cursor-pointer bg-blue-100 dark:bg-gray-700/45"
                      }`}
                    onClick={() => {
                      if (supplyBalance > 0 && !isApproved) {
                        handleMaxClick();
                      }
                    }}
                  >
                    {formatValue(supplyBalance)} Max
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button

                className="z-20 px-[14px] text-[#2a1f9d] dark:text-darkText py-1.5  box bg-transparent shadow-xl  text-xs"
                onClick={() => {
                  setIsOpen(true);
                  setIsVisible(false);
                }}
              >
                Earn rewards
              </button>
            </div>
            <div className="w-full -mt-8">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100 cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-full flex justify-between items-center my-1">
                  <p>Supply APY</p>
                  <p>
                    {supplyRateAPR < 0.1
                      ? "<0.01%"
                      : `${supplyRateAPR.toFixed(2)}%`}
                  </p>
                </div>
                <div className="w-full flex justify-between items-center my-1">
                  <p>Collateralization</p>
                  <p
                    className={`font-semibold ${currentCollateralStatus
                      ? "text-green-500"
                      : "text-red-500"
                      }`}
                  >
                    {currentCollateralStatus ? "Enabled" : "Disabled"}
                  </p>
                </div>

                <div className="w-full flex flex-col my-1">
                  <div className="w-full flex justify-between items-center">
                    <p>Health Factor</p>
                    <p>
                      <span
                        className={`${truncatedValue > 3
                          ? "text-green-500"
                          : truncatedValue <= 1
                            ? "text-red-500"
                            : truncatedValue <= 1.5
                              ? "text-orange-600"
                              : truncatedValue <= 2
                                ? "text-orange-400"
                                : "text-orange-300"
                          }`}
                      >
                        {truncatedValue > 100 ? "Infinity" : truncatedValue}
                      </span>
                      <span className="text-gray-500 mx-1">→</span>
                      <span
                        className={`${value > 3
                          ? "text-green-500"
                          : value <= 1
                            ? "text-red-500"
                            : value <= 1.5
                              ? "text-orange-600"
                              : value <= 2
                                ? "text-orange-400"
                                : "text-orange-300"
                          }`}
                      >
                        {currentHealthFactor}
                      </span>
                    </p>
                  </div>
                  <div className="w-full flex justify-between items-center my-1 mt-2">
                    <div className="flex items-center gap-1">
                      <p>Transaction Fee</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p>{transferFee}</p>
                      <img
                        src={image}
                        alt="connect_wallet_icon"
                        className="object-cover w-4 h-4 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <p>Final amount</p>
                    <div className="flex items-center gap-2">
                      <p>
                        {(amount
                          ? (+amount || 0) + (+transferFee || 0)
                          : 0
                        ).toFixed(8)}{" "}
                      </p>
                      <img
                        src={image}
                        alt="connect_wallet_icon"
                        className="object-cover w-4 h-4 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="w-full flex justify-end items-center mt-1">
                    <p className="text-gray-500">liquidation at &lt;1</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {!hasEnoughBalance && (
            <div className="w-full flex items-center text-xs mt-3 bg-yellow-100 p-2 rounded-md dark:bg-darkBackground/30">
              <p className="text-yellow-700 dark:text-yellow-500">
                You do not have enough {asset} in your account to pay for
                transaction fees . Please deposit {asset} from another account.
              </p>
            </div>
          )}
          {supplyBalance === 0 && (
            <div className="w-full flex items-center text-xs mt-3 bg-yellow-100 p-2 rounded-md dark:bg-darkBackground/30">
              <p className="text-yellow-700 dark:text-yellow-500">
                You do not have enough transaction fees to supply.
              </p>
            </div>
          )}

          <div className="w-full flex justify-between items-center mt-3">
            <div className="flex items-center">
              <p
                className={`text-xs whitespace-nowrap ${isApproved ? "text-green-500" : "text-red-500"
                  }`}
              >
                {isApproved
                  ? "Approved with signed message"
                  : "Approve with signed message"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            {/* Approve Button */}
            <button
              ref={approveButtonRef}
              onClick={() => !isApproved && handleClick()}
              className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${isApproved ||
                isLoading ||
                !hasEnoughBalance ||
                amount <= 0
                ? "opacity-50 cursor-not-allowed"
                : ""
                }`}
              disabled={
                isApproved || isLoading || amount <= 0 || !hasEnoughBalance
              }
            >
              Approve {asset} to continue
            </button>

            {/* Supply Button */}
            <button
              ref={supplyButtonRef}
              onClick={() => isApproved && handleClick()}
              className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${!isApproved ||
                isLoading ||
                amount <= 0 ||
                !hasEnoughBalance
                ? "opacity-50 cursor-not-allowed"
                : ""
                }`}
              disabled={
                !isApproved || isLoading || amount <= 0 || !hasEnoughBalance
              }
            >
              Supply {asset}
            </button>
          </div>

          { }
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
      )}
      {isOpen && (
        <div className="supply-popup" ref={openModalRef}>
          <div className="flex items-center space-x-2">
            <h1 className="font-semibold text-xl">Create liquidity</h1>
            <span className="relative cursor-pointer flex items-center">
              <span className="group inline-flex items-center">
                <Info
                  size={16}
                  className="text-[#233D63] dark:text-darkText dark:opacity-50 mt-1 -ml-1"
                />
                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[15rem] pointer-events-none">
                  The supply rate APY may vary based on utilization levels and incentive structures.
                </div>
              </span>
            </span>
          </div>

          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2 dark:text-darkText">
                <h1>Amount</h1>
              </div>
              <div className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer p-2 rounded-md dark:bg-[#1D1B40] dark:text-darkText">
                <div className="w-[50%]">
                  <input
                    type="text"
                    value={minAmount}
                    disabled
                    className="lg:text-lg   mb-2  focus:outline-none bg-gray-100 rounded-md p-1 w-full dark:bg-darkBackground/5 dark:text-darkText"

                  />

                  <p className="text-xs text-gray-500 px-2 mt-2 mb-1">
                    {minAmountUsdValue
                      ? `$${minAmountUsdValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} USD`
                      : "$0.00 USD"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="w-auto flex items-center gap-2 mt-1">
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-6 h-6 rounded-full"
                    />
                    <span className="text-lg">{asset}</span>
                  </div>
                  <p
                    className={`text-xs mt-4 p-2 py-1 rounded-md button1 ${supplyBalance === 0 || isApproved
                      ? "text-gray-400 cursor-not-allowed"
                      : "cursor-pointer bg-blue-100 dark:bg-gray-700/45"
                      }`}

                  >
                    {formatValue(maxAmount)} Max
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className=" text-[16px]">Pool:</span>
              <img src={dfin} alt="pool_icon" className="w-6 h-6 rounded-full z-10" />
              <img src={image} alt="pool_icon" className="w-6 h-6 rounded-full -ml-3" />
              <span className="text-lg ">DFIN/{asset}</span>
            </div>
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100 cursor-pointer p-1 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-full flex justify-between items-center my-1 ">
                  <div className="flex items-center gap-1 ml-1">
                    <p>Transaction Fee</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.45 mr-1">
                    <p>{transferFee}</p>
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-4 h-4 rounded-full"
                    />
                  </div>
                </div>
                <div className="w-full flex justify-between items-center my-1">
                  <div className="flex items-center gap-1 ml-1">
                    <p>Final Amount</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 mr-1">
                    <p>
                      {(minAmount
                        ? (+minAmount || 0) + (+transferFee || 0)
                        : 0
                      ).toFixed(8)}{" "}
                    </p>
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-4 h-4 rounded-full"
                    />
                  </div>
                </div>


              </div>
            </div>

          </div>
          <div className="flex flex-col gap-4 mt-4">
            <button
              ref={currentLiquidityRef}
              onClick={() => handleCreateLiquidityClick()}
              className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${isLoading ||
                minAmount <= 0
                ? "opacity-50 cursor-not-allowed"
                : ""
                }`}
              disabled={
                isLoading || minAmount <= 0
              }
            >
              Create Liquidity
            </button>
          </div>

          { }
          {isLoading && (
            <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black bg-opacity-40 backdrop-blur-sm">
              <div className="loader mb-4"></div> {/* Loader outside the content box */}

              <div className="flex flex-col items-center gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-lg w-[390px]">
                <p className="text-sm lg:text-md text-black dark:text-white break-words whitespace-normal text-center leading-tight line-clamp-2">
                  {liquidityMessage}
                </p>
              </div>
            </div>
          )}


        </div>
      )}
      {isPaymentDone && (
        <div
          ref={paymentModalRef}
          className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-3 px-5 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50"
        >
          <div className="w-full flex flex-col items-center">
            <button
              ref={closeButtonRef}
              onClick={handleClosePaymentPopup}
              className="text-gray-400 focus:outline-none self-end button1"
            >
              <X size={24} />
            </button>
            <div className="border rounded-full p-2 my-3 text-green-500 border-green-500">
              <Check />
            </div>
            <h1 className="font-semibold text-xl">All done!</h1>
            <p className=" text-sm  lgx:text-lg text-center">
              You have supplied{" "}
              <strong>
                {scaledAmount / 100000000
                  ? scaledAmount / 100000000 >= 1e-8 &&
                    scaledAmount / 100000000 < 1e-7
                    ? Number(scaledAmount / 100000000).toFixed(8)
                    : scaledAmount / 100000000 >= 1e-7 &&
                      scaledAmount / 100000000 < 1e-6
                      ? Number(scaledAmount / 100000000).toFixed(7)
                      : scaledAmount / 100000000
                  : "0"}{" "}
                {asset}
              </strong>
            </p>
            <p className="text-sm  lgx:text-lg text-center">
              You have received{" "}
              <strong>
                {scaledAmount / 100000000
                  ? scaledAmount / 100000000 >= 1e-8 &&
                    scaledAmount / 100000000 < 1e-7
                    ? Number(scaledAmount / 100000000).toFixed(8)
                    : scaledAmount / 100000000 >= 1e-7 &&
                      scaledAmount / 100000000 < 1e-6
                      ? Number(scaledAmount / 100000000).toFixed(7)
                      : scaledAmount / 100000000
                  : "0"}{" "}
                d{asset}
              </strong>
            </p>

            <button
              ref={closeButtonRef}
              onClick={handleClosePaymentPopup}
              className="bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-max text-white rounded-md p-2 px-6 shadow-md font-semibold text-sm mt-4 mb-5"
            >
              Close Now
            </button>
          </div>
        </div>
      )}
      {isLPPopupOpen && (
        <div className="lp-popup" ref={lpModalRef}>
          <div className="flex items-center space-x-2">
            <h1 className="font-semibold text-xl">Lock LP token</h1>
            <span className="relative cursor-pointer flex items-center">
              <span className="group inline-flex items-center">
                <Info
                  size={18}
                  className="text-[#233D63] dark:text-darkText dark:opacity-50"
                />
                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[15rem] pointer-events-none">
                  The supply rate APY may vary based on utilization levels and incentive structures.
                </div>
              </span>
            </span>
          </div>

          <div className="flex flex-col gap-2 mt-5 text-sm">
            <div className="w-full">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100 cursor-pointer p-1.5 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">
                <div className="w-full flex justify-between items-center my-1 ">
                  <div className="flex items-center gap-1 ml-1">
                    <p>Amount to be locked </p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.45">
                    <p>{lpBalance}</p>
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-4 h-4 rounded-full"
                    />
                  </div>
                </div>
                <div className="w-full flex justify-between items-center my-1">
                  <div className="flex items-center gap-1 ml-1">

                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <p>
                      ${lpUsdValue}
                    </p>
                  </div>
                </div>


              </div>
            </div>

            <div className="w-full mt-4">
              <h2 className="font-semibold text-gray-700 dark:text-white">Locking period:</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Lock longer – earn more.
              </p>

              {/* Selection Buttons */}
              <div className="flex items-center justify-between bg-gray-100 dark:bg-[#1D1B40] p-1 rounded-full mt-3">
                {lockOptions.map((option) => (
                  <button
                    key={option.label}
                    className={`px-6 py-1 rounded-full transition-all 
                    ${selectedLock === option.label
                        ? "bg-white dark:bg-[#373658] font-semibold text-black dark:text-white shadow-sm"
                        : "bg-transparent text-gray-400"
                      }`}
                    onClick={() => setSelectedLock(option.label)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>



              {/* Duration Labels */}
              <div className="flex items-center justify-between mt-3 text-xs ml-2 mr-2 text-gray-500 dark:text-gray-400">
                {lockOptions.map((option) => (
                  <span
                    key={option.duration}
                    className={
                      selectedLock === option.label ? "font-semibold text-black dark:text-white" : ""
                    }
                  >
                    {option.duration}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-full mt-2">
              <div className="w-full flex justify-between my-2">
                <h1>Transaction overview</h1>
              </div>
              <div className="w-full bg-gray-100 cursor-pointer p-3 rounded-md text-sm dark:bg-darkBackground/30 dark:text-darkText">

                <div className="w-full flex justify-between items-center my-1">
                  <p>APR</p>
                  <p>
                    {supplyRateAPR < 0.1
                      ? "<0.01%"
                      : `${supplyRateAPR.toFixed(2)}%`}
                  </p>
                </div>

                <div className="w-full flex justify-between items-center my-1">

                  <div className="flex items-center gap-1">
                    <p>Transaction Fee</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p>{transferFee}</p>
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-4 h-4 rounded-full"
                    />
                  </div>
                </div>
                <div className="w-full flex justify-between items-center">
                  <p>Final amount</p>
                  <div className="flex items-center gap-2">
                    <p>
                      {(lpBalance
                        ? (+lpBalance || 0) + (+transferFee || 0)
                        : 0
                      ).toFixed(8)}{" "}
                    </p>
                    <img
                      src={image}
                      alt="connect_wallet_icon"
                      className="object-cover w-4 h-4 rounded-full"
                    />
                  </div>
                </div>


              </div>
            </div>

          </div>
          <div className="flex flex-col gap-4 mt-4">
            {/* Approve Button */}


            {/* Supply Button */}
            <button
              ref={lpModalRef}
              onClick={() => handleLpclick()}
              className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${isLoading ||
                lpBalance <= 0
                ? "opacity-50 cursor-not-allowed"
                : ""
                }`}
              disabled={
                isLoading || lpBalance <= 0
              }
            >
              Confirm and lock
            </button>
          </div>

          { }
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
      )}
      {issLiquidityDone && (
        <div

          className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-3 px-5 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50"
        >
          <div className="w-full flex flex-col items-center mb-4 ">
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className="text-gray-400 focus:outline-none self-end button1"
            >
              <X size={24} />
            </button>
            <div className="border rounded-full p-2 my-3 text-green-500 border-green-500">
              <Check />
            </div>
            <p className=" text-sm  text-wrap lgx:text-lg text-center mt-2 mb-6">
              {liquidityMessage}

            </p>



          </div>
        </div>
      )}
      {isTokenLocked && (
        <div
          ref={tokenLockref}
          className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-3 px-5 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50"
        >
          <div className="w-full flex flex-col items-center mb-6">
            <button
              ref={closeButtonRef}
              onClick={handleClosePaymentPopup}
              className="text-gray-400 focus:outline-none self-end button1"
            >
              <X size={24} />
            </button>
            <div className="border rounded-full p-2 my-3 text-green-500 border-green-500">
              <Check />
            </div>
            <p className=" text-sm  lgx:text-lg text-center mt-2">
              You have successfully locked your LP tokens for{" "}
              {selectedLockDuration}.

            </p>
          </div>
        </div>
      )}
      {showPopup && (
        <div
          className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl rounded-xl 
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-3 px-5 text-[#2A1F9D] 
          dark:bg-[#252347] dark:text-darkText z-50"
        >
          <div className="w-full flex flex-col items-center">
            <button
              onClick={() => setShowPopup(false)}
              className="text-gray-400 focus:outline-none self-end"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-bold text-center text-[#2A1F9D] dark:text-indigo-300">
              Warning
            </h2>
            <p className="text-md text-[#989898] text-center dark:text-darkText mt-4 font-light">
              Are you sure you want to lock <strong className="font-bold ">{lpBalance ?? "0.00"} LP</strong> tokens for{" "}
              <strong className="font-bold ">{selectedLockDuration}</strong>?
            </p>

            {/* Confirmation Checkbox */}
            <div className="mt-4 flex justify-center">
              <label className="flex items-center text-[#989898]">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 appearance-none border-2 border-gray-300 rounded
                   bg-white checked:bg-blue-400 checked:border-blue-400 focus:outline-none"
                    checked={isCheckboxChecked}
                    onChange={handleCheckboxChange}
                  />

                  {/* Custom SVG for the checkmark */}
                  {isCheckboxChecked && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute left-1/3 top-1/2 transform -translate-x-1/2 -translate-y-1/2 stroke-white"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>

                <p className="font-semibold ml-2">Yes, lock my LP tokens</p>
              </label>
            </div>

            <button
              onClick={handleLockLiquidity}
              disabled={Loading}
              className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-max text-white rounded-md 
              p-2 px-6 shadow-md font-semibold text-sm mt-4 mb-5 ${Loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              Lock lp tokens
            </button>

          </div>

        </div>

      )}
      {Loading && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div className="loader"></div>


        </div>
      )}
      {showPanicPopup && (
        <div className="w-[325px] lg1:w-[420px] absolute bg-white shadow-xl  rounded-lg top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2  text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
          <div className="w-full flex flex-col items-center ">
            <div className="w-full flex items-center justify-between  ">
              <h1 className="font-semibold text-lg text-orange-400 text-center flex-grow mt-3">
                Important Message
              </h1>
              <button
                ref={closeButtonRef}
                onClick={handleClosePaymentPopup}
                className="text-gray-400 focus:outline-none mt-3 mr-4"
              >
                <X size={22} />
              </button>
            </div>

            <div
              className="dark:bg-gradient 
                     dark:from-darkGradientStart 
                     dark:to-darkGradientEnd 
                     dark:text-darkText p-2 "
            >
              <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                Thanks for helping us improve DFinance! <br></br> You’ve
                uncovered a bug, and our dev team is on it.
              </p>

              <p className="text-gray-700 mb-4 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                Your account is temporarily locked while we investigate and fix
                the issue. <br />
              </p>
              <p className="text-gray-700 mb-2 text-[14px] dark:text-darkText mt-2 leading-relaxed">
                We appreciate your contribution and have logged your ID—testers
                like you are key to making DFinance better! <br />
                If you have any questions, feel free to reach out.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupplyPopup;
