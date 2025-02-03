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
import useAssetData from "../../components/Common/useAssets";
import useFetchConversionRate from "../../components/customHooks/useFetchConversionRate";
import useFetchBalanceBackend from "../../components/customHooks/useFetchBalanceBackend";
import MiniLoader from "../../components/Common/MiniLoader";
import { Doughnut, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

// Register Chart.js elements
ChartJS.register(ArcElement, Tooltip);

const DashboardCards = () => {
  const navigate = useNavigate();
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
  useEffect(() => {
    fetchBalance("ckBTC");
    fetchBalance("ckETH");
    fetchBalance("ckUSDC");
    fetchBalance("ICP");
    fetchBalance("ckUSDT");
  }, [fetchBalance]);
  console.log("ckBTCBalance", ckBTCBalance);
  console.log("ckETHBalance", ckETHBalance);
  console.log("ckUSDCBalance", ckUSDCBalance);
  console.log("ckICPBalance", ckICPBalance);
  console.log("ckUSDTBalance", ckUSDTBalance);
  const assetRates = {
    ckETH: ckETHUsdRate,
    ckBTC: ckBTCUsdRate,
    ckUSDC: ckUSDCUsdRate,
    ICP: ckICPBalance,
    ckUSDT: ckUSDTUsdRate,
  };
  const assetBalances = {
    ckETH: ckETHBalance,
    ckBTC: ckBTCBalance,
    ckUSDC: ckUSDCBalance,
    ICP: ckICPUsdRate,
    ckUSDT: ckUSDTBalance,
  };
  const [healthStats, setHealthStats] = useState({
    lessThanOne: 0,
    greaterThanOne: 0,
    infinity: 0,
  });
  const { backendActor } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [like, setLike] = useState(false);
  const [notification, setNotification] = useState("");
  const checkControllerStatus = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      const result = await backendActor.to_check_controller();
      console.log("Controller Status:", result); // Debug log
      setLike(result); // Update `like` state with the backend value
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [threshold] = useState(5000000000000);
  const [tokenThreshold] = useState(10000);
  const { assets, reserveData, filteredItems, interestAccure } =
    useAssetData(searchQuery);
  console.log("filteredItems", filteredItems);
  const poolAssets = [
    { name: "ckBTC", imageUrl: ckBTC },
    { name: "ckETH", imageUrl: ckETH },
    { name: "ckUSDC", imageUrl: ckUSDC },
    { name: "ckUSDT", imageUrl: ckUSDT },
    { name: "ICP", imageUrl: icp },
  ];
  console.log("interestAccure", interestAccure);
  const [users, setUsers] = useState([]); //  State to store users

  const handleViewMore = () => {
    navigate("/2a45fg/health-factor-list"); // 🔹 Navigate to the new page
  };
  const getAllUsers = async () => {
    if (!backendActor) {
      console.error("Backend actor not initialized");
      return;
    }

    try {
      const allUsers = await backendActor.get_all_users();
      console.log("Retrieved Users:", allUsers);

      setUsers(allUsers); //  Store users in state
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  //  Fetch Users on Component Mount
  useEffect(() => {
    getAllUsers();
  }, []);

  const getCycles = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    const response = await backendActor.cycle_checker();
    console.log("response cycle checker", response);
    // Assuming the response is an object like { cycles: 5678 }
    return response.toString(); // Extract the 'cycles' property
  };

  const formatNumber = useFormatNumber();
  // State to track last sent notifications
  const [lastEmailDate, setLastEmailDate] = useState(null);
  const [lastExhaustedEmailDate, setLastExhaustedEmailDate] = useState(null);

  const sendEmailNotification = async (subject, htmlMessage) => {
    try {
      const templateParams = {
        to_name: "Admin",
        subject,
        message: htmlMessage,
      };

      await emailjs.send(
        "service_7pu7uvh", // Replace with your EmailJS Service ID
        "template_1k2eq7a", // Replace with your EmailJS Template ID
        templateParams,
        "uWDc83b20aMxTTyrz" // Replace with your EmailJS Public Key
      );

      console.log("Email sent successfully.");
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  };

  let emailInterval; // Variable to store the interval ID
  let lastExhaustedEmailTimestamp = 0;
  let lastWarningEmailTimestamp = 0;

  const handleNotification = (currentCycles, assetBalance) => {
    const oneDay = 24 * 60 * 60 * 1000; // 1 minute in milliseconds

    console.log("Handling notification for cycles:", currentCycles);

    // Function to send a warning email
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

    // Function to send an exhausted email
    const sendExhaustedEmail = async () => {
      const htmlMessage = `
      Your cycles are exhausted! Please renew your cycles immediately to continue services.
      Current Cycles: ${formatNumber(currentCycles)}
      Threshold: ${formatNumber(threshold)}
    `;
      try {
        console.log("Sending exhausted email...");
        await sendEmailNotification("Cycle Exhausted", htmlMessage);
        lastExhaustedEmailTimestamp = Date.now(); // Update the last exhausted email timestamp
      } catch (error) {
        console.error("Failed to send exhausted email:", error);
      }
    };

    // Clear existing interval
    if (emailInterval) {
      console.log("Clearing previous interval...");
      clearInterval(emailInterval);
    }

    // Set up a new interval to check and send emails every minute
    emailInterval = setInterval(async () => {
      console.log("Interval triggered. Checking conditions...");
      console.log("currentCycles", currentCycles);
      console.log("threshold", threshold);
      if (currentCycles <= threshold) {
        console.log("Cycles are exhausted. Sending exhausted email...");
        await sendExhaustedEmail(); // Send exhausted email every minute until cycles increase
      } else if (
        currentCycles > threshold &&
        currentCycles < threshold + 2000000000000
      ) {
        console.log(
          "Cycles are nearing the safe threshold. Sending warning email..."
        );
        await sendWarningEmail(); // Send warning email every minute until cycles increase
      }
      // Keep checking and sending emails every minute indefinitely.
    }, oneDay); // Interval set to 1 minute
  };

  // Simulate cycle updates
  const onCycleUpdate = (newCycles) => {
    console.log("Cycle count updated:", newCycles);
    handleNotification(newCycles);
  };
  let lastTokenExhaustedEmailTimestamp = 0;
  let lastTokenWarningEmailTimestamp = 0;
  let emailinterval = null; // Declare interval variable globally

  const handleTokenNotification = (assetName, assetBalance) => {
    const oneDay = 24 * 60 * 60 * 1000; // 1 minute in milliseconds
    const currentTime = Date.now();

    console.log(`Handling token notification for ${assetName}:`, assetBalance);

    // Function to send a warning email
    const sendTokenWarningEmail = async () => {
      const htmlMessage = `
      Your balance of ${assetName} is approaching the threshold. Please mint  ${assetName} above threshold value .
      Current Balance: ${formatNumber(assetBalance)}
      Threshold: ${formatNumber(tokenThreshold)}
    `;
      try {
        console.log("Sending token warning email...");
        await sendEmailNotification(`${assetName} Warning`, htmlMessage);
        lastTokenWarningEmailTimestamp = currentTime; // Update the last warning email timestamp
      } catch (error) {
        console.error("Failed to send token warning email:", error);
      }
    };

    // Function to send an exhausted email
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

    // If emailInterval exists, clear it before setting a new one
    if (emailinterval) {
      console.log("Clearing previous interval...");
      clearInterval(emailinterval);
    }

    // Set up a new interval to check and send emails every minute
    emailInterval = setInterval(async () => {
      console.log("Interval triggered. Checking conditions...");
      console.log("assetBalance", assetBalance);
      console.log("tokenThreshold", tokenThreshold);

      if (assetBalance <= tokenThreshold) {
        console.log("Token balance is exhausted. Sending exhausted email...");
        await sendTokenExhaustedEmail(); // Send exhausted email if balance is below threshold
      } else if (
        assetBalance > tokenThreshold &&
        assetBalance < tokenThreshold + 1000
      ) {
        console.log(
          "Token balance is nearing the safe threshold. Sending warning email..."
        );
        await sendTokenWarningEmail(); // Send warning email if balance is nearing threshold
      }
    }, oneDay); // Check every minute (60 seconds)
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

        borderColor: "#ffffff", // White border for separation
        borderWidth: 6, // Creates spacing between segments
        cutout: "70%", // Makes it a donut chart
        hoverOffset: 4,
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
    // Call handleTokenBalances whenever asset balances change or after data is fetched
    handleTokenBalances();
  }, [assetBalances, tokenThreshold]); // Trigger when asset balances or tokenThreshold change
  const onTokenUpdate = (newBalance) => {
    console.log("Cycle count updated:", newBalance);
    handleNotification(newBalance);
  };
  useEffect(() => {
    const fetchData = async () => {
      if (!users.length) return; //  Ensure users are available before proceeding

      setLoading(true);
      try {
        const cycles = await getCycles(); // Fetch cycles only

        const usersCount = users.length; //  Use stored users count

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
  const cachedData = useRef({}); //  Cache to store fetched user data
  const [userAccountData, setUserAccountData] = useState({});
  const [healthFactors, setHealthFactors] = useState({});

  //  Fetch and cache user account data
  const fetchUserAccountDataWithCache = async (principal) => {
    if (!principal || cachedData.current[principal]) return; //  Skip if already cached

    try {
      const result = await backendActor.get_user_account_data([principal]);
      if (result) {
        cachedData.current[principal] = result; //  Cache result
        setUserAccountData((prev) => ({ ...prev, [principal]: result }));
      }
    } catch (error) {
      console.error(` Error fetching data for principal: ${principal}`, error);
    }
  };

  //  Fetch all user data in parallel, ensuring cache usage
  useEffect(() => {
    if (!users || users.length === 0) return; //  Ensure `users` is valid

    //  Fetch user data in parallel while respecting cache
    Promise.all(
      users.map(([principal]) => {
        if (principal) return fetchUserAccountDataWithCache(principal);
        return null; // Skip invalid users
      })
    )
      .then(() => console.log(" All user account data fetched"))
      .catch((error) =>
        console.error(" Error fetching user account data in batch:", error)
      );
  }, [users]); //  Runs when users change
  console.log("userAccountData", userAccountData);
  useEffect(() => {
    if (!userAccountData || Object.keys(userAccountData).length === 0) return;

    const updatedHealthFactors = {};

    Object.entries(userAccountData).forEach(([principal, data]) => {
      if (data?.Ok && Array.isArray(data.Ok) && data.Ok.length > 4) {
        updatedHealthFactors[principal] = Number(data.Ok[4]) / 10000000000; //  Divide by 1e8
      } else {
        updatedHealthFactors[principal] = null; //  Handle missing values
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
        //  Classify `>100` as Infinity
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

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const radioRefs = {}; // Object to store refs for radio buttons
  const [filteredData, setFilteredData] = useState(null); // New state for filtered data
  poolAssets.forEach((asset) => {
    radioRefs[asset.name] = React.createRef();
  });
  useEffect(() => {
    // Disable scrolling when the popup is open
    if (showPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup to reset the overflow style when the component unmounts or popup is closed
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showPopup]);
  const handleAssetSelection = (asset) => {
    // Close the popup momentarily to force re-rendering
    setShowPopup(false);
    console.log("filteredItems", filteredItems);
    console.log("selected asset", asset);
    const filteredData = filteredItems.filter((item) => item[0] === asset.name); // Use item[0] if you want to compare the first element of the inner array
    console.log("filteredData", filteredData);
    setFilteredData(filteredData);
    setTimeout(() => {
      setSelectedAsset(asset); // Update the selected asset
      setShowPopup(true); // Reopen the popup
    }, 0);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedAsset(null); // Clear selected asset
    setFilteredData(null); // Clear filtered data
    Object.values(radioRefs).forEach((ref) => {
      if (ref.current) {
        ref.current.checked = false; // Deselect the radio button
      }
    });
  };

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
            {/* Small View More Button */}
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
              {/*  Left Side - Legend */}
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
              {/* Adjusted Container Size */}
              <div className="w-40 h-26 pr-2">
                <Doughnut
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false, // Allow resizing
                    cutout: "70%", // Controls the hollow center
                    plugins: {
                      legend: { display: false }, // Hide default legend
                      tooltip: { enabled: true }, // Keep tooltips
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
              key={selectedAsset.name} // Unique key for the popup
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
              onClick={closePopup} // Close popup when backdrop is clicked
            >
              <div
                className="bg-[#fcfafa] shadow-xl ring-1 ring-black/10 dark:ring-white/20 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 rounded-lg p-6 w-80"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the popup
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
                        // Log data for debugging
                        console.log("data", data[1]?.Ok?.asset_supply);

                        // Get the asset name (e.g., 'ckETH', 'ckBTC')
                        const assetName = data[0];

                        // Get the rate for the asset from assetRates
                        const assetRate = assetRates[assetName];
                        const assetBalance = assetBalances[assetName];
                        // If the asset rate is not found, you can handle it here (optional)
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
                  onClick={() => setShowPopup(false)} // Close popup when clicking the close button
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Error />
      )}
    </>
  );
};

export default DashboardCards;
