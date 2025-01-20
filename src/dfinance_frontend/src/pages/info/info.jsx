import React, { useState, useEffect } from "react";
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
  
  const { backendActor } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [like, setLike] = useState(true); 
  const [notification, setNotification] = useState(""); 
  // const checkControllerStatus = async () => {
  //   if (!backendActor) {
  //     throw new Error("Backend actor not initialized");
  //   }
  //   try {
  //     const result = await backendActor.to_check_controller();
  //     console.log("Controller Status:", result); // Debug log
  //     setLike(result); // Update `like` state with the backend value
  //   } catch (err) {
  //     console.error("Error fetching controller status:", err);
  //     setError("Failed to fetch controller status");
  //   }
  // };

  // useEffect(() => {
  //   checkControllerStatus();
  // }, [backendActor]);
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
  const getAllUsers = async () => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }

    try {
      const allUsers = await backendActor.get_all_users();
      return allUsers;
    } catch (error) {
      throw error;
    }
  };
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


const handleNotification = (currentCycles,assetBalance) => {
  const oneDay =24 * 60 * 60 * 1000; // 1 minute in milliseconds

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
console.log("currentCycles",currentCycles);
console.log("threshold",threshold);
    if (currentCycles <= threshold) {
      console.log("Cycles are exhausted. Sending exhausted email...");
      await sendExhaustedEmail(); // Send exhausted email every minute until cycles increase
    } else if (currentCycles > threshold && currentCycles < threshold + 2000000000000) {
      console.log("Cycles are nearing the safe threshold. Sending warning email...");
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
let emailinterval = null;  // Declare interval variable globally

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
    } else if (assetBalance > tokenThreshold && assetBalance < tokenThreshold + 1000) {
      console.log("Token balance is nearing the safe threshold. Sending warning email...");
      await sendTokenWarningEmail(); // Send warning email if balance is nearing threshold
    }
  }, oneDay); // Check every minute (60 seconds)
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
      setLoading(true);
      try {
        const [users, cycles] = await Promise.all([getAllUsers(), getCycles()]);
        // const users = await getAllUsers();
        const usersCount = users.length;
// const cycles =5000000000000;
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
  }, [backendActor, interestAccure]);

  

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
      {like ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-14 px-5 mt-16">
          {cardData.map((card, index) => (
            <div
              key={index}
              className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63]  dark:text-darkTextSecondary1 rounded-xl shadow-lg  px-4 py-3 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold mt-2">{card.title}</h3>

              <p
                className={`text-4xl font-bold mt-2 ${
                  loading
                    ? "text-[#233D63] dark:text-darkText"
                    : card.title === "Cycles"
                    ? getCycleColor(card.value) // Apply cycle color only for Cycles
                    : "text-[#233D63] dark:text-darkText"
                }`}
              >
                {console.log("card.title", card.title)}
                {loading ? (
                  "Loading..."
                ) : card.title === "Interest Accured" ? (
                  <>
                    <span className="font-normal">$</span>{" "}
                    {/* Smaller font for the dollar sign */}
                    {card.value}
                  </>
                ) : (
                  card.value
                )}
              </p>

              {card.title === "Reserves" && !loading && (
                <div className="mt-3 flex flex-wrap justify-center gap-6">
                  {card.assets.map((asset, idx) => (
                    <label
                      key={idx}
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="asset"
                        className="visble"
                        ref={radioRefs[asset.name]}
                        onChange={() => handleAssetSelection(asset)}
                      />
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="w-8 h-8 object-cover rounded-full border-2 border-transparent checked:border-blue-500 ml-1"
                      />
                    </label>
                  ))}
                </div>
              )}

              {/* Show threshold if it's the "Cycles" card */}
              {card.title === "Cycles" && !loading && (
                <p className="text-sm mt-3 text-[#233D63]  dark:text-darkTextSecondary">
                  Threshold Value: {formatNumber(threshold)}
                </p>
              )}

              {/* Display 'View Details' button only for the 'Users' card */}
              {card.title === "Users" && !loading && (
                <a
                  href="https://analytics.google.com/analytics/web/#/analysis/p472242742/edit/5FJVJVVVSzm_gOhVztd31w"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center  text-[#233D63] hover:dark:text-darkText  dark:text-darkTextSecondary hover:text-[#070d15] text-sm"
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
          {/* {error && <div className="text-red-500">{error}</div>} */}
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
                            <div className="w-full h-[0.8px] bg-gradient-to-r from-[#EB8863] to-[#81198E] my-4 "></div>
                            <h3 className="mb-1 text-[#233D63]  dark:text-darkTextSecondary1">Testnet</h3>
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
