import React from 'react';
import { 
    healthFactorValue, 
    healthFactorCutOutPositions, 
    currentLTVValue, 
    currentLTVCutOutPositions, 
    healthFactorMinValue, 
    currentLTVThreshold, 
    liquidationThresholdLabel 
} from '../../utils/constants';

const RiskPopup = ({ onClose }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg max-w-3xl mx-auto z-10 border p-4 relative">
                {/* Close button */}
                <button
                    className="text-gray-600 hover:text-gray-900 absolute top-4 right-4"
                    onClick={onClose}
                >
                    &times;
                </button>
                <div className="px-6 py-4">
                    <div className="flex justify-between items-center pb-3">
                        <h3 className="text-lg font-semibold text-center w-full" style={{ color: '#4659CF' }}>Liquidation Risk Parameters</h3>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                        Your health factor and loan to value determine the assurance of your collateral. To avoid liquidations, you can supply more collateral or repay borrow positions. <a href="#" className="text-blue-500 underline">Learn more</a>
                    </div>
                    <div className="mt-4 space-y-6">
                        <div className="border border-gray-600 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-700">Health Factor</h4>
                            <p className="text-sm text-gray-500 mb-2">
                                Safety of your deposited collateral against the borrowed assets and its underlying value.
                            </p>
                            <div className="flex items-center mt-4">
                                <svg width="100%" height="40">
                                    {/* Define the gradient */}
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="5%" style={{ stopColor: 'red', stopOpacity: 1 }} />
                                            <stop offset="60%" style={{ stopColor: 'yellow', stopOpacity: 1 }} />
                                            <stop offset="30%" style={{ stopColor: 'green', stopOpacity: 1 }} />
                                        </linearGradient>
                                    </defs>

                                    {/* Background line */}
                                    <rect x="0" y="15" width="100%" height="2" fill="url(#lineGradient)" />

                                    {/* Cut-out rectangles */}
                                    <rect x={`${healthFactorCutOutPositions.green}%`} y="12" width="0.25%" height="9" fill="red" mt-4 />
                                    <rect x={`${healthFactorCutOutPositions.red}%`} y="12" width="0.25%" height="9" fill="green" mt-4 />

                                    {/* Percentage markers */}
                                    <text x={`${healthFactorCutOutPositions.green}%`} y="35" fill="red" fontSize="12" textAnchor="middle">{healthFactorMinValue}</text>
                                    <text x={`${healthFactorCutOutPositions.red}%`} y="10" fill="blue" fontSize="12" textAnchor="middle">{healthFactorValue}</text>
                                </svg>
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-500 font-bold rounded">{healthFactorValue}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">If the health factor goes below {healthFactorMinValue}, the {liquidationThresholdLabel.toLowerCase()} of your collateral might be triggered.</p>
                        </div>
                        <div className="border border-gray-600 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-700">Current LTV</h4>
                            <p className="text-sm text-gray-500">
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
                                    <rect x={`${currentLTVCutOutPositions.green}%`} y="12" width="0.25%" height="9" fill="green" mt-4 />
                                    <rect x={`${currentLTVCutOutPositions.red}%`} y="12" width="0.25%" height="9" fill="red" mt-4 />

                                    {/* Percentage markers */}
                                    <text x={`${currentLTVCutOutPositions.green}%`} y="10" fill="green" fontSize="12" textAnchor="middle">{currentLTVValue}%</text>
                                    <text x={`${currentLTVCutOutPositions.red}%`} y="10" fill="red" fontSize="12" textAnchor="middle">{currentLTVThreshold}</text>
                                    <text x={`${currentLTVCutOutPositions.red}%`} y="40" fill="red" fontSize="12" textAnchor="middle">{liquidationThresholdLabel}</text>
                                </svg>
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-500 font-bold rounded">{currentLTVValue}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-6">If your loan to value goes above {currentLTVThreshold}, your collateral may be liquidated.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskPopup;
