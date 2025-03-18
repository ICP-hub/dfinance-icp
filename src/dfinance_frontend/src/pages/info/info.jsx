import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/useAuthClient";
import pLimit from "p-limit";
import ckBTC from "../../../public/assests-icon/ckBTC.png";
import ckETH from "../../../public/assests-icon/CKETH.svg";
import ckUSDC from "../../../public/assests-icon/ckusdc.svg";
import ckUSDT from "../../../public/assests-icon/ckUSDT.svg";
import icp from "../../../public/assests-icon/ICPMARKET.png";
import { ExternalLink } from "lucide-react";
import { idlFactory } from "../../../../declarations/debttoken";
import { idlFactory as idlFactory1 } from "../../../../declarations/dtoken";
import Error from "../Error";
import useFormatNumber from "../../components/customHooks/useFormatNumber";
import emailjs from "emailjs-com";
import useAssetData from "../../components/customHooks/useAssets";
import useFetchConversionRate from "../../components/customHooks/useFetchConversionRate";
import useFetchBalanceBackend from "../../components/customHooks/useFetchBalanceBackend";
import MiniLoader from "../../components/Common/MiniLoader";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Analytics from "../../../public/Helpers/AnalyticsIcon.svg";
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


  const navigate = useNavigate();
  const { backendActor, isAuthenticated, fetchReserveData,
    createLedgerActor, } = useAuth();
  const {

    isFreezePopupVisible,
    setIsFreezePopupVisible,
  } = useUserData();
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
 const [cycles ,setCycles]= useState("");
  const radioRefs = {};
  const [filteredData, setFilteredData] = useState(null);
  const [userAccountData, setUserAccountData] = useState({});
  const [userData, setUserData] = useState({});
  const [assetBalance, setAssetBalances] = useState([]);
  const [healthFactors, setHealthFactors] = useState({});
  const { isSwitchingWallet } = useSelector((state) => state.utility);
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
  const { filteredItems, interestAccure, assets } = useAssetData(searchQuery);
 


  const poolAssets = [
    { name: "ckBTC", imageUrl: ckBTC },
    { name: "ckETH", imageUrl: ckETH },
    { name: "ckUSDC", imageUrl: ckUSDC },
    { name: "ckUSDT", imageUrl: ckUSDT },
    { name: "ICP", imageUrl: icp },
  ];
  console.log("interestAccure", interestAccure);
  const [cardData, setCardData] = useState([
    {
      title: "Users",
      value: users?.length > 0 ? users.length : "",
      link: "/users",
    },

    { title: "Cycles", value: cycles, link: "/cycles" },
    {
      title: "Interest Accured",
      value: interestAccure,
      link: "/interest accured",
    },
    { title: "Reserves", value: "5", link: "/pools", assets: poolAssets },
  ]);

  const healthFactorRoute = process.env.DFX_ADMIN_ROUTE;

  const handleViewMore = () => {
    navigate(healthFactorRoute, {
      state: { userAccountData }, // ✅ Pass data to the next page
    });
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
    const batchSize = 5; // Adjust this based on your system's capacity

    const processUsersInBatches = async (usersBatch) => {
      for (const [principal, userData] of usersBatch) {
        if (!principal) continue;

        const userBalances = {};

        await Promise.all(
          assets.map(async (asset) => {
            const reserveDataForAsset = await fetchReserveData(asset);
            console.log("reserveDataForAsset", reserveDataForAsset);
            const dtokenId = reserveDataForAsset?.Ok?.d_token_canister?.[0];
            const debtTokenId = reserveDataForAsset?.Ok?.debt_token_canister?.[0];
            console.log("dtokenId", dtokenId);

            const assetBalance = {
              dtokenBalance: null,
              debtTokenBalance: null,
            };

            try {
              const formattedPrincipal = Principal.fromText(principal.toString());
              const account = { owner: formattedPrincipal, subaccount: [] };

              if (dtokenId) {
                const dtokenActor = createLedgerActor(dtokenId, idlFactory);
                if (dtokenActor) {
                  const balance = await dtokenActor.icrc1_balance_of(account);
                  assetBalance.dtokenBalance = Number(balance);
                }
              }

              if (debtTokenId) {
                const debtTokenActor = createLedgerActor(debtTokenId, idlFactory1);
                if (debtTokenActor) {
                  const balance = await debtTokenActor.icrc1_balance_of(account);
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

        // Update state progressively to avoid UI freeze
        setAssetBalances((prevBalances) => ({ ...prevBalances, [principal]: userBalances }));
      }
    };

    // Process users in batches
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await processUsersInBatches(batch);
    }
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

    const sendTokenWarningEmail = async () => {
      const htmlMessage = `
      Your balance of ${assetName} is approaching the threshold. Please mint  ${assetName} above threshold value .
      Current Balance: ${formatNumber(assetBalance)}
      Threshold: ${formatNumber(tokenThreshold)}
    `;
      try {
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
        await sendEmailNotification(`${assetName} Exhausted`, htmlMessage);
        lastTokenExhaustedEmailTimestamp = currentTime;
      } catch (error) {
        console.error("Failed to send token exhausted email:", error);
      }
    };

    if (emailinterval) {
      clearInterval(emailinterval);
    }

    emailInterval = setInterval(async () => {
      if (assetBalance <= tokenThreshold) {
        console.log("Token balance is exhausted. Sending exhausted email...");
        await sendTokenExhaustedEmail();
      } else if (
        assetBalance > tokenThreshold &&
        assetBalance < tokenThreshold + 1000
      ) {
        await sendTokenWarningEmail();
      }
    }, oneDay);
  };
  const formatValue = (num) => {
    if (num < 1) return num.toFixed(7);

    if (num >= 1e12)
      return num % 1e12 === 0
        ? num / 1e12 + "T"
        : (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9)
      return num % 1e9 === 0 ? num / 1e9 + "B" : (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6)
      return num % 1e6 === 0 ? num / 1e6 + "M" : (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3)
      return num % 1e3 === 0 ? num / 1e3 + "K" : (num / 1e3).toFixed(2) + "K";

    return num.toFixed(2);
  };

  const theme = useSelector((state) => state.theme.theme);
  const borderColor = theme === "dark" ? "#0F172A" : "#D379AB66";
  const validValues = [
    healthStats.lessThanOne,
    healthStats.greaterThanOne,
    healthStats.infinity,
  ].filter((v) => v > 0);
  const total =
    validValues.length > 0 ? validValues.reduce((acc, val) => acc + val, 0) : 1;

  const normalize = (value) => (value > 0 ? (value / total) * 100 : 0);

  const pieData = {
    labels: ["<1", ">1", "Infinity"],
    datasets: [
      {
        data: [
          normalize(healthStats.lessThanOne),
          normalize(healthStats.greaterThanOne),
          normalize(healthStats.infinity),
        ],
        backgroundColor: ["#E53935", "#43A047", "#FBC02D"],
        hoverBackgroundColor: ["#E53935", "#43A047", "#FBC02D"],
        borderColor: borderColor,
        borderWidth: 2,
        borderRadius: 6,
        spacing: 2,
        cutout: "60%",
        rotation: -40,
        circumference: 360,
        hoverOffset: 6,
      },
    ],
  };

  const pieOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (tooltipItem) {
            const index = tooltipItem.dataIndex;
            const categoryLabels = ["<1", ">1", "Infinity"];
            const rawValues = [
              healthStats.lessThanOne,
              healthStats.greaterThanOne,
              healthStats.infinity,
            ];
            return `${rawValues[index]} Users`;
          },
        },
      },
    },
  };

  // Function to handle token balances
  const onTokenUpdate = (newBalance) => {
    console.log("Balance count updated:", newBalance);
    handleTokenNotification(newBalance);
  };

  const handleTokenBalances = async () => {
    for (const asset of poolAssets) {
      const assetBalance = assetBalances[asset.name];
      if (assetBalance !== undefined) {
        handleTokenNotification(asset.name, assetBalance);
        onTokenUpdate(assetBalance); // ✅ Call `onTokenUpdate` with `assetBalance`
      }
    }
  };

  useEffect(() => {
    handleTokenBalances();
  }, [assetBalances, tokenThreshold]);

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
    console.log("useEffect triggered");
    console.log("Users:", users);
    console.log("Total users:", users?.length);
    console.log("Asset balance:", assetBalance);

    if (!users || users.length === 0) {
      console.log("No users found, exiting useEffect.");
      return;
    }

    // Dynamically determine batch size based on user count
    const totalUsers = users.length;
    let batchSize;

    if (totalUsers >= 10000) {
      batchSize = 1000;
    } else if (totalUsers >= 5000) {
      batchSize = 500;
    } else if (totalUsers >= 2000) {
      batchSize = 100;
    } else {
      batchSize = 100; // If fewer users, process all at once
    }

    console.log(`Batch size determined: ${batchSize}`);

    const userChunks = [];
    for (let i = 0; i < totalUsers; i += batchSize) {
      userChunks.push(users.slice(i, i + batchSize));
    }

    console.log(`Total batches created: ${userChunks.length}`);

    // Limit concurrency per batch (process all batches together, but queue inside each batch)
    const processBatchesInParallelWithQueue = async () => {
      try {
        await Promise.all(
          userChunks.map(async (batch, batchIndex) => {
            console.log(
              `Starting Batch ${batchIndex + 1} (size: ${batch.length})`
            );

            // Each batch gets its own `p-limit(1)` to process requests **one by one** inside the batch
            const batchQueue = pLimit(1);

            await Promise.all(
              batch.map(([principal]) =>
                batchQueue(async () => {
                  if (principal) {
                    console.log(
                      `Requesting data for: ${principal} in Batch ${batchIndex + 1
                      }`
                    );
                    await fetchUserAccountDataWithCache(principal);
                    console.log(
                      `Completed request for: ${principal} in Batch ${batchIndex + 1
                      }`
                    );
                  }
                })
              )
            );

            console.log(`Completed Batch ${batchIndex + 1}`);
          })
        );

        console.log(" All batches completed!");
      } catch (error) {
        console.error(" Error in processing batches:", error);
      }
    };

    processBatchesInParallelWithQueue();
  }, [users, assetBalance]);
  console.log("userAccountData", userAccountData)
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

    setHealthFactors(updatedHealthFactors);
  }, [userAccountData]);
  useEffect(() => {
    if (users.length > 0) {
      fetchAssetData();
    }
  }, [users, assets]);
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

  const handleAssetClick = (asset) => {
    setShowPopup(false);

    const filteredData = filteredItems.filter((item) => item[0] === asset.name);
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
  useEffect(() => {
    const fetchCycles = async () => {
      try {
        const cycleValue = await getCycles();
        setCycles(cycleValue); // ✅ Set state with retrieved cycles
      } catch (error) {
        console.error("Error fetching cycles:", error);
        setCycles("Error retrieving cycles"); // ✅ Ensure fallback value is set
      }
    };

    fetchCycles(); // ✅ Fetch cycles on mount
  }, []);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 lgx:grid-cols-3 gap-10 p-10 ">
          {/*  Users Card */}
          {cardData
            .filter((card) => card.title === "Users")
            .map((card, index) => (
              <div
                key={index}
                className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63] dark:text-darkTextSecondary1 rounded-[40px] shadow-lg p-5 flex flex-col justify-start lg:ml-8 hover:shadow-2xl transition-shadow duration-300 w-100 h-120"
              >
                <h3 className="lg:text-lg text-sm font-normal px-6 py-2 mt-3">
                  {card.title}
                </h3>
                <p className="text-4xl font-bold px-6 py-1 mt-6  text-[#233D63] dark:text-darkText">
                  {card.value}
                </p>
                <a
                  href="https://analytics.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-1 text-sm flex items-center hover:underline mt-2"
                >
                  Open Analytics{" "}
                  {theme === "dark" ? (
                    <img
                      src={Analytics}
                      className="ml-1 w-4 h-4"
                      alt="External Link"
                    />
                  ) : (
                    <ExternalLink className="ml-1" size={16} color="#4169E1" />
                  )}
                </a>
              </div>
            ))}

          {/*  Health Factor Card */}
          <div className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63] dark:text-darkTextSecondary1 rounded-[40px] shadow-lg p-5 flex flex-col relative w-100 h-120 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between px-3">
              <h3 className="lg:text-lg text-sm text-nowrap font-normal px-3 lg:px-6 py-2 mt-3">
                Health Factor
              </h3>
              <button
                onClick={handleViewMore}
                className="flex items-center  text-sm px-4 py-2 mt-3"
              >
                More
                {theme === "dark" ? (
                  <img src={Analytics} className="ml-2 w-4 h-4" alt="External Link" />
                ) : (
                  <ExternalLink className="ml-2" size={16} color="#4169E1" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between w-full px-6 py-2 mt-6">
              <div className="lg:w-32 lg:h-32 w-20 h-20 lg:ml-6">
                <Doughnut data={pieData} options={pieOptions} />
              </div>
              <div className="flex flex-col space-y-5 pl-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm dark:text-darkText">&gt;1</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-sm dark:text-darkText">&lt;1</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm dark:text-darkText">Infinity</span>
                </div>
              </div>
            </div>
          </div>

          {/*  Reserves Card */}
          {cardData
            .filter((card) => card.title === "Reserves")
            .map((card, index) => (
              <div
                key={index}
                className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63] dark:text-darkTextSecondary1 rounded-[40px] shadow-lg px-6 py-5 flex flex-col items-start justify-center hover:shadow-2xl transition-shadow duration-300 w-100 h-120"
              >
                {/* Title */}
                <h3 className="lg:text-lg text-sm font-normal px-3  py-2 mt-2 ">
                  {card.title}
                </h3>

                {/* Value */}
                <p className="text-4xl font-bold  text-[#233D63] dark:text-darkText px-3  py-1  ">
                  {card.value}
                </p>

                {/* Assets Row (Clickable Images) */}
                {!loading && (
                  <div className="mt-3 flex flex-wrap justify-start gap-3 px-3">
                    {card.assets.map((asset, idx) => (
                      <button
                        key={idx}
                        className=" w-6 h-6 lg:w-10 lg:h-10 rounded-full flex items-center justify-center cursor-pointer "
                        onClick={() => handleAssetClick(asset)}
                      >
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className=" w-6 h-6 lg:w-9 lg:h-9 object-cover rounded-full"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Click Text */}
                <p className="text-xs  text-[#233D63] dark:text-gray-400 mt-9 py-2 px-3 ">
                  Click on assets to learn more
                </p>
              </div>
            ))}

          {/*  Interest Accrued Card */}
          <div className="flex flex-col">
            {cardData
              .filter((card) => card.title === "Interest Accured")
              .map((card, index) => (
                <div
                  key={index}
                  className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63] dark:text-darkTextSecondary1 rounded-[40px] shadow-lg px-6 py-4 lgx:ml-[190px] flex flex-col items-start justify-start hover:shadow-2xl transition-shadow duration-300 lgx:w-[355px] lgx:h-[210px]  w-100 h-[240px]"
                >
                  {/* Title - Moved Up */}
                  <h3 className="lg:text-lg text-sm font-normal px-3 py-2 mt-3 ">
                    {card.title}
                  </h3>

                  {/* Value - Moved Closer to Title */}
                  <p className="text-4xl font-bold  text-[#233D63] dark:text-darkText px-3 py-2 mt-1">
                    <span className="font-normal  text-[#233D63] dark:text-gray-400">
                      $
                    </span>
                    {card.value}
                  </p>
                </div>
              ))}
          </div>

          {/*  Cycles Card */}
          {cardData
            .filter((card) => card.title === "Cycles")
            .map((card, index) => (
              <div
                key={index}
                className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63] dark:text-darkTextSecondary1 rounded-[40px] shadow-lg px-6 py-4 lgx:ml-[260px] flex flex-col items-start justify-start hover:shadow-2xl transition-shadow duration-300 lgx:w-[355px] lgx:h-[210px] w-100 h-[240px]"
              >
                {/* Title */}
                <h3 className="lg:text-lg text-sm font-normal px-3 py-2 mt-3">
                  {card.title}
                </h3>

                {/* Value with Conditional Coloring */}
                <p
                  className={`text-4xl font-bold px-3 py-2 mt-1 ${loading
                      ? "text-[#233D63] dark:text-darkText"
                      : getCycleColor(card.value)
                    }`}
                >
                  {loading ? <MiniLoader isLoading={true} /> : card.value}
                </p>

                {/* Threshold for Cycles */}
                {!loading && (
                  <p className="text-sm mt-1 px-3 py-2 text-[#233D63] dark:text-darkTextSecondary1">
                    Threshold Value: <span className="font-bold">{formatNumber(threshold)}</span>
                  </p>
                )}
              </div>
            ))}

          {showPopup &&
            selectedAsset &&
            (() => {
              // Initialize assetBalance with 0
              let assetBalance = 0;

              // Extract first valid assetBalance if data exists
              if (filteredData && filteredData.length > 0) {
                for (const data of filteredData) {
                  const assetName = data[0];
                  if (assetBalances[assetName] !== undefined) {
                    assetBalance = assetBalances[assetName];
                    break; // Stop after finding the first valid assetBalance
                  }
                }
              }

              return (
                <div
                  key={selectedAsset.name}
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                  onClick={closePopup}
                >
                  <div
                    className="bg-white dark:bg-darkOverlayBackground shadow-xl ring-1 ring-black/10 dark:ring-white/20 flex flex-col text-white dark:text-darkText z-50 rounded-[20px] p-6 w-[325px] lg1:w-[350px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Asset Header */}
                    <div className="flex items-center lg:gap-4 mb-3 gap-2 ">
                      <img
                        src={selectedAsset.imageUrl}
                        alt={selectedAsset.name}
                        className=" w-8 h-8 lg:w-10 lg:h-10 object-contain rounded-full"
                      />
                      <h3 className=" text-lg lg:text-xl font-bold">
                        {selectedAsset.name}
                      </h3>
                    </div>

                    {/* Asset Data List */}
                    <div className="flex flex-col space-y-3">
                      {filteredData && filteredData.length > 0 ? (
                        filteredData.map((data, idx) => {
                          const assetName = data[0];
                          const assetRate = assetRates[assetName];

                          if (!assetRate) {
                            return (
                              <div
                                key={idx}
                                className="bg-[#1D203E] rounded-lg p-3"
                              >
                                <p className="text-sm text-gray-400">
                                  Rate not available for {assetName}
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={idx}
                              className="dark:bg-[#1D1B40] bg-gray-100 hover:bg-gray-200 rounded-xl p-3 flex flex-col space-y-1"
                            >
                              {/* First Section: Total Supplied & Borrowed */}
                              <div className="flex flex-col space-y-2">
                                <div className="flex justify-between">
                                  <p className="text-sm text-[#233D63] dark:text-darkTextSecondary1">
                                    Total Supplied:
                                  </p>
                                  <p className="text-sm font-bold text-[#233D63] dark:text-darkText text-right">
                                    <span className="font-normal text-[#233D63] dark:text-gray-400">
                                      $
                                    </span>{" "}
                                    {formatValue(
                                      (Number(data[1]?.Ok?.asset_supply) /
                                        1e8) *
                                      (assetRate / 1e8)
                                    )}
                                  </p>
                                </div>

                                <div className="flex justify-between">
                                  <p className="text-sm text-[#233D63] dark:text-darkTextSecondary1">
                                    Total Borrowed:
                                  </p>
                                  <p className="text-sm font-bold text-[#233D63] dark:text-darkText text-right">
                                    <span className="font-normal text-[#233D63] dark:text-gray-400">
                                      $
                                    </span>{" "}
                                    {formatValue(
                                      (Number(data[1]?.Ok?.asset_borrow) /
                                        1e8) *
                                      (assetRate / 1e8)
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-400 text-center">
                          No data available for this asset.
                        </p>
                      )}
                    </div>

                    {/* Divider & Testnet Section Below */}
                    <div className="dark:bg-[#1D1B40] bg-gray-100 hover:bg-gray-200 rounded-xl p-3 flex flex-col space-y-1  mt-5">
                      <div className="flex justify-between">
                        <p className="font-normal text-sm text-[#233D63] dark:text-darkTextSecondary1">
                          Token Available:
                        </p>
                        <p className="text-sm font-bold  text-right">
                          {Number(assetBalance).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex justify-between">
                        <p className="font-normal text-sm text-[#233D63] dark:text-darkTextSecondary1">
                          Token Threshold:
                        </p>
                        <p className="text-sm font-bold  text-right">
                          {Number(tokenThreshold)}
                        </p>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      className="mt-6 w-full bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] text-white rounded-xl shadow-md px-5 py-1 text-lg font-semibold"
                      onClick={() => setShowPopup(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
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
