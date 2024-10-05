import React, { useEffect, useRef } from "react";
import { liquidationThresholdLabel } from "../../../utils/constants";
import { X } from "lucide-react";

const RiskPopup = ({ onClose, userData }) => {
  const popupRef = useRef(null);

  console.log("userdata in risk", userData);
  const health_Factor_Value =
    parseFloat(userData.Ok.health_factor) > 100
      ? Infinity
      : parseFloat(userData.Ok.health_factor);

  const Ltv_Value = parseFloat(userData.Ok.ltv * 100);

  const liquidationThreshold_Value = userData?.Ok.liquidation_threshold * 100;
  console.log("liquidationThresholdValue", liquidationThreshold_Value);
  const healthFactorMinValue = 1;
  const Max_Ltv = 50;
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

  const healthFactorColor =
    health_Factor_Value > 3
      ? "green"
      : health_Factor_Value <= 1
      ? "red"
      : health_Factor_Value <= 1.5
      ? "orange"
      : health_Factor_Value <= 2
      ? "yellow"
      : "vivid orange";
  const ltvColor =
    Ltv_Value >= liquidationThreshold_Value
      ? "red"
      : Ltv_Value < liquidationThreshold_Value
      ? "green"
      : "orange";
  const MaxltvColor =
    Ltv_Value >= Max_Ltv
      ? "#fa6e0d" // Dark brown
      : Ltv_Value <= Max_Ltv
      ? "#008000" // Green
      : "#00FFFF"; // Cyan

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
                        offset="5%"
                        style={{ stopColor: "red", stopOpacity: 1 }}
                      />
                      <stop
                        offset="10%"
                        style={{ stopColor: "orange", stopOpacity: 1 }}
                      />
                      <stop
                        offset="20%"
                        style={{ stopColor: "yellow", stopOpacity: 1 }}
                      />
                      <stop
                        offset="80%"
                        style={{ stopColor: "green", stopOpacity: 1 }}
                      />
                      <stop
                        offset="100%"
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
                    dx={healthFactorPosition > 50 ? "-3.4em" : "-0.01em"}
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
                  className={`ml-2 px-4 py-1 bg-[#b2ffac] font-bold rounded-l-2xl rounded-r-2xl cursor-pointer ${
                    health_Factor_Value > 3
                      ? "text-green-800" // Use appropriate Tailwind CSS class for green
                      : health_Factor_Value <= 1
                      ? "text-red-500" // Use appropriate Tailwind CSS class for red
                      : health_Factor_Value <= 1.5
                      ? "text-orange-500" // Use appropriate Tailwind CSS class for orange
                      : health_Factor_Value <= 2
                      ? "text-orange-300" // Use appropriate Tailwind CSS class for soft orange
                      : "text-orange-600" // Use appropriate Tailwind CSS class for vivid orange
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
                <svg width="100%" height="40">
                  <defs>
                    <linearGradient
                      id="lineGradientt"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop
                        offset="20%"
                        style={{ stopColor: "green", stopOpacity: 1 }}
                      />
                      <stop
                        offset="63%"
                        style={{ stopColor: "#fa6e0d", stopOpacity: 1 }} // Removed extra quotation mark
                      />
                      <stop
                        offset="65%" // Use a different offset for the red color
                        style={{ stopColor: "red", stopOpacity: 1 }}
                      />
                    </linearGradient>
                  </defs>

                  <rect
                    className="transition-bar"
                    x="0"
                    y="15"
                    width="100%"
                    height="2"
                    fill="url(#lineGradientt)"
                  />
                  <rect
                    className="transition-bar"
                    x={`${currentLTVThresholdPosition}%`}
                    y="12"
                    width="0.25%"
                    height="9"
                    fill="red"
                  />
                  <rect
                    className="transition-bar"
                    x={`${Math.max(currentLTVPosition - 0.25, 0)}%`} // Move slightly left to prevent cutting off
                    y="12"
                    width="0.25%"
                    height="9"
                    fill={ltvColor}
                  />
                  <text
                    className="transition-text"
                    x={`${currentLTVPosition}%`}
                    y="9"
                    fill={ltvColor}
                    fontSize="13"
                    textAnchor={currentLTVPosition > 50 ? "left" : "right"}
                    dx={currentLTVPosition > 50 ? "-3.4em" : "-0.01em"}
                    dy=".04em"
                  >
                    {" "}
                    {parseFloat(Ltv_Value)?.toFixed(2) || "0.00"}
                  </text>
                  <rect
                    className="transition-bar"
                    x={`${currentMaxLtvPosition}%`}
                    y="12"
                    width="0.25%"
                    height="9"
                    fill={MaxltvColor}
                  />
                  <text
                    className="transition-text"
                    x={`${currentMaxLtvPosition}%`}
                    y="10"
                    fill={MaxltvColor}
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {Max_Ltv}
                  </text>
                  <text
                    className="transition-text"
                    x={`${currentMaxLtvPosition - 2}%`} // Move the text 2% to the left
                    y="40"
                    dy="-0.2em"
                    fill={MaxltvColor}
                    fontSize="12"
                    textAnchor="middle"
                  >
                    Max Ltv
                  </text>

                  <text
                    className="transition-text"
                    x={`${currentLTVThresholdPosition}%`}
                    y="10"
                    fill="red"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {liquidationThreshold_Value}
                  </text>
                  <text
                    className="transition-text"
                    x={`${currentLTVThresholdPosition + 2}%`}
                    y="40"
                    dy="-0.2em"
                    fill="red"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {liquidationThresholdLabel}
                  </text>
                </svg>
                <span
  className={`ml-2 px-4 py-1 bg-[#b2ffac] font-bold rounded-l-2xl rounded-r-2xl cursor-pointer ${
    Ltv_Value >= liquidationThreshold_Value
      ? "text-red-500" // Red for liquidation threshold
      : Ltv_Value <= Max_Ltv
      ? "text-green-600" // Green if LTV is less than or equal to Max LTV
      : "text-[#fa6e0d]" // Orange for other values between Max LTV and liquidation threshold
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
