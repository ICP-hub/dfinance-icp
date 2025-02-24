// PointSystemPage.jsx
import React, { useState, useEffect } from "react";
import HeroSection from "./HeroSection";
import { FaCheckCircle } from "react-icons/fa";
import CheckCircleIcon from "../../../public/Helpers/tabler_blend-mode.svg";
import borrowIcon from "../../../public/Helpers/tabler_transaction-dollar.svg";
import { useNavigate } from "react-router-dom";
import star from "../../../public/Helpers/settings.svg";
import { useAuth } from "../../utils/useAuthClient";
import { FAQ_QUESTIONS_POINTSYSTEM } from "../../utils/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Leaderboard from "./Leaderboard";
import Breakdown from "./breakdown";

const PointSystemPage = () => {
  const { principal, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(null);
  const [currentFAQ, setCurrentFAQ] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isAuthenticated === false) {
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
          <div className="p-0 md:p-6 ">
            <Leaderboard />
          </div>
        );
      case "breakdown":
        return (
          <div>
            <Breakdown />
          </div>
        );
      case "rates":
        return (
          <div className="p-0 md:p-6">
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Rates Section */}
              <div>
                <h2 className="text-2xl -mt-5 font-bold mb-6 text-[#2A1F9D] dark:text-darkTextSecondary">
                  Rates
                </h2>
                <div className="grid grid-cols-1 lgx:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50  flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl ">
                    <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 text-[#2A1F9D] dark:text-darkTextSecondary1">
                      <div className="flex items-center">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 text-[#2A1F9D] dark:text-darkTextSecondary1"
                        >
                          <path
                            d="M8 9.5C8 11.2239 8.68482 12.8772 9.90381 14.0962C11.1228 15.3152 12.7761 16 14.5 16C16.2239 16 17.8772 15.3152 19.0962 14.0962C20.3152 12.8772 21 11.2239 21 9.5C21 7.77609 20.3152 6.12279 19.0962 4.90381C17.8772 3.68482 16.2239 3 14.5 3C12.7761 3 11.1228 3.68482 9.90381 4.90381C8.68482 6.12279 8 7.77609 8 9.5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M3 14.5C3 16.2239 3.68482 17.8772 4.90381 19.0962C6.12279 20.3152 7.77609 21 9.5 21C11.2239 21 12.8772 20.3152 14.0962 19.0962C15.3152 17.8772 16 16.2239 16 14.5C16 12.7761 15.3152 11.1228 14.0962 9.90381C12.8772 8.68482 11.2239 8 9.5 8C7.77609 8 6.12279 8.68482 4.90381 9.90381C3.68482 11.1228 3 12.7761 3 14.5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="ml-2">Lending Positions</span>
                      </div>
                    </h3>
                    <ul className="text-[13px] space-y-2 text-[#2A1F9D] dark:text-darkTextSecondary">
                      {[
                        {
                          points: 3,
                          text: "points per dollar per day in Stables (ckUSDC, ckUSDT).",
                        },
                        {
                          points: 2,
                          text: "points per dollar per day in ckBTC, ckETH, ICP.",
                        },
                        {
                          points: 1,
                          text: "point per dollar per day in anything else (e.g., Liquid staked tokens).",
                        },
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <div className="w-6 flex items-center justify-center">
                            <img
                              src={star}
                              alt="DFinance"
                              className="w-5 h-5"
                              style={{
                                imageRendering: "-webkit-optimize-contrast",
                                imageRendering: "crisp-edges",
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <b>{item.points}</b> {item.text}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl">
                    <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 text-[#2A1F9D] dark:text-darkTextSecondary1">
                      <div className="flex items-center">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 text-[#2A1F9D] dark:text-darkTextSecondary1"
                        >
                          <path
                            d="M8 9.5C8 11.2239 8.68482 12.8772 9.90381 14.0962C11.1228 15.3152 12.7761 16 14.5 16C16.2239 16 17.8772 15.3152 19.0962 14.0962C20.3152 12.8772 21 11.2239 21 9.5C21 7.77609 20.3152 6.12279 19.0962 4.90381C17.8772 3.68482 16.2239 3 14.5 3C12.7761 3 11.1228 3.68482 9.90381 4.90381C8.68482 6.12279 8 7.77609 8 9.5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M3 14.5C3 16.2239 3.68482 17.8772 4.90381 19.0962C6.12279 20.3152 7.77609 21 9.5 21C11.2239 21 12.8772 20.3152 14.0962 19.0962C15.3152 17.8772 16 16.2239 16 14.5C16 12.7761 15.3152 11.1228 14.0962 9.90381C12.8772 8.68482 11.2239 8 9.5 8C7.77609 8 6.12279 8.68482 4.90381 9.90381C3.68482 11.1228 3 12.7761 3 14.5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="ml-2">Borrow Positions</span>
                      </div>
                    </h3>
                    <ul className="text-[13px] space-y-2 text-[#2A1F9D] dark:text-darkTextSecondary">
                      {[
                        {
                          points: 3,
                          text: "points per dollar per day in anything else (e.g., Liquid staked tokens).",
                        },
                        {
                          points: 2,
                          text: "points per dollar per day in ckBTC, ckETH, ICP.",
                        },
                        {
                          points: 1,
                          text: "point per dollar per day in Stables (ckUSDC, ckUSDT).",
                        },
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <div className="w-6 flex items-center justify-center">
                            <img
                              src={star}
                              alt="DFinance"
                              className="w-5 h-5"
                              style={{
                                imageRendering: "-webkit-optimize-contrast",
                                imageRendering: "crisp-edges",
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <b>{item.points}</b> {item.text}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Boosts Section */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-[#2A1F9D] dark:text-darkTextSecondary">
                  Boosts
                </h2>
                <div className="grid grid-cols-1 lgx:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-semibold mb-2 text-[#2A1F9D] dark:text-darkTextSecondary1">
                      First 7 Days
                    </h3>
                    <p className="text-[13px] text-[#2A1F9D] dark:text-darkTextSecondary">
                      Lending within the first 7 days gives you a permanent
                      boost of <b>2x</b> for as long as those funds remain in
                      those positions.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-semibold mb-2 text-[#2A1F9D] dark:text-darkTextSecondary1">
                      Same Asset
                    </h3>
                    <p className="text-[13px] text-[#2A1F9D] dark:text-darkTextSecondary">
                      If you provide the same asset in lending and borrowing
                      positions, points are decreased by <b>0.5x</b>.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-semibold mb-2 text-[#2A1F9D] dark:text-darkTextSecondary1">
                      Liquidity
                    </h3>
                    <p className="text-[13px] text-[#2A1F9D] dark:text-darkTextSecondary">
                    The debt user's points are reduced by <strong>0.5x</strong>, while the liquidator's points are increased by <strong>1.5x</strong> for the particular transaction.
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 flex flex-col dark:bg-bottom-left-to-top-right-gradient p-8 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-semibold mb-2 text-[#2A1F9D] dark:text-darkTextSecondary1">
                      Repay
                    </h3>
                    <p className="text-[13px] text-[#2A1F9D] dark:text-darkTextSecondary">
                    Points are adjusted by <strong>1x/1.5</strong> based on the debt amount repaid and the collateral amount liquidated on the user side.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "howItWorks":
        return (
          <div className="p-0 md:p-6 text-[#2A1F9D] dark:text-darkText">
            {/* Replace with informational cards or an FAQ */}
            <div className="">
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-[#2A1F9D] dark:text-darkTextSecondary -mt-2">
                How the Points System Works
              </h2>

              {/* Overview */}
              <div className="p-5 bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 dark:bg-bottom-left-to-top-right-gradient rounded-2xl mb-7 text-[#2A1F9D] dark:text-darkText ">
                <h3 className="font-semibold text-lg mb-2">Overview</h3>
                <p className="text-[13px] font-normal dark:text-white/80">
                  The points system rewards users for engaging in lending,
                  borrowing, and providing liquidity. Points can be redeemed for
                  exclusive rewards and increase based on boosts and multipliers
                  applied to certain activities.
                </p>
              </div>

              {/* How Points Are Earned */}
              <div className="p-5 bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 dark:bg-bottom-left-to-top-right-gradient rounded-2xl mb-7 text-[#2A1F9D] dark:text-darkText">
                <h3 className="font-semibold text-lg">How Points Are Earned</h3>
                <ul className="list-disc ml-6 mt-2 text-[13px] font-normal dark:text-white/80">
                  <li className="mb-2">
                    <span className="font-semibold dark:text-white/90">Lending Points:</span> Earn 3 points per dollar per day in
                    stablecoins, 2 points in ckBTC, ckETH, ICP, and 1 point in other
                    assets.
                  </li>
                  <li className="mb-2">
                    <span className="font-semibold dark:text-white/90">Borrowing Points:</span> Accumulate points at 3 points per
                    dollar in other assets, 2 points in ckBTC, ckETH, ICP, and 1 point
                    in stablecoins.
                  </li>
                  <li className="mb-2">
                    <span className="font-semibold dark:text-white/90">Liquidity Points:</span> Earned by providing liquidity in
                    the platform’s pools, with rates based on asset type.
                  </li>
                </ul>
              </div>

              {/* Boosts and Multipliers */}
              <div className="p-5 bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 dark:bg-bottom-left-to-top-right-gradient rounded-2xl mb-7 text-[#2A1F9D] dark:text-darkText">
                <h3 className="font-semibold text-lg">
                  Boosts and Multipliers
                </h3>
                <ul className="list-disc ml-6 mt-2 text-[13px] dark:text-white/80">
                  <li className="mb-2">
                    <span className="font-semibold dark:text-white/90">First 7 Days Boost:</span> Lending within the first 7 days
                    gives a permanent 2x boost.
                  </li>
                  <li className="mb-2">
                    <span className="font-semibold dark:text-white/90">Same Asset Boost:</span> Providing the same asset in both
                    lending and borrowing positions reduces points by 0.5x.
                  </li>
                  <li className="mb-2">
                    <span className="font-semibold dark:text-white/90">Liquidity Boost:</span> Boosts points by 1.5x for the
                    liquidator and reduces by 0.5x for the debt user in specific
                    transactions.
                  </li>
                </ul>
              </div>

              {/* Point Redemption */}
              <div className="p-5 bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 dark:bg-bottom-left-to-top-right-gradient rounded-2xl mb-7 text-[#2A1F9D] dark:text-darkText">
                <h3 className="font-semibold text-lg">Point Redemption</h3>
                <p className="text-[13px] font-normal dark:text-white/80 mt-2">
                  Redeem points for rewards, access to exclusive content, or
                  other benefits. Redemptions may have minimum point
                  requirements and are subject to availability.
                </p>
              </div>

              {/* Examples */}
              <div className="p-5 bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 dark:bg-bottom-left-to-top-right-gradient rounded-2xl text-[#2A1F9D] dark:text-darkText">
                <h3 className="font-semibold text-lg mb-2">Example</h3>
                <p className="text-[13px] font-normal dark:text-white/80">
                  For example, 3 x $100 in stable coin lent = 300 points. With
                  the bonus = 600 points.
                </p>
              </div>
            </div>

            <section className="mt-10" id="faq">
              <div className="w-full p-5 md:p-10 bg-gradient-to-r from-[#4659CF]/50 via-[#D379AB]/50 to-[#FCBD78]/50 rounded-2xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
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
                    <div className="w-full text-[12px] md:text-[15px] md:w-[115%] bg-white shadow md:relative rounded-xl overflow-hidden cursor-pointer  dark:bg-darkFAQBackground">
                      {FAQ_QUESTIONS_POINTSYSTEM.map((item, index) => (
                        <div key={index} className="w-full dark:text-darkText">
                          <div
                            className={`w-full flex p-4 items-center transition-opacity duration-300 ease-in-out ${
                              currentFAQ === index
                                ? "bg-[#eef0f5] dark:bg-currentFAQBackground"
                                : ""
                            } hover:bg-[#FAFBFF] hover:dark:bg-currentFAQBackground`}
                            onClick={() => setCurrentFAQ(index)}
                          >
                            <div className="w-1/12">
                              <div
                                className={`w-4 h-4 rounded-full ${
                                  currentFAQ === index
                                    ? "bg-[#517687] dark:bg-darkText"
                                    : "bg-[#DBE8EE] dark:bg-[#192C35]"
                                }`}
                              ></div>
                            </div>
                            <div className="w-10/12">{item.question}</div>
                            <div
                              className={`w-1/12 ${
                                currentFAQ === index
                                  ? "text-[#517687] dark:text-darkText rotate-90 md:rotate-0"
                                  : "text-[#DBE8EE] dark:text-[#192C35]"
                              } flex justify-end`}
                            >
                              <ChevronRight />
                            </div>
                          </div>
                          {currentFAQ === index && (
                            <div
                              className={`block animate-fade-down -z-10 md:hidden p-4 bg-[#FAFBFF] rounded-b-xl text-black max-h-full dark:bg-darkFAQBackground2 dark:text-darkText transition-opacity duration-300 ${
                                currentFAQ === index
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            >
                              <p>{item.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {FAQ_QUESTIONS_POINTSYSTEM.filter(
                    (faq) => faq.id === currentFAQ
                  ).map((faq) => (
                    <div
                      key={faq.id}
                      className="hidden md:block animate-fadeInLeft h-full text-[15px] ml-[-10px] bg-[#FAFBFF] rounded-xl text-black pl-[10%] p-6 dark:bg-darkFAQBackground2 dark:text-darkText transition-opacity duration-300"
                    >
                      <h1 className="font-semibold mt-4">{faq.question}</h1>
                      <p className="mt-8">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        );
      default:
        return <Leaderboard />;
    }
  };

  return (
    <div className=" min-h-screen">
      {/* Hero Section */}

      <HeroSection onSectionChange={setActiveSection} />

      {/* Content Section */}
      <div className="container mx-auto px-4 py-4">{renderContent()}</div>
    </div>
  );
};

export default PointSystemPage;
