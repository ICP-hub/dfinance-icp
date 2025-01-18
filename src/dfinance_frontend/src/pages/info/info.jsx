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

const DashboardCards = () => {
  const navigate = useNavigate();
  const { backendActor } = useAuth();

  const [like, setLike] = useState(true); // State to control page visibility
  const [cardData, setCardData] = useState([
    { title: "Users", value: "Loading...", link: "/users" },
    { title: "Cycles", value: "5678", link: "/cycles" },
    { title: "Reserves", value: "5", link: "/pools", assets: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [threshold] = useState(5000);

  const poolAssets = [
    { name: "ckBTC", imageUrl: ckBTC },
    { name: "ckETH", imageUrl: ckETH },
    { name: "ckUSDC", imageUrl: ckUSDC },
    { name: "ckUSDT", imageUrl: ckUSDT },
    { name: "ICP", imageUrl: icp },
  ];

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const users = await getAllUsers();
        const usersCount = users.length;

        const formattedData = [
          { title: "Users", value: usersCount, link: "/users" },
          { title: "Cycles", value: "5678", link: "/cycles" },
          {
            title: "Reserves",
            value: "5",
            link: "/pools",
            assets: poolAssets,
          },
        ];

        setCardData(formattedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [backendActor]);

  const sendEmailNotification = () => {
    console.log("Sending email notification: Cycles are below threshold");
  };

  useEffect(() => {
    if (
      cardData[1].title === "Cycles" &&
      !loading &&
      parseInt(cardData[1].value) < threshold
    ) {
      sendEmailNotification();
    }
  }, [cardData, loading, threshold]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const getCycleColor = (value) => {
    const cycleValue = parseInt(value);
    if (cycleValue < threshold) {
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

  poolAssets.forEach((asset) => {
    radioRefs[asset.name] = React.createRef();
  });
  const handleAssetSelection = (asset) => {
    // Close the popup momentarily to force re-rendering
    setShowPopup(false);
    setTimeout(() => {
      setSelectedAsset(asset); // Update the selected asset
      setShowPopup(true); // Reopen the popup
    }, 0);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedAsset(null); // Clear selected asset
    Object.values(radioRefs).forEach((ref) => {
      if (ref.current) {
        ref.current.checked = false; // Deselect the radio button
      }
    });
  };

  return (
    <>
      {like ? (
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4 p-14 mt-16">
          {cardData.map((card, index) => (
            <div
              key={index}
              className="dark:from-darkGradientStart dark:to-darkGradientEnd bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 text-[#233D63]  dark:text-darkTextSecondary1 rounded-xl shadow-lg p-2 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold mt-2">{card.title}</h3>

              <p
                className={`text-4xl font-bold mt-2 ${
                  loading
                    ? "text-[#233D63]  dark:text-darkText"
                    : card.title === "Cycles"
                    ? getCycleColor(card.value) // Apply cycle color only for Cycles
                    : "text-[#233D63]  dark:text-darkText"
                }`}
              >
                {loading ? "Loading..." : card.value}
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
                  Threshold: {threshold} (Current: {card.value})
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
                  Open Analytics <ExternalLink className="ml-1" size={16} />
                </a>
              )}
            </div>
          ))}
          {error && <div className="text-red-500">{error}</div>}
          {showPopup && selectedAsset && (
            <div
              key={selectedAsset.name} // Unique key for the popup
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
              onClick={closePopup} // Close popup when backdrop is clicked
            >
              <div
                className="bg-[#fcfafa] shadow-xl ring-1 ring-black/10 dark:ring-white/20 flex flex-col dark:bg-darkOverlayBackground dark:text-darkText z-50 rounded-lg p-6 w-96"
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
                <p>Additional details or values can be shown here.</p>
                <button
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
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
