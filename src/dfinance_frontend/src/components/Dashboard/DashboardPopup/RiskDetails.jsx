import React, { useEffect, useRef } from "react";
import { liquidationThresholdLabel } from "../../../utils/constants";
import { X } from "lucide-react";
import { useSelector } from "react-redux";

/**
 * RiskPopup Component
 *
 * This component displays a popup that provides details about the liquidation risk parameters of a user's collateral.
 * It includes information such as the health factor, loan-to-value (LTV) ratio, and liquidation thresholds.
 *
 * @param {Object} props - The component props containing user data and necessary functions.
 * @param {Function} onClose - Function to close the popup.
 * @param {Object} userData - User's data for calculating liquidation risk.
 * @param {Object} userAccountData - User's account data, including collateral, debt, and liquidation thresholds.
 * @returns {JSX.Element} - Returns the RiskPopup component, displaying liquidation risk parameters.
 */

const RiskPopup = ({ onClose, userData, userAccountData }) => {

  /* ===================================================================================
   *                                  REDUX-SELECTER
   * =================================================================================== */
  const popupRef = useRef(null);
  const theme = useSelector((state) => state.theme.theme);

  /* ===================================================================================
   *                                  FUNCTIONS
   * =================================================================================== */

  const totalCollateral =parseFloat(Number(userAccountData?.Ok?.[0]) / 100000000) || 0;
  const totalDebt = parseFloat(Number(userAccountData?.Ok?.[1]) / 100000000) || 0;
  const health_Factor_Value = Number(userAccountData?.Ok?.[4]) / 10000000000 > 100   ? Infinity   : parseFloat((Number(userAccountData?.Ok?.[4]) / 10000000000).toFixed(2));
  const Ltv_Value = (totalDebt / totalCollateral) * 100;
  const liquidationThreshold_Value =Number(userAccountData?.Ok?.[3]) / 100000000 || 0  ? (Number(userAccountData?.Ok?.[3]) / 100000000).toFixed(2)  : "0.00";
  const healthFactorMinValue = 1;
  const Max_Ltv = parseFloat(Number(userAccountData?.Ok?.[2]) / 100000000).toFixed(2);

  const handleClickOutside = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      onClose();
    }
  };

  /**
   * Calculates the position of the health factor value on a scale from 0 to 100.
   *
   * @param {number} value - The health factor value.
   * @returns {number} - The calculated position of the health factor value.
   */
  const calculateHealthFactorPosition = (value) => {
    if (typeof value !== "number" || isNaN(value)) {
      return NaN;
    }
    if (value === Infinity) {
      return 100;
    } else if (value === -Infinity) {
      return 0;
    }
    const minValue = 0;
    const maxValue = 100;
    const offset = 5;
    const position = Math.max(
      0,
      Math.min(
        100,
        ((value - minValue) / (maxValue - minValue)) * (100 - offset) + offset
      )
    );
    return value === 0 ? 0 : position;
  };

  /**
   * Calculates the position of the Loan-to-Value (LTV) ratio on a scale from 0 to 100.
   *
   * @param {number} value - The LTV value.
   * @param {number} min - The minimum threshold for the LTV.
   * @param {number} max - The maximum threshold for the LTV.
   * @returns {number} - The calculated position of the LTV ratio.
   */
  const calculateLTVPosition = (value, min, max) => {
    if (
      typeof value !== "number" ||
      typeof min !== "number" ||
      typeof max !== "number" ||
      min === max
    ) {
      return NaN;
    }
    return ((value - min) / (max - min)) * 100;
  };

  /**
   * Calculates the position of the maximum Loan-to-Value (LTV) ratio on a scale from 0 to 100.
   * It represents the maximum LTV threshold as a percentage of the allowable range.
   *
   * @param {number} value - The maximum LTV value.
   * @param {number} min - The minimum threshold for the LTV.
   * @param {number} max - The maximum threshold for the LTV.
   * @returns {number} - The calculated position of the maximum LTV ratio.
   */
  const calculateMaxLTVPosition = (value, min, max) => {
    if (
      typeof value !== "number" ||
      typeof min !== "number" ||
      typeof max !== "number" ||
      min === max
    ) {
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
  const healthFactorPosition =calculateHealthFactorPosition(health_Factor_Value);
  const healthFactorMinPosition =calculateHealthFactorPosition(healthFactorMinValue);
  const currentLTVPosition = calculateLTVPosition(Ltv_Value, 0, 100);
  const currentLTVThresholdPosition = calculateLTVPosition(thresholdValue,0,100);
  const currentMaxLtvPosition = calculateMaxLTVPosition(MaxLtvValue, 0, 100);

  const healthFactorColor =
    theme === "dark"
      ? health_Factor_Value > 3
        ? "#2ecc71"
        : health_Factor_Value <= 1
        ? "#e74c3c"
        : health_Factor_Value <= 1.5
        ? "#e67e22"
        : health_Factor_Value <= 2
        ? "#f1c40f"
        : "#d35400"
      : health_Factor_Value > 3
      ? "#1e8b47"
      : health_Factor_Value <= 1
      ? "red"
      : health_Factor_Value <= 1.5
      ? "#fa6e0d"
      : health_Factor_Value <= 2
      ? "#ea580c"
      : "orange";

  const ltvColor =
    theme === "dark"
      ? Ltv_Value >= liquidationThreshold_Value
        ? "#e74c3c"
        : Ltv_Value >= Max_Ltv
        ? "#e67e22"
        : "#2ecc71"
      : Ltv_Value >= liquidationThreshold_Value
      ? "red"
      : Ltv_Value >= Max_Ltv
      ? "#fa6e0d"
      : "#1e8b47";

  const MaxltvColor =
    theme === "dark"
      ? Ltv_Value >= Max_Ltv
        ? "#e67e22"
        : Ltv_Value < Max_Ltv
        ? "#008000"
        : "#00FFFF"
      : Ltv_Value >= Max_Ltv
      ? "#fa6e0d"
      : Ltv_Value < Max_Ltv
      ? "#1e8b47"
      : "#00FFFF";

  /* ===================================================================================
   *                                  EFFECTS
   * =================================================================================== */

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, []);

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 transition-bar">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div
        ref={popupRef}
        className="bg-white rounded-lg overflow-y-auto shadow-lg w-full max-w-[400px] lg:max-w-[780px] max-h-[95vh] mx-4 sm:mx-auto z-10 lg:p-4 p-1 relative dark:bg-darkOverlayBackground"
      >
        <div
          className="h-6 absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6 cursor-pointer button1"
          onClick={onClose}
        >
          <X className="text-black dark:text-darkText w-6 h-6" />
        </div>
        <div className="px-6 py-4">
          <div className="flex justify-between items-center pb-3">
            <h3 className="lg:text-lg text-sm font-semibold text-center w-full text-[#4659CF] dark:text-darkText">
              Liquidation Risk Parameters
            </h3>
          </div>
          <div className="mt-2 lg:text-sm text-xs text-gray-500 dark:text-darkText">
            Your health factor and loan to value determine the assurance of your
            collateral. To avoid liquidations, you can supply more collateral or
            repay borrow positions.
          </div>
          <div className="mt-4 space-y-6">
            <div className="border border-gray-600 rounded-lg p-4">
              <h4 className="lg:text-sm text-xsfont-semibold text-blue-700 dark:text-darkText">
                Health Factor
              </h4>
              <p className="lg:text-sm text-xs text-gray-500 mb-2 dark:text-darkTextSecondary">
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
                        offset="8%"
                        style={{ stopColor: "orange", stopOpacity: 1 }}
                      />
                      <stop
                        offset="10%"
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
                  className={`ml-2 px-4 py-1 font-bold rounded-l-2xl rounded-r-2xl cursor-pointer ${
                    health_Factor_Value > 3
                      ? "bg-green-200 text-green-700"
                      : health_Factor_Value <= 1
                      ? "bg-red-200 text-red-700"
                      : health_Factor_Value <= 1.5
                      ? "bg-orange-100 text-orange-500"
                      : health_Factor_Value <= 2
                      ? "bg-orange-300 text-orange-600"
                      : "bg-orange-400 text-orange-800"
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
              <h4 className="lg:text-sm text-xs font-semibold text-blue-700 dark:text-darkText">
                Current LTV
              </h4>
              <p className="lg:text-sm text-xs text-gray-500 dark:text-darkTextSecondary">
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
                        offset="0%"
                        style={{ stopColor: "green", stopOpacity: 1 }}
                      />
                      <stop
                        offset={`${currentMaxLtvPosition - 1}%`}
                        style={{ stopColor: "green", stopOpacity: 1 }}
                      />
                      <stop
                        offset={`${currentMaxLtvPosition - 1}%`}
                        style={{ stopColor: "#fa6e0d", stopOpacity: 1 }}
                      />
                      <stop
                        offset={`${currentLTVThresholdPosition - 1}%`}
                        style={{ stopColor: "#fa6e0d", stopOpacity: 1 }}
                      />
                      <stop
                        offset={`${currentLTVThresholdPosition}%`}
                        style={{ stopColor: "red", stopOpacity: 1 }}
                      />
                      <stop
                        offset="100%"
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
                    x={
                      currentLTVPosition > 50
                        ? `${currentLTVPosition - 1}%`
                        : `${currentLTVPosition - 0.025}%`
                    }
                    y="27"
                    width="0.25%"
                    height="9"
                    fill={ltvColor}
                  />
                  <text
                    className="transition-text"
                    x={`${currentLTVPosition}%`}
                    y="35"
                    fill={ltvColor}
                    fontSize="12"
                    textAnchor={currentLTVPosition > 50 ? "left" : "right"}
                    dy="1em"
                    dx={currentLTVPosition > 50 ? "-2.5em" : "-0.01em"}
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
                    x={`${currentMaxLtvPosition}%`}
                    y="55"
                    dy="0.5em"
                    fill="#fa6e0d"
                    fontSize="12"
                    textAnchor={currentMaxLtvPosition > 50 ? "left" : "right"}
                    dx={currentMaxLtvPosition > 50 ? "-3.6em" : "-0.01em"}
                  >
                    {parseFloat(Max_Ltv)?.toFixed(2) || "0.00"}{" "}
                    <tspan
                      className="font-light text-[10px]"
                      dy={currentMaxLtvPosition > 50 ? "1.2em" : "0.0em"}
                      dx={currentMaxLtvPosition > 50 ? "-4.3em" : "0.1em"}
                    >
                      (Max Ltv)
                    </tspan>
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
                    <tspan
                      className="font-light"
                      dy={currentLTVThresholdPosition > 50 ? "-1.2em" : "0.0em"}
                      dx={currentLTVThresholdPosition > 50 ? "-4.3em" : "0.1em"}
                    >
                      {" "}
                      {currentLTVThresholdPosition > 50
                        ? "(Liq Thrs.)"
                        : `(${liquidationThresholdLabel})`}
                    </tspan>
                  </text>
                </svg>
                <span
                  className={`ml-2 px-4 py-1 -mt-3
                  ${
                    Ltv_Value >= liquidationThreshold_Value
                      ? "bg-red-200"
                      : Ltv_Value >= Max_Ltv
                      ? "bg-[#fae8b3]"
                      : "bg-green-200"
                  } 
                  font-bold rounded-l-2xl rounded-r-2xl cursor-pointer ${
                    Ltv_Value >= liquidationThreshold_Value
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
