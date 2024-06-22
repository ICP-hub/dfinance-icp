import { useState } from "react"
import React from "react"
import {
  MY_ASSET_TO_SUPPLY_TABLE_COL,
  MY_SUPPLY_ASSET_TABLE_COL,
  MY_SUPPLY_ASSET_TABLE_ROWS,
  MY_ASSET_TO_SUPPLY_TABLE_ROW,
  MY_ASSET_TO_BORROW_TABLE_COL,
  MY_ASSET_TO_BORROW_TABLE_ROW,
  MY_BORROW_ASSET_TABLE_COL,
  MY_BORROW_ASSET_TABLE_ROWS
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
    asset: "",
    image: ""
  })
  const handleModalOpen = (type, asset, image) => {
    console.log("Handle modal opened")
    setIsModalOpen({
      isOpen: true,
      type: type,
      asset: asset,
      image: image
    })
  }


  const renderModalOpen = (type) => {
    switch (type) {
      case "borrow":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={<BorrowPopup asset={isModalOpen.asset} image={isModalOpen.image} />}
          />

        )
      case "supply":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={<SupplyPopup asset={isModalOpen.asset} image={isModalOpen.image} />}
          />
        )
      case "withdraw":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={<WithdrawPopup asset={isModalOpen.asset} image={isModalOpen.image} />}
          />
        )
      case "payment":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={<PaymentDone asset={isModalOpen.asset} image={isModalOpen.image} />}
          />
        )
      default:
        return null
    }
  }
  return (
    <div className="w-full flex-col lg:flex-row flex gap-6">
      <div className="w-full lg:w-6/12 mt-20">
        <div className="w-full min-h-[300px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl">
          <h1 className="text-[#2A1F9D] font-semibold my-2 ml-2">Your Supplies</h1>
          {MY_SUPPLY_ASSET_TABLE_ROWS.length === 0 ? (
            noSupplyMessage
          ) : (
            <div className="w-full overflow-auto">
              <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base">
                <thead>
                  <tr className="text-left text-[#233D63] text-xs ">
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
                        <div className="w-full flex items-center justify-start min-w-[80px] gap-2 whitespace-nowrap">
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
                                backgroundColor: '#fff',
                                border: '1px solid black',
                                boxShadow: '0 0 10px black',
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                              {
                                backgroundColor: "#1939ea",
                              },
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="w-full flex gap-2 pt-2">
                          <Button
                            title={"Supply"}
                            onClickHandler={() => handleModalOpen("supply", item.asset, item.image)}
                            className={
                              "bg-gradient-to-r text-white from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-md px-3 py-1.5 shadow-lg font-semibold text-xs"
                            }
                          />
                          <Button
                            title={"Withdraw"}
                            onClickHandler={() => handleModalOpen("withdraw", item.asset, item.image)}
                            className={
                              "bg-gradient-to-r text-white from-[#2A1F9D] to-[#4659CF] rounded-md px-3 py-1.5 shadow-lg font-semibold text-xs"
                            }
                          />
                        </div>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="w-full mt-10 min-h-[350px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl">
          <h1 className="text-[#2A1F9D] font-semibold my-2 ml-2">
            Assets to supply
          </h1>
          {MY_ASSET_TO_SUPPLY_TABLE_ROW.length === 0 ? (
            noAssetsToSupplyMessage
          ) : (
            <div className="w-full overflow-auto">
              <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base">
                <thead>
                  <tr className="text-left text-[#233D63] text-xs">
                    {MY_SUPPLY_ASSET_TABLE_COL.map((item, index) => (
                      <td key={index} className="p-3 whitespace-nowrap">
                        {item.header}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MY_ASSET_TO_SUPPLY_TABLE_ROW.slice(0, 8).map((item, index) => (
                    <tr
                      key={index}
                      className="w-full font-semibold hover:bg-[#ddf5ff8f] rounded-lg text-xs"
                    >
                      <td className="p-3 align-top">
                        <div className="w-full flex items-center justify-start min-w-[80px] gap-2 whitespace-nowrap">
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
                        <div className="w-full flex gap-2 ">
                          <Button
                            title={"Supply"}
                            onClickHandler={() => handleModalOpen("supply", item.asset, item.image)}
                            className={
                              "bg-gradient-to-r text-white from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-md px-3 py-1.5 shadow-lg font-semibold text-xs"
                            }
                          />
                          <Button
                            title={"Details"}
                            onClickHandler={() => navigate('/dashboard/asset-details')}
                            className={
                              "bg-gradient-to-r text-white from-[#2A1F9D] to-[#4659CF] rounded-md px-3 py-1.5 shadow-lg font-semibold text-xs"
                            }
                          />
                        </div>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <div className="w-full lg:w-6/12 mt-20">
        <div className="w-full min-h-[250px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl">

          <h1 className="text-[#2A1F9D] font-semibold my-2 ml-2">Your Borrows</h1>
          {MY_BORROW_ASSET_TABLE_ROWS.length === 0 ? (
            noBorrowMessage
          ) : (

            <div className="w-full overflow-auto">
              <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base">
                <thead>
                  <tr className="text-left text-[#233D63] text-xs ">
                    {MY_BORROW_ASSET_TABLE_COL.map((item, index) => (
                      <td key={index} className="p-3 whitespace-nowrap">
                        {item.header}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MY_BORROW_ASSET_TABLE_ROWS.slice(0, 8).map((item, index) => (
                    <tr
                      key={index}
                      className="w-full font-semibold hover:bg-[#ddf5ff8f] rounded-lg text-xs"
                    >
                      <td className="p-3 align-top">
                        <div className="w-full flex items-center justify-start min-w-[80px] gap-2 whitespace-nowrap">
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
                        {item.apy_type}
                      </td>
                      <td className="p-3 align-top">
                        <div className="w-full flex gap-2">
                          <Button
                            title={"Borrow"}
                            onClickHandler={() => handleModalOpen("borrow", item.asset, item.image)}
                            className={
                              "bg-gradient-to-r text-white from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-md px-3 py-1.5 shadow-lg font-semibold text-xs"
                            }
                          />

                          <Button
                            title={"Repay"}
                            onClickHandler={() => handleModalOpen("withdraw", item.asset, item.image)}
                            className={
                              "bg-gradient-to-r text-white from-[#2A1F9D] to-[#4659CF] rounded-md px-3 py-1.5 shadow-lg font-semibold text-xs"
                            }
                          />
                        </div>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="w-full mt-10 min-h-[450px] p-6 bg-gradient-to-r from-[#4659CF]/40 via-[#D379AB]/40 to-[#FCBD78]/40 rounded-3xl">
          <h1 className="text-[#2A1F9D] font-semibold my-2 ml-2">
            Assets to borrow
          </h1>
          {MY_ASSET_TO_BORROW_TABLE_ROW.length === 0 ? (
            noAssetsToBorrowMessage
          ) : (
            <div className="w-full overflow-auto">
            <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base">
              <thead>
                <tr className="text-left text-[#233D63] text-xs">
                  {MY_ASSET_TO_BORROW_TABLE_COL.map((item, index) => (
                    <td key={index} className="p-3 whitespace-nowrap">
                      {index === 2 ? item.header2 : item.header}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MY_ASSET_TO_BORROW_TABLE_ROW.slice(0, 8).map((item, index) => (
                  <tr
                    key={index}
                    className="w-full font-semibold hover:bg-[#ddf5ff8f] rounded-lg text-xs"
                  >
                    <td className="p-3 align-top">
                      <div className="w-full flex items-center justify-start min-w-[80px] gap-2 whitespace-nowrap">
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
                    <td className="p-3 align-top">
                      <div className="flex flex-col">
                        <p>{item.apy}</p>
                        <p className="font-light break-words">
                          {item.apy_desc.slice(0, 18)}<br />
                          {item.apy_desc.slice(18, 32)}<br />
                          {item.apy_desc.slice(32)}
                        </p>
                      </div>

                    </td>
                    <td className="p-3 align-top">
                        <div className="w-full flex gap-3">
                          <Button
                            title={"Borrow"}
                            onClickHandler={() => handleModalOpen("borrow", item.asset, item.image)}
                            className={
                              "bg-gradient-to-r text-white from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-md p-2 px-3 shadow-lg font-semibold text-sm"
                            }
                          />
                          <Button
                            title={"Details"}
                            onClickHandler={() => handleModalOpen("payment")}
                            className={
                              "bg-gradient-to-r text-white from-[#2A1F9D] to-[#4659CF] rounded-md p-2 px-3 shadow-lg font-semibold text-sm "
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                   {/* Gradient border line */}
                   <tr className="relative">
                    <td colSpan="4" className="p-0">
                      <div className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] opacity-50" />
                    </td>
                  </tr>
                  </tbody>
                  <thead>
                  <tr className="text-left text-[#233D63] text-xs">
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
                        <div className="w-full flex items-center justify-start min-w-[80px] gap-2 whitespace-nowrap">
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
                            onClickHandler={() => handleModalOpen("borrow", item.asset, item.image)}
                            className={
                              "bg-gradient-to-r text-white from-[#4659CF] via-[#D379AB] to-[#FCBD78] rounded-md p-2 px-3 shadow-lg font-semibold text-sm"
                            }
                          />
                          <Button
                            title={"Details"}
                            onClickHandler={() => handleModalOpen("payment")}
                            className={
                              "bg-gradient-to-r text-white from-[#2A1F9D] to-[#4659CF] rounded-md p-2 px-3 shadow-lg font-semibold text-sm "
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {renderModalOpen(isModalOpen.type)}
    </div>
  )
}

export default MySupply