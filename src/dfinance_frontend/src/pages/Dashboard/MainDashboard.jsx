import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import Ellipse from "../../components/Common/Ellipse";

import DashboardNav from "../../components/Dashboard/DashboardNav";
import Loading from "../../components/Common/Loading";
import { usePageLoading } from "../../components/customHooks/useLoading";
import useAssetData from "../../components/customHooks/useAssets";
import { useAuth } from "../../utils/useAuthClient";
import { useStoicAuth } from "../../utils/useStoicAuth";
const MainDashboard = ({ children, isDGov, includeDashboardNav = true }) => {
  const { connectedWallet } = useSelector((state) => state.utility);

  // Dynamically select the appropriate auth hook
  const auth = connectedWallet === "stoic" ? useStoicAuth() : useAuth();

  const {
    isAuthenticated,
    
  } = auth;
  const { loading } = useAssetData();
  const isLoading = usePageLoading();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [isLoadingPage, setIsLoadingPage] = useState(
    isAuthenticated ? loading : isLoading
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoadingPage) {
        setIsLoadingPage(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isLoadingPage]);

  if (isLoadingPage) {
    return <Loading isLoading={isLoadingPage} />;
  }

  return (
    <>
      <div className="w-full h-full xl3:w-[80%] xl4:w-[60%] xl3:mx-auto px-4 md:px-12 xl:px-24 relative font-poppins">
        <div className="absolute top-0 right-0 xl:w-auto xl:h-auto -z-10">
          <Ellipse
            position={"top-right"}
            className="w-48 h-48 md:w-[800px] md:h-[600px]"
          />
        </div>

        <Navbar isHomeNav={false} />

        {isDGov ? (
          <div className="w-full">{children}</div>
        ) : (
          <div className="w-full">
            {includeDashboardNav && <DashboardNav />}
            {children}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default MainDashboard;
