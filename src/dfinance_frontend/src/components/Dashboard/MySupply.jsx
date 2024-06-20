import { useState } from "react"
import React from "react"
import {
  MY_ASSET_TO_SUPPLY_TABLE_COL,
  MY_SUPPLY_ASSET_TABLE_COL,
  MY_SUPPLY_ASSET_TABLE_ROWS,
} from "../../utils/constants"
import Button from "../Button"
import { Switch } from "@mui/material"
import { Check } from "lucide-react"
import MySupplyModal from "./MySupplyModal"
import WithdrawPopup from "./WithdrawPopup"
import SupplyPopup from "./SupplyPopup"
import BorrowPopup from "./BorrowPopup"
import PaymentDone from "./PaymentDone"
import { useNavigate } from "react-router-dom"

const MySupply = () => {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState({
    isOpen: false,
    type: "",
  })

  const handleModalOpen = (type) => {
    console.log("sdsvvd")
    setIsModalOpen({
      isOpen: true,
      type: type,
    })
  }

  const renderModalOpen = (type) => {
    switch (type) {
      case "borrow":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={<BorrowPopup />}
          />
        )
      case "supply":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={<SupplyPopup />}
          />
        )
      case "withdraw":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={<WithdrawPopup />}
          />
        )
      case "payment":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={<PaymentDone />}
          />
        )
      default:
        return null
    }
  }
  return (
    <div className="w-full flex-col lg:flex-row flex gap-6 mt-[1rem] mb-[4rem]">
      <div className="w-full lg:w-6/12 mt-6">
        <div className="w-full min-h-[350px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl dark:bg-[linear-gradient(to_bottom_right,#27234F,#0D123C)]">
          <h1 className="text-[#2A1F9D] font-semibold my-2 dark:text-darkText">Your Supply</h1>
          <div className="w-full overflow-auto">
            <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText">
              <thead>
                <tr className="text-left text-[#233D63] text-xs dark:text-darkTextSecondary">
                  {MY_SUPPLY_ASSET_TABLE_COL.map((item, index) => (
                    <td key={index} className="p-3 whitespace-nowrap">
                      {item.header}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MY_SUPPLY_ASSET_TABLE_ROWS.slice(0, 8).map((item, index) => (
                  <tr
                    key={index}
                    className="w-full font-semibold hover:bg-[#ddf5ff8f] rounded-lg text-xs"
                  >
                    <td className="p-3 align-top">
                      <div className="w-full flex items-center justify-start min-w-[80px] gap-1 whitespace-nowrap">
                        <img
                          src={item.image}
                          alt={item.asset}
                          className="w-8 h-8 rounded-full"
                        />
                        {item.asset}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-col">
                        <p>{item.wallet_balance_count}</p>
                        <p className="font-light">${item.wallet_balance}M</p>
                      </div>
                    </td>
                    <td className="p-3 align-top">{item.apy}</td>
                    <td className="p-3 align-top">
                      <div className="w-full flex items-center justify-center">
                        <Switch
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#fff",
                            },
                            "& .MuiSwitch-track": {
                              backgroundColor: "#76EE59",
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                              {
                                backgroundColor: "#76EE59",
                              },
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="w-full flex gap-3">
                        <Button
                          title={"Supply"}
                          onClickHandler={() => handleModalOpen("supply")}
                          className={
                            "bg-gradient-to-r text-white from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-md p-2 px-3 shadow-lg font-semibold text-sm"
                          }
                        />
                        <Button
                          title={"Withdraw"}
                          onClickHandler={() => handleModalOpen("withdraw")}
                          className={
                            "bg-gradient-to-r text-white from-[#2A1F9D] to-[#4659CF] rounded-md p-2 px-3 shadow-lg font-semibold text-sm opacity-65"
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-full mt-6 min-h-[350px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl dark:bg-[linear-gradient(to_bottom_right,#27234F,#0D123C)]">
          <h1 className="text-[#2A1F9D] font-semibold my-2 dark:text-darkText">
            Assets to supply
          </h1>
          <div className="w-full overflow-auto">
            <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText">
              <thead>
                <tr className="text-left text-[#233D63] text-xs dark:text-darkTextSecondary">
                  {MY_SUPPLY_ASSET_TABLE_COL.map((item, index) => (
                    <td key={index} className="p-3 whitespace-nowrap">
                      {item.header}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MY_SUPPLY_ASSET_TABLE_ROWS.slice(0, 8).map((item, index) => (
                  <tr
                    key={index}
                    className="w-full font-semibold hover:bg-[#ddf5ff8f] rounded-lg text-xs"
                  >
                    <td className="p-3 align-top">
                      <div className="w-full flex items-center justify-start min-w-[80px] gap-1 whitespace-nowrap">
                        <img
                          src={item.image}
                          alt={item.asset}
                          className="w-8 h-8 rounded-full"
                        />
                        {item.asset}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-col">
                        <p>{item.wallet_balance_count}</p>
                        <p className="font-light">${item.wallet_balance}M</p>
                      </div>
                    </td>
                    <td className="p-3 align-top">{item.apy}</td>
                    <td className="p-3 align-top">
                      <div className="w-full flex items-center justify-center">
                        <Check color="#32851E" size={14} />
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="w-full flex gap-3">
                        <Button
                          title={"Supply"}
                          onClickHandler={() => handleModalOpen("supply")}
                          className={
                            "bg-gradient-to-r text-white from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-md p-2 px-3 shadow-lg font-semibold text-sm"
                          }
                        />
                        <Button
                          title={"Details"}
                          onClickHandler={() => navigate('/dashboard/asset-details')}
                          className={
                            "bg-gradient-to-r text-white from-[#2A1F9D] to-[#4659CF] rounded-md p-2 px-3 shadow-lg font-semibold text-sm opacity-65"
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-6/12 mt-6">
        <div className="w-full min-h-[250px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl dark:bg-[linear-gradient(to_bottom_right,#27234F,#0D123C)] ">
          <h1 className="text-[#2A1F9D] font-semibold my-2 dark:text-darkText">Your borrows</h1>
          <p className="text-[#233D63] text-sm dark:text-darkTextSecondary">Nothing Borrowed Yet</p>
        </div>
        <div className="w-full mt-6 min-h-[450px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl dark:bg-[linear-gradient(to_bottom_right,#27234F,#0D123C)]">
          <h1 className="text-[#2A1F9D] font-semibold my-2 dark:text-darkText">
            Assets to borrow
          </h1>
          <div className="w-full overflow-auto">
            <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText">
              <thead>
                <tr className="text-left text-[#233D63] text-xs dark:text-darkTextSecondary">
                  {MY_ASSET_TO_SUPPLY_TABLE_COL.map((item, index) => (
                    <td key={index} className="p-3 whitespace-nowrap">
                      {index === 2 ? item.header1 : item.header}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MY_SUPPLY_ASSET_TABLE_ROWS.slice(0, 8).map((item, index) => (
                  <tr
                    key={index}
                    className="w-full font-semibold hover:bg-[#ddf5ff8f] rounded-lg text-xs"
                  >
                    <td className="p-3 align-top">
                      <div className="w-full flex items-center justify-start min-w-[80px] gap-1 whitespace-nowrap">
                        <img
                          src={item.image}
                          alt={item.asset}
                          className="w-8 h-8 rounded-full"
                        />
                        {item.asset}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-col">
                        <p>{item.wallet_balance_count}</p>
                        <p className="font-light">${item.wallet_balance}M</p>
                      </div>
                    </td>
                    <td className="p-3 align-top">{item.apy}</td>
                    <td className="p-3 align-top">
                      <div className="w-full flex gap-3">
                        <Button
                          title={"Borrow"}
                          onClickHandler={() => handleModalOpen("borrow")}
                          className={
                            "bg-gradient-to-r text-white from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-md p-2 px-3 shadow-lg font-semibold text-sm"
                          }
                        />
                        <Button
                          title={"Details"}
                          onClickHandler={() => handleModalOpen("payment")}
                          className={
                            "bg-gradient-to-r text-white from-[#2A1F9D] to-[#4659CF] rounded-md p-2 px-3 shadow-lg font-semibold text-sm opacity-65"
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {renderModalOpen(isModalOpen.type)}
    </div>
  )
}

export default MySupply
