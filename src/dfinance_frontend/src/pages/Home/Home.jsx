import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Tab, Tabs } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../../components/Common/Button";
import Buton from "../../components/Common/LearnMoreButton";
import Ellipse from "../../components/Common/Ellipse";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import HeroSection from "../../components/Home/HeroSection";
import HowITWork from "../../components/Home/HowITWork";
import TabPanel from "../../components/Home/TabPanel";
import { LuMoveUp } from "react-icons/lu";
import Loading from "../../components/Common/Loading";
import {
  MAIN_NAV_LINK,
  FAQ_QUESTION,
  TAB_CARD_DATA,
  SECURITY_CONTRIBUTORS_DATA,
} from "../../utils/constants";
import { usePageLoading } from "../../components/Common/useLoading";

const Home = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const theme = useSelector((state) => state.theme.theme);
  const isLoading = usePageLoading();

  const [currentFAQ, setCurrentFAQ] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        const nextIndex = (currentFAQ + 1) % FAQ_QUESTION.length;
        setCurrentFAQ(nextIndex);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [currentFAQ, isPaused]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      if (scrollTop > 600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const [currentTab, setCurrentTab] = useState(MAIN_NAV_LINK[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const intervalRef = useRef();

  useEffect(() => {
    const startInterval = () => {
      const id = setInterval(() => {
        const nextIndex = (currentIndex + 1) % MAIN_NAV_LINK.length;
        setCurrentIndex(nextIndex);
        setCurrentTab(MAIN_NAV_LINK[nextIndex].id);
      }, 3000);
      intervalRef.current = id;
    };

    startInterval();

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [currentIndex]);

  const handleMouseEnter = () => {
    clearInterval(intervalRef.current);
  };

  const handleMouseLeave = () => {
    const id = setInterval(() => {
      const nextIndex = (currentIndex + 1) % MAIN_NAV_LINK.length;
      setCurrentIndex(nextIndex);
      setCurrentTab(MAIN_NAV_LINK[nextIndex].id);
    }, 3000);
    intervalRef.current = id;
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleCards = isMobile ? TAB_CARD_DATA.slice(0, 4) : TAB_CARD_DATA;

  if (isLoading) {
    return <Loading isLoading={isLoading} />;
  }

  return (
    <>
      {}
      <div className="w-full xl3:w-[80%] xl4:w-[50%] xl3:mx-auto px-4 md:px-12 xl:px-24 relative overflow-hidden font-poppins">
        {}
        <div className="absolute top-0 right-0 xl:w-auto xl:h-auto -z-10">
          <Ellipse
            position={"top-right"}
            className="w-70 h-70 md:w-[950px] md:h-[590px]"
          />
        </div>

        {}
        <Navbar isHomeNav={true} />

        {}
        <HeroSection />

        {}
        <section className="mt-16">
          <div
            className="w-full"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <nav className="flex justify-center not-italic">
              <Tabs
                value={currentTab}
                onChange={(e, newTab) => setCurrentTab(newTab)}
                sx={{
                  "& .MuiTabs-indicator": {
                    backgroundImage:
                      "linear-gradient(to right, rgb(70 89 207 / 1), #D379AB, rgb(197 98 189 / 0.7))",
                  },
                }}
              >
                {MAIN_NAV_LINK.map((item, index) => (
                  <Tab
                    key={index}
                    label={item.title}
                    disableRipple={true}
                    disableFocusRipple={true}
                    className="button1"
                    sx={{
                      textTransform: "capitalize",
                      fontStyle: "normal",
                      fontFamily: "Poppins",
                      fontWeight: "600",
                      fontSize: "14px",
                      color: theme === "dark" ? "white" : "#2A1F9D",
                      "&.Mui-selected": {
                        color: "transparent",
                        backgroundImage:
                          "linear-gradient(to right, rgb(70 89 207 / 1), #D379AB, rgb(197 98 189 / 0.7))",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      },
                    }}
                  />
                ))}
              </Tabs>
            </nav>
            {MAIN_NAV_LINK.map((item) => (
              <React.Fragment key={item.id}>
                {currentTab === item.id && (
                  <p className="text-sm font-normal text-[#737373] text-center mt-6 dark:text-darkTextSecondary">
                    {item.content}
                  </p>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="w-full mt-10">
            <h1 className="font-semibold bg-gradient-to-r from-[#4659CF] via-[#C562BD] to-transparent h-12 w-48 bg-clip-text text-transparent text-[36px] mb-2">
              Markets
            </h1>
            <TabPanel />
          </div>
        </section>

        {}

        {}
        <section className="mt-[44px] md:mt-24 " id="gov">
          <div className="w-full text-center text-[#2A1F9D] dark:text-darkText">
            <h1 className="text-lg text-[28px] md:text-[45px] font-light">
              A Better Way To <span className="font-semibold">DeFi</span>
            </h1>
            <p className="text-[#737373] text-[13px] md:text-[16px] my-4 lg:my-6 dark:text-darkText">
              Phase 1 includes simple borrowing and lending with our points
              system for a $DFIN airdrop
            </p>

            <div className="w-full flex justify-center mt-3">
              {" "}
              {}
              <a
                href="https://dfinance.notion.site/DFinance-Points-System-17544afe836e80ffae46f31b676a7ce7"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button title="LEARN MORE" />
              </a>
            </div>
          </div>
        </section>

        {}
        <HowITWork />

        {}
        {}

        {}
        <section className="mt-[44px] md:mt-24 " id="faq">
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
                <div className="w-full text-[12px] md:text-[15px] md:w-[115%] bg-white shadow md:relative rounded-xl overflow-hidden cursor-pointer dark:bg-darkFAQBackground">
                  {FAQ_QUESTION.map((item, index) => (
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
                            currentFAQ === index ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {FAQ_QUESTION.filter((faq) => faq.id === currentFAQ).map(
                (faq) => (
                  <div
                    key={faq.id}
                    className="hidden md:block animate-fadeInLeft h-full text-[15px] ml-[-10px] bg-[#FAFBFF] rounded-xl text-black pl-[10%] p-6 dark:bg-darkFAQBackground2 dark:text-darkText transition-opacity duration-300"
                  >
                    <h1 className="font-semibold mt-4">{faq.question}</h1>
                    <p className="mt-8">{faq.answer}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {}
        <div className="absolute right-0 bottom-[0%] -z-10">
          <Ellipse
            position={"bottom-right"}
            className="w-72 h-96 lg:w-auto lg:h-[600px]"
          />
        </div>
      </div>
      {}
      <button
        className={`fixed bottom-5 md:bottom-10 z-50 right-5 md:right-10 bg-[#5B62FE] h-[50px] w-[50px] text-white rounded-full transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={scrollToTop}
      >
        <LuMoveUp className="text-[30px] mx-auto hover:text-white transition-colors" />
      </button>
      <Footer />
    </>
  );
};
export default Home;
