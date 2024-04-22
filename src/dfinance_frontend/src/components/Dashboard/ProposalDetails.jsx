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
        <h1 className="text-[#2A1F9D] mt-3 text-xl font-semibold">
          Proposal overview
        </h1>
      </div>
      <div className="w-full flex flex-col md2:flex-row mt-4 gap-6">
        <div className="w-full md2:w-8/12 dxl:w-9/12 min-h-[450px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl">
          <div className="w-full">
            <div className="w-full p-3">
              <h1 className="text-[#2A1F9D] text-lg font-semibold my-2">
                Interim aAMPL distribution
              </h1>
              <span className="p-2 block rounded-full px-3 border border-white w-fit text-xs mt-3">
                Open for votings
              </span>
            </div>
          </div>
          <div className="w-full mt-8">
            <div className="w-full my-6 text-[#59588D] text-sm">
              <h1 className="text-[#5B62FE] font-semibold text-lg">
                Simple Summary
              </h1>
              <p>Distribute 300.000 USDC to users affected by aAMPL problem.</p>
            </div>
            <div className="w-full my-6 text-[#59588D] text-sm">
              <h1 className="text-[#5B62FE] font-semibold text-lg">
                Motivation
              </h1>
              <p>
                On December 2023, a problem was detected on the AMPL custom
                reserve on Aave v2 Ethereum, causing an unexpected inflation of
                AMPL-related balances and supply, not following the intended
                design by the Ampleforth team. While further analysis is
                performed for the most reasonable strategy on giving withdrawal
                liquidity for aAMPL supplies, an interim distribution of 300`000
                USD value is proposed as lower threshold, to allow aAMPL
                suppliers to proceed partially with their withdrawals. With aip
                72 having passed the governance process, aAMPL transfers are no
                longer permitted, which allows to snapshot the current{" "}
              </p>
            </div>
            <div className="w-full my-6 text-[#59588D] text-sm">
              <h1 className="text-[#5B62FE] font-semibold text-lg">
                Specification
              </h1>
              <p>
                The distribution will be done via the Merkl platform by Angle
                Labs, specialized on these operations and used before in other
                Aave DAO proposals, like the Merit program. Users with a balance
                below 30$ will be excluded from this initial distribution as the
                gas-cost for claiming would not offset set amount claimed.
              </p>
            </div>

            <div className="w-full my-6 text-[#59588D] text-sm">
              <h1 className="text-[#5B62FE] font-semibold text-lg">
                References
              </h1>
              <ul>
                <li>Implementation: AaveV2Ethereum</li>
                <li>Tests: AaveV2Ethereum</li>
                <li>Snapshot</li>
                <li>Discussion</li>
                <li>Distribution:IPFS</li>
                <li>Distribution:formatted</li>
              </ul>
            </div>

            <div className="w-full my-6 text-[#59588D] text-sm">
              <h1 className="text-[#5B62FE] font-semibold text-lg">
                Copyright
              </h1>
              <p>Copyright and related rights waived via CC0.</p>
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
