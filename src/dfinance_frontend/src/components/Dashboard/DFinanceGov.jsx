import React, { useState } from "react"
import Button from "../Button"
import { BsToggles2 } from "react-icons/bs";
import { BiSolidSearch } from "react-icons/bi";
import {
  SlidersHorizontal,
  SlidersVertical,
  ExternalLink,
  Search,
  X,
} from "lucide-react"
import { PROPOSALS_DETAILS } from "../../utils/constants"
import { Link } from "react-router-dom"

const DFinanceGov = () => {
  const [isFilter, setIsFilter] = useState(false)
  const [showsearch, setShowSearch] = useState(false);

  const showSearchBar =()=>{
    setShowSearch(!showsearch);
  }

  return (
    <>
      <div className="w-full mt-6">
        <h1 className="text-[#5B62FE] text-sm inline-flex items-center ml-6">
          Available on
          <img src="https://w7.pngwing.com/pngs/268/1013/png-transparent-ethereum-eth-hd-logo-thumbnail.png" alt="Ethereum Logo" className="mx-2 w-6 h-6" />
          Ethereum Mainnet
        </h1>
        <div className="w-full flex flex-col md2:flex-row mt-8">
          <div className="w-full md2:w-8/12 dxl:w-6/12 p-6">
            <h1 className="text-[#2A1F9D] font-medium text-xl">
              DFinance Governance
            </h1>
            <p className="text-[#5B62FE] text-sm text-justify mt-3">
              DFinance is a fully decentralized, community governed protocol by
              the DFINANCE token-holders. DFINANCE token-holders collectively
              discuss, propose, and vote on upgrades to the protocol. DFINANCE
              token-holders (Ethereum network only) can either vote themselves
              on new proposals or delagate to an address of choice. To learn
              more check out the Governance.
            </p>
          </div>
          <div className="w-full md2:w-4/12 dxl:w-4/12 p-6">
            <h1 className="text-[#2A1F9D] font-medium text-xl">Others</h1>
            <div className="w-full flex gap-4 flex-wrap mt-3">
              {["SNAPSHOTS", "GOVERNANCE", "FORUM", "FAQ"].map((i) => (
                <span className="bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] p-2 whitespace-nowrap rounded-full text-xs flex items-center gap-2 text-white px-6">
                  {i} <ExternalLink size={16} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col md2:flex-row mt-12 my-4 gap-8">
        <div className="w-full md2:w-8/12 dxl:w-9/12 min-h-[450px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl">
         <div className="flex items-center justify-between ">
          <div>
            Proposals
            </div>
            <div className="flex relative gap-3 items-center">
            {isFilter && (
                <div className="w-fit absolute -left-3/4 top-10 z-30 bg-white text-[#2A1F9D] rounded-xl overflow-hidden animate-fade-down">
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
            <BsToggles2 onClick={()=>setIsFilter(!isFilter)} size={22} className="text-[#AFAFAF]  " />
              <span className="bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] p-2 whitespace-nowrap rounded-full text-xs flex items-center gap-2 text-white font-semibold px-3">
                All Proposals
                </span>

            </div>
          
            <div  className="flex gap-2 items-center">
            {showsearch && 
            <input
            type="text"
            name="search"
            id="search"
            placeholder="Search for products"
            className={`w-[187px] md:block hidden z-20  bg-[#cdeefc] p-2 px-4 rounded-lg focus:outline-none box-border ${
              showsearch
                ? "animate-fade-left flex"
                : "animate-fade-right hidden"
            }`}
          />
          }
            <BiSolidSearch onClick={showSearchBar} size={32} className="text-[#AFAFAF]  "/>
            </div>

         </div>
         {showsearch && 
            <input
            type="text"
            name="search"
            id="search"
            placeholder="Search for products"
            className={`w-full block md:hidden z-20  bg-[#cdeefc] p-2 px-4 rounded-lg focus:outline-none box-border ${
              showsearch
                ? "animate-fade-left flex"
                : "animate-fade-right hidden"
            }`}
          />
          }

          <div className="w-full mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-full flex flex-col sm:flex-row my-6 border border-gray-300 shadow-sm rounded-lg p-3">
                <div className="w-full sm:w-9/12 flex flex-col gap-4">
                  <span className="p-2 rounded-full px-3 border border-white w-fit text-xs">
                    Open for votings
                  </span>
                  <Link to={"proposal-details"} className="text-[#2A1F9D] text-lg font-semibold">
                    weETH Onbaording
                  </Link>
                </div>
                <div className="w-full sm:w-3/12 flex flex-col gap-3 mt-3 sm:mt-0">
                  <div className="w-full text-[#5B62FE]">
                    <div className="w-full flex items-center justify-between text-xs">
                      <span>YAE 531K</span>
                      <span>100.00%</span>
                    </div>
                    <div className="bg-[#2A1F9D] w-full h-2 rounded-full mt-2"></div>
                  </div>
                  <div className="w-full text-[#5B62FE]">
                    <div className="w-full flex items-center justify-between text-xs">
                      <span>NAY 0</span>
                      <span>0%</span>
                    </div>
                    <div className="bg-[#B6B6B6B6] w-full h-2 rounded-full mt-2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full md2:w-4/12 dxl:w-3/12">
          <div className="w-full bg-[#233D63] p-4 rounded-xl text-white">
            <h1 className="font-semibold">Your info</h1>
            <p className="text-gray-200 text-xs my-2">
              Please connect a wallet to view your personal information here.
            </p>
            <div className="w-full mt-4">
              <Button
                title={"Connect Wallet"}
                className={
                  "my-2 bg-gradient-to-r text-white from-[#EDD049] to-[#8CC0D7] rounded-xl p-3 px-8 shadow-lg font-semibold text-sm'"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DFinanceGov