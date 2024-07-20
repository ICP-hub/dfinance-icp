import { useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import React from "react";
import {
  MY_ASSET_TO_SUPPLY_TABLE_COL,
  MY_SUPPLY_ASSET_TABLE_COL,
  MY_SUPPLY_ASSET_TABLE_ROWS,
  MY_ASSET_TO_SUPPLY_TABLE_ROW,
  MY_ASSET_TO_BORROW_TABLE_COL,
  MY_ASSET_TO_BORROW_TABLE_ROW,
  MY_BORROW_ASSET_TABLE_COL,
  MY_BORROW_ASSET_TABLE_ROWS,
} from "../../utils/constants";
import CustomizedSwitches from "../MaterialUISwitch";
import EModeButton from "./Emode";
import Button from "../Button";
import { Switch } from "@mui/material";
import { Check, Eye, EyeOff, Info } from "lucide-react";
import MySupplyModal from "./MySupplyModal";
import WithdrawPopup from "./WithdrawPopup";
import SupplyPopup from "./SupplyPopup";
import BorrowPopup from "./BorrowwPopup";
import PaymentDone from "./PaymentDone";
import { useNavigate } from "react-router-dom";
import Borrow from "./BorrowPopup";
import Repay from "./Repay";
import { useAuth } from "../../utils/useAuthClient";

const MySupply = () => {
  const navigate = useNavigate();
  const { state, pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const shouldRenderTransactionHistoryButton = pathname === "/dashboard";
  const [isModalOpen, setIsModalOpen] = useState({
    isOpen: false,
    type: "",
    asset: "",
    image: "",
  });console.log("hello",isModalOpen);
  const handleModalOpen = (type, asset, image) => {
    console.log("Handle modal opened");
    setIsModalOpen({
      isOpen: true,
      type: type,
      asset: asset,
      image: image,
    });
  };
  const theme = useSelector((state) => state.theme.theme);
  const checkColor = theme === "dark" ? "#ffffff" : "#2A1F9D";
  const [activeSection, setActiveSection] = useState("supply");
  const [isVisible, setIsVisible] = useState(true);
  const [isBorrowVisible, setIsBorrowVisible] = useState(true);
  const [isborrowVisible, setIsborrowVisible] = useState(true);
  const [isSupplyVisible, setIsSupplyVisible] = useState(true);
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  const toggleBorrowVisibility = () => {
    setIsBorrowVisible(!isBorrowVisible);
  };
  const toggleborrowVisibility = () => {
    setIsborrowVisible(!isborrowVisible);
  };
  const toggleSupplyVisibility = () => {
    setIsSupplyVisible(!isSupplyVisible);
  };
  const renderModalOpen = (type) => {
    switch (type) {
      case "borrow":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <BorrowPopup
              isModalOpen={isModalOpen.isOpen}
              handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
              />
            }
          />
        );
      case "borroww":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <Borrow   isModalOpen={isModalOpen.isOpen}
              handleModalOpen={handleModalOpen}
              asset={isModalOpen.asset} image={isModalOpen.image} />
            }
          />
        );
      case "supply":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <SupplyPopup
              isModalOpen={isModalOpen.isOpen}
              setIsModalOpen={setIsModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
              />
            }
          />
        );
      case "withdraw":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <WithdrawPopup
              isModalOpen={isModalOpen.isOpen}
              handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
              />
            }
          />
        );
      case "payment":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <PaymentDone
              isModalOpen={isModalOpen.isOpen}
              handleModalOpen={handleModalOpen}
                asset={isModalOpen.asset}
                image={isModalOpen.image}
              />
            }
          />
        );
      case "repay":
        return (
          <MySupplyModal
            isModalOpen={isModalOpen.isOpen}
            handleModalOpen={handleModalOpen}
            children={
              <Repay   isModalOpen={isModalOpen.isOpen}
              handleModalOpen={handleModalOpen}
              asset={isModalOpen.asset} image={isModalOpen.image} />
            }
          />
        );
      default:
        return null;
    }
  };
  const hasNoBorrows = MY_BORROW_ASSET_TABLE_ROWS.length === 0;
  const noBorrowMessage = (
    <p className="text-[#233D63] font-semibold ml-2 mt-10">
      Nothing borrowed yet
    </p>
  );
  const noSupplyMessage = (
    <p className="text-[#233D63] font-semibold ml-2 mt-10">
      Nothing supplied yet
    </p>
  );
  const noAssetsToSupplyMessage = (
    <p className="text-[#233D63] font-semibold ml-2 mt-10">
      No assets to supply.
    </p>
  );
  const noAssetsToBorrowMessage = (
    <p className="text-[#233D63] font-semibold ml-2 mt-10">
      No assets to borrow.
    </p>
  );
  return (
    <div className="w-full flex-col lg:flex-row flex gap-6">
      <div className="flex justify-center -mb-38 lg:hidden">
        <button
          className={`w-1/2 py-2  ${activeSection === "supply"
              ? "text-[#2A1F9D] font-bold underline dark:text-darkTextSecondary"
              : "text-[#2A1F9D] opacity-50  dark:text-darkTextSecondary1"
            }`}
          onClick={() => setActiveSection("supply")}
        >
          &#8226; Supply
        </button>
        <button
          className={`w-1/2 py-1  ${activeSection === "borrow"
              ? "text-[#2A1F9D] font-bold underline dark:text-darkTextSecondary"
              : "text-[#2A1F9D] opacity-50 dark:text-darkTextSecondary"
            }`}
          onClick={() => setActiveSection("borrow")}
        >
          &#8226; Borrow
        </button>

        <div className="ml-auto lg:hidden sxs3:flex align-center justify-center">
          {isAuthenticated && shouldRenderTransactionHistoryButton && (
            <a href="/dashboard/transaction-history" className="block">
              <button className=" text-nowrap px-2 py-2 md:px-4 md:py-2 border border-[#2A1F9D] text-[#2A1F9D] bg-[#ffff] rounded-lg shadow-md hover:shadow-[#00000040] font-semibold text-sm cursor-pointer relative dark:bg-darkOverlayBackground dark:text-darkText dark:border-none">
                Transactions
              </button>
            </a>
          )}
        </div>
      </div>

      <div className="w-full lg:w-6/12 mt-6 md:mt-4 lg:mt-20">
        <div
          className={`${activeSection === "supply" ? "block" : "hidden"
            } lg:block`}
        >
          <div
            className={`w-full ${isSupplyVisible ? "min-h-[350px]" : "min-h-[100px]"
              } p-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mt-3">
              <h1 className="text-[#2A1F9D] font-semibold my-2 ml-2 dark:text-darkText">
                Your supplies
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-4"
                onClick={toggleSupplyVisibility}
              >
                {isSupplyVisible ? "Hide" : "Show"}
                {isSupplyVisible ? (
                  <EyeOff className="ml-1" size={16} />
                ) : (
                  <Eye className="ml-1" size={16} />
                )}
              </button>
            </div>

            {/* Content for Mobile Screens */}
            <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
              {isSupplyVisible && (
                <>
                  {MY_SUPPLY_ASSET_TABLE_ROWS.length === 0 ? (
                    noSupplyMessage
                  ) : (
                    <div className="overflow-auto mt-4">
                      {MY_SUPPLY_ASSET_TABLE_ROWS.slice(0, 8).map(
                        (item, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg dark:bg-darkSurface dark:text-darkText`}
                          >
                            <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                              <img
                                src={item.image}
                                alt={item.asset}
                                className="w-8 h-8 rounded-full dark:text-darkText"
                              />
                              <span className="text-sm font-semibold text-[#2A1F9D] dark:text-darkText">
                                {item.asset}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-[#233D63] font-semibold mb-4 mt-6">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50 ">
                                Wallet Balance:
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                ${item.wallet_balance_count}M
                              </p>
                            </div>
                            <div className="flex justify-end text-xs  dark:text-darkText">
                              <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                ${item.wallet_balance}M
                              </p>
                            </div>
                            <div className="flex justify-between text-xs text-[#233D63] font-semibold mt-6 mb-1">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50 ">
                                APY:
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText mt-2 mb-2">
                                {item.apy}%
                              </p>
                            </div>
                            <div className="flex justify-between text-xs  text-[#233D63] font-semibold mt-3 mb-4">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50 ">
                                Can Be Collateral
                              </p>
                              <div className="-mr-3 -mt-4 mb-4" >
                              <CustomizedSwitches 
                               />
                               </div>
                            </div>
                            <div className="flex justify-center gap-2 mt-2 mb-2">
                              <Button
                                title={"Supply"}
                                onClickHandler={() =>
                                  handleModalOpen(
                                    "supply",
                                    item.asset,
                                    item.image
                                  )
                                }
                                className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md font-semibold text-lg"
                              />
                              <Button
                                title={"Withdraw"}
                                onClickHandler={() =>
                                  handleModalOpen(
                                    "withdraw",
                                    item.asset,
                                    item.image
                                  )
                                }
                                className={`w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent`}
                              />
                            </div>
                            {index !==
                              MY_SUPPLY_ASSET_TABLE_ROWS.length - 1 && (
                                <div className="border-t border-blue-800 my-4 opacity-50 mt-4"></div>
                              )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Content for Desktop Screens */}
            <div className="hidden xl:block">
              {isSupplyVisible && (
                <>
                  {MY_SUPPLY_ASSET_TABLE_ROWS.length === 0 ? (
                    noSupplyMessage
                  ) : (
                    <div className="w-full overflow-auto mt-4">
                      <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText">
                        <thead>
                          <tr className="text-left text-[#233D63] text-xs  dark:text-darkTextSecondary1">
                            {MY_SUPPLY_ASSET_TABLE_COL.map((item, index) => (
                              <td key={index} className="p-3 ">
                                {item.header}
                              </td>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MY_SUPPLY_ASSET_TABLE_ROWS.slice(0, 8).map(
                            (item, index) => (
                              <tr
                                key={index}
                                className="w-full font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
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
                                    <p className="font-light">
                                      ${item.wallet_balance}M
                                    </p>
                                  </div>
                                </td>
                                <td className="p-3 align-top mt-1.5">
                                  {item.apy}
                                </td>
                                <td className="p-3 align-top">
                                  <div className="w-full flex items-center justify-center">

                                    <CustomizedSwitches
                                    />
                                  </div>
                                </td>
                                <td className="p-3 align-top">
                                  <div className="w-full flex gap-2 pt-2">
                                    <Button
                                      title={"Supply"}
                                      onClickHandler={() =>
                                        handleModalOpen(
                                          "supply",
                                          item.asset,
                                          item.image
                                        )
                                      }
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white  rounded-lg px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs"
                                    />
                                    <Button
                                      title={"Withdraw"}
                                      onClickHandler={() =>
                                        handleModalOpen(
                                          "withdraw",
                                          item.asset,
                                          item.image
                                        )
                                      }
                                      className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D]  rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs  "
                                       />
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div
            className={`w-full mt-8 ${isVisible ? "min-h-[350px]" : "min-h-[100px]"
              } p-6 bg-gradient-to-r from-[#4659CF]/40   to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center">
              <h1 className="text-[#2A1F9D] font-semibold my-2 ml-2 dark:text-darkText">
                Assets to supply
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-4"
                onClick={toggleVisibility}
              >
                {isVisible ? "Hide" : "Show"}
                {isVisible ? (
                  <EyeOff className="ml-1" size={16} />
                ) : (
                  <Eye className="ml-1" size={16} />
                )}
              </button>
            </div>
            {/* mobile screen  */}
            <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
              {isVisible && (
                <>
                  {MY_SUPPLY_ASSET_TABLE_ROWS.length === 0 ? (
                    noSupplyMessage
                  ) : (
                    <div className="overflow-auto mt-4">
                      {MY_SUPPLY_ASSET_TABLE_ROWS.slice(0, 8).map(
                        (item, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg  dark:bg-darkSurface mb-4 dark:text-darkText "
                          >
                            <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                              <img
                                src={item.image}
                                alt={item.asset}
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="text-sm font-semibold  text-[#2A1F9D] dark:text-darkText">
                                {item.asset}
                              </span>
                            </div>
                            <div className="flex justify-between  text-[#233D63] text-xs font-semibold mb-1 mt-6 ">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50  ">
                                Wallet Balance:
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText ">
                                {item.wallet_balance_count}
                              </p>
                            </div>
                            <div className="flex justify-end text-xs mb-2">
                              <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                ${item.wallet_balance}M
                              </p>
                            </div>
                            <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-6 mb-2">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50  ">
                                APY:
                              </p>
                              <p className="text-right text-[#2A1F9D] mb-2 dark:text-darkText">
                                {item.apy}%
                              </p>
                            </div>
                            <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-4 mb-4">
                              <p className="text-nowrap  text-[#233D63] dark:text-darkText dark:opacity-50  ">
                                Can Be Coletral
                              </p>
                              <div className="w-full flex items-center justify-end dark:text-darkText">
                                  <Check color={checkColor} size={16} />
                                </div>
                            </div>
                            <div className="flex  justify-center gap-2 mt-2">
                              <Button
                                title={"Supply"}
                                onClickHandler={() =>
                                  handleModalOpen(
                                    "supply",
                                    item.asset,
                                    item.image
                                  )
                                }
                                className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md shadow-[#00000040] font-semibold text-lg font-inter"
                              />

                              <Button
                                title={"Details"}
                                onClickHandler={() =>
                                  navigate("/dashboard/asset-details")
                                }
                                className={` w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent font-inter
                                  
                                }`}
                              />
                            </div>
                            {index !==
                              MY_SUPPLY_ASSET_TABLE_ROWS.length - 1 && (
                                <div className="border-t border-blue-800 my-4 opacity-50 mt-4"></div>
                              )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* for desktop screen */}
            <div className="hidden xl:block ">
              {isVisible &&
                (MY_ASSET_TO_SUPPLY_TABLE_ROW.length === 0 ? (
                  noAssetsToSupplyMessage
                ) : (
                  <div className="w-full overflow-auto">
                    <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText">
                      <thead>
                        <tr className="text-left text-[#233D63] text-xs dark:text-darkTextSecondary1">
                          {MY_SUPPLY_ASSET_TABLE_COL.map((item, index) => (
                            <td key={index} className="p-3 ">
                              {item.header}
                            </td>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {MY_ASSET_TO_SUPPLY_TABLE_ROW.slice(0, 8).map(
                          (item, index) => (
                            <tr
                              key={index}
                              className="w-full font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
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
                                  <p className="font-light">
                                    ${item.wallet_balance}M
                                  </p>
                                </div>
                              </td>
                              <td className="p-3 align-top">{item.apy}</td>
                              <td className="p-3 align-top">
                                <div className="w-full flex items-center justify-center dark:text-darkText">
                                  <Check color={checkColor} size={16} />
                                </div>
                              </td>
                              <td className="p-3 align-top">
                                <div className="w-full flex gap-2  ">
                                  <Button
                                    title={"Supply"}
                                    onClickHandler={() =>
                                      handleModalOpen(
                                        "supply",
                                        item.asset,
                                        item.image
                                      )
                                    }
                                    className={
                                      "bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white  rounded-md px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs font-inter"
                                    }
                                  />
                                  <Button
                                    title={"Details"}
                                    onClickHandler={() =>
                                      navigate("/dashboard/asset-details")
                                    }
                                    className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D]  rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"

                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-6/12 md:-mt-10 lg:mt-20">
        <div
          className={`${activeSection === "borrow" ? "block" : "hidden"
            } lg:block`}
        >
          <div
            className={`w-full ${isborrowVisible ? "min-h-[350px]" : "min-h-[100px]"
              } p-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center mt-3">
              <h1 className="text-[#2A1F9D] font-semibold my-2 ml-2 dark:text-darkText">
                Your borrow
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-auto md:ml-0"
                onClick={toggleborrowVisibility}
              >
                {isborrowVisible ? "Hide" : "Show"}
                {isborrowVisible ? (
                  <EyeOff className="ml-1" size={16} />
                ) : (
                  <Eye className="ml-1" size={16} />
                )}
              </button>
            </div>

            {/* E-Mode section for mobile screens only */}
            <div className="md:block lgx:block xl:hidden flex flex-col items-start mt-2 ml-2">
              <div className="flex items-center space-x-4">
                <span className="text-[#2A1F9D] opacity-50 font-semibold dark:text-darkText">
                  E-Mode
                </span>
                <EModeButton />
              </div>
            </div>
            <div className="hidden xl:flex items-center space-x-4  ml-40 -mt-8">
              <div className="flex items-center space-x-4">
                <span className="text-[#2A1F9D] opacity-50 font-semibold dark:text-darkText">
                  E-Mode
                </span>
                <EModeButton />
              </div>
            </div>
            {/* mobile screen for borrow */}
            {isborrowVisible && (
              <>
                {MY_BORROW_ASSET_TABLE_ROWS.length === 0 ? (
                  noBorrowMessage
                ) : (
                  <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
                    <div className="overflow-auto ">
                      {MY_BORROW_ASSET_TABLE_ROWS.slice(0, 8).map(
                        (item, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg  dark:bg-darkSurface mb-4 dark:text-darkText"
                          >
                            <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                              <img
                                src={item.image}
                                alt={item.asset}
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="text-sm font-semibold text-[#2A1F9D] dark:text-darkText">
                                {item.asset}
                              </span>
                            </div>
                            <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-2">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50  mt-4">
                                Debt
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText mt-4">
                                ${item.wallet_balance}M
                              </p>
                            </div>
                            <div className="flex justify-end text-xs font-semibold">
                              <p className="text-right text-[#2A1F9D] mb-2 dark:text-darkText">
                                {item.wallet_balance_count}
                              </p>
                            </div>
                            <div className="flex justify-between  text-[#233D63] text-xs font-semibold mb-2">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50 mt-2">
                                APY:
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText mt-2">
                                {item.apy}
                              </p>
                            </div>
                            <div className="flex justify-between text-[#233D63] text-xs font-semibold mt-6 mb-2">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50  ">
                                APY Type:
                              </p>
                              <p className="text-right text-white bg-[#79779a] px-4 border border-white rounded-lg p-2 dark:text-darkText">
                                {item.apy_type}
                              </p>
                            </div>
                            <div className="flex justify-center gap-2 mt-4">
                              <Button
                                title={"Borrow"}
                                onClickHandler={() =>
                                  handleModalOpen(
                                    "borrow",
                                    item.asset,
                                    item.image
                                  )
                                }
                                className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md shadow-[#00000040] font-semibold text-lg font-inter"
                              />
                              <Button
                                title={"Repay"}
                                onClickHandler={() =>
                                  handleModalOpen(
                                    "repay",
                                    item.asset,
                                    item.image
                                  )
                                }
                                className={` w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent font-inter
                                  
                                }`}
                              />
                            </div>
                            {index !==
                              MY_BORROW_ASSET_TABLE_ROWS.length - 1 && (
                                <div className="border-t border-[#2A1F9D] my-4 opacity-50"></div>
                              )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* desktop screen */}
            <div className="hidden xl:block">
              {isborrowVisible && (
                <>
                  {MY_BORROW_ASSET_TABLE_ROWS.length === 0 ? (
                    noBorrowMessage
                  ) : (
                    <div className="w-full overflow-auto md: mt-6 ">
                      <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText">
                        <thead>
                          <tr className="text-left text-[#233D63] text-xs dark:text-darkTextSecondary1 mt-10">
                            {MY_BORROW_ASSET_TABLE_COL.map((item, index) => (
                              <td key={index} className="p-3 whitespace-nowrap">
                                {item.header}
                              </td>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MY_BORROW_ASSET_TABLE_ROWS.slice(0, 8).map(
                            (item, index) => (
                              <tr
                                key={index}
                                className="w-full font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
                              >
                                <td className="p-3 align-top mb-1">
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
                                    <p className="font-light">
                                      ${item.wallet_balance}M
                                    </p>
                                  </div>
                                </td>
                                <td className="p-3 align-top ">
                                  {item.apy}
                                </td>
                                <td className="p-3 align-top">
                                  <div className="w-full flex mt-2.5 ">
                                    {item.apy_type}
                                  </div>
                                </td>
                                <td className="p-3 align-top">
                                  <div className="w-full flex gap-2 pt-2.5">
                                    <Button
                                      title={"Borrow"}
                                      onClickHandler={() =>
                                        handleModalOpen(
                                          "borrow",
                                          item.asset,
                                          item.image
                                        )
                                      }
                                      className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white shadow-md shadow-[#00000040] rounded-md px-3 py-1.5  font-semibold text-xs"
                                    />
                                    <Button
                                      title={"Repay"}
                                      onClickHandler={() =>
                                        handleModalOpen(
                                          "repay",
                                          "repay",
                                          item.asset,
                                          item.image
                                        )
                                      }
                                      className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D]  rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"
                                    />
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div
            className={`w-full mt-9 h-[350px] overflow-y-auto hide-scrollbar ${isBorrowVisible ? "min-h-[350px]" : "min-h-[100px]"
              } p-6 bg-gradient-to-r from-[#4659CF]/40  to-[#FCBD78]/40 rounded-3xl dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd relative`}
          >
            <div className="flex justify-between items-center">
              <h1 className="text-[#2A1F9D] font-semibold my-2 ml-2 dark:text-darkText">
                Assets to borrow
              </h1>
              <button
                className="flex items-center text-sm text-[#2A1F9D] font-semibold dark:text-darkTextSecondary cursor-pointer ml-auto md:ml-0"
                onClick={toggleBorrowVisibility}
              >
                {isBorrowVisible ? "Hide" : "Show"}
                {isBorrowVisible ? (
                  <EyeOff className="ml-1" size={16} />
                ) : (
                  <Eye className="ml-1" size={16} />
                )}
              </button>
            </div>
            {isBorrowVisible && (
              <>
                {MY_BORROW_ASSET_TABLE_ROWS.length === 0 ? (
                  noBorrowMessage
                ) : (
                  <div className="md:block lgx:block xl:hidden dark:bg-gradient dark:from-darkGradientStart dark:to-darkGradientEnd">
                    <div className="overflow-auto ">
                      {MY_BORROW_ASSET_TABLE_ROWS.slice(0, 8).map(
                        (item, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg  dark:bg-darkSurface mb-4 dark:text-darkText"
                          >
                            <div className="flex items-center justify-start min-w-[80px] gap-2 mb-2">
                              <img
                                src={item.image}
                                alt={item.asset}
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="text-sm font-semibold dark:text-darkText text-[#2A1F9D]">
                                {item.asset}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-[#233D63] font-semibold mb-2 mt-1">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50  mt-4">
                                Avaliable
                              </p>
                              <p className="text-right text-[#2A1F9D] dark:text-darkText mt-4">
                                ${item.wallet_balance}M
                              </p>
                            </div>
                            <div className="flex justify-end text-xs font-semibold">
                              <p className="text-right text-[#2A1F9D] mb-4 dark:text-darkText">
                                {item.wallet_balance_count}
                              </p>
                            </div>
                            <div className="flex justify-between text-[#233D63] text-xs font-semibold mb-6 mt-6">
                              <p className="text-[#233D63] dark:text-darkText dark:opacity-50  text-nowrap flex items-center">
                                APY, Variable <Info size={16} />
                              </p>

                              <p className="text-right text-[#2A1F9D] dark:text-darkText">
                                {item.apy}%
                              </p>
                            </div>

                            <div className="flex justify-center gap-2 mt-4">
                              <Button
                                title={"Borrow"}
                                onClickHandler={() =>
                                  handleModalOpen(
                                    "borrow",
                                    item.asset,
                                    item.image
                                  )
                                }
                                className="bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white rounded-md px-9 py-1 shadow-md shadow-[#00000040] font-semibold text-lg font-inter"
                              />
                              <Button
                                title={"Details"}
                                onClickHandler={() =>
                                  handleModalOpen("payment")
                                }
                                className={` w-[380px] md:block lgx:block xl:hidden z-20 px-4 py-[7px] focus:outline-none box bg-transparent font-inter
                                  
                                  }`}
                              />
                            </div>
                            {index !==
                              MY_BORROW_ASSET_TABLE_ROWS.length - 1 && (
                                <div className="border-t border-[#2A1F9D] my-4 opacity-50"></div>
                              )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* DESKTOP  */}
            <div className="hidden xl:block">
              {isBorrowVisible && (
                <>
                  <div className="bg-[#AEADCB] opacity-80 mt-2 px-2 py-2 rounded-lg flex items-center mb-2">
                    <span className="text-white dark:text-darkText ms-4 text-sm">
                      To borrow you need to supply any asset to be used as
                      collateral.
                    </span>
                    <Info className="ml-4 text-[#2A1F9D]" />
                  </div>
                  {MY_ASSET_TO_BORROW_TABLE_ROW.length === 0 ? (
                    noAssetsToBorrowMessage
                  ) : (
                    <div className="w-full overflow-auto">
                      <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText">
                        <thead>
                          <tr className="text-left text-[#233D63] text-xs dark:text-darkTextSecondary1">
                            {MY_ASSET_TO_BORROW_TABLE_COL.map((item, index) => (
                              <td key={index} className="p-3 whitespace-nowrap">
                                {index === 2 ? item.header2 : item.header}
                              </td>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MY_ASSET_TO_BORROW_TABLE_ROW.slice(0, 8).map(
                            (item, index) => (
                              <tr
                                key={index}
                                className="w-full font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
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
                                    <p className="font-light">
                                      ${item.wallet_balance}M
                                    </p>
                                  </div>
                                </td>
                                <td className="p-3 align-top">
                                  <div className="flex flex-col">
                                    <p>{item.apy}</p>
                                    <p className="font-light break-words">
                                      {item.apy_desc.slice(0, 18)}
                                      <br />
                                      {item.apy_desc.slice(18, 32)}
                                      <br />
                                      {item.apy_desc.slice(32)}
                                    </p>
                                  </div>
                                </td>
                                <td className="p-3 align-top">
                                  <div className="w-full flex gap-3">
                                    <Button
                                      title={"Borrow"}
                                      onClickHandler={() =>
                                        handleModalOpen(
                                          "borrow",
                                          item.asset,
                                          item.image
                                        )
                                      }
                                      className={
                                        "bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white  rounded-md px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs font-inter"
                                      }
                                    />
                                    <Button
                                      title={"Details"}
                                      onClickHandler={() =>
                                        handleModalOpen("payment")
                                      }
                                      className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D]  rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"

                                    />
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                          {/* Gradient border line */}
                          <tr className="relative">
                            <td colSpan="4" className="p-0">
                              <div className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] opacity-50" />
                            </td>
                          </tr>
                        </tbody>
                        <thead>
                          <tr className="text-left text-[#233D63] text-xs dark:text-darkTextSecondary1">
                            {MY_ASSET_TO_SUPPLY_TABLE_COL.map((item, index) => (
                              <td key={index} className="p-3 whitespace-nowrap">
                                {index === 2 ? item.header1 : item.header}
                              </td>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MY_SUPPLY_ASSET_TABLE_ROWS.slice(0, 8).map(
                            (item, index) => (
                              <tr
                                key={index}
                                className="w-full font-semibold hover:bg-[#ddf5ff8f] dark:hover:bg-[#8782d8] rounded-lg text-xs"
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
                                    <p className="font-light">
                                      ${item.wallet_balance}M
                                    </p>
                                  </div>
                                </td>
                                <td className="p-3 align-top">{item.apy}</td>
                                <td className="p-3 align-top">
                                  <div className="w-full flex gap-3">
                                    <Button
                                      title={"Borrow"}
                                      onClickHandler={() =>
                                        handleModalOpen(
                                          "borroww",
                                          item.asset,
                                          item.image
                                        )
                                      }
                                      className={
                                        "bg-gradient-to-tr from-[#4659CF] from-20% via-[#D379AB] via-60% to-[#FCBD78] to-90% text-white  rounded-md px-3 py-1.5 shadow-md shadow-[#00000040] font-semibold text-xs font-inter"
                                      }
                                    />
                                    <Button
                                      title={"Details"}
                                      onClickHandler={() =>
                                        handleModalOpen("payment")
                                      }
                                      className="bg-gradient-to-r text-white from-[#4659CF] to-[#2A1F9D]  rounded-md shadow-md shadow-[#00000040] px-3 py-1.5 font-semibold text-xs"

                                    />
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {renderModalOpen(isModalOpen.type)}
    </div>
  );
};

export default MySupply;
