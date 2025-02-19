import React, { useState } from "react";
import { useSelector } from "react-redux";
import { ChevronDown, ChevronUp } from "lucide-react";
import star from "../../../public/Helpers/settings.svg";

const HeroSection = ({ onSectionChange }) => {
  const theme = useSelector((state) => state.theme.theme);
  const [activeSection, setActiveSection] = useState("leaderboard");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    onSectionChange(section);
    setIsDropdownOpen(false); // Close dropdown when a section is selected
  };

  // Map section keys to display names
  const sectionNames = {
    leaderboard: "Leaderboard",
    breakdown: "My Breakdown",
    rates: "Rates & Boosts",
    howItWorks: "How it works",
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-4 sm:p-8 lg:p-8 text-[#2A1F9D] text-lg dark:text-darkTextSecondary">
      {/* Logo and Tagline */}
      <div className="text-center mb-4">
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
        <p className="text-[12px] sm:text-[12px] lg:text-[14px] mt-2 text-[#233D63] dark:text-darkTextSecondary1">
          Earn Rewards by deploying assets into various products on DFinance
        </p>
      </div>

      {/* Divider */}
      <div className="flex gap-2 w-full justify-center pt-2 border-t border-gray-600 opacity-50"></div>

      {/* Small Screen Dropdown Navigation */}
      <div className="w-full flex justify-center mt-2">
        <div className="w-full sm:hidden flex flex-col items-center rounded-lg overflow-hidden">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-2 text-sm font-semibold text-center bg-[#4659CF]/10 dark:bg-bottom-left-to-top-right-gradient text-[#2A1F9D] dark:text-darkTextSecondary rounded-lg"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {sectionNames[activeSection]}
              {isDropdownOpen ? <ChevronUp /> : <ChevronDown />}
            </span>
          </button>

          {isDropdownOpen && (
            <div className="mt-1 w-full bg-[#4659CF]/20 dark:bg-bottom-left-to-top-right-gradient rounded-lg">
              {Object.keys(sectionNames).map((section) => (
                <button
                  key={section}
                  onClick={() => handleSectionChange(section)}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeSection === section
                      ? "font-semibold text-[#2A1F9D] bg-transparent"
                      : "text-[#233D63] bg-transparent"
                  } dark:text-darkTextSecondary1`}
                  style={{
                    border: "none",
                    padding: "8px 16px", // Consistent padding for all items
                    backgroundColor: "transparent", // Ensures no background color
                  }}
                >
                  {sectionNames[section]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Large Screen Horizontal Navigation */}
        <div className="hidden sm:flex gap-2 sm:gap-4 bg-[#4659CF]/15 dark:bg-bottom-left-to-top-right-gradient rounded-lg w-fit">
          {Object.keys(sectionNames).map((section) => (
            <button
              key={section}
              onClick={() => handleSectionChange(section)}
              className={`text-xs sm:text-sm lg:text-base px-3 sm:px-4 py-1 sm:py-2 rounded-md transition ${
                activeSection === section
                  ? "flex items-center gap-2 z-20 focus:outline-none box shadow-lg text-sm font-semibold rounded-lg text-[#2A1F9D] dark:text-darkTextSecondary"
                  : "text-[#233D63] dark:text-darkTextSecondary1"
              }`}
            >
              {sectionNames[section]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
