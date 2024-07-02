import React, { useState } from "react"
import Button from "../Button"
import { useAuth } from "../../utils/useAuthClient"
import { BsToggles2 } from "react-icons/bs";
import { IoIosSearch } from "react-icons/io";
import {

  ExternalLink,

} from "lucide-react"
import { PROPOSALS_DETAILS } from "../../utils/constants"
import { Link } from "react-router-dom"

const DFinanceGov = () => {
  const [isFilter, setIsFilter] = useState(false)
  const [showsearch, setShowSearch] = useState(false);
  const [selectedItem, setSelectedItem] = useState("All Proposals");

  const {
    isAuthenticated,
    login,
    logout,
    principal,
    reloadLogin,
    accountIdString,
  } = useAuth();


  const showSearchBar = () => {
    setShowSearch(!showsearch);
  }
  const handleFilter = (item) => {
    setSelectedItem(item);
    setIsFilter(false); // Close the dropdown after selecting an item
  };
  const handleClickOutside = (event) => {
    if (!event.target.closest(".dropdown")) {
      setIsFilter(false); // Close the dropdown if clicked outside of it
    }
  };

  React.useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleToggleClick = (event) => {
    event.stopPropagation(); // Prevent propagation of the click event to the document
    setIsFilter(!isFilter); // Toggle the dropdown
  };

  return (
    <>
      <div className="w-full mt-6">
        <h1 className="text-[#5B62FE] text-sm inline-flex items-center ml-6">
          Available on
          <img src="https://i.pinimg.com/originals/12/33/64/123364eb4e844960c2fd6ebffccba0a0.png" alt="Icp Logo" className="mx-2 w-6 h-6" />
          ICP Mainnet
        </h1>
        <div className="w-full flex flex-col  md2:flex-row mt-2">
          <div className="w-full md2:w-8/12 dxl:w-9/12 p-6">
            <h1 className="text-[#2A1F9D] font-medium text-xl dark:text-darkText">
              DFinance Governance
            </h1>
            <p className="text-[#5B62FE] text-sm text-justify mt-3 dark:text-darkTextSecondary">
              DFinance is a fully decentralized, community governed protocol by
              the DFINANCE token-holders. DFINANCE token-holders collectively
              discuss, propose, and vote on upgrades to the protocol. DFINANCE
              token-holders (Ethereum network only) can either vote themselves
              on new proposals or delagate to an address of choice. To learn
              more check out the Governance.
            </p>
          </div>
          <div className="w-full justify-start md2:w-5/12 dxl:w-4/12 md2:p-6 md2:ml-16">
            <h1 className="text-[#2A1F9D] font-medium text-xl mx-5 lg:mx-10 dark:text-darkText">Others</h1>
            <div className="w-full flex gap-4 flex-wrap mt-3 mx-5 lg:mx-10 cursor-pointer">
              {["SNAPSHOTS", "GOVERNANCE", "FORUM", "FAQ"].map((i) => (
                <span className="button_gradient p-2 whitespace-nowrap rounded-full text-xs flex items-center gap-2 text-white px-6">
                  {i} <ExternalLink size={16} />
                </span>
              ))}
            </div>

          </div>
        </div>
      </div>
      <div className="w-full flex flex-col md2:flex-row mt-8 my-4 gap-8">
        <div className="w-full md2:w-8/12 dxl:w-9/12 min-h-[450px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl pt-10 dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
          <div className="flex items-center justify-between ">
            <div className="text-[#2A1F9D] text-2xl font-semibold ml-2 dark:text-darkText">
              Proposals
            </div>

            <div className="flex relative gap-1 items-center">
              {showsearch && (

                <div className="test">
                  <input
                    type="text"
                    name="search"
                    id="search"
                    placeholder="Search for proposals"
                    style={{ fontSize: '0.75rem' }}
                    className={`placeholder-gray-500 w-[400px] md:block hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent ${showsearch
                      ? "animate-fade-left flex"
                      : "animate-fade-right hidden"
                      }`}
                  
                  />
                </div>
              )}

              <svg onClick={showSearchBar} className="cursor-pointer" width="55" height="25" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.35437 12.9725C10.4572 12.9725 12.9725 10.4572 12.9725 7.35436C12.9725 4.25156 10.4572 1.73624 7.35437 1.73624C4.25157 1.73624 1.73625 4.25156 1.73625 7.35436C1.73625 10.4572 4.25157 12.9725 7.35437 12.9725Z" stroke="url(#paint0_linear_293_865)" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M11.2613 11.5531L13.4638 13.75" stroke="url(#paint1_linear_293_865)" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
                <defs>
                  <linearGradient id="paint0_linear_293_865" x1="3.5" y1="3.5" x2="13.5" y2="14" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#2E28A5" />
                    <stop offset="1" stop-color="#FAAA98" />
                  </linearGradient>
                  <linearGradient id="paint1_linear_293_865" x1="12.3625" y1="11.5531" x2="12.3625" y2="13.75" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#C88A9B" />
                  </linearGradient>
                </defs>
              </svg>


              {isFilter && (
                <div className="w-fit absolute dropdown  -left-4/12 top-20 z-30 bg-white text-[#2A1F9D] rounded-xl overflow-hidden animate-fade-down">
                  {PROPOSALS_DETAILS.map((item, index) => (
                    <button
                      type="button"
                      key={index}
                      className="w-full whitespace-nowrap text-left text-sm p-3 hover:bg-[#e1dfff]"
                      onClick={() => handleFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              <svg onClick={handleToggleClick} className="cursor-pointer" width="25" height="25" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.25 5.25H4.5" stroke="#998FFF" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M2.25 12.75H6.75" stroke="#998FFF" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M13.5 12.75L15.75 12.75" stroke="#998FFF" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M11.25 5.25L15.75 5.25" stroke="#998FFF" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M4.5 5.25C4.5 4.55109 4.5 4.20163 4.61418 3.92597C4.76642 3.55843 5.05843 3.26642 5.42597 3.11418C5.70163 3 6.05109 3 6.75 3C7.44891 3 7.79837 3 8.07403 3.11418C8.44157 3.26642 8.73358 3.55843 8.88582 3.92597C9 4.20163 9 4.55109 9 5.25C9 5.94891 9 6.29837 8.88582 6.57403C8.73358 6.94157 8.44157 7.23358 8.07403 7.38582C7.79837 7.5 7.44891 7.5 6.75 7.5C6.05109 7.5 5.70163 7.5 5.42597 7.38582C5.05843 7.23358 4.76642 6.94157 4.61418 6.57403C4.5 6.29837 4.5 5.94891 4.5 5.25Z" stroke="#998FFF" />
                <path d="M9 12.75C9 12.0511 9 11.7016 9.11418 11.426C9.26642 11.0584 9.55843 10.7664 9.92597 10.6142C10.2016 10.5 10.5511 10.5 11.25 10.5C11.9489 10.5 12.2984 10.5 12.574 10.6142C12.9416 10.7664 13.2336 11.0584 13.3858 11.426C13.5 11.7016 13.5 12.0511 13.5 12.75C13.5 13.4489 13.5 13.7984 13.3858 14.074C13.2336 14.4416 12.9416 14.7336 12.574 14.8858C12.2984 15 11.9489 15 11.25 15C10.5511 15 10.2016 15 9.92597 14.8858C9.55843 14.7336 9.26642 14.4416 9.11418 14.074C9 13.7984 9 13.4489 9 12.75Z" stroke="#998FFF" />
              </svg>
              <span className="button_gradient  p-2 whitespace-nowrap rounded-full text-xs z-40  flex items-center ml-4 text-white font-semibold ">
                {selectedItem}
              </span>


            </div>
          </div>

          {showsearch &&
            <input
              type="text"
              name="search"
              id="search"
              placeholder="Search for products"
              className={`placeholder-gray-500 w-[250px] block md:hidden z-20 px-4 py-[7px] mt-2 focus:outline-none box bg-transparent ${showsearch
                ? "animate-fade-left flex"
                : "animate-fade-right hidden"
                }`}
            />
          }

          <div className="w-full mt-8">
            {[1, 2, 3, 4].map((i, index) => (
              <div key={i} className={`w-full flex flex-col sm:flex-row rounded-lg p-3 ${index !== [1, 2, 3, 4].length - 1 ? 'gradient-line-bottom' : ''}`}>
                <div className="w-full sm:w-9/12 flex flex-col gap-6 ">
                  <Link to={"proposal-details"} className="text-[#2A1F9D] text-lg font-semibold  ml-[-0.2rem] mt-2 dark:text-darkText">
                    weETH Onboarding
                  </Link>
                  <span className="p-1 rounded-full px-6 border border-white w-fit text-xs text-[#5B62FE]  mb-4 dark:text-darkText">
                    Open for voting
                  </span>
                </div>
                <div className="w-full sm:w-3/12 flex flex-col gap-3 mt-3 sm:mt-0">
                  <div className="w-full text-[#5B62FE] dark:text-darkTextSecondary">
                    <div className="w-full flex items-center justify-between text-xs">
                      <span>YAE 531K</span>
                      <span>100.00%</span>
                    </div>
                    <div className="bg-[#2A1F9D] w-full h-2 rounded-full mt-2"></div>
                  </div>
                  <div className="w-full text-[#5B62FE] dark:text-darkTextSecondary">
                    <div className="w-full flex items-center justify-between text-xs mt-3 mb-2">
                      <span>NAY 0</span>
                      <span>0%</span>
                    </div>
                    <div className="bg-[#B6B6B6] w-full h-2 rounded-full mt-2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>


        </div>
        <div className="w-full md2:w-4/12 dxl:w-3/12">
          <div className="w-full bg-[#233D63] p-4 rounded-xl text-white">
            <h1 className="font-semibold">Your info</h1>
           {isAuthenticated ? <p className="text-gray-200 text-xs my-2">Your wallet has been connected</p>: <p className="text-gray-200 text-xs my-2">
              Please connect a wallet to view your personal information here.
            </p>}
            {!isAuthenticated && <div className="w-full mt-4">
              <Button
                title={"Connect Wallet"}
                className={
                  "my-2 bg-gradient-to-r text-white from-[#EDD049] to-[#8CC0D7] rounded-xl p-3 px-8 shadow-lg font-semibold text-sm'"
                }
              />
            </div>}
          </div>
        </div>
      </div>
    </>
  )
}

export default DFinanceGov