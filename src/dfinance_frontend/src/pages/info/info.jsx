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
import MiniLoader from "../../components/Common/MiniLoader";
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
  const [like, setLike] = useState(false); // State to control page visibility
  const [notification, setNotification] = useState(""); // Notification message
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
        "service_860ie6t", // Replace with your EmailJS Service ID
        "template_s74va8z", // Replace with your EmailJS Template ID
        templateParams,
        "BMGYJ-HAO8cOyGE6E" // Replace with your EmailJS Public Key
      );

      console.log("Email sent successfully.");
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  };

  const handleNotification = async (currentCycles) => {
    const today = new Date().toDateString();

    if (currentCycles < threshold) {
      // Send exhaustion email if not sent today
      if (lastExhaustedEmailDate !== today) {
        setLastExhaustedEmailDate(today); // Track date of last sent email
        const htmlMessage = `
      <p>Your cycles are exhausted!</p>
      <p>Current Cycles: ${currentCycles}</p>
      <p>Threshold: ${formatNumber(threshold)}</p>
     
    `;
        await sendEmailNotification("Cycle Exhausted", htmlMessage);
      }
      setNotification("Warning: Cycles are exhausted! Renew them.");
    } else if (currentCycles < threshold + 2000000000000) {
      // Send warning email daily if not sent today
      if (lastEmailDate !== today) {
        setLastEmailDate(today); // Track date of last sent email
        const htmlMessage = `
        <p>The cycle count is below the safe threshold!</p>
        <p>Current Cycles: ${currentCycles}</p>
        <p>Threshold + 2T: ${formatNumber(threshold + 2 * T)}</p>
       
      `;
        await sendEmailNotification("Cycle Warning", htmlMessage);
      }
      setNotification("Warning: Cycles are nearing exhaustion!");
    } else {
      setNotification(""); // Clear notification if cycles are safe
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [users, cycles] = await Promise.all([getAllUsers(), getCycles()]);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-14 mt-16">
          {cardData.map((card, index) => (
            <div
              key={index}
              className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63]  dark:text-darkTextSecondary1 rounded-xl shadow-lg p-2 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow duration-300"
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
                  <div className="h-[150px] flex justify-center items-center">
                    <MiniLoader isLoading={true} />
                  </div>
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
          {error && <div className="text-red-500">{error}</div>}
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
                            <p className="font-normal text-sm">
                              Token Available:{" "}
                              <span className="font-bold">
                                ${Number(assetBalance / 1e8).toFixed(8)}
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
