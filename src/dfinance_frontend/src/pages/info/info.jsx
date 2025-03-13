import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/useAuthClient";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/CKETH.svg";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import { ExternalLink } from "lucide-react";
import Error from "../Error";
import useFormatNumber from "../../components/customHooks/useFormatNumber";
import emailjs from "emailjs-com";
import useAssetData from "../../components/customHooks/useAssets";
import useFetchConversionRate from "../../components/customHooks/useFetchConversionRate";
import useFetchBalanceBackend from "../../components/customHooks/useFetchBalanceBackend";
import MiniLoader from "../../components/Common/MiniLoader";
import { Doughnut, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { idlFactory } from "../../../../declarations/debttoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/dtoken";
import { useSelector } from "react-redux";
import { Principal } from "@dfinity/principal";
import WalletModal from "../../components/Dashboard/WalletModal";
import useUserData from "../../components/customHooks/useUserData";
import FreezeCanisterPopup from "../../components/Dashboard/DashboardPopup/CanisterDrainPopup";
ChartJS.register(ArcElement, Tooltip);

/**
 * This component displays various statistics related to users, cycles, reserves, and interest accrued.
 * It also monitors cycle and token thresholds and sends email notifications if thresholds are breached.
 *
 * @returns {JSX.Element} - Returns the DashboardCards component.
 */
const DashboardCards = () => {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */
  const { backendActor, isAuthenticated,fetchReserveData,
    createLedgerActor, } = useAuth();
  const {
   
    isFreezePopupVisible,
    setIsFreezePopupVisible,
  } = useUserData();
  const navigate = useNavigate();
  const formatNumber = useFormatNumber();

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
  } = useFetchConversionRate();

  const {
    ckBTCBalance,
    ckETHBalance,
    ckUSDCBalance,
    ckICPBalance,
    ckUSDTBalance,
    fetchBalance,
  } = useFetchBalanceBackend();

  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */
  const [searchQuery, setSearchQuery] = useState("");
  const [like, setLike] = useState(false);
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [threshold] = useState(5000000000000);
  const [tokenThreshold] = useState(10000);
  const [users, setUsers] = useState([]);
  const [lastEmailDate, setLastEmailDate] = useState(null);
  const [lastExhaustedEmailDate, setLastExhaustedEmailDate] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [assetBalance, setAssetBalances] = useState([]);
  const { isSwitchingWallet } = useSelector((state) => state.utility);
  const radioRefs = {};
  const [filteredData, setFilteredData] = useState(null);
  const [userAccountData, setUserAccountData] = useState({});
  const [healthFactors, setHealthFactors] = useState({});

  /* ===================================================================================
   *                                  EFFECTS & FUNCTIONS
   * =================================================================================== */
  useEffect(() => {
    fetchBalance("ckBTC");
    fetchBalance("ckETH");
    fetchBalance("ckUSDC");
    fetchBalance("ICP");
    fetchBalance("ckUSDT");
  }, [fetchBalance]);

  const assetRates = {
    ckETH: ckETHUsdRate,
    ckBTC: ckBTCUsdRate,
    ckUSDC: ckUSDCUsdRate,
    ICP: ckICPUsdRate,
    ckUSDT: ckUSDTUsdRate,
  };

  const assetBalances = {
    ckETH: ckETHBalance,
    ckBTC: ckBTCBalance,
    ckUSDC: ckUSDCBalance,
    ICP: ckICPBalance,
    ckUSDT: ckUSDTBalance,
  };

  const [healthStats, setHealthStats] = useState({
    lessThanOne: 0,
    greaterThanOne: 0,
    infinity: 0,
  });

  /**
   * Checks the controller status from the backend.
   */
  const checkControllerStatus = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.to_check_controller();
      console.log("Controller Status:", result);
      setLike(result);
    } catch (err) {
      console.error("Error fetching controller status:", err);
      setError("Failed to fetch controller status");
    }
  };

  useEffect(() => {
    checkControllerStatus();
  }, [backendActor]);

  const [cardData, setCardData] = useState([
    { title: "Users", value: "Loading...", link: "/users" },
    { title: "Cycles", value: "5678", link: "/cycles" },
    { title: "Interest Accured", value: "5678", link: "/interest accured" },
    { title: "Reserves", value: "5", link: "/pools", assets: [] },
  ]);

  const { filteredItems, interestAccure ,assets } = useAssetData(searchQuery);

  const poolAssets = [
    { name: "ckBTC", imageUrl: ckBTC },
    { name: "ckETH", imageUrl: ckETH },
    { name: "ckUSDC", imageUrl: ckUSDC },
    { name: "ckUSDT", imageUrl: ckUSDT },
    { name: "ICP", imageUrl: icp },
  ];
  console.log("interestAccure", interestAccure);

  const handleViewMore = () => {
    navigate("/2a45fg/health-factor-list");
  };
  const getAllUsers = async () => {
    if (!backendActor) {
      console.error("Backend actor not initialized");
      return;
    }
    try {
      const allUsers = await backendActor.get_all_users();
      console.log("Retrieved Users:", allUsers);

      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    getAllUsers();
  }, []);

  /**
   * Fetches the current cycle count from the backend.
   */
  const getCycles = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
  
    const response = await backendActor.cycle_checker();
    console.log("Raw response from cycle_checker:", response);
  
    // Extract value from response
    const cycles = response.Ok ?? "Error retrieving cycles";
    console.log("Extracted cycle value:", cycles);
  
    return cycles.toString();
  };
  /**
   * Sends email notifications when cycle or token thresholds are breached.
   * @param {string} subject - Email subject.
   * @param {string} htmlMessage - Email body.
   */
  const sendEmailNotification = async (subject, htmlMessage) => {
    try {
      const templateParams = {
        to_name: "Admin",
        subject,
        message: htmlMessage,
      };

      await emailjs.send(
        "service_7pu7uvh",
        "template_1k2eq7a",
        templateParams,
        "uWDc83b20aMxTTyrz"
      );

      console.log("Email sent successfully.");
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  };

  let emailInterval;
  let lastExhaustedEmailTimestamp = 0;
  let lastWarningEmailTimestamp = 0;

  /**
   * Handles cycle-based notifications and sends warning or exhaustion emails.
   * @param {number} currentCycles - The current number of cycles.
   */
  const handleNotification = (currentCycles, assetBalance) => {
    const oneDay = 24 * 60 * 60 * 1000;
    console.log("Handling notification for cycles:", currentCycles);

    const sendWarningEmail = async () => {
      const htmlMessage = `
    Your cycles are close to the threshold value. Please renew your cycles to avoid interruption.
   Current Cycles: ${formatNumber(currentCycles)}
   Threshold : ${formatNumber(threshold + 2000000000000)}
    `;
      try {
        console.log("Sending warning email...");
        await sendEmailNotification("Cycle Warning", htmlMessage);
        lastWarningEmailTimestamp = Date.now();
      } catch (error) {
        console.error("Failed to send warning email:", error);
      }
    };

    const sendExhaustedEmail = async () => {
      const htmlMessage = `
      Your cycles are exhausted! Please renew your cycles immediately to continue services.
      Current Cycles: ${formatNumber(currentCycles)}
      Threshold: ${formatNumber(threshold)}
    `;
      try {
        console.log("Sending exhausted email...");
        await sendEmailNotification("Cycle Exhausted", htmlMessage);
        lastExhaustedEmailTimestamp = Date.now();
      } catch (error) {
        console.error("Failed to send exhausted email:", error);
      }
    };

    if (emailInterval) {
      console.log("Clearing previous interval...");
      clearInterval(emailInterval);
    }

    emailInterval = setInterval(async () => {
      console.log("Interval triggered. Checking conditions...");
      console.log("currentCycles", currentCycles);
      console.log("threshold", threshold);
      if (currentCycles <= threshold) {
        console.log("Cycles are exhausted. Sending exhausted email...");
        await sendExhaustedEmail();
      } else if (
        currentCycles > threshold &&
        currentCycles < threshold + 2000000000000
      ) {
        console.log(
          "Cycles are nearing the safe threshold. Sending warning email..."
        );
        await sendWarningEmail();
      }
    }, oneDay);
  };
  const fetchAssetData = async () => {
    const balances = {};

    await Promise.all(
      users.map(async ([principal, userData]) => {
        if (!principal) return; 

        const userBalances = {};

        await Promise.all(
          assets.map(async (asset) => {
            const reserveDataForAsset = await fetchReserveData(asset);
            console.log("reserveDataForAsset", reserveDataForAsset);
            const dtokenId = reserveDataForAsset?.Ok?.d_token_canister?.[0];
            const debtTokenId =
              reserveDataForAsset?.Ok?.debt_token_canister?.[0];
            console.log("dtokenId", dtokenId);
            const assetBalance = {
              dtokenBalance: null,
              debtTokenBalance: null,
            };

            try {
              const formattedPrincipal = Principal.fromText(
                principal.toString()
              );
              const account = { owner: formattedPrincipal, subaccount: [] };

             
              if (dtokenId) {
                const dtokenActor = createLedgerActor(dtokenId, idlFactory);
                if (dtokenActor) {
                  const balance = await dtokenActor.icrc1_balance_of(account);
                  assetBalance.dtokenBalance = Number(balance);
                }
              }

             
              if (debtTokenId) {
                const debtTokenActor = createLedgerActor(
                  debtTokenId,
                  idlFactory1
                );
                if (debtTokenActor) {
                  const balance = await debtTokenActor.icrc1_balance_of(
                    account
                  );
                  assetBalance.debtTokenBalance = Number(balance);
                }
              }
            } catch (error) {
              console.error(`Error processing balances for ${asset}:`, error);
            }

           
            userBalances[asset] = assetBalance;
          })
        );

        
        balances[principal] = userBalances;
      })
    );

    
    setAssetBalances(balances);
  };
  // Simulate cycle updates
  const onCycleUpdate = async () => {
    try {
      const newCycles = await getCycles(); // Await cycle retrieval
      console.log("Cycle count updated:", newCycles);
  
      handleTokenNotification(newCycles);
    } catch (error) {
      console.error("Error fetching cycles:", error);
    }
  };
  
  useEffect(() => {
    if (users.length > 0) {
      fetchAssetData();
    }
  }, [users, assets]);
  let lastTokenExhaustedEmailTimestamp = 0;
  let lastTokenWarningEmailTimestamp = 0;
  let emailinterval = null;

  /**
   * Handles token balance-based notifications and sends warning or exhaustion emails.
   * @param {string} assetName - Name of the asset.
   * @param {number} assetBalance - Current asset balance.
   */
  const handleTokenNotification = (assetName, assetBalance) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const currentTime = Date.now();

    console.log(`Handling token notification for ${assetName}:`, assetBalance);

    const sendTokenWarningEmail = async () => {
      const htmlMessage = `
      Your balance of ${assetName} is approaching the threshold. Please mint  ${assetName} above threshold value .
      Current Balance: ${formatNumber(assetBalance)}
      Threshold: ${formatNumber(tokenThreshold)}
    `;
      try {
        console.log("Sending token warning email...");
        await sendEmailNotification(`${assetName} Warning`, htmlMessage);
        lastTokenWarningEmailTimestamp = currentTime;
      } catch (error) {
        console.error("Failed to send token warning email:", error);
      }
    };

    const sendTokenExhaustedEmail = async () => {
      const htmlMessage = `
      Your balance of ${assetName} is exhausted!  Please mint  ${assetName} above threshold value.
      Current Balance: ${formatNumber(assetBalance)}
      Threshold: ${formatNumber(tokenThreshold)}
    `;
      try {
        console.log("Sending token exhausted email...");
        await sendEmailNotification(`${assetName} Exhausted`, htmlMessage);
        lastTokenExhaustedEmailTimestamp = currentTime;
      } catch (error) {
        console.error("Failed to send token exhausted email:", error);
      }
    };

    if (emailinterval) {
      console.log("Clearing previous interval...");
      clearInterval(emailinterval);
    }

    emailInterval = setInterval(async () => {
      console.log("Interval triggered. Checking conditions...");
      console.log("assetBalance", assetBalance);
      console.log("tokenThreshold", tokenThreshold);

      if (assetBalance <= tokenThreshold) {
        console.log("Token balance is exhausted. Sending exhausted email...");
        await sendTokenExhaustedEmail();
      } else if (
        assetBalance > tokenThreshold &&
        assetBalance < tokenThreshold + 1000
      ) {
        console.log(
          "Token balance is nearing the safe threshold. Sending warning email..."
        );
        await sendTokenWarningEmail();
      }
    }, oneDay);
  };

  const pieData = {
    datasets: [
      {
        data: [
          healthStats.lessThanOne,
          healthStats.greaterThanOne,
          healthStats.infinity,
        ],
        backgroundColor: ["#EF4444", "#22C55E", "#EAB308"],
        hoverBackgroundColor: ["#EF4444", "#22C55E", "#EAB308"],

        borderColor: "#ffffff",
        borderWidth: 3,
        cutout: "70%",
        hoverOffset: 6,
      },
    ],
  };

  // Function to handle token balances
  const handleTokenBalances = () => {
    poolAssets.forEach((asset) => {
      const assetBalance = assetBalances[asset.name];
      if (assetBalance !== undefined) {
        handleTokenNotification(asset.name, assetBalance);
      }
    });
  };

  useEffect(() => {
    handleTokenBalances();
  }, [assetBalances, tokenThreshold]);

  const onTokenUpdate = (newBalance) => {
    console.log("Cycle count updated:", newBalance);
    handleNotification(newBalance);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!users.length) return;
      setLoading(true);

      try {
        const cycles = await getCycles();
        const usersCount = users.length;
        const formattedData = [
          { title: "Users", value: usersCount, link: "/users" },
          { title: "Cycles", value: formatNumber(cycles), link: "/cycles" },
          { title: "Interest Accured", value: interestAccure, link: "/cycles" },
          {
            title: "Reserves",
            value: "5",
            link: "/pools",
            assets: poolAssets,
          },
        ];

        setCardData(formattedData);
        await handleNotification(Number(cycles));
        await onCycleUpdate(Number(cycles));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [users, interestAccure]);
  const cachedData = useRef({});

  //  Fetch and cache user account data
  const fetchUserAccountDataWithCache = async (principal) => {
    if (backendActor && isAuthenticated) {
       // Start loading indicator
  
      // Convert the principal to a string for usage in the assetBalances object
      const principalString = principal.toString();
  
      // Log assetBalances before proceeding to check if data is available for this principal
      console.log("assetBalances before function:", assetBalance[principalString]);
  
      const userBalance = assetBalance[principalString];
      if (!userBalance) {
        console.error("userBalance is undefined or not available for principal:", principalString);
         // Stop loading indicator
        return; // Exit the function if userBalance is not available
      }
      console.log("userBalance before function:", userBalance);
  
      // Check if the data is already cached for this principal
      if (cachedData.current[principalString]) {
        setUserAccountData((prev) => ({
          ...prev,
          [principalString]: cachedData.current[principalString],
        }));
         // Stop loading indicator
        return;
      }
  
      try {
        if (!principalString || cachedData.current[principalString]) return;
  
        const principalObj = Principal.fromText(principalString);
  
        // Log the state of assetBalances and userBalance for debugging
        console.log("assetBalances for principal", principalString, ":", assetBalance);
        console.log("assetBalances[principal]:", assetBalance[principalString]);
        console.log("userBalance for principal:", userBalance);
  
        // Ensure userBalance exists for the given principal
        if (!userBalance) {
          console.error("No data found for userBalance for this principal:", principalString);
          
          return; // Exit if userBalance is still not found
        }
  
        // Find the user by principal in the users array
        const user = users.find(
          ([userPrincipal]) => userPrincipal.toString() === principalString
        );
  
        if (user) {
          const userInfo = user[1]; // The second element of the array (user info)
          console.log("userInfo", userInfo);
  
          // Access reserves array
          const reserves = userInfo?.reserves?.flat() || [];
          console.log("reserves:", reserves);
  
          let assetBalancesObj = [];
          let borrowBalancesObj = [];
  
          // Loop through each reserve entry to fetch the asset and balance info
          reserves.forEach(([asset, assetInfo]) => {
            console.log("assetInfo:", assetInfo);
  
            // Extract asset balance and borrow balance for each asset in the reserves
            const assetBalances = BigInt(userBalance?.[asset]?.dtokenBalance || 0);
            const borrowBalances = BigInt(userBalance?.[asset]?.debtTokenBalance || 0);
  
            // Log assetBalance and borrowBalance for debugging
            console.log(`assetBalance for ${asset}:`, assetBalances);
            console.log(`borrowBalance for ${asset}:`, borrowBalances);
  
            // Only include non-zero balances for asset and borrow
            if (assetBalances > 0n) {
              assetBalancesObj.push({
                balance: assetBalances,
                name: asset,
              });
            }
            if (borrowBalances > 0n) {
              borrowBalancesObj.push({
                balance: borrowBalances,
                name: asset,
              });
            }
          });
  
          console.log("Asset Balances Set:", assetBalancesObj);
          console.log("Borrow Balances Set:", borrowBalancesObj);
  
          const assetBalancesParam = assetBalancesObj.length > 0 ? [assetBalancesObj] : [];
          const borrowBalancesParam = borrowBalancesObj.length > 0 ? [borrowBalancesObj] : [];
  
          // Call backend with separate sets for asset and borrow balances
          const result = await backendActor.get_user_account_data(
            [principalObj], // Pass the principal (empty array for the first parameter)
            assetBalancesParam, // Pass asset balances wrapped in an array
            borrowBalancesParam // Pass borrow balances wrapped in an array
          );
  
          console.log("Backend result:", result);
  
          if (result?.Err === "ERROR :: Pending") {
            console.warn("Pending state detected. Retrying...");
            setTimeout(() => fetchUserAccountDataWithCache(principal), 1000);
            return;
          }
  
          // Store the result in cache and update user account data
          if (result?.Ok) {
            cachedData.current[principalString] = result;
            setUserAccountData((prev) => ({
              ...prev,
              [principalString]: result,
            }));
          }
        } else {
          console.error("User not found for principal:", principalString);
        }
      } catch (error) {
        console.error("Error fetching user account data:", error.message);
      } finally {
         // Stop loading indicator
      }
    }
  };

  //  Fetch all user data in parallel, ensuring cache usage
  useEffect(() => {
    if (!users || users.length === 0) return;
  
    // Fetch user account data for each user concurrently using Promise.all
    Promise.all( 
      users.map(([principal]) => {
        if (principal) return fetchUserAccountDataWithCache(principal); // Call for each user
        return null;
      })
    )
      .then(() => console.log("All user account data fetched"))
      .catch((error) =>
        console.error("Error fetching user account data in batch:", error)
      ); 
    
  }, [users, assetBalance]);

  useEffect(() => {
    if (!userAccountData || Object.keys(userAccountData).length === 0) return;

    const updatedHealthFactors = {};

    Object.entries(userAccountData).forEach(([principal, data]) => {
      if (data?.Ok && Array.isArray(data.Ok) && data.Ok.length > 4) {
        updatedHealthFactors[principal] = Number(data.Ok[4]) / 10000000000;
      } else {
        updatedHealthFactors[principal] = null;
      }
    });

    console.log(
      " Updated Health Factors (Divided by 1e8):",
      updatedHealthFactors
    );
    setHealthFactors(updatedHealthFactors);
  }, [userAccountData]);

  //  Extract and update Health Factor statistics
  useEffect(() => {
    if (!healthFactors || Object.keys(healthFactors).length === 0) return;
    let lessThanOne = 0,
      greaterThanOne = 0,
      infinity = 0;
    Object.values(healthFactors).forEach((factor) => {
      if (factor === "Infinity" || factor > 100) {
        infinity++;
      } else if (!isNaN(Number(factor)) && Number(factor) < 1) {
        lessThanOne++;
      } else if (!isNaN(Number(factor))) {
        greaterThanOne++;
      }
    });

    setHealthStats({ lessThanOne, greaterThanOne, infinity });
  }, [healthFactors]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const getCycleColor = (value) => {
    const cycleValue = parseInt(value);
    if (cycleValue < formatNumber(threshold)) {
      return "text-red-500";
    } else if (cycleValue >= threshold && cycleValue <= threshold * 1.1) {
      return "text-orange-500";
    } else {
      return "text-green-500";
    }
  };

  poolAssets.forEach((asset) => {
    radioRefs[asset.name] = React.createRef();
  });

  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showPopup]);

  const handleAssetSelection = (asset) => {
    setShowPopup(false);
    console.log("filteredItems", filteredItems);
    console.log("selected asset", asset);
    const filteredData = filteredItems.filter((item) => item[0] === asset.name);
    console.log("filteredData", filteredData);
    setFilteredData(filteredData);
    setTimeout(() => {
      setSelectedAsset(asset);
      setShowPopup(true);
    }, 0);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedAsset(null);
    setFilteredData(null);
    Object.values(radioRefs).forEach((ref) => {
      if (ref.current) {
        ref.current.checked = false;
      }
    });
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
  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <>
      {loading ? (
        <div className="h-[150px] flex justify-center items-center">
          <MiniLoader isLoading={true} />
        </div>
      ) : like ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-14 px-5 mt-16">
          {/*  Users Card */}
          {cardData
            .filter((card) => card.title === "Users")
            .map((card, index) => (
              <div
                key={index}
                className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63] dark:text-darkTextSecondary1 rounded-xl shadow-lg px-4 py-3 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow duration-300"
              >
                <h3 className="text-xl font-semibold mt-2 ">{card.title}</h3>
                <p className="text-4xl font-bold mb-3.5 mt-2 text-[#233D63] dark:text-darkText">
                  {card.value}
                </p>

                {/*  Users Card: View Analytics Button */}
                {!loading && (
                  <a
                    href="https://analytics.google.com/analytics/web/#/analysis/p472242742/edit/5FJVJVVVSzm_gOhVztd31w"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 mb-14 flex items-center text-[#233D63] hover:dark:text-darkText dark:text-darkTextSecondary hover:text-[#070d15] text-sm"
                  >
                    Open Analytics{" "}
                    <ExternalLink
                      className="ml-1"
                      size={16}
                      dark:color="#87CEEB"
                      color="#4169E1"
                    />
                  </a>
                )}
              </div>
            ))}

          {/*  Health Factor Card */}
          <div className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63] dark:text-darkTextSecondary1 rounded-xl shadow-lg px-4 py-3 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow duration-300 relative">
            <button
              onClick={handleViewMore}
              className="absolute top-2 right-2  text-white rounded-md px-2 py-0.5 text-xs  hover:bg-opacity-80 transition"
            >
              More
            </button>

            <h3 className="text-xl font-semibold text-center mb-3 mt-5">
              Health Factor
            </h3>

            <div className="flex justify-between items-center w-full">
              <div className="flex flex-col space-y-1 pl-4">
                <div className="flex items-center">
                  <div className="w-10 h-4 bg-red-500 border border-white rounded-md"></div>
                  <span className="ml-2 text-sm text-gray-100">&lt; 1</span>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-4 bg-green-500 border border-white rounded-md"></div>
                  <span className="ml-2 text-sm text-gray-100">&gt; 1</span>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-4 bg-yellow-500 border border-white rounded-md"></div>
                  <span className="ml-2 text-sm text-gray-100">Infinity</span>
                </div>
              </div>

              {/*  Right Side - Pie Chart */}
              <div className="w-40 h-26 pr-2">
                <Doughnut
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: true },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/*  Reserves Card */}
          {cardData
            .filter((card) => card.title === "Reserves")
            .map((card, index) => (
              <div
                key={index}
                className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63] dark:text-darkTextSecondary1 rounded-xl shadow-lg px-4 py-3 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow duration-300"
              >
                <h3 className="text-xl font-semibold  mt-2.5">{card.title}</h3>
                <p className="text-4xl font-bold mb-3 mt-2.5 text-[#233D63] dark:text-darkText">
                  {card.value}
                </p>

                {/*  Asset Selection */}
                {!loading && (
                  <div className="mt-2.5 mb-14 flex flex-wrap justify-center gap-6">
                    {card.assets.map((asset, idx) => (
                      <label
                        key={idx}
                        className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="asset"
                          className="visible"
                          ref={radioRefs[asset.name]}
                          onChange={() => handleAssetSelection(asset)}
                        />
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-6 h-6 object-cover rounded-full border-2 border-transparent checked:border-blue-500 ml-1"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/*  Interest Accrued Card */}
          {cardData
            .filter((card) => card.title === "Interest Accured")
            .map((card, index) => (
              <div
                key={index}
                className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63] dark:text-darkTextSecondary1 rounded-xl shadow-lg px-4 py-3 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow duration-300"
              >
                <h3 className="text-xl font-semibold mt-1.5 ">{card.title}</h3>
                <p className="text-4xl font-bold mb-5 mt-2 text-[#233D63] dark:text-darkText">
                  <span className="font-normal">$</span>
                  {card.value}
                </p>
              </div>
            ))}

          {/*  Cycles Card */}
          {cardData
            .filter((card) => card.title === "Cycles")
            .map((card, index) => (
              <div
                key={index}
                className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63] dark:text-darkTextSecondary1 rounded-xl shadow-lg px-4 py-3 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow duration-300"
              >
                <h3 className="text-xl font-semibold mt-5">{card.title}</h3>
                <p
                  className={`text-4xl font-bold mt-2 ${
                    loading
                      ? "text-[#233D63] dark:text-darkText"
                      : getCycleColor(card.value)
                  }`}
                >
                  {loading ? <MiniLoader isLoading={true} /> : card.value}
                </p>

                {/*  Threshold for Cycles */}
                {!loading && (
                  <p className="text-sm mt-3 text-[#233D63] dark:text-darkTextSecondary">
                    Threshold Value: {formatNumber(threshold)}
                  </p>
                )}
              </div>
            ))}
          {showPopup && selectedAsset && (
            <div
              key={selectedAsset.name}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
              onClick={closePopup}
            >
              <div
                className="bg-[#fcfafa] shadow-xl ring-1 ring-black/10 dark:ring-white/20 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 rounded-lg p-6 w-80"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={selectedAsset.imageUrl}
                    alt={selectedAsset.name}
                    className="w-8 h-8 object-contain"
                  />
                  <h3 className="text-lg font-bold">{selectedAsset.name}</h3>
                </div>
                <div>
                  {filteredData && filteredData.length > 0 ? (
                    <ul>
                      {filteredData.map((data, idx) => {
                        console.log("data", data[1]?.Ok?.asset_supply);
                        const assetName = data[0];
                        const assetRate = assetRates[assetName];
                        const assetBalance = assetBalances[assetName];
                        if (!assetRate) {
                          return (
                            <li key={idx} className="mb-2">
                              <p>Rate not available for {assetName}</p>
                            </li>
                          );
                        }

                        return (
                          <li key={idx} className="mb-2">
                            <p className="font-normal text-sm">
                              Total Supplied:{" "}
                              <span className="font-bold">
                                $
                                {(
                                  (Number(data[1]?.Ok?.asset_supply) / 1e8) *
                                  (assetRate / 1e8)
                                ).toFixed(8)}
                              </span>
                            </p>
                            {"  "}
                            <p className="font-normal text-sm">
                              Total Borrowed:{" "}
                              <span className="font-bold">
                                $
                                {(
                                  (Number(data[1]?.Ok?.asset_borrow) / 1e8) *
                                  (assetRate / 1e8)
                                ).toFixed(8)}
                              </span>
                            </p>
                            {"  "}

                            <div className="flex align-center justify-center border-t-2 dark:border-gray-300/20 border-gray-500/25 mx-auto my-4 mb-5"></div>
                            <h3 className="mb-1 text-[#233D63]  dark:text-darkTextSecondary1">
                              Testnet
                            </h3>
                            <p className="font-normal text-sm">
                              Token Available:{" "}
                              <span className="font-bold">
                                {Number(assetBalance).toFixed(2)}
                              </span>
                            </p>
                            <p className="font-normal text-sm">
                              Token Threshold:{" "}
                              <span className="font-bold">
                                {Number(tokenThreshold)}
                              </span>
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p>No data available for this asset.</p>
                  )}
                </div>
                <button
                  className="mt-4 w-full bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-lg shadow-md px-7 py-2  text-[14px] font-semibold"
                  onClick={() => setShowPopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
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
      ) : (
        <Error />
      )}
    </>
  );
};

export default DashboardCards;
