import React, { useEffect, useRef } from 'react';
import {
    healthFactorValue,
    currentLTVValue,
    healthFactorMinValue,
    currentLTVThreshold,
    liquidationThresholdLabel
} from '../../../utils/constants';
import { X } from 'lucide-react';

const RiskPopup = ({ onClose, userData }) => {
    const popupRef = useRef(null);


    console.log("userdata in risk", userData)
    const health_Factor_Value = userData.Ok.health_factor;
    const Ltv_Value = userData.Ok.ltv;
    const liquidationThreshold_Value = 76.5;
    const healthFactorMinValue = 1;

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

    const calculateHealthFactorPosition = (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
            console.error('Invalid Health Factor value:', value);
            return NaN;
        }
        return Math.max(0, Math.min(100, (value / 10) * 100));
    };

    const calculateLTVPosition = (value, min, max) => {
        if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number' || min === max) {
            console.error('Invalid input values for LTV position calculation:', { value, min, max });
            return NaN;
        }
        return ((value - min) / (max - min)) * 100;
    };

    const parseThreshold = (threshold) => {
        if (typeof threshold === 'string') {
            const parsed = parseFloat(threshold.replace('%', ''));
            if (!isNaN(parsed)) return parsed;
        }
        return threshold;
    };

    const thresholdValue = parseThreshold(liquidationThreshold_Value);
    const healthFactorPosition = calculateHealthFactorPosition(health_Factor_Value);
    const healthFactorMinPosition = calculateHealthFactorPosition(healthFactorMinValue);
    const currentLTVPosition = calculateLTVPosition(Ltv_Value, 0, 100);
    const currentLTVThresholdPosition = calculateLTVPosition(thresholdValue, 0, 100);

    console.log('Health Factor Value:', health_Factor_Value);
    console.log('Health Factor Position:', healthFactorPosition);
    console.log('Health Factor Min Value:', healthFactorMinValue);
    console.log('Health Factor Min Position:', healthFactorMinPosition);
    console.log('Current LTV Value:', Ltv_Value);
    console.log('Current LTV Position:', currentLTVPosition);
    console.log('Current LTV Threshold:', liquidationThreshold_Value);
    console.log('Parsed Current LTV Threshold:', thresholdValue);
    console.log('Current LTV Threshold Position:', currentLTVThresholdPosition);

    const healthFactorColor = health_Factor_Value < healthFactorMinValue ? 'yellow' : 'green';
    const ltvColor = Ltv_Value > thresholdValue ? 'yellow' : 'green';

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 transition-bar">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div ref={popupRef} className="bg-white rounded-lg overflow-hidden shadow-lg w-[380px] lg:w-[780px] mx-4 sm:mx-auto z-10 p-4 relative dark:bg-darkOverlayBackground">
                <div className="h-6 absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6 cursor-pointer" onClick={onClose}>
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
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="5%" style={{ stopColor: 'red', stopOpacity: 1 }} />
                                            <stop offset="60%" style={{ stopColor: 'yellow', stopOpacity: 1 }} />
                                            <stop offset="100%" style={{ stopColor: 'lightgreen', stopOpacity: 1 }} />
                                        </linearGradient>
                                    </defs>
                                    <rect className="transition-bar" x="0" y="15" width="100%" height="2" fill="url(#lineGradient)" />
                                    <rect className="transition-bar" x={`${healthFactorMinPosition}%`} y="12" width="0.25%" height="9" fill="red" />
                                    <rect className="transition-bar" x={`${healthFactorPosition}%`} y="12" width="0.25%" height="9" fill={healthFactorColor} />
                                    <text className="transition-text" x={`${healthFactorPosition}%`} y="9" fill="gray" fontSize="12" textAnchor="middle" dx="0.3em" dy=".07em">{health_Factor_Value}</text>
                                    <text className='transition-text' x={`${healthFactorMinPosition}%`} y="35" fill="red" fontSize="12" textAnchor="middle">{healthFactorMinValue}</text>
                                </svg>
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-500 font-bold rounded">{health_Factor_Value}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 dark:text-darkTextSecondary">
                                If the health factor goes below {healthFactorMinValue}, the {liquidationThresholdLabel.toLowerCase()} of your collateral might be triggered.
                            </p>
                        </div>
                        <div className="border border-gray-600 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-700 dark:text-darkText">Current LTV</h4>
                            <p className="text-sm text-gray-500 dark:text-darkTextSecondary">
                                Your current loan to value based on your collateral supplied.
                            </p>
                            <div className="flex items-center mt-4">
                                <svg width="100%" height="40">
                                    <defs>
                                        <linearGradient id="lineGradientt" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="20%" style={{ stopColor: 'green', stopOpacity: 1 }} />
                                            <stop offset="70%" style={{ stopColor: '#C0F9BC', stopOpacity: 1 }} />
                                            <stop offset="100%" style={{ stopColor: '#E9E9E9', stopOpacity: 1 }} />
                                        </linearGradient>
                                    </defs>
                                    <rect className="transition-bar" x="0" y="15" width="100%" height="2" fill="url(#lineGradientt)" />
                                    <rect className="transition-bar" x={`${currentLTVThresholdPosition}%`} y="12" width="0.25%" height="9" fill="yellow" />
                                    <rect className="transition-bar" x={`${currentLTVPosition}%`} y="12" width="0.25%" height="9" fill={ltvColor} />
                                    <text className="transition-text" x={`${currentLTVPosition}%`} y="30" fill="gray" fontSize="12" textAnchor="left" dx="0.1em" dy=".2em">{Ltv_Value}</text>
                                    <text className="transition-text" x={`${currentLTVThresholdPosition}%`} y="10" fill="red" fontSize="12" textAnchor="middle">{liquidationThreshold_Value}</text>
                                    <text className="transition-text" x={`${currentLTVThresholdPosition}%`} y="40" fill="red" fontSize="12" textAnchor="middle">{liquidationThresholdLabel}</text>
                                </svg>
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-500 font-bold rounded cursor-pointer">{Ltv_Value}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-6 dark:text-darkTextSecondary">
                                If your loan to value goes above {liquidationThreshold_Value}, your collateral may be liquidated.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskPopup;