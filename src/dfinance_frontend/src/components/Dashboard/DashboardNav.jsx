import React, { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import { TAB_CARD_DATA, WALLET_DETAILS_TABS } from "../../utils/constants"
import { useSelector } from "react-redux"

const DashboardNav = () => {
  const { state } = useLocation()

  const { isWalletCreated } = useSelector((state) => state.utility)

  const [hoverEle, setHoverEle] = useState({
    index: null,
    isHover: false,
  })
  const [isDrop, setIsDrop] = useState(false)
  const [currentValueIndex, setCurrentValueIndex] = useState(state?.id || 0)
  const [currentValueData, setCurrentValueData] = useState(
    state || TAB_CARD_DATA[0]
  )

  const handleHoverIn = (index) => {
    setHoverEle({ index, isHover: true })
  }

  const handleHoverOut = () => {
    setHoverEle({ index: null, isHover: false })
  }

  useEffect(() => {
    setCurrentValueData(
      TAB_CARD_DATA.find((item) => item.id === currentValueIndex)
    )
  }, [currentValueIndex])
  return (
    <div className="w-full">
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

          <div className="relative">
            <span
              className="block p-1 rounded-full bg-[#8CC0D770] text-[#2A1F9D] cursor-pointer"
              onClick={() => setIsDrop(!isDrop)}
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
                      setCurrentValueIndex(index)
                      setIsDrop(false)
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
        <div
          id="info_text"
          className="flex flex-wrap p-0 md:px-6 md:ml-3 text-xs md:text-base"
        >
          {isWalletCreated ? (
            <div className="flex items-center flex-wrap text-[#2A1F9D] font-semibold gap-6">
              {WALLET_DETAILS_TABS.map((data, index) => (
                <button
                  key={index}
                  className="relative"
                  onMouseEnter={() => handleHoverIn(index)}
                  onMouseLeave={handleHoverOut}
                >
                  {data.title}
                  <hr
                    className={`ease-in-out duration-500 bg-[#8CC0D7] h-[2px] ${
                      hoverEle.index === index && hoverEle.isHover
                        ? "w-full"
                        : "w-1/5"
                    }`}
                  />
                  {hoverEle.index === index && hoverEle.isHover && (
                    <span className="animate-fade absolute top-full left-0 font-light py-2">
                      ${data.count}M
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <>
              <span className="text-[#0C5974] font-semibold px-4 flex items-center gap-1">
                <span className="border-b border-b-[#8CC0D7]">Net</span>
                <span>Worth</span>
              </span>
              <span className="text-[#0C5974] font-semibold px-4 flex items-center gap-1">
                <span className="border-b border-b-[#8CC0D7]">Net</span>
                <span>APY</span>
                <Info size={18} />
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardNav
