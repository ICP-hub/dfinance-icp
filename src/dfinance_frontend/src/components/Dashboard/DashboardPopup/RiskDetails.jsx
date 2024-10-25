import React, { useEffect, useRef } from "react";
import { liquidationThresholdLabel } from "../../../utils/constants";
import { X } from "lucide-react";
import { useSelector } from "react-redux";

const RiskPopup = ({ onClose, userData }) => {
  const popupRef = useRef(null);

  console.log("userdata in risk", userData);
  const health_Factor_Value =
  userData?.Ok?.health_factor / 10000000000 > 100
    ? "Infinity"
    : parseFloat((userData?.Ok?.health_factor / 10000000000).toFixed(2))
  const Ltv_Value = parseFloat(Number((userData?.Ok?.ltv)/100000000)*100)
    ? parseFloat(Number((userData?.Ok?.ltv)/100000000)*100)
    : 0;

  const liquidationThreshold_Value = (Number(userData?.Ok?.liquidation_threshold)/100000000)
    ? ((Number(userData?.Ok?.liquidation_threshold)/100000000)).toFixed(2)
    : "0.00";
  // const liquidationThreshold_Value = 80

  console.log("liquidationThresholdValue", liquidationThreshold_Value);
  const healthFactorMinValue = 1;
  const Max_Ltv = parseFloat(Number((userData?.Ok?.max_ltv)/100000000));
  const handleClickOutside = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, []);

  const calculateHealthFactorPosition = (value) => {
    if (typeof value !== "number" || isNaN(value)) {
      console.error("Invalid Health Factor value:", value);
      return NaN;
    }

    if (value === Infinity) {
      return 100; // Maximum position for infinity
    } else if (value === -Infinity) {
      return 0; // Minimum position for negative infinity
    }

    const minValue = 0; // Minimum value to consider for health factor
    const maxValue = 100; // Maximum health factor value
    const offset = 5; // Offset distance for value 1

    // Calculate the position
    const position = Math.max(
      0,
      Math.min(
        100,
        ((value - minValue) / (maxValue - minValue)) * (100 - offset) + offset
      )
    );

    // If the value is 0, ensure it returns 0
    return value === 0 ? 0 : position;
  };

  const calculateLTVPosition = (value, min, max) => {
    if (
      typeof value !== "number" ||
      typeof min !== "number" ||
      typeof max !== "number" ||
      min === max
    ) {
      console.error("Invalid input values for LTV position calculation:", {
        value,
        min,
        max,
      });
      return NaN;
    }
    return ((value - min) / (max - min)) * 100;
  };
  const calculateMaxLTVPosition = (value, min, max) => {
    if (
      typeof value !== "number" ||
      typeof min !== "number" ||
      typeof max !== "number" ||
      min === max
    ) {
      console.error("Invalid input values for LTV position calculation:", {
        value,
        min,
        max,
      });
      return NaN;
    }
    return ((value - min) / (max - min)) * 100;
  };

  const parseThreshold = (threshold) => {
    if (typeof threshold === "string") {
      const parsed = parseFloat(threshold.replace("%", ""));
      if (!isNaN(parsed)) return parsed;
    }
    return threshold;
  };

  const thresholdValue = parseThreshold(liquidationThreshold_Value);
  const MaxLtvValue = parseThreshold(Max_Ltv);
  console.log("threshold value", liquidationThreshold_Value);
  const healthFactorPosition =
    calculateHealthFactorPosition(health_Factor_Value);
  const healthFactorMinPosition =
    calculateHealthFactorPosition(healthFactorMinValue);
  const currentLTVPosition = calculateLTVPosition(Ltv_Value, 0, 100);
  const currentLTVThresholdPosition = calculateLTVPosition(
    thresholdValue,
    0,
    100
  );
  const currentMaxLtvPosition = calculateMaxLTVPosition(MaxLtvValue, 0, 100);

  console.log("Health Factor Value:", health_Factor_Value);
  console.log("Health Factor Position:", healthFactorPosition);
  console.log("Health Factor Min Value:", healthFactorMinValue);
  console.log("Health Factor Min Position:", healthFactorMinPosition);
  console.log("Current LTV Value:", Ltv_Value);
  console.log("Current LTV Position:", currentLTVPosition);
  console.log("Current LTV Threshold:", liquidationThreshold_Value);
  console.log("Parsed Current LTV Threshold:", thresholdValue);
  console.log("Current LTV Threshold Position:", currentLTVThresholdPosition);

  const theme = useSelector((state) => state.theme.theme);

  const healthFactorColor =
    theme === "dark"
      ? // Dark mode colors
      health_Factor_Value > 3
        ? "#2ecc71" // Dark green shade
        : health_Factor_Value <= 1
          ? "#e74c3c" // Dark red shade
          : health_Factor_Value <= 1.5
            ? "#e67e22" // Dark orange shade
            : health_Factor_Value <= 2
              ? "#f1c40f" // Dark yellow shade
              : "#d35400" // Vivid orange for dark mode
      : // Light mode colors
      health_Factor_Value > 3
        ? "#1e8b47" // Light green shade
        : health_Factor_Value <= 1
          ? "red" // Light red shade
          : health_Factor_Value <= 1.5
            ? "#fa6e0d" // Light orange shade
            : health_Factor_Value <= 2
              ? "yellow" // Light yellow shade
              : "orange"; // Vivid orange for light mode

  const ltvColor =
    theme === "dark"
      ? Ltv_Value >= liquidationThreshold_Value
        ? "#e74c3c" // Dark red for liquidation threshold
        : Ltv_Value >= Max_Ltv
          ? "#e67e22" // Dark orange if LTV equals or exceeds Max LTV
          : "#2ecc71" // Dark green if LTV is less than Max LTV
      : Ltv_Value >= liquidationThreshold_Value
        ? "red" // Light red for liquidation threshold
        : Ltv_Value >= Max_Ltv
          ? "#fa6e0d" // Light orange if LTV equals or exceeds Max LTV
          : "#1e8b47"; // Light green if LTV is less than Max LTV

  // Max LTV color based on theme
  const MaxltvColor =
    theme === "dark"
      ? Ltv_Value >= Max_Ltv
        ? "#e67e22" // Dark orange if LTV equals or exceeds Max LTV
        : Ltv_Value < Max_Ltv
          ? "#008000" // Dark green if LTV is less than Max LTV
          : "#00FFFF" // Cyan for other cases (you can adjust as needed)
      : Ltv_Value >= Max_Ltv
        ? "#fa6e0d" // Light orange if LTV equals or exceeds Max LTV
        : Ltv_Value < Max_Ltv
          ? "#1e8b47" // Light green if LTV is less than Max LTV
          : "#00FFFF"; // Cyan for other cases (you can adjust as needed)

  // const ltvColor =
  //   Ltv_Value >= liquidationThreshold_Value
  //     ? "red" // Red for liquidation threshold
  //     : Ltv_Value >= Max_Ltv // Check if LTV is equal to or greater than Max LTV
  //       ? "#fa6e0d" // Orange if LTV equals Max LTV or is in the range
  //       : "green";

  // const MaxltvColor =
  //   Ltv_Value >= Max_Ltv
  //     ? "#fa6e0d" // Dark brown
  //     : Ltv_Value < Max_Ltv
  //       ? "#008000" // Green
  //       : "#00FFFF"; // Cyan

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 transition-bar">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div
        ref={popupRef}
        className="bg-white rounded-lg overflow-hidden shadow-lg w-[380px] lg:w-[780px] mx-4 sm:mx-auto z-10 p-4 relative dark:bg-darkOverlayBackground"
      >
        <div
          className="h-6 absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6 cursor-pointer button1"
          onClick={onClose}
        >
          <X className="text-black dark:text-darkText w-6 h-6" />
        </div>
        <div className="px-6 py-4">
          <div className="flex justify-between items-center pb-3">
            <h3 className="text-lg font-semibold text-center w-full text-[#4659CF] dark:text-darkText">
              Liquidation Risk Parameters
            </h3>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-darkText">
            Your health factor and loan to value determine the assurance of your
            collateral. To avoid liquidations, you can supply more collateral or
            repay borrow positions.
          </div>
          <div className="mt-4 space-y-6">
            <div className="border border-gray-600 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-darkText">
                Health Factor
              </h4>
              <p className="text-sm text-gray-500 mb-2 dark:text-darkTextSecondary">
                Safety of your deposited collateral against the borrowed assets
                and its underlying value.
              </p>
              <div className="flex items-center mt-6">
                <svg width="100%" height="40">
                  <defs>
                    <linearGradient
                      id="lineGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop
                        offset="5%" // Start with red
                        style={{ stopColor: "red", stopOpacity: 1 }}
                      />
                      <stop
                        offset="8%" // Transition to orange
                        style={{ stopColor: "orange", stopOpacity: 1 }}
                      />
                      <stop
                        offset="10%" // Transition to green
                        style={{ stopColor: "green", stopOpacity: 1 }}
                      />
                      <stop
                        offset="100%" // Continue with green
                        style={{ stopColor: "green", stopOpacity: 1 }}
                      />
                    </linearGradient>
                  </defs>

                  <rect
                    className="transition-bar"
                    x="0"
                    y="15"
                    width="100%"
                    height="2"
                    fill="url(#lineGradient)"
                  />
                  <rect
                    className="transition-bar"
                    x={`${healthFactorMinPosition}%`}
                    y="12"
                    width="0.25%"
                    height="9"
                    fill="red"
                  />
                  <rect
                    className="transition-bar"
                    x={`${healthFactorPosition}%`}
                    y="12"
                    width="0.25%"
                    height="9"
                    fill={healthFactorColor}
                  />
                  <text
                    className="transition-text"
                    x={`${healthFactorPosition}%`}
                    y="9"
                    fill={healthFactorColor}
                    fontSize="13"
                    textAnchor={healthFactorPosition > 50 ? "left" : "right"}
                    dx={healthFactorPosition > 50 ? "-3.4em" : "-0.001em"}
                    dy=".04em"
                  >
                    {parseFloat(health_Factor_Value)?.toFixed(2) || "0.00"}
                  </text>

                  <text
                    className="transition-text"
                    x={`${healthFactorMinPosition}%`}
                    y="35"
                    fill="red"
                    fontSize="14"
                    textAnchor="middle"
                  >
                    {healthFactorMinValue}
                  </text>
                </svg>
                <span
                  className={`ml-2 px-4 py-1 font-bold rounded-l-2xl rounded-r-2xl cursor-pointer ${health_Factor_Value > 3
                    ? "bg-green-200 text-green-700" // Light green background with green text
                    : health_Factor_Value <= 1
                      ? "bg-red-200 text-red-700" // Light red background with red text
                      : health_Factor_Value <= 1.5
                        ? "bg-orange-100 text-orange-500" // Soft orange background with orange text
                        : health_Factor_Value <= 2
                          ? "bg-orange-200 text-orange-300" // Light orange background with softer orange text
                          : "bg-orange-300 text-orange-600" // Light vivid orange background with vivid orange text
                    }`}
                >
                  {parseFloat(health_Factor_Value)?.toFixed(2) || "0.00"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 dark:text-darkTextSecondary">
                If the health factor goes below {healthFactorMinValue}, the{" "}
                {liquidationThresholdLabel.toLowerCase()} of your collateral
                might be triggered.
              </p>
            </div>
            <div className="border border-gray-600 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-darkText">
                Current LTV
              </h4>
              <p className="text-sm text-gray-500 dark:text-darkTextSecondary">
                Your current loan to value based on your collateral supplied.
              </p>
              <div className="flex items-center mt-4">
                <svg width="100%" height="75">
                  <defs>
                    <linearGradient
                      id="lineGradientt"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop
                        offset="0%" // Start green
                        style={{ stopColor: "green", stopOpacity: 1 }}
                      />
                      <stop
                        offset={`${currentMaxLtvPosition-1}%`} // End of green
                        style={{ stopColor: "green", stopOpacity: 1 }}
                      />
                      <stop
                        offset={`${currentMaxLtvPosition-1}%`} // Start of orange
                        style={{ stopColor: "#fa6e0d", stopOpacity: 1 }}
                      />
                      <stop
                        offset={`${currentLTVThresholdPosition-1}%`} // End of orange and start of red
                        style={{ stopColor: "#fa6e0d", stopOpacity: 1 }} // Keep orange until the threshold position
                      />
                      <stop
                        offset={`${currentLTVThresholdPosition}%`} // Start of red
                        style={{ stopColor: "red", stopOpacity: 1 }} // Start red at the threshold position
                      />
                      <stop
                        offset="100%" // Fill the rest with red
                        style={{ stopColor: "red", stopOpacity: 1 }}
                      />
                    </linearGradient>
                  </defs>

                  <rect
                    className="transition-bar"
                    x="0"
                    y="30"
                    width="100%"
                    height="2"
                    fill="url(#lineGradientt)"
                  />
                  <rect
                    className="transition-bar"
                    x={
                      currentLTVThresholdPosition > 50
                        ? `${currentLTVThresholdPosition - 1}%`
                        : `${currentLTVThresholdPosition - 0.025}%`
                    }
                    y="27"
                    width="0.25%"
                    height="9"
                    fill="red"
                  />
                  <rect
                    className="transition-bar"
                    x={`${Math.max(currentLTVPosition - 0.25, 0)}%`} // Move slightly left to prevent cutting off
                    y="27"
                    width="0.25%"
                    height="9"
                    fill={ltvColor}
                  />
                  <text
                    className="transition-text"
                    x={`${currentLTVPosition}%`}
                    y="35" // Adjust this value to move it down, try increasing it
                    fill={ltvColor}
                    fontSize="12"
                    textAnchor={currentLTVPosition > 50 ? "left" : "right"}
                    dy="1em"
                    dx={currentLTVPosition > 50 ? "-1em" : "-0.01em"}
                  >
                    {parseFloat(Ltv_Value)?.toFixed(2) || "0"}
                  </text>
                  <rect
                    className="transition-bar"
                    x={
                      currentMaxLtvPosition > 50
                        ? `${currentMaxLtvPosition - 1}%`
                        : `${currentMaxLtvPosition - 0.025}%`
                    }
                    y="27"
                    width="0.25%"
                    height="9"
                    fill="#fa6e0d"
                  />

                  <text
                    className="transition-text font-semibold"
                    x={`${currentMaxLtvPosition}%`} // Move the text 2% to the left
                    y="55"
                    dy="0.5em"
                    fill="#fa6e0d"
                    fontSize="12"
                    textAnchor={currentMaxLtvPosition > 50 ? "left" : "right"}
                    dx={currentMaxLtvPosition > 50 ? "-3.6em" : "-0.01em"}
                  >
                    {parseFloat(Max_Ltv)?.toFixed(2) || "0.00"}
                    {" "} <tspan className="font-light text-[10px]" dy={currentMaxLtvPosition > 50 ? "1.2em" : "0.0em"} dx={currentMaxLtvPosition > 50 ? "-4.3em" : "0.1em"} >(Max Ltv)</tspan>
                  </text>

                  <text
                    className="transition-text font-semibold"
                    x={`${currentLTVThresholdPosition}%`}
                    y="25"
                    fill="red"
                    fontSize="12"
                    textAnchor={
                      currentLTVThresholdPosition > 50 ? "left" : "right"
                    }
                    dx={currentLTVThresholdPosition > 50 ? "-5em" : "-0.01em"}
                  >
                    {liquidationThreshold_Value}
                    <tspan className="font-light" dy={currentLTVThresholdPosition > 50 ? "-1.2em" : "0.0em"} dx={currentLTVThresholdPosition > 50 ? "-4.3em" : "0.1em"}>
                      {" "}  {currentLTVThresholdPosition > 50
                        ? "(Liq Thrs.)"
                        : `(${liquidationThresholdLabel})`}
                    </tspan>
                  </text>
                </svg>
                <span
                  className={`ml-2 px-4 py-1 -mt-3
                  ${Ltv_Value >= liquidationThreshold_Value // Check if LTV is greater than or equal to the liquidation threshold
                      ? "bg-red-200" // Light red for liquidation threshold
                      : Ltv_Value >= Max_Ltv // Check if LTV is equal to or greater than Max LTV
                        ? "bg-[#fae8b3]" // Light orange if LTV equals Max LTV or is in the range
                        : "bg-green-200" // Light green if LTV is less than Max LTV
                    } 
                  font-bold rounded-l-2xl rounded-r-2xl cursor-pointer ${Ltv_Value >= liquidationThreshold_Value
                      ? "text-red-700"
                      : Ltv_Value >= Max_Ltv
                        ? "text-[#fa6e0d]"
                        : "text-green-700"
                    }`}
                >
                  {parseFloat(Ltv_Value)?.toFixed(2) || "0.00"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-6 dark:text-darkTextSecondary">
                If your loan to value goes above {liquidationThreshold_Value},
                your collateral may be liquidated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskPopup;
