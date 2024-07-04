import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import Button from "../Button";
import { FAUCET_ASSETS_TABLE_ROW, FAUCET_ASSETS_TABLE_COL } from "../../utils/constants";
import { useNavigate } from "react-router-dom";
import FaucetPopup from "./FaucetPopup"; // Import your FaucetPopup component here

const FaucetDetails = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Number of items per page
  const navigate = useNavigate();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(FAUCET_ASSETS_TABLE_ROW.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleFaucetClick = (asset, image) => {
    setSelectedAsset(asset);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = FAUCET_ASSETS_TABLE_ROW.slice(indexOfFirstItem, indexOfLastItem);

  const theme = useSelector((state) => state.theme.theme);
  const chevronColor = theme === "dark" ? "#ffffff" : "#3739b4";

  return (
    <div className="w-full mt-10">
      <div className="w-full md:h-[40px] flex items-center px-6 mt-8 md:px-16">
        <h1 className="text-[#2A1F9D] font-semibold text-lg dark:text-darkText">Test Assets</h1>
      </div>

      <div className="w-full min-h-[390px] mt-6 p-0 lg:px-12 mb-20 ">
        <div className="w-full">
          <div className="w-full overflow-auto content">
            <table className="w-full text-[#2A1F9D] font-[500] text-xs md:text-sm lg:text-base dark:text-darkText">
              <thead>
                <tr className="text-left text-[#233D63] dark:text-darkTextSecondary">
                  {FAUCET_ASSETS_TABLE_COL.slice(0, 2).map((item, index) => (
                    <td key={index} className="p-1 whitespace-nowrap">
                      {item.header}
                    </td>
                  ))}
                  <td className="p-3 hidden md:table-cell">{FAUCET_ASSETS_TABLE_COL[2]?.header}</td>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <tr
                    key={index}
                    className={`w-full font-semibold hover:bg-[#ddf5ff8f] rounded-lg ${
                      index !== currentItems.length - 1 ? "gradient-line-bottom" : ""
                    }`}
                  >
                    <td className="p-3 align-top">
                      <div className="w-full flex items-center justify-start min-w-[120px] gap-1 whitespace-nowrap mr-1">
                        <img src={item.image} alt={item.asset} className="w-8 h-8 rounded-full" />
                        {item.asset}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-row ml-6">
                        <div>
                          <p>{item.total_supply_count}</p>
                          <center>
                            <p className="font-light">{item.WalletBalance}</p>
                          </center>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 align-top flex">
                      <div className="w-full flex justify-end align-center">
                        <Button
                          title={"Faucet"}
                          className="mb-7 bg-gradient-to-tr from-[#4C5FD8] via-[#D379AB] to-[#FCBD78] text-white rounded-lg px-3 py-1 shadow-2xl shadow-black/90 font-semibold text-sm sxs3:px-6"
                          onClickHandler={() => handleFaucetClick(item.asset, item.image)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="w-full flex justify-center mt-6">
            <div id="pagination" className="flex gap-2">
              <button
                type="button"
                className="border rounded-full p-1 border-[#c8ced5] bg-[#c8ced5] text-white hover:bg-[#b0b5bb] hover:border-[#b0b5bb] hover:text-white"
                onClick={handlePreviousPage}
              >
                <ChevronLeft />
              </button>

              <button
                type="button"
                className="border rounded-full p-1 border-[#c8ced5] hover:border-[#c8ced5] hover:text-[#b0b5bb] text-[#c8ced5]"
                onClick={handleNextPage}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gray-800 opacity-50" />
        <FaucetPopup
          asset={selectedAsset}
          image={currentItems.find((item) => item.asset === selectedAsset)?.image}
          balance={currentItems.find((item) => item.asset === selectedAsset)?.WalletBalance}
          onClose={closePopup}
        />
        </div>
      )}
    </div>
  );
};

export default FaucetDetails;