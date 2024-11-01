// PointSystemPage.jsx
import React, { useState,useEffect } from "react";
import HeroSection from "./HeroSection";
import { FaCheckCircle } from "react-icons/fa";
import  CheckCircleIcon  from "../../../public/Helpers/tabler_blend-mode.svg"
import  borrowIcon  from "../../../public/Helpers/tabler_transaction-dollar.svg"
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../utils/useAuthClient";
import {
  
  FAQ_QUESTIONS_POINTSYSTEM,
  
} from "../../utils/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Leaderboard from "./Leaderboard";
const PointSystemPage = () => {
  const { principal, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(null);
  const [currentFAQ, setCurrentFAQ] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
 
  useEffect(() => {
    if (isAuthenticated=== false) {
      navigate("/dashboard"); // Redirect to dashboard if wallet is disconnected
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        const nextIndex = (currentFAQ + 1) % FAQ_QUESTIONS_POINTSYSTEM.length;
        setCurrentFAQ(nextIndex);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [currentFAQ, isPaused]);
  // Render content based on the selected section
  const renderContent = () => {
    switch (activeSection) {
      case "leaderboard":
        return (
          <div className="p-6 ">
          
          <Leaderboard/>
          </div>
        );
      case "breakdown":
        return (
          <div className="p-6 ">
            <h2 className="text-2xl font-bold mb-4 text-[#2A1F9D]  dark:text-darkTextSecondary">My Breakdown</h2>
            {/* Replace this with a breakdown card layout */}
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-[#fcfafa] dark:bg-bottom-left-to-top-right-gradient rounded-lg">
                <h3 className="font-semibold text-lg">Total Points: 2000</h3>
                <p>Details about point accumulation.</p>
              </div>
              <div className="p-4 bg-[#fcfafa] dark:bg-bottom-left-to-top-right-gradient rounded-lg">
                <h3 className="font-semibold text-lg">Redeemed Rewards</h3>
                <p>Details about rewards redeemed.</p>
              </div>
            </div>
          </div>
        );
      case "rates":
        return (
          <div className="p-6 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Rates Section */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-[#2A1F9D] dark:text-darkTextSecondary">Rates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#fcfafa]  flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl ">
                    <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 text-[#2A1F9D] dark:text-darkTextSecondary">
                      <img src={CheckCircleIcon} alt="Check Circle" className="w-5 h-5" /> Lending Positions
                    </h3>
                    <ul className="text-sm space-y-2 text-[#2A1F9D] dark:text-darkTextSecondary">
                      <li>✔️ 3 points per dollar per day in Stables</li>
                      <li>✔️ 2 points per dollar per day in BTC/ETH/ICP</li>
                      <li>✔️ 1 point per dollar per day in anything else (e.g., Liquid Staked tokens)</li>
                    </ul>
                  </div>
        
                  <div className="bg-[#fcfafa] flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl">
                    <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 text-[#2A1F9D] dark:text-darkTextSecondary">
                      <img src={borrowIcon} alt="Borrow Icon" className="w-5 h-5" /> Borrow Positions
                    </h3>
                    <ul className="text-sm space-y-2 text-[#2A1F9D] dark:text-darkTextSecondary">
                      <li>✔️ 3 points per dollar per day in anything else (e.g., Liquid Staked tokens)</li>
                      <li>✔️ 2 points per dollar per day in BTC/ETH/ICP</li>
                      <li>✔️ 1 point per dollar per day in Stables</li>
                    </ul>
                  </div>
                </div>
              </div>
        
              {/* Boosts Section */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-[#2A1F9D] dark:text-darkTextSecondary">Boosts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#fcfafa] flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-semibold mb-2 text-[#2A1F9D] dark:text-darkTextSecondary">First 7 Days</h3>
                    <p className="text-sm text-[#2A1F9D] dark:text-darkTextSecondary">
                      Lending within the first 7 days gives you a permanent boost of 2x for as long as those funds remain in those positions.
                    </p>
                  </div>
                  <div className="bg-[#fcfafa] flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-semibold mb-2 text-[#2A1F9D] dark:text-darkTextSecondary">Same Asset</h3>
                    <p className="text-sm text-[#2A1F9D] dark:text-darkTextSecondary">
                      If you provide the same asset in lending and borrowing positions, points are decreased by 0.5x.
                    </p>
                  </div>
                  <div className="bg-[#fcfafa] flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-semibold mb-2 text-[#2A1F9D] dark:text-darkTextSecondary">Liquidity</h3>
                    <p className="text-sm text-[#2A1F9D] dark:text-darkTextSecondary">
                      We can reduce the points by 0.5x for the debt user and increase the points by 1.5x for the liquidator for the particular transaction.
                    </p>
                  </div>
                  <div className="bg-[#fcfafa] flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-semibold mb-2 text-[#2A1F9D] dark:text-darkTextSecondary">Repay</h3>
                    <p className="text-sm text-[#2A1F9D] dark:text-darkTextSecondary">
                      We calculate the debt amount repaid and the collateral amount being liquidated, then adjust points by 1x/1.5x for both on the user side.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
        
      case "howItWorks":
        return (
          <div className="p-6 text-[#2A1F9D] dark:text-darkText">
            {/* Replace with informational cards or an FAQ */}
            <section className="" id="faq">
          <div className="w-full p-5 md:p-10 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-2xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
            <div className="w-full">
              <h1 className="text-[25px] font-inter md:text-[45px] font-extralight text-[#2A1F9D] dark:text-darkText">
                Frequently Asked Questions
              </h1>
            </div>
            <div
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="w-full md:grid grid-cols-2"
            >
              <div className="w-full relative z-10 flex h-auto md:h-auto items-center my-[29px]">
                <div className="w-full text-[12px] md:text-[15px] md:w-[115%] bg-white shadow md:relative rounded-xl overflow-hidden cursor-pointer dark:bg-bottom-left-to-top-right-gradient">
                  {FAQ_QUESTIONS_POINTSYSTEM.map((item, index) => (
                    <div key={index} className="w-full dark:text-darkText">
                      <div
                        className={`w-full flex p-4 items-center transition-opacity duration-300 ease-in-out ${currentFAQ === index
                            ? "bg-[#eef0f5] dark:bg-currentFAQBackground"
                            : ""
                          } hover:bg-[#FAFBFF] hover:dark:bg-currentFAQBackground`}
                        onClick={() => setCurrentFAQ(index)}
                      >
                        <div className="w-1/12">
                          <div
                            className={`w-4 h-4 rounded-full ${currentFAQ === index
                                ? "bg-[#517687] dark:bg-darkText"
                                : "bg-[#DBE8EE] dark:bg-[#192C35]"
                              }`}
                          ></div>
                        </div>
                        <div className="w-10/12">{item.question}</div>
                        <div
                          className={`w-1/12 ${currentFAQ === index
                              ? "text-[#517687] dark:text-darkText rotate-90 md:rotate-0"
                              : "text-[#DBE8EE] dark:text-[#192C35]"
                            } flex justify-end`}
                        >
                          <ChevronRight />
                        </div>
                      </div>
                      {currentFAQ === index && (
                        <div
                          className={`block animate-fade-down -z-10 md:hidden p-4 bg-[#FAFBFF] rounded-b-xl text-black max-h-full dark:bg-bottom-left-to-top-right-gradient dark:text-darkText transition-opacity duration-300 ${currentFAQ === index ? "opacity-100" : "opacity-0"
                            }`}
                        >
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {FAQ_QUESTIONS_POINTSYSTEM.filter((faq) => faq.id === currentFAQ).map(
                (faq) => (
                  <div
                    key={faq.id}
                    className="hidden md:block animate-fadeInLeft h-full text-[15px] ml-[-10px] bg-[#FAFBFF] rounded-xl text-black pl-[10%] p-6 dark:bg-bottom-left-to-top-right-gradient dark:text-darkText transition-opacity duration-300"
                  >
                    <h1 className="font-semibold mt-4">{faq.question}</h1>
                    <p className="mt-8">{faq.answer}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
          </div>
        );
      default:
        return (
         <Leaderboard/>
        );
    }
  };

  return (
    <div className=" min-h-screen">
      {/* Hero Section */}

      <HeroSection onSectionChange={setActiveSection} />

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        {renderContent()}
      </div>
    
    </div>
    
    
  );
};

export default PointSystemPage;
