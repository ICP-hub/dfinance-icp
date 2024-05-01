import React from "react"
import Button from "../Button"
import { ExternalLink } from "lucide-react"

const DFinanceGov = () => {
  return (
    <>
      <div className="w-full mt-6">
        <h1 className="text-[#5B62FE] text-sm">
          Available on Ethereum Mainnet
        </h1>
        <div className="w-full flex mt-8">
          <div className="w-8/12 p-6">
            <h1 className="text-[#2A1F9D] font-medium text-xl">
              DFinance Governance
            </h1>
            <p className="text-[#5B62FE] text-xs text-justify">
              DFinance is a fully decentralized, community governed protocol by
              the DFINANCE token-holders. DFINANCE token-holders collectively
              discuss, propose, and vote on upgrades to the protocol. DFINANCE
              token-holders (Ethereum network only) can either vote themselves
              on new proposals or delagate to an address of choice. To learn
              more check out the Governance.
            </p>
          </div>
          <div className="w-4/12 p-6">
            <h1 className="text-[#2A1F9D] font-medium text-xl">Others</h1>
            <div className="w-full flex gap-4">
              {["SNAPSHOTS", "GOVERNANCE", "FORUM", "FAQ"].map((i) => (
                <span className="bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] p-2 whitespace-nowrap rounded-full text-xs flex items-center gap-2 text-white">
                  {i} <ExternalLink size={16}/>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col lg:flex-row mt-16 my-6 gap-6">
        <div className="w-full lg:w-9/12 min-h-[450px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl">
          <h1 className="text-[#2A1F9D] font-semibold my-2">
                      Proposals
          </h1>
          <div className="w-full mt-8 lg:flex"></div>
        </div>
        <div className="w-full lg:w-3/12">
          <div className="w-full bg-[#233D63] p-4 rounded-xl text-white">
            <h1 className="font-semibold">Your info</h1>
            <p className="text-gray-200 text-xs my-1">
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
