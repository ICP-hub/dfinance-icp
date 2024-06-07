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
import { MAIN_NAV_LINK, FAQ_QUESTION, TAB_CARD_DATA } from "../../utils/constants"; // Assuming TAB_CARD_DATA is imported from the same place as other constants

const Home = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentTab, setCurrentTab] = useState(0);
  const [currentFAQ, setCurrentFAQ] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleCards = isMobile ? TAB_CARD_DATA.slice(0, 4) : TAB_CARD_DATA;

  return (
    <>
      {/* Main Home Page */}
      <div className="w-full xl3:w-[80%] xl4:w-[50%] xl3:mx-auto px-4 md:px-12 xl:px-24 relative overflow-hidden shadow-sm">
        {/* Background Overlay Ellipse */}
        <div className="absolute top-0 right-0 xl:w-auto xl:h-auto -z-10">
          <Ellipse
            position={"top-right"}
            className="w-48 h-48 md:w-[400px] md:h-[400px]"
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
            <h1 className="text-[#0C5A74] font-semibold text-[36px] mb-2">
              Markets
            </h1>
            <TabPanel currentTab={currentTab} />
            <div className="w-full flex justify-end mt-6">
              <div id="pagination" className="flex gap-2">
                <button
                  type="button"
                  className="border rounded-full p-1 border border-red-500 hover:border-[#73b1cf] hover:text-[#73b1cf] text-[#517688]"
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  className="border rounded-full p-1 border-[#517688] hover:border-[#73b1cf] hover:text-[#73b1cf] text-[#517688]"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Info section */}
        <section className="mt-24">
          <div className="w-full flex justify-center">
            <div className="w-full xl:w-3/4 p-10 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-2xl flex items-center text-white flex-wrap">
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
        <section className="mt-24" id="gov">
          <div className="w-full text-center text-[#2A1F9D]">
            <h1 className="text-lg xl:text-[45px] font-extralight">
              Governed by the <span className="font-semibold">Community</span>
            </h1>
            <p className="text-[#737373] lg:my-6">
            DFinance is a fully decentralized, community governed protocol with 166,579 token holders.
            </p>
            <Button title="LEARN MORE" />
          </div>   
        </section>

        {/* How it Works */}
        <HowITWork />

        {/* Security Contributors */}
        <section className="mt-24">
          <h1 className="font-semibold text-3xl lg:text-5xl text-blue-800">Security Contributors</h1>
          <br></br>
          <p className="text-sm lg:text-base text-gray-800 font-semibold">
            Audited by the world’s leading security firms, security of the <br></br>
            DFinance Protocol is the highest priority.
          </p>


        </section>

       {/* FAQ */}
       <section className="mt-24 overflow-auto" id="faq">
          <div className="w-[800px] lg:w-full p-10 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-2xl">
            <div className="w-full">
              <h1 className="text-[45px] hidden lg:block font-extralight text-[#2A1F9D]">
                Frequently Asked Questions
              </h1>
              <h1 className="text-[45px] block lg:hidden font-extralight text-[#2A1F9D]">
                FAQ
              </h1>
            </div>
            <div className="w-full grid grid-cols-2">
              <div className="w-full relative z-10 flex items-center my-[29px] flex-col md:flex-row">
                <div className="w-full md:w-[115%] bg-white shadow absolute md:relative rounded-xl overflow-hidden cursor-pointer">
                  {FAQ_QUESTION.map((item, index) => (
                    <div key={index} className="w-full">
                      <div
                        className={`w-full flex p-4 items-center ${currentFAQ === index ? "bg-[#eef0f5]" : ""
                          } hover:bg-[#FAFBFF]`}
                        onClick={() => setCurrentFAQ(index)}
                      >
                        <div className="w-1/12">
                          <div
                            className={`w-4 h-4 rounded-full ${currentFAQ === index ? "bg-[#517687]" : "bg-[#DBE8EE]"
                              }`}
                          ></div>
                        </div>
                        <div className="w-10/12">{item.question}</div>
                        <div
                          className={`w-1/12 ${currentFAQ === index ? "text-[#517687]" : "text-[#DBE8EE]"
                            } flex justify-end`}
                        >
                          <ChevronRight />
                        </div>
                      </div>
                      {currentFAQ === index && (
                        <div className="block md:hidden p-4 bg-[#FAFBFF] rounded-b-xl text-black max-h-full overflow-y-auto">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden md:block h-full ml-[-30px] bg-[#FAFBFF] rounded-xl text-black pl-[10%] p-6">
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
      <Footer />
    </>
  );
};
export default Home;
