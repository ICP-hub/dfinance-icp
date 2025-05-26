import React, { useState, useEffect, useRef } from "react";
import { Drawer } from "@mui/material";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/useAuthClient";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "../../redux/reducers/themeReducer";
import CustomizedSwitches from "../Common/materialUISwitch";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toggleSound } from "../../redux/reducers/soundReducer";
import { Info } from "lucide-react";
import loader from "../../../public/helper/loader.svg";
import { setUserData } from "../../redux/reducers/userReducer";
import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
  generateRandomUsername,
} from "../../utils/constants";
import { setWalletModalOpen } from "../../redux/reducers/utilityReducer";
import Button from "../Common/button";
import icplogo from "../../../public/wallet/icp.png";
import { GrCopy } from "react-icons/gr";
import { CiShare1 } from "react-icons/ci";
import { joyRideTrigger } from "../../redux/reducers/joyRideReducer";
import useFetchConversionRate from "../CustomHooks/useFetchConversionRate";
import { Principal } from "@dfinity/principal";
import useAssetData from "../CustomHooks/useAssets";
import useFunctionBlockStatus from "../CustomHooks/useFunctionBlockStatus";
import { toggleDashboardRefresh } from "../../redux/reducers/dashboardDataUpdateReducer";
import useNotificationSystem from "../CustomHooks/useNotification";
import useTransferFee from "../CustomHooks/useTransferFee";
import { SCALING_FACTOR } from "../../utils/constants";
const MobileTopNav = ({
  isMobileNav,
  setIsMobileNav,
  isHomeNav,
  handleLogout,
}) => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const { isBlocked } = useFunctionBlockStatus();
  const theme = useSelector((state) => state.theme.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { assets, AssetImages } = useAssetData();
  const { isAuthenticated, principal, accountIdString, backendActor } = useAuth();
  const ledgerActors = useSelector((state) => state.ledger);
  const checkAndNotify = useNotificationSystem();
  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("isDarkMode");
    return savedTheme ? JSON.parse(savedTheme) : theme === "dark";
  });
  const [switchWalletDrop, setSwitchWalletDrop] = useState(false);
  const isSoundOn = useSelector((state) => state.sound.isSoundOn);
  const isTestnetMode = useSelector((state) => state.testnetMode.isTestnetMode);
  const previousIsTestnetMode = useRef(isTestnetMode);
  const isProduction = process.env.DFX_PRODUCTION === 'true';

  const handleTestnetModeToggle = () => {

    if (!isProduction) {
      const url = `https://cszmy-vyaaa-aaaak-quhea-cai.icp0.io/dashboard/?openWallet=true`;
      console.log("Redirecting to:", url);
      window.location.replace(url);
    } else {
      console.log("Production mode — redirection blocked.");
    }
  };

  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const toggleRefresh = useSelector(
    (state) => state.faucetUpdate.refreshTrigger
  );
  /* ===================================================================================
   *                 Derived State, UI Variables, and Route-Based Flags
   * =================================================================================== */
  const isMobile2 = window.innerWidth <= 640;

  // copy principal ID to clipboard
  const copyToClipboard = () => {
    if (principal) {
      navigator.clipboard
        .writeText(principal)
        .then(() => {
          toast.success(`Principal copied to clipboard`, {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        })
        .catch((err) => {
          toast.error(`Failed to copy: ` + err, {
            className: "custom-toast",
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        });
    }
  };

  const truncateString = (str, maxLength) => {
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  };

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */
  const [asset, setAsset] = useState("ICP");
  const [amount, setAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ledgerFee, setLedgerFee] = useState(null);
  const transferFeRetrive = useTransferFee(asset);
  const transferFee = Number(transferFeRetrive?.transferFee) || 0;
  const ledgerFeeNumber =
    typeof ledgerFee === "bigint"
      ? Number(ledgerFee) / 1e8
      : Number(ledgerFee) / 1e8 || 0;

  const transactionFee = transferFee + ledgerFeeNumber;
  const approvalFee = transactionFee + ledgerFeeNumber;

  const formatFee = (fee) => {
    const fixedFee = parseFloat(fee).toFixed(8);
    const parts = fixedFee.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1] || "";
    return `${integerPart}.${decimalPart.padEnd(8, "0").slice(0, 8)}`;
  };
  const formattedApprovalFee = formatFee(approvalFee);

  const {
    fetchConversionRate,
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  } = useFetchConversionRate();

  const handleSoundToggle = () => {
    dispatch(toggleSound());
  };
  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isApproved) {
        await handleTransfer();
      } else {
        await handleApprove();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatusFromBackend = async () => {
    try {
      const cycleStatus = await backendActor.cycle_alert();
      const tokenStatus = await backendActor.token_balance_alert(asset);
      const status = {
        cycle: cycleStatus,
        token: tokenStatus.OK
      };

      return status;
    } catch (error) {
      console.error("Failed to fetch status:", error);
      throw error;
    }
  };
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

  const assetBalances = {
    ICP: ckICPBalance,
    ckETH: ckETHBalance,
    ckUSDT: ckUSDTBalance,
    ckBTC: ckBTCBalance,
    ckUSDC: ckUSDCBalance,
  };

  const balance = assetBalances[asset] || 0;
  const numericBalance = parseFloat(balance);
  const supplyBalance = Math.max(
    (assetBalances[asset] || 0) - formattedApprovalFee,
    0
  );
  const truncateTo8Decimals = (num) => {
    return Math.trunc(num * SCALING_FACTOR) / SCALING_FACTOR;
  };
  const approvalfee = +formattedApprovalFee || 0;
  const totalRequired = truncateTo8Decimals(+amount + approvalFee);
  const hasEnoughBalance =
    balance >= approvalfee &&
    totalRequired <= +numericBalance;

  // handle approve function
  const handleApprove = async () => {
    if (!receiverAddress.trim()) {
      toast.dismiss();
      toast.error("Please enter a valid receiver address", {
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

    if (receiverAddress.trim() === principal.toString()) {
      toast.dismiss();
      toast.error("You cannot approve transfers to your own address", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setAmount("");
      setReceiverAddress("");
      return;
    }

    if (isBlocked) {
      toast.dismiss();
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
      setAmount("");
      setReceiverAddress("");
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

    const amountAsNat64 = BigInt(
      Math.round(parseFloat(amount.replace(/,/g, "")) * 1e8)
    );
    const transferFeeBigInt = BigInt(Math.round(transferFee * 1e8));

    const totalAmount = amountAsNat64 + transferFeeBigInt + ledgerFee;
    try {
      const response = await ledgerActor.icrc2_approve({
        fee: ledgerFee ? [ledgerFee] : [],
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

      if ("Ok" in response) {
        setIsApproved(true);
        toast.dismiss();
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
        dispatch(toggleDashboardRefresh());
      } else if ("Err" in response) {
        console.error(response.Err);
        setIsApproved(false);
        setAmount("");
        setReceiverAddress("");
      }
    } catch (error) {
      console.error(error);
      setIsApproved(false);
      setAmount("");
      setReceiverAddress("");
    }
  };

  const handleTransfer = async () => {
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

      const safeAmount = Number((amount || "").replace(/,/g, "")) || 0;
      let amountAsNat64 = Math.round(safeAmount * SCALING_FACTOR);
      const transferFeeBigInt = Math.round(transferFee * SCALING_FACTOR);

      const scaledAmount = amountAsNat64;

      const ledgerFeenumber =
        typeof ledgerFee === "bigint" ? Number(ledgerFee) : ledgerFee || 0;
      const totalAmount = transferFeeBigInt
        ? scaledAmount + transferFeeBigInt + ledgerFeenumber
        : scaledAmount;
      const transferFromArgs = {
        from: {
          owner: Principal.fromText(principal),
          subaccount: [],
        },
        to: {
          owner: Principal.fromText(receiverAddress),
          subaccount: [],
        },
        amount: totalAmount,
        fee: ledgerFee ? [ledgerFee] : [],
        memo: [],
        created_at_time: [],
        spender_subaccount: [],
      };

      const response = await ledgerActor.icrc2_transfer_from(transferFromArgs);
      dispatch(toggleDashboardRefresh());
      const statusData = await fetchStatusFromBackend();
      await checkAndNotify(statusData);
      if ("Ok" in response) {
        setIsTransferDropDownOpen(false);
        setAmount("");
        setReceiverAddress("");
        if (isSoundOn) {
          const sound = new Audio(coinSound);
          sound.play();
        }

        toast.success(`Transfer successful!`, {
          className: "custom-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setAmount("");
        setReceiverAddress("");
        setIsApproved(false);
      } else if ("Err" in response) {
        handleTransferError(response.Err);
        setAmount("");
        setReceiverAddress("");
        setIsApproved(false);
      }
    } catch (error) {
      handleTransferException(error);
      setAmount("");
      setReceiverAddress("");
      setIsApproved(false);
    }
  };

  // Helper functions for error handling
  const handleTransferError = (errorKey) => {
    const errorMsg = errorKey?.toString() || "An unexpected error occurred";
    console.error("Error:", errorKey);

    if (typeof errorKey === "object" && "BLOCKEDFORONEHOUR" in errorKey) {
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
      setIsTransferDropDownOpen(false);
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
    } else if (errorMsg.toLowerCase().includes("unauthorized access")) {
      toast.error(
        "Unauthorized access. Only platform or controllers can perform this action.",
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
    } else {
      const userFriendlyMessage =
        errorMessages[errorKey] || errorMessages.Default;
      toast.error(`Transfer failed: ${userFriendlyMessage}`, {
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

  // Function to handle transfer exceptions
  const handleTransferException = (error) => {
    const message = error.message || "transfer action failed!";
    console.error(`Error: ${message}`);
    const msgLower = message.toLowerCase();

    if (msgLower.includes("panic")) {
      setShowPanicPopup(true);
      setIsVisible(false);
    } else if (msgLower.includes("invalid character")) {
      toast.error("Invalid principal ID format ", {
        className: "custom-toast",
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else if (
      msgLower.includes("out of cycles") ||
      message.includes("Reject text: Canister")
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
  };
  const handleAmountChange = (e) => {
    let inputAmount = e.target.value;

    inputAmount = inputAmount.replace(/[^0-9.]/g, "");
    if (inputAmount.indexOf(".") !== inputAmount.lastIndexOf(".")) {
      inputAmount = inputAmount.slice(0, inputAmount.lastIndexOf("."));
    }

    if (inputAmount === "") {
      setAmount("");
      return;
    }

    if (inputAmount === "." || inputAmount === "0.") {
      setAmount(inputAmount);
      return;
    }

    const numericAmount = parseFloat(inputAmount);
    if (!isNaN(numericAmount) && numericAmount > supplyBalance) {
      toast.dismiss();
      toast.error(
        `Amount cannot exceed your available supply balance of ${supplyBalance.toLocaleString(
          "en-US"
        )}`
      );
      return;
    } else {
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
  };
  const handleMaxClick = () => {
    setAmount(supplyBalance.toString());
  };
  const handleDarkModeToggle = () => {
    dispatch(toggleTheme());
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("isDarkMode", JSON.stringify(newMode));
      return newMode;
    });
  };
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTransferDropdownOpen, setIsTransferDropDownOpen] = useState(false);
  const [showDepositPopup, setShowDepositPopup] = useState(false);

  const toggleDropdown = () => {
    setIsTransferDropDownOpen(!isTransferDropdownOpen);
  };
  const toggleDepositDropdown = () => {
    setShowDepositPopup(!showDepositPopup);
  };
  const handleClose = () => {
    setIsMobileNav(false);
  };

  const handleSwitchWallet = () => {
    setSwitchWalletDrop(!switchWalletDrop);
  };

  const switchWallet = () => {
    dispatch(setWalletModalOpen({ isOpen: true, isSwitching: true }));
  };

  const handleTour = () => {
    dispatch(joyRideTrigger());
    handleClose();
    navigate("/dashboard");
  };
  const truncateToEightDecimals = (value) => {
    const multiplier = Math.pow(10, 8);
    const truncated = Math.floor(value * multiplier) / multiplier;
    return truncated.toFixed(8);
  };
  const [receiverAddress, setReceiverAddress] = useState("");
  const validateReceiverAddress = (value) => {
    const regex = /^[a-z0-9-]{60,65}$/;

    if (!value) {
      console.error("Receiver address is required.");
    } else if (!regex.test(value)) {
      console.error("Invalid receiver address format.");
    }
  };
  const handleReceiverChange = (e) => {
    const value = e.target.value.trim();
    setReceiverAddress(value);
    validateReceiverAddress(value);
  };

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */
  useEffect(() => {
    if (!asset || !ledgerActors) return;

    let ledgerActor;
    if (asset === "ckBTC") ledgerActor = ledgerActors.ckBTC;
    else if (asset === "ckETH") ledgerActor = ledgerActors.ckETH;
    else if (asset === "ckUSDC") ledgerActor = ledgerActors.ckUSDC;
    else if (asset === "ICP") ledgerActor = ledgerActors.ICP;
    else if (asset === "ckUSDT") ledgerActor = ledgerActors.ckUSDT;
    else {
      console.error(`Unknown asset type: ${asset}`);
      return;
    }

    // Define async function inside useEffect
    const fetchFee = async () => {
      try {
        const fee = await ledgerActor?.icrc1_fee();
        const feeAsNumber = typeof fee === "bigint" ? Number(fee) : fee;
        const feeBigInt = BigInt(Math.round(feeAsNumber));
        setLedgerFee(feeBigInt);
      } catch (error) {
        console.error(`Error getting fee for ${asset}:`, error);
      }
    };

    // Call the async function
    fetchFee();
  }, [asset]);

  useEffect(() => {
    const balanceStr = truncateToEightDecimals(supplyBalance);
    setAmount(balanceStr);
  }, [supplyBalance]);
  useEffect(() => {
    const shouldLockScroll = showDepositPopup || isTransferDropdownOpen;

    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showDepositPopup, isTransferDropdownOpen]);

  useEffect(() => {
    if (previousIsTestnetMode.current !== isTestnetMode) {
      if (previousIsTestnetMode.current !== undefined) {
        toast.dismiss();
      }
      toast.success(
        `Testnet mode ${isTestnetMode ? "enabled" : "disabled"} successfully!`
      );
      previousIsTestnetMode.current = isTestnetMode;
    }
  }, [isTestnetMode]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    if (theme === "dark") {
      htmlElement.classList.add("dark");
      bodyElement.classList.add("dark");
      bodyElement.style.backgroundColor = "#070a18";
      setIsDarkMode(true);
    } else {
      htmlElement.classList.remove("dark");
      bodyElement.classList.remove("dark");
      bodyElement.style.backgroundColor = "";
      setIsDarkMode(false);
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated === true) {
      dispatch(
        setUserData({
          name: generateRandomUsername(),
          isAuth: isAuthenticated,
          principal,
          imageUrl:
            "https://res.cloudinary.com/dzfc0ty7q/image/upload/v1714272826/avatars/Web3_Avatar-36_xouxfd.svg",
        })
      );
    } else {
      dispatch(setUserData(null));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setSwitchWalletDrop(false);
  }, [location]);
  useEffect(() => {
    const fetchAllData = async () => {
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
        console.error(error.message);
      }
    };

    fetchAllData();
  }, [
    fetchBalance,
    fetchConversionRate,
    dashboardRefreshTrigger,
    toggleRefresh,
  ]);
  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <Drawer
      anchor={"right"}
      open={isMobileNav}
      onClose={handleClose}
      PaperProps={{
        style: {
          width: "80vw",
          maxWidth: "440px",
          height: "100vh",
          maxHeight: "calc(100vh - 60px)",
          marginTop: "30px",
          marginBottom: "20px",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "transparent",
        },
      }}
    >
      <div className="flex flex-col pt-6 p-4 bg-white dark:bg-darkOverlayBackground font-poppins w-full h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-[#AEADCB] dark:text-darkTextPrimary">
            Menu
          </h2>
          <button
            onClick={handleClose}
            className="text-[#AEADCB] dark:text-darkTextPrimary"
          >
            <X size={24} />
          </button>
        </div>

        {isAuthenticated && isMobile2 && (
          <div className="flex items-center gap-1 my-2 mx-2 mb-4 p-1 bg-gradient-to-tr from-[#EB8863]/60 to-[#81198E]/60 dark:from-[#EB8863]/80 dark:to-[#81198E]/80 text-white shadow-[#00000040] text-[12px] cursor-pointer relative rounded-[10px] shadow-sm border-b-[1px] border-white/40 dark:border-white/20">
            <div
              className="flex items-center lg:gap-1 py-[9px] px-3 overflow-hidden button1"
              onClick={() => {
                handleSwitchWallet();
              }}
            >
              <img
                src={loader}
                alt="square"
                className="object-contain w-5 h-5 -mr-[3px]"
              />
              <span className=" font-bold ml-3">
                {truncateString(principal, 18)}
              </span>
            </div>

            {switchWalletDrop && (
              <>
                <div
                  className="fixed inset-0 bg-black opacity-40 z-40"
                  onClick={() => setSwitchWalletDrop(false)}
                ></div>
                <div
                  className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 lg1:absolute lg1:top-[160px] lg1:-left-[60px] lg1:transform lg1:-translate-x-1/2 lg1:mt-2 min-w-[300px] md:px-5 md:py-6 px-5 py-6 rounded-xl bg-white mb-4 z-50 dark:bg-darkOverlayBackground dark:border-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full flex items-center gap-2">
                    <img src={loader} alt="square" className="w-8 h-8" />
                    <h1 className="font-bold md:text-xl text-[17px] text-blue-800 dark:text-darkText">
                      {truncateString(principal, 20)}
                    </h1>
                  </div>
                  <div className="flex flex-col-reverse   lg:block">
                    <div className="flex flex-col lg1:flex-row mt-3 gap-3 ">
                      <div className="hidden lg1:flex justify-center">
                        <div
                          className="flex-1 flex flex-col items-center justify-center border border-gray-200 p-3 rounded-xl text-sm relative dark:border-currentFAQBackground sm:flex-row md:flex-col lg:flex-col"
                          style={{ height: "70px", width: "160px" }}
                        >
                          <span
                            className="absolute top-1/4 transform -translate-y-1/2 text-blue-800 dark:text-darkTextSecondary"
                            style={{ right: "55%" }}
                          >
                            Network
                          </span>
                          <div className="absolute bottom-2 left-2 mt-4 flex items-center">
                            <img
                              src={icplogo}
                              alt="Icp Logo"
                              className="w-6 h-6"
                            />
                            <span className="ml-2 text-base font-bold text-blue-800 dark:text-darkText">
                              ICP
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="lg1:hidden lg:flex justify-center">
                        <div className="flex-1 flex flex-col  justify-center border border-gray-200 p-3 rounded-xl text-sm  dark:border-currentFAQBackground sm:flex-row md:flex-col lg:flex-col">
                          <div className="flex gap-5">
                            <div className="flex items-center justify-center">
                              <p className="text-blue-800 dark:text-darkText">
                                Network
                              </p>
                            </div>

                            <div className="flex items-center ml-auto">
                              <img
                                src={icplogo}
                                alt="Icp Logo"
                                className="w-6 h-6"
                              />
                              <span className="ml-2 text-base font-bold text-blue-800 dark:text-darkText">
                                ICP
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      { }
                      <div className=" w-full flex justify-center">
                        <div
                          className=" flex-1 flex flex-col lg1:items-center md:place-items-start justify-center border border-gray-200 p-3 rounded-xl text-sm relative dark:border-currentFAQBackground"
                          style={{ height: "70px", width: "160px" }}
                        >
                          <button
                            className="text-blue-800 hover:text-gray-800 flex items-center -ml-4 dark:text-darkTextSecondary"
                            onClick={copyToClipboard}
                          >
                            <GrCopy className="h-5 w-4 ml-4 lg1:ml-0" />
                            <span className="ml-1">Copy Address</span>
                          </button>
                          <button
                            className="text-blue-800 hover:text-gray-800 flex items-center mt-2 dark:text-darkTextSeconday justify-start"
                            onClick={() => (window.location.href = "/faucet")}
                          >
                            <CiShare1 className="h-5 w-4 dark:text-darkText" />
                            <span className="ml-1 text-nowrap dark:text-darkTextSecondary">
                              Faucet Asset
                            </span>
                          </button>
                        </div>
                      </div>{" "}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!isHomeNav
          ? DASHBOARD_TOP_NAV_LINK.map((link, index) => {
            if (link.alwaysPresent) {
              return (
                <NavLink
                  key={index}
                  to={link.route}
                  className="text-[#2A1F9D] mt-5 p-3 font-bold text-sm dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2"
                  style={{ marginBottom: "0.25rem", marginTop: "0.25rem" }}
                  onClick={handleClose}
                >
                  {link.title}
                </NavLink>
              );
            } else if (isTestnetMode && link.testnet) {
              return (
                <React.Fragment key={index}>
                  <NavLink
                    to={link.route}
                    className="text-[#2A1F9D] mt-5 p-3 font-bold text-sm dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2"
                    style={{ marginBottom: "0.25rem", marginTop: "0.25rem" }}
                    onClick={handleClose}
                  >
                    {link.title}
                  </NavLink>
                  {link.title === "Faucet" && <>{ }</>}
                </React.Fragment>
              );
            } else if (!isTestnetMode && !link.testnet) {
              return (
                <NavLink
                  key={index}
                  to={link.route}
                  className="text-[#2A1F9D] mt-5 p-3 text-sm font-bold dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2"
                  style={{ marginBottom: "0.25rem", marginTop: "0.25rem" }}
                  onClick={handleClose}
                >
                  {link.title}
                </NavLink>
              );
            }
            return null;
          })
          : HOME_TOP_NAV_LINK.map((link, index) => (
            <NavLink
              key={index}
              target={link.target}
              to={link.route}
              className="text-[#2A1F9D] text-sm mt-5 p-3 font-bold dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2"
              style={{ marginBottom: "0.25rem", marginTop: "0.25rem" }}
              onClick={handleClose}
            >
              {link.title}
            </NavLink>
          ))}

        <h2 className="text-sm my-4 font-semibold text-[#AEADCB] dark:text-darkTextPrimary mb-2 mt-8">
          Settings
        </h2>
        <div className="p-2 dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 transition-colors duration-300 ease-in-out mx-2 my-1 text-sm">
          <div className="flex flex-col space-y-1 ">
            <div className="flex items-center justify-between">
              <label
                htmlFor="darkMode"
                className="ml-1 text-[#2A1F9D] dark:text-darkTextSecondary text-nowrap"
              >
                Dark Mode
              </label>
              <div className="flex items-center gap-3 text-[#2A1F9D] dark:text-darkTextSecondary">
                {isDarkMode ? "On" : "Off"}

                <div className="-mr-4">
                  <CustomizedSwitches
                    checked={isDarkMode}
                    onChange={handleDarkModeToggle}
                  />
                </div>
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex items-center justify-between text-sm">
                <label
                  htmlFor="testnetMode"
                  className="ml-1 text-[#2A1F9D] dark:text-darkTextSecondary text-nowrap"
                >
                  Testnet Mode
                </label>
                <div className="flex items-center gap-3 dark:text-darkTextSecondar">
                  {isTestnetMode ? "On" : "Off"}
                  <div className="-mr-4">
                    <CustomizedSwitches
                      checked={isTestnetMode}
                      onChange={handleTestnetModeToggle}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center relative group">
                <label
                  htmlFor="darkMode"
                  className="ml-1 text-[#2A1F9D] dark:text-darkTextSecondary text-nowrap"
                >
                  Sound
                </label>

                <Info size={16} className="ml-2 cursor-pointer" />

                <div className="absolute left-36 transform -translate-x-[40%] bottom-full mb-2 hidden group-hover:block items-center justify-center bg-gray-200 text-gray-800 text-xs rounded-md p-2 shadow-lg border border-gray-300 w-[30vw]">
                  Enabling this will allow the user to hear sound when supply,
                  borrow, repay, or withdraw functions are executed.
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#2A1F9D] dark:text-darkTextSecondary">
                {isSoundOn ? "On" : "Off"}

                <div className="-mr-4">
                  <CustomizedSwitches
                    checked={isSoundOn}
                    onChange={handleSoundToggle}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex align-center justify-center w-[93%] border-t-2 dark:border-gray-300/20 border-gray-500/25 mx-auto my-4 mb-5"></div>
        <div className="flex w-full align-center justify-center mb-2">
          <button
            type="button"
            className="w-[95%] bg-gradient-to-tr from-[#4C5FD8] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg p-[9px] px-8 shadow-sm shadow-[#00000040] font-medium text-[12px] h-auto z-10 opacity-100"
            onClick={handleTour}
          >
            Start Guide Tour
          </button>
        </div>
      </div>
      {isAuthenticated && (
        <div className="w-full flex flex-col lg1:flex-row justify-center  p-4  gap-3 bg-white dark:dark:bg-darkOverlayBackground">
          <Button
            title="Transfer"
            className=" z-20 py-3 px-9  focus:outline-none box bg-transparent  shadow-lg  text-sm rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white font-poppins"
            onClickHandler={toggleDropdown}
          />
          <Button
            title="Deposit"
            className=" z-20 py-3 px-9  focus:outline-none box bg-transparent  shadow-lg  text-sm rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white font-poppins"
            onClickHandler={toggleDepositDropdown}
          />

          <Button
            title="Switch Wallet"
            className=" z-20 py-3 px-9  focus:outline-none box bg-transparent  shadow-lg  text-sm rounded-lg bg-gradient-to-r from-orange-400 to-purple-700 bg-clip-text text-transparent dark:text-white font-poppins"
            onClickHandler={switchWallet}
          />
          <Button
            title="Disconnect"
            className="bg-gradient-to-tr from-[#E46E6E] from-20% to-[#8F1843] to-100% border-b-3 dark:border-darkBackground text-white dark:text-darkText rounded-lg py-3 px-9 shadow-lg text-sm font-poppins"
            onClickHandler={handleLogout}
          />
        </div>
      )}
      {isTransferDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsTransferDropDownOpen(false);
                setIsDropdownOpen(false);
                setReceiverAddress("");
                setAmount("");
                setIsApproved(false);
              }
            }}
          >
            <div className="w-[325px] lg1:w-[400px] absolute bg-white shadow-xl rounded-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 px-6 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
              <div className="flex justify-between items-center">
                <h1 className="font-semibold text-xl">Transfer</h1>
                <button
                  onClick={() => setIsTransferDropDownOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-5 text-sm">
                <div className="w-full">
                  <div className="w-full flex justify-between my-2">
                    <h1>Amount</h1>
                  </div>
                  <div className="w-full flex justify-between bg-gray-100 hover:bg-gray-200 cursor-pointer px-2 py-2 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                    <div className="flex flex-col items-start w-[45%] lg:gap-[2rem] gap-[2.5rem]">
                      <input
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        disabled={supplyBalance === 0 || isApproved}
                        className="lg:text-lg placeholder:text-sm lg:placeholder:text-md focus:outline-none px-2 py-1 bg-gray-100 rounded-md w-full dark:bg-darkBackground/5 dark:text-darkText"
                        placeholder={`Enter Amount `}
                      />
                      <p className="text-[12px] text-gray-500 -mb-1"></p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="w-auto flex gap-2 items-center">
                        <div className="relative">
                          <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 focus:outline-none"
                          >
                            {asset && (
                              <img
                                src={AssetImages[assets.indexOf(asset)]}
                                alt={asset}
                                className="object-fill w-6 h-6 rounded-full"
                              />
                            )}
                            <span className="text-lg">{asset}</span>
                            <svg
                              className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                                }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                              ></path>
                            </svg>
                          </button>

                          {isDropdownOpen && (
                            <div
                              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                              onClick={(e) => {

                                if (e.target === e.currentTarget) {
                                  setIsDropdownOpen(false);
                                }
                              }}
                            >
                              <div className="absolute right-[40px]  mt-20 w-48 origin-top-right  bg-white dark:bg-darkOverlayBackground border dark:border-gray-600  border-gray-300 rounded-xl shadow-md z-10">
                                <div className="py-1">
                                  {assets.map((a) => {
                                    const assetIndex = assets.indexOf(a);

                                    return (
                                      <button
                                        key={a}
                                        className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-darkBackground/10"
                                        onClick={() => {

                                          if (a !== asset) {
                                            setAmount("");
                                          }
                                          setAsset(a);
                                          setIsDropdownOpen(false);
                                        }}
                                      >

                                        {assetIndex !== -1 &&
                                          AssetImages[assetIndex] && (
                                            <img
                                              key={assetIndex}
                                              src={AssetImages[assetIndex]}
                                              alt={a || "asset"}
                                              className="rounded-full w-5 h-5 mt-1"
                                            />
                                          )}

                                        <span>{a}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-[11px] text-gray-500 text-right w-full font-semibold">
                          Wallet Balance:
                        </p>
                        <div className="flex gap-1 items-center">
                          <p className="text-[12px] text-gray-500 -mb-[3px]">
                            {truncateToEightDecimals(supplyBalance)}
                          </p>
                          <p
                            className={`text-[12px] px-2 py-0 rounded-md button1 ${supplyBalance === 0 || isApproved
                              ? "text-gray-400 cursor-not-allowed"
                              : "cursor-pointer bg-blue-100 dark:bg-gray-700/45"
                              }`}
                            onClick={() => {
                              if (supplyBalance > 0 && !isApproved) {
                                handleMaxClick();
                              }
                            }}
                          >
                            Max
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <div className="w-full flex items-center my-2">
                    <h1>Receiver Principal Address</h1>
                    <span className="relative cursor-pointer ">
                      <span className="group inline-flex ml-1 mt-1">
                        <Info
                          size={14}
                          className="text-[#233D63] dark:text-darkText dark:opacity-50"
                        />
                        <div className="absolute left-1/4 transform -translate-x-1/2 bottom-full mb-2 bg-[#fcfafa] px-4 py-2 dark:bg-darkOverlayBackground dark:text-darkText rounded-xl shadow-xl ring-1 ring-black/10 dark:ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity text-gray-800 text-xs w-[15rem] pointer-events-none">
                          Only Principal IDs are accepted here.
                        </div>
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                    <input
                      type="text"
                      value={receiverAddress}
                      onChange={handleReceiverChange}
                      disabled={supplyBalance === 0 || isApproved}
                      className="w-full text-sm lg:text-base placeholder:text-sm placeholder:opacity-70 px-2 py-1 bg-transparent focus:outline-none dark:text-darkText"
                      placeholder="Enter Receiver Address"
                    />
                  </div>
                </div>

                <div className="w-full mt-3">
                  {amount > 0 && amount > supplyBalance && (
                    <div className="bg-[#BA5858] p-2 rounded-lg my-2">
                      <div className="text-white text-[12px]">
                        Insufficient wallet balance to transfer {asset}.
                      </div>
                    </div>
                  )}

                  {supplyBalance <= 0 && (
                    <div className="bg-[#BA5858] p-2 rounded-lg my-2">
                      <div className="text-white text-[12px]">
                        You do not have any {asset} in your wallet for
                        transferring. Please deposit {asset} before attempting
                        to transfer.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 mt-4">
                    <button
                      onClick={() => !isApproved && handleClick()}
                      className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${isApproved ||
                        isLoading ||
                        amount <= 0 ||
                        supplyBalance <= 0 ||
                        amount > supplyBalance
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                        }`}
                      disabled={
                        isApproved ||
                        isLoading ||
                        amount <= 0 ||
                        supplyBalance <= 0 ||
                        amount > supplyBalance
                      }
                    >
                      Approve {asset} to continue
                    </button>

                    <button
                      onClick={() => isApproved && handleClick()}
                      className={`bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] w-full text-white rounded-md p-2 px-4 shadow-md font-semibold text-sm flex justify-center items-center ${!isApproved ||
                        isLoading ||
                        amount <= 0 ||
                        supplyBalance <= 0 ||
                        amount > supplyBalance
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                        }`}
                      disabled={
                        !isApproved ||
                        isLoading ||
                        amount <= 0 ||
                        supplyBalance <= 0 ||
                        amount > supplyBalance
                      }
                    >
                      Transfer
                    </button>
                  </div>

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
          </div>
        </>
      )}

      {showDepositPopup && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDepositPopup(false);
              }
            }}
          >
            <div className="w-[325px] lg1:w-[400px] absolute bg-white shadow-xl rounded-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 px-6 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText z-50">
              <div className="flex justify-between items-center">
                <h1 className="font-semibold text-xl">Deposit</h1>
                <button
                  onClick={() => setShowDepositPopup(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-5 text-sm">
                <div className="w-full">
                  <div className="w-full flex justify-between my-2">
                    <h1>Receiver Address</h1>
                  </div>
                  <div className="w-full flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                    <textarea
                      value={principal}
                      readOnly
                      rows={2}
                      className="w-full resize-none text-[13px] lg:text-[13px] placeholder:text-sm placeholder:opacity-70 px-1 py-1 bg-transparent focus:outline-none dark:text-darkText"
                    />
                    <GrCopy
                      className="h-5 w-4 ml-4 lg1:ml-6 cursor-pointer text-gray-600 hover:text-gray-800 dark:text-darkText"
                      onClick={() => {
                        navigator.clipboard.writeText(principal);
                        toast.dismiss();
                        toast.success(`Principal Coppied !`, {
                          className: "custom-toast",
                          position: "top-center",
                          autoClose: 3000,
                          hideProgressBar: false,
                          closeOnClick: true,
                          pauseOnHover: true,
                          draggable: true,
                          progress: undefined,
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="w-full flex justify-between my-2">
                    <h1>Account Id</h1>
                  </div>
                  <div className="w-full flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md dark:bg-darkBackground/30 dark:text-darkText">
                    <textarea
                      value={accountIdString}
                      readOnly
                      rows={2}
                      className="w-full resize-none text-[10px] lg:text-[13px] placeholder:text-sm placeholder:opacity-70 px-1 py-1 bg-transparent focus:outline-none dark:text-darkText"
                    />
                    <GrCopy
                      className="h-5 w-4 ml-4 lg1:ml-6 cursor-pointer text-gray-600 hover:text-gray-800 dark:text-darkText"
                      onClick={() => {
                        navigator.clipboard.writeText(accountIdString);
                        toast.dismiss();
                        toast.success(`Account Id  Coppied !`, {
                          className: "custom-toast",
                          position: "top-center",
                          autoClose: 3000,
                          hideProgressBar: false,
                          closeOnClick: true,
                          pauseOnHover: true,
                          draggable: true,
                          progress: undefined,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default MobileTopNav;
