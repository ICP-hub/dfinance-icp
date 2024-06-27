import React from "react"
import Button from "../Button"
import { X } from "lucide-react"
import { TOP_TEN_PROP } from "../../utils/constants"
import { useNavigate } from "react-router-dom"

const ProposalDetails = () => {
  const navigate = useNavigate()
  return (
    <>
      <div className="w-full mt-6">
        <div className="w-full">
          <span className="w-fit bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] p-2 whitespace-nowrap rounded-md text-xs flex items-center gap-2 text-white px-6 cursor-pointer hover:from-[#6575dd]" onClick={() => navigate(-1)}>
            Back
          </span>
        </div>
        <h1 className="text-[#2A1F9D] text-xl font-semibold mt-8">
          Proposal overview
        </h1>
      </div>
      <div className="w-full flex flex-col md2:flex-row mt-4 gap-6 mb-10">
        <div className="w-full md2:w-8/12 dxl:w-9/12 min-h-[450px] p-3 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
          <div className="w-full">
            <div className="w-full p-3">
              <h1 className="text-[#2A1F9D] text-xl font-semibold my-2 ml-1 dark:text-darkText">
                Interim aAMPL distribution
              </h1>
              <span className=" text-[#5b62fe] p-2 block rounded-full px-3 border border-white w-fit text-xs mt-3 dark:text-darkTextSecondary">
                Open for votings
              </span>
            </div>
          </div>
          <div className="w-full mt-8">
          <div className="w-full mt-8 max-w-[calc(100%-2rem)] mx-auto">
    <div className="w-full my-4 text-[#59588D] text-sm dark:text-darkTextSecondary">
        <h1 className="text-[#5B62FE] font-semibold text-lg dark:text-darkText">
            Simple Summary
        </h1>
        <p>Distribute 300.000 USDC to users affected by aAMPL problem.</p>
    </div>
    <div className="w-full my-4 text-[#59588D] text-sm  dark:text-darkTextSecondary">
        <h1 className="text-[#5B62FE] font-semibold text-lg dark:text-darkText">Motivation</h1>
        <p className="text-justify">
            On December 2023, a problem was detected on the AMPL custom reserve on Aave v2 Ethereum, causing an unexpected inflation of AMPL-related balances and supply, not following the intended design by the Ampleforth team. While further analysis is performed for the most reasonable strategy on giving withdrawal liquidity for aAMPL supplies, an interim distribution of 300’000 USD value is proposed as lower threshold, to allow aAMPL suppliers to proceed partially with their withdrawals. With aip 72 having passed the governance process, aAMPL transfers are no longer permitted, which allows to snapshot the current aAMPL balances to perform a fair distribution between affected users.
        </p>
        <p className="text-justify">
            This distribution has been defined the following way, with the help of @ChaosLabs and the Ampleforth team (for ubaAMPL holders):
        </p>
        <ul className="list-disc pl-5 mt-1">
            <li>
                From each address holding aAMPL, a percentage over the total aAMPL supply has been calculated, to understand how is the proportion of each address.
            </li>
            <li>
                Using the previously calculated percentages, they have been applied over the total 300,000 USDC distribution: for example, for an address holding 5% of the total aAMPL, the claim has been calculated as 5% of 300,000; 15,000 USDC.
            </li>
            <li>
                For the holders of aAMPL through Unbuttoned aAMPL (ubaAMPL), the proportion over the total supply of ubaAMPL has been used to calculate the claims on aAMPL. For example, if an address held 20% of the total ubaAMPL supply, and ubaAMPL itself would be 20% of the aAMPL supply, the claims of that address would be the 4% of the total aAMPL. We appreciate the Ampleforth team providing us these "internal" holdings of ubaAMPL, given their knowledge of the system.
            </li>
            <li>
                Only claims over a value of 30 USDC have been included, given that gas-wise, it would not be profitable to claim lower amounts. However, those values lower than 30 USDC will be naturally taken into account for the final follow-up distribution.
            </li>
            <li>
                Once again, this is an interim distribution, that will be followed up by another with more precise numbers and bigger in size.
            </li>
            <li>
                For the sake of reducing complexity, the Aave governance proposal will release the whole 300,000 USDC, and the Ampleforth team can just transfer to the Aave Collector the 40% of that amount, removing any dependency for users to claim as soon as possible.
            </li>
            <li>
                It is possible to check each address claims <a href="https://github.com/bgd-labs/aave-proposals-v3/blob/8d5b3e902adf7c5c246e752b5d6b6e0e5d9831b7/src/20240409_AaveV2Ethereum_InterimAAMPLDistribution/distribution.pdf" className="text-blue-500 underline">HERE</a>.
            </li>
        </ul>
    </div>
    <div className="w-full my-6 text-[#59588D] text-sm  dark:text-darkTextSecondary">
        <h1 className="text-[#5B62FE] font-semibold text-lg dark:text-darkText">
            Specification
        </h1>
        <p className="text-justify">
            The distribution will be done via the <a href="https://app.merkl.xyz/" className="text-blue-500 underline">Merkl</a> platform by Angle Labs, specialized in these operations and used before in other Aave DAO proposals, like the Merit program.
        </p>
        <p className="text-justify">
            Users with a balance below 30$ will be excluded from this initial distribution as the gas-cost for claiming would not offset the amount claimed.
        </p>
        <p className="text-justify">
            Therefore the proposal will perform the following steps upon execution:
        </p>
        <ul className="list-disc pl-5 text-justify">
            <li>Withdraw USDC from the collector (298.5k including a 0.5% fee for Angle Labs)</li>
            <li class="break-words whitespace-pre-wrap">
                Approve the full amount to <a href="https://etherscan.io/address/0x8BB4C975Ff3c250e0ceEA271728547f3802B36Fd" class="text-blue-500 underline">0x8BB4C975Ff3c250e0ceEA271728547f3802B36Fd</a> which is the distribution creator by Angle Labs
            </li>
            <li>Sign the TOS of <a href="https://app.merkl.xyz/" className="text-blue-500 underline">https://app.merkl.xyz/</a> via an onchain transaction, a requirement on the Merkl platform</li>
            <li>Create a campaign to distribute funds to the affected users</li>
        </ul>
        <p className="text-justify">
            2 hours after proposal execution, users will be able to claim the USDC on <a href="https://app.merkl.xyz/" className="text-blue-500 underline">https://app.merkl.xyz/</a>
        </p>
    </div>
    <div className="w-full my-4 text-[#59588D] text-sm  dark:text-darkTextSecondary">
        <h1 className="text-[#5B62FE] font-semibold text-lg dark:text-darkText">
            References
        </h1>
        <ul>
            <li>Implementation: <a href="https://github.com/bgd-labs/aave-proposals-v3/blob/2244338d3cb5b0482ff3499bf8f95c0762cc004c/src/20240409_AaveV2Ethereum_InterimAAMPLDistribution/AaveV2Ethereum_InterimAAMPLDistribution_20240409.sol#L1" className="underline">AaveV2Ethereum</a></li>
            <li>Tests: <a href="https://github.com/bgd-labs/aave-proposals-v3/blob/2244338d3cb5b0482ff3499bf8f95c0762cc004c" className="underline">Aave DAO Proposals</a></li>
        </ul>
    </div>
    <div className="w-full my-4 text-[#59588D] text-sm dark:text-darkText">
        <p className="text-[#78757A]">
            Copyright © 2024 Aave DAO
        </p>
    </div>
</div>

            
          </div>
        </div>
        <div className="w-full md2:w-4/12 dxl:w-3/12">
          <div className="w-full bg-[#233D63] p-4 rounded-xl text-white">
            <h1 className="font-semibold">Your voting info</h1>
            <p className="text-gray-200 text-xs my-1 flex items-center gap-2">
              Voting is on{" "}
              <img
                src="https://cdn.iconscout.com/icon/free/png-512/free-polygon-token-4086724-3379854.png?f=webp&w=512"
                alt="Icon"
                className="w-4 h-4 rounded-full object-cover"
              />{" "}
              Polygon
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
          <div className="w-full bg-[#233D63] p-4 rounded-xl text-white mt-6">
            <h1 className="font-semibold">Your voting info</h1>
            <div className="w-full mt-3">
              <div className="w-full text-[#5B62FE] mb-3">
                <div className="w-full flex items-center justify-between text-xs">
                  <span>YAE 531K</span>
                  <span>100.00%</span>
                </div>
                <div className="bg-gradient-to-r from-[#EDD049] to-[#8CC0D7] w-full h-2 rounded-full mt-2"></div>
              </div>
              <div className="w-full text-[#5B62FE] mb-3">
                <div className="w-full flex items-center justify-between text-xs">
                  <span>NAY 0</span>
                  <span>0%</span>
                </div>
                <div className="bg-[#B6B6B6B6] w-full h-2 rounded-full mt-2"></div>
              </div>
            </div>
            <div className="w-full py-4">
              <div className="w-full flex justify-between text-xs"></div>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="w-8/12 text-left text-gray-400">
                      Top 10 addresses
                    </th>
                    <th className="w-4/12 text-left text-gray-400">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_TEN_PROP.map((item, index) => (
                    <tr key={index.id}>
                      <td className="w-8/12 py-2">{item.title}</td>
                      <td className="w-4/12 py-2">{item.voteCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="w-full bg-[#233D63] p-4 rounded-xl text-white mt-6">
            <div className="w-full py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="w-full text-left text-gray-400">
                      Top 10 addresses
                    </th>
                    <th className="w-full text-gray-400">
                      <span className="p-2 block rounded-full border border-white w-fit text-[10px] whitespace-nowrap">
                        Open for voting
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2">Quorum</td>
                    <td className="py-2">
                      <span className="flex items-center gap-2 text-xs whitespace-nowrap">
                        Not reached <X size={14} />
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">
                      <div className="flex flex-col">
                        <span>Current votes</span>
                        <span className="text-[10px] text-gray-400">
                          Required
                        </span>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-col">
                        <span>144.64K</span>
                        <span className="text-[10px] text-gray-400">
                          320.00K
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">Quorum</td>
                    <td className="py-2">
                      <span className="flex items-center gap-2 text-xs whitespace-nowrap">
                        Not reached <X size={14} />
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">
                      <div className="flex flex-col">
                        <span>Current votes</span>
                        <span className="text-[10px] text-gray-400">
                          Required
                        </span>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-col">
                        <span>144.64K</span>
                        <span className="text-[10px] text-gray-400">
                          320.00K
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProposalDetails
