import React from "react"
import { NavLink } from "react-router-dom"
import Ellipse from "../../components/Ellipse"
import Logo from "../../components/Logo"
import {
  FAQ_QUESTION,
  HOME_TOP_NAV_LINK,
  MAIN_NAV_LINK,
  SHOWCASE_SECTION,
} from "../../utils/constants"
import { Drawer, Tab, Tabs } from "@mui/material"
import TabPanel from "../../components/Home/TabPanel"
import { ChevronLeft, ChevronRight, Menu } from "lucide-react"
import ShowCaseSection from "../../components/Home/ShowCaseSection"
import MobileTobNav from "../../components/Home/MobileTobNav"
import HeroSection from "../../components/Home/HeroSection"
import HowITWork from "../../components/Home/HowITWork"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Button from "../../components/Button"

const Home = () => {
  const [currentTab, setCurrentTab] = React.useState(0)
  const [currentFAQ, setCurrentFAQ] = React.useState(0)

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
            <p className="text-sm font-normal text-[#737373] text-center mt-3">
              Supply into the protocol and watch your assets grow as a liquidity
              provider
            </p>
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
                  className="border rounded-full p-1 border-[#517688] hover:border-[#73b1cf] hover:text-[#73b1cf] text-[#517688]"
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

        {/* Background Overlay Ellipse */}
        <div className="absolute left-0 top-[55%] lg:top-1/4 -z-10">
          <Ellipse
            position={"middle-left"}
            className="w-52 h-96 lg:w-auto lg:h-auto"
          />
        </div>

        {/* info section */}
        <section className="mt-24">
          <div className="w-full flex justify-center">
            <div className="w-full xl:w-3/4 p-10 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-2xl flex items-center text-white flex-wrap">
              <div className="w-full xl:w-9/12">
                <h1 className="font-semibold text-lg">And more to come...</h1>
                <p className="mt-4 text-sm font-medium">
                  Submit a proposal to deploy a new market in the Aave
                  ecosystem. You can learn from the Aave governance.
                </p>
              </div>
              <div className="w-full xl:w-3/12 flex justify-center mt-6 lg:mt-0">
                <Button title="LEARN MORE" />
              </div>
            </div>
          </div>
        </section>

        {/* Governed by the Community */}
        <section className="mt-24">
          <div className="w-full  text-center text-[#2A1F9D]">
            <h1 className="text-lg xl:text-[45px] font-extralight">
              Governed by the <span className="font-semibold">Community</span>
            </h1>
            <p className="text-[#737373] lg:my-6">
              Aave is a fully decentralized, community governed protocol with
              166,579 token holders.
            </p>
            <Button title="LEARN MORE" />
          </div>
          <div className="w-full flex justify-center my-3">
            <div className="w-[700px] h-auto mt-3 xl:mt-0 xl:h-[400px]">
              <img
                src="/image-78.svg"
                alt="Governed by the Community"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </section>

        {/* How it Works */}
        <HowITWork />

        {/* Showcase Section (ICP Grants DAO & Security Contributors) */}
        {SHOWCASE_SECTION.map((item) => (
          <section className="mt-24">
            <ShowCaseSection key={item.id} data={item} />
          </section>
        ))}

        {/* FAQ */}
        <section className="mt-24 overflow-auto">
          <div className="w-[800px] lg:w-full p-10 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-2xl">
            <div className="w-full">
              <h1 className="text-[45px] hidden lg:block font-extralight text-[#2A1F9D]">
                Frequently Asked Questions
              </h1>
              <h1 className="text-[45px] block lg:hidden font-extralight text-[#2A1F9D]">
                FAQ
              </h1>
            </div>
            <div className="w-full flex">
              <div className="w-6/12 relative flex items-center">
                <div className="w-[115%] bg-white absolute shadow inset-auto rounded-xl overflow-hidden cursor-pointer">
                  {FAQ_QUESTION.map((item, index) => (
                    <div
                      key={index}
                      className={`w-full flex p-4 items-center ${
                        currentFAQ === index ? "bg-[#eef0f5]" : ""
                      } hover:bg-[#FAFBFF]`}
                      onClick={() => setCurrentFAQ(index)}
                    >
                      <div className="w-1/12">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            currentFAQ === index
                              ? "bg-[#517687]"
                              : "bg-[#DBE8EE]"
                          }`}
                        ></div>
                      </div>
                      <div className="w-10/12">{item.question}</div>
                      <div
                        className={`w-1/12 ${
                          currentFAQ === index
                            ? "text-[#517687]"
                            : "text-[#DBE8EE]"
                        } flex justify-end`}
                      >
                        <ChevronRight />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-6/12 h-[400px] bg-[#FAFBFF] rounded-xl text-black pl-[10%] p-6">
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
  )
}

export default Home
