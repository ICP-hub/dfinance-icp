import React, { useEffect } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Ellipse from "../../components/Common/Ellipse";

import DashboardNav from "../../components/Dashboard/DashboardNav";
import { useAuth } from "../../utils/useAuthClient";

const MainDashboard = ({ children, isDGov, includeDashboardNav = true }) => {
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     login();
  //   }
  // }, []);

  return (
    <>
      <div className="w-full h-full xl3:w-[80%] xl4:w-[60%] xl3:mx-auto px-4 md:px-12 xl:px-24 relative font-poppins">
        <div className="absolute top-0 right-0 xl:w-auto xl:h-auto -z-10">
          <Ellipse
            position={"top-right"}
            className="w-48 h-48 md:w-[800px] md:h-[600px]"
          />
        </div>

        {/* dashboard navbar */}
        <Navbar isHomeNav={false} />

        {/* main area */}
        {isDGov ? (
          <div className="w-full">{children}</div>
        ) : (
          <div className="w-full">
            {includeDashboardNav && <DashboardNav />}
            {children}
          </div>
        )}
      </div>

      {/* footer */}
      <Footer />
    </>
  );
};

export default MainDashboard;
