import React, { useState, useEffect ,useRef} from "react"
import { useLocation } from "react-router-dom"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import { TAB_CARD_DATA, WALLET_DETAILS_TABS } from "../../utils/constants"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
const DashboardNav = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { isWalletConnected } = useSelector((state) => state.utility)
  console.log(isWalletConnected, "isWalletConnected");

  const [isDrop, setIsDrop] = useState(false)
  const [currentValueIndex, setCurrentValueIndex] = useState(state?.id || 0)
  const [currentValueData, setCurrentValueData] = useState(
    state || TAB_CARD_DATA[0]
  )
  const dropdownRef = useRef(null);
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDrop(false);
      document.removeEventListener("mousedown", handleClickOutside);
    }
  };

  const toggleDropdown = () => {
    if (!isDrop) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    setIsDrop(!isDrop);
  };
  useEffect(() => {
    const asset = TAB_CARD_DATA.find((item) => item.id === currentValueIndex);
    setCurrentValueData(asset);
  }, [currentValueIndex]);

  useEffect(() => {
    if (state && state.id !== undefined) {
      setCurrentValueIndex(state.id);
    }
  }, [state]);
  const handleAssetSelect = (index) => {
    setCurrentValueIndex(index);
    setIsDrop(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };
  return (
    <div className="w-full">
       <div className="w-full">
          <span className="w-fit bg-gradient-to-r from-[#4659CF] via-[#D379AB] to-[#FCBD78] p-2 mb-2 mt-2 whitespace-nowrap rounded-md text-xs flex items-center gap-2 text-white px-6 cursor-pointer hover:from-[#6575dd]" onClick={() => navigate(-1)}>
            Back
          </span>
        </div>
      <h1 className="text-[#2A1F9D] font-semibold">Dashboard</h1>
      <div className="w-full flex flex-wrap py-2 items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full border overflow-hidden shrink-0">
            <img
              src={currentValueData ? currentValueData.image : ""}
              alt={currentValueData ? currentValueData.title : ""}
              className="w-[30px] h-[30px] md:w-8 md:h-8 shrink-0"
            />
          </div>

          <h1 className="text-[#2A1F9D] font-semibold">
            {currentValueData ? currentValueData.title : ""}
          </h1>

          <div className="relative" ref={dropdownRef}>
      <span
        className="block p-1 rounded-full bg-[#8CC0D770] text-[#2A1F9D] cursor-pointer"
        onClick={toggleDropdown}
      >
        {!isDrop ? (
          <ChevronRight size={16} color="#2A1F9D" />
        ) : (
          <ChevronDown size={16} color="#2A1F9D" />
        )}
      </span>
      {isDrop && (
        <div
          className={`w-fit z-50 absolute overflow-hidden animate-fade-down animate-duration-500 top-full mt-3 bg-[#0C5974] text-white rounded-2xl`}
        >
          {TAB_CARD_DATA.map((data, index) => (
            <div
              key={index}
              className={`flex whitespace-nowrap hover:bg-[#2a6980] ${
                currentValueIndex === index ? "bg-[#347c96]" : ""
              } items-center text-white p-3 px-4 gap-3`}
              onClick={() => {
                setCurrentValueIndex(index);
                setIsDrop(false);
                document.removeEventListener("mousedown", handleClickOutside);
                handleAssetSelect(index)
              }}
            >
              <div className="w-5 h-5 rounded-full border overflow-hidden">
                <img
                  src={data.image}
                  alt={data.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <h1 className="text-xs">{data.title}</h1>
            </div>
          ))}
        </div>
      )}
    </div>
        </div>
        <div className="flex items-center flex-wrap text-[#2A1F9D] font-semibold gap-6">
          {WALLET_DETAILS_TABS.map((data, index) => (
            <div key={index} className="relative group ml-10">
              <button className="relative">
                {data.title}
                { (
                  <>
                    <hr className="ease-in-out duration-500 bg-[#8CC0D7] h-[2px] w-[20px] group-hover:w-full" />
                    <span className="absolute top-full left-0 font-light py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      ${data.count}M
                    </span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardNav
 