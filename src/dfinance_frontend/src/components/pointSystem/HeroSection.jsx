// HeroSection.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import star from "../../../public/Helpers/settings.svg";
import DFinanceLight from "../../../public/logo/DFinance-Light.svg";

const HeroSection = ({ onSectionChange }) => {
  const theme = useSelector((state) => state.theme.theme);
  const [activeSection, setActiveSection] = useState("leaderboard");

  const handleSectionChange = (section) => {
    setActiveSection(section);
    onSectionChange(section);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-4 mt-6 sm:p-8 lg:p-8 text-[#2A1F9D] text-lg dark:text-darkTextSecondary">
      {/* Logo and Tagline */}
      <div className="text-center mb-4 sm:mb-4 lg:mb-4">
        {/* Flex container for image and "DFinance" text */}
        <div className="flex items-center justify-center gap-2">
          <img
            src={star}
            alt="DFinance"
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
            style={{
              imageRendering: "-webkit-optimize-contrast",
              imageRendering: "crisp-edges",
            }}
          />
          <span className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#2A1F9D] dark:text-darkText">
            DFinance Points
          </span>
        </div>
        <p className="text-xs sm:text-sm lg:text-base mt-2 sm:mt-2 lg:mt-2 text-[#233D63] dark:text-darkTextSecondary1">
          Earn Rewards by deploying assets into various products on DFinance
        </p>
      </div>

      {/* Navigation Menu with Rectangular Buttons */}
      <div className="flex gap-2 sm:gap-2 w-full justify-center pt-2 border-t border-gray-600 opacity-50"></div>
      <div className="w-full flex justify-center mt-2 sm:mt-2 lg:mt-2">
        <div className="flex gap-2 sm:gap-4 bg-[#4659CF]/15 dark:bg-bottom-left-to-top-right-gradient rounded-lg w-fit">
          {["leaderboard", "breakdown", "rates", "howItWorks"].map((section) => (
            <button
              key={section}
              onClick={() => handleSectionChange(section)}
              className={`text-xs sm:text-sm lg:text-base px-3 sm:px-4 py-1 sm:py-2 rounded-md transition
                ${
                  activeSection === section
                    ? "flex items-center gap-2 z-20 py-2 px-4 focus:outline-none box shadow-lg text-sm font-semibold rounded-lg transition text-[#2A1F9D] dark:text-darkTextSecondary"
                    : "text-[#233D63] dark:text-darkTextSecondary1"
                }`}
            >
              {section === "leaderboard" && "Leaderboard"}
              {section === "breakdown" && "My Breakdown"}
              {section === "rates" && "Rates & Boosts"}
              {section === "howItWorks" && "How it works"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
