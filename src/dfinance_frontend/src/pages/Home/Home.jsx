import React, { useState, useEffect } from "react";
import { Tab, Tabs } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../../components/Button";
import Ellipse from "../../components/Ellipse";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import HeroSection from "../../components/Home/HeroSection";
import HowITWork from "../../components/Home/HowITWork";
import TabPanel from "../../components/Home/TabPanel";
import { LuMoveUp } from "react-icons/lu";
import { MAIN_NAV_LINK, FAQ_QUESTION, TAB_CARD_DATA, SECURITY_CONTRIBUTORS_DATA } from "../../utils/constants"; // Assuming TAB_CARD_DATA is imported from the same place as other constants

const Home = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
 
  const [currentFAQ, setCurrentFAQ] = useState(0);
  const [isPaused, setIsPaused] = useState(false); 
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
        if (!isPaused) {
      const nextIndex = (currentFAQ + 1) % FAQ_QUESTION.length;
      setCurrentFAQ(nextIndex);
    }
    }, 2500); 
    return () => clearInterval(interval);
  }, [currentFAQ, isPaused]);
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      if (scrollTop > 600) { // Adjust this value to control when the button appears
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const [currentTab, setCurrentTab] = useState(MAIN_NAV_LINK[0].id); // Start with the first item
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate the index of the next item
      const nextIndex = (currentIndex + 1) % MAIN_NAV_LINK.length;
      setCurrentIndex(nextIndex);
      setCurrentTab(MAIN_NAV_LINK[nextIndex].id);
    }, 3000); // 3000 milliseconds = 3 seconds

    return () => clearInterval(interval); // Cleanup function to clear interval on component unmount
  }, [currentIndex]); // Run effect whenever currentIndex changes


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleCards = isMobile ? TAB_CARD_DATA.slice(0, 4) : TAB_CARD_DATA;

  return (
    <>
      {/* Main Home Page */}
      <div className="w-full xl3:w-[80%] xl4:w-[50%] xl3:mx-auto px-4 md:px-12 xl:px-24 relative overflow-hidden font-poppins">
        {/* Background Overlay Ellipse */}
        <div className="absolute top-0 right-0 xl:w-auto xl:h-auto -z-10">
          <Ellipse
            position={"top-right"}
            className="w-70 h-70 md:w-[950px] md:h-[590px]"
          />
        </div>

        {/* Navbar */}
        <Navbar isHomeNav={true} />

        {/* Application heading & Counter Animation */}
        <HeroSection />

        {/* Tab based section */}
        <section className="mt-24">
          <div className="w-full">
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
                    sx={{
                      textTransform: "capitalize",
                      fontStyle: "normal",
                      fontFamily: "Poppins",
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "#2A1F9D",
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
                  <p className="text-sm font-normal text-[#737373] text-center mt-3">
                    {item.content}
                  </p>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="w-full mt-10">
            <h1 className="font-semibold bg-gradient-to-tr from-[#4659CF] via-[#C562BD] to-transparent h-12 w-48 bg-clip-text text-transparent text-[36px] mb-2">
              Markets
            </h1>
            <TabPanel />
          </div>
        </section>

        {/* Info section */}
        <section className="mt-[44px] md:mt-24">
  <div className="w-full flex justify-center">
    <div className="w-full xl:w-5/5 p-10 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-2xl flex items-center text-white flex-wrap dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd ">
      <div className="w-full xl:w-9/12">
        <h1 className="font-semibold text-lg">And more to come...</h1>
        <p className="mt-4 text-sm font-medium">
          Submit a proposal to deploy a new market in the Dfinance ecosystem. You can learn from the DFinance governance.
        </p>
      </div>
      <div className="w-full xl:w-3/12 flex justify-end mt-3 lg:mt-0">
        <Button title="LEARN MORE" />
      </div>
    </div>
  </div>
</section>


        {/* Governed by the Community */}
        <section className="mt-[44px] md:mt-24 " id="gov">
          <div className="w-full text-center text-[#2A1F9D] dark:text-darkText">
            <h1 className="text-lg text-[28px] md:text-[45px] font-extralight">
              Governed by the <span className="font-semibold">Community</span>
            </h1>
            <p className="text-[#737373] text-[13px] md:text-[16px] my-4 lg:my-6 dark:text-darkText">
  DFinance is a fully decentralized, community governed protocol<br className="hidden lg:inline"/> with 166,579 token holders.
</p>

<div className="flex justify-center">
  <Button className="button_gradient p-2 whitespace-nowrap rounded-md text-xs flex gap-2 text-white px-8" title="LEARN MORE" />
</div>


          </div>   
        </section>

        {/* How it Works */}
        <HowITWork />

        {/* Security Contributors */}
        <section className="mt-24">
          <h1 className="font-bold text-center font-poppins text-3xl lg:text-5xl text-blue-800 dark:text-darkText">Security Contributors</h1>
          <br></br>
          <p className="text-[12px] font-poppins font-[500] text-center lg:text-[18px] text-[#737373] dark:text-darkText">
            Audited by the world’s leading security firms, security of the DFinance<br></br>
             Protocol is the highest priority.
          </p>
          <div className="flex flex-wrap gap-4 mx-auto items-center pt-[34px] pb-[24px]">
            {SECURITY_CONTRIBUTORS_DATA.map((item)=>(
              <img className="mx-auto mt-[29px] " src={item.image} draggable="false" />
            ))}

          </div>


        </section>

       {/* FAQ */}
       <section className="mt-24 " id="faq">
          <div className="w-full p-5 md:p-10 mb-20 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-2xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
            <div className="w-full">
              <h1 className="text-[25px] font-inter md:text-[45px] font-extralight text-[#2A1F9D] dark:text-darkText">
                Frequently Asked Questions
              </h1>
             
            </div>
            <div onMouseEnter={()=>setIsPaused(true)} onMouseLeave={()=>setIsPaused(false)} className="w-full md:grid grid-cols-2">
              <div className="w-full relative  z-10 flex h-auto md:h-auto items-center my-[29px] ">
                <div className="w-full text-[12px] md:text-[15px] md:w-[115%] bg-white shadow  md:relative rounded-xl overflow-hidden cursor-pointer dark:bg-darkFAQBackground">
                  {FAQ_QUESTION.map((item, index) => (
                    <div key={index} className="w-full dark:text-darkText">
                      <div
                        className={`w-full flex p-4 items-center ${currentFAQ === index ? "bg-[#eef0f5] dark:bg-currentFAQBackground" : ""
                          } hover:bg-[#FAFBFF] hover:dark:bg-currentFAQBackground`}
                        onClick={() => setCurrentFAQ(index)}
                      >
                        <div className="w-1/12">
                          <div
                            className={`w-4 h-4 rounded-full ${currentFAQ === index ? "bg-[#517687] dark:bg-darkText" : "bg-[#DBE8EE] dark:bg-[#192C35]"
                              }`}
                          ></div>
                        </div>
                        <div className="w-10/12">{item.question}</div>
                        <div
                          className={`w-1/12 ${currentFAQ === index ? "text-[#517687] dark:text-darkText rotate-90 md:rotate-0" : "text-[#DBE8EE] dark:text-[#192C35]"
                            } flex justify-end`}
                        >
                          <ChevronRight />
                        </div>
                      </div>
                      {currentFAQ === index && (
                        <div className="block animate-fade-down md:hidden p-4 bg-[#FAFBFF] rounded-b-xl text-black max-h-full ">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden md:block h-full text-[15px] ml-[-30px] bg-[#FAFBFF] rounded-xl text-black pl-[10%] p-6 dark:bg-darkFAQBackground2 dark:text-darkText">
                <h1 className="font-semibold mt-4">
                  {FAQ_QUESTION.find((item) => item.id === currentFAQ).question}
                </h1>
                <p className="mt-8">
                  {FAQ_QUESTION.find((item) => item.id === currentFAQ).answer}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Background Overlay Ellipse */}
        <div className="absolute right-0 bottom-[0%] -z-10">
          <Ellipse
            position={"bottom-right"}
            className="w-72 h-96 lg:w-auto lg:h-[600px]"
          />
        </div>
        
      </div>
      {/* Footer */}
      <button
      className={`fixed bottom-5 md:bottom-10 z-50 right-5 md:right-10 bg-[#5B62FE] h-[75px] w-[75px] text-white rounded-full transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={scrollToTop}
    >
      <LuMoveUp  className="text-[50px] mx-auto hover:text-white transition-colors"/>
    </button>
      <Footer />
    </>
  );
};
export default Home;
