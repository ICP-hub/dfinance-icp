import React, { useEffect, useRef } from 'react';
import {
    healthFactorValue,
    healthFactorCutOutPositions,
    currentLTVValue,
    currentLTVCutOutPositions,
    healthFactorMinValue,
    currentLTVThreshold,
    liquidationThresholdLabel
} from '../../../utils/constants';
import { X } from 'lucide-react';

const RiskPopup = ({ onClose }) => {
    const popupRef = useRef(null);

    const handleClickOutside = (event) => {
        if (popupRef.current && !popupRef.current.contains(event.target)) {
            onClose();
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, []);

    // Helper function to calculate the position for Health Factor
    const calculateHealthFactorPosition = (value) => {
        // Scale value to percentage (assuming value is between 0 and 10)
        return Math.max(0, Math.min(100, value * 10)); // Clamping between 0 and 100
    };

    // Helper function to calculate the position for LTV
    const calculateLTVPosition = (value, min, max) => {
        return ((value - min) / (max - min)) * 100;
    };

    // Dynamic positions for Health Factor
    const healthFactorPosition = calculateHealthFactorPosition(healthFactorValue);
    console.log('Health Factor Value:', healthFactorValue);
    console.log('Health Factor Position:', healthFactorPosition);

    // Dynamic positions for Current LTV
    const currentLTVPosition = calculateLTVPosition(currentLTVValue, 0, 100); // Assuming range is 0 to 100
    console.log('Current LTV Value:', currentLTVValue);
    console.log('Current LTV Position:', currentLTVPosition);

    // Determine colors based on value positions
    const healthFactorColor = healthFactorValue < healthFactorMinValue ? 'yellow' : 'green';
    const ltvColor = currentLTVValue > currentLTVThreshold ? 'yellow' : 'green';

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black opacity-50"></div>

            <div ref={popupRef} className="bg-white rounded-lg overflow-hidden shadow-lg w-[380px] lg:w-[780px] mx-4 sm:mx-auto z-10 p-4 relative dark:bg-darkOverlayBackground">
                {/* Close button */}
                <div
                    className="h-6 absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6 cursor-pointer"
                    onClick={onClose}
                >
                    <X className="text-black dark:text-darkText w-6 h-6" />
                </div>
                <div className="px-6 py-4">
                    <div className="flex justify-between items-center pb-3">
                        <h3 className="text-lg font-semibold text-center w-full text-[#4659CF] dark:text-darkText">Liquidation Risk Parameters</h3>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-darkText">
                        Your health factor and loan to value determine the assurance of your collateral. To avoid liquidations, you can supply more collateral or repay borrow positions. <a href="#" className="text-blue-500 underline">Learn more</a>
                    </div>
                    <div className="mt-4 space-y-6">
                        <div className="border border-gray-600 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-700 dark:text-darkText">Health Factor</h4>
                            <p className="text-sm text-gray-500 mb-2 dark:text-darkTextSecondary">
                                Safety of your deposited collateral against the borrowed assets and its underlying value.
                            </p>
                            <div className="flex items-center mt-4">
                                <svg width="100%" height="40">
                                    {/* Define the gradient */}
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="5%" style={{ stopColor: 'red', stopOpacity: 1 }} />
                                            <stop offset="60%" style={{ stopColor: 'yellow', stopOpacity: 1 }} />
                                            <stop offset="100%" style={{ stopColor: 'lightgreen', stopOpacity: 1 }} />
                                        </linearGradient>
                                    </defs>

                                    {/* Background line */}
                                    <rect x="0" y="15" width="100%" height="2" fill="url(#lineGradient)" />

                                    {/* Cut-out rectangles */}
                                    <rect x={`${healthFactorCutOutPositions.green}%`} y="12" width="0.25%" height="9" fill="red" />
                                 
                                    {/* Current health factor value marker */}
                                    <rect x={`${healthFactorPosition}%`} y="12" width="0.25%" height="9" fill={healthFactorColor} />
                                    <text x={`${healthFactorPosition}%`} y="9" fill="white" fontSize="12" textAnchor="middle" dx="0.3em" dy=".07em">{healthFactorValue}</text>

                                    {/* Percentage markers */}
                                    <text x={`${healthFactorCutOutPositions.green}%`} y="35" fill="red" fontSize="12" textAnchor="middle">{healthFactorMinValue}</text>
                                </svg>
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-500 font-bold rounded">{healthFactorValue}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 dark:text-darkTextSecondary">If the health factor goes below {healthFactorMinValue}, the {liquidationThresholdLabel.toLowerCase()} of your collateral might be triggered.</p>
                        </div>
                        <div className="border border-gray-600 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-700 dark:text-darkText">Current LTV</h4>
                            <p className="text-sm text-gray-500 dark:text-darkTextSecondary">
                                Your current loan to value based on your collateral supplied.
                            </p>
                            <div className="flex items-center mt-4">
                                <svg width="100%" height="40">
                                    {/* Define the gradient */}
                                    <defs>
                                        <linearGradient id="lineGradientt" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="20%" style={{ stopColor: 'green', stopOpacity: 1 }} />
                                            <stop offset="70%" style={{ stopColor: '#C0F9BC', stopOpacity: 1 }} />
                                            <stop offset="100%" style={{ stopColor: '#E9E9E9', stopOpacity: 1 }} />
                                        </linearGradient>
                                    </defs>

                                    {/* Background line */}
                                    <rect x="0" y="15" width="100%" height="2" fill="url(#lineGradientt)" />

                                    {/* Cut-out rectangles */}
                                    <rect x={`${currentLTVCutOutPositions.red}%`} y="12" width="0.25%" height="9" fill="red" />

                                    {/* Current LTV value marker */}
                                    <rect x={`${currentLTVPosition}%`} y="12" width="0.25%" height="9" fill={ltvColor} />
                                    <text x={`${currentLTVPosition}%`} y="30" fill="white" fontSize="12" textAnchor="middle" dx="0.1em" dy=".2em">{currentLTVValue}</text>

                                    {/* Percentage markers */}
                                    <text x={`${currentLTVCutOutPositions.red}%`} y="10" fill="red" fontSize="12" textAnchor="middle">{currentLTVThreshold}</text>
                                    <text x={`${currentLTVCutOutPositions.red}%`} y="40" fill="red" fontSize="12" textAnchor="middle">{liquidationThresholdLabel}</text>
                                </svg>
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-500 font-bold rounded cursor-pointer">{currentLTVValue}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-6 dark:text-darkTextSecondary">If your loan to value goes above {currentLTVThreshold}, your collateral may be liquidated.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskPopup;
