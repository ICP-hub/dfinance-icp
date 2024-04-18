import React, { useEffect, useState } from "react"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Ellipse from "../../components/Ellipse"

import Button from "../../components/Button"
import DashboardNav from "../../components/Dashboard/DashboardNav"
import CreateWallet from "../../components/Dashboard/CreateWallet"

const MainDashboard = ({children}) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <div className="w-full h-full xl2:w-1/2 xl2:mx-auto px-4 md:px-12 xl:px-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 xl:w-auto xl:h-auto -z-10">
          <Ellipse
            position={"top-right"}
            className="w-48 h-48 md:w-[800px] md:h-[600px]"
          />
        </div>

        {/* dashboard navbar */}
        <Navbar isHomeNav={false} />

        {/* main area */}
        <div className="w-full">
          <DashboardNav />
          {children}
        </div>
      </div>

      {/* footer */}
      <Footer />
    </>
  )
}

export default MainDashboard
