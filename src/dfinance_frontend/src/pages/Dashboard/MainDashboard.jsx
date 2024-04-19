import React, { useEffect, useState } from "react"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Ellipse from "../../components/Ellipse"

import DashboardNav from "../../components/Dashboard/DashboardNav"

const MainDashboard = ({children}) => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <div className="w-full h-full xl3:w-[80%] xl4:w-[50%] xl3:mx-auto px-4 md:px-12 xl:px-24 relative">
        <div className="absolute top-0 right-0 xl:w-auto xl:h-auto -z-10">
          <Ellipse
            position={"top-right"}
            className="w-48 h-48 md:w-[800px] md:h-[600px]"
          />
        </div>

        {/* dashboard navbar */}
        <Navbar isHomeNav={false} />

        {/* main area */}
        <div className="w-full xl3:h-screen flex flex-col justify-center">
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
