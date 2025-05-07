import React, { useEffect } from "react";
import useAssetData from "../customHooks/useAssets";
import { useAuth } from "../../utils/useAuthClient";

export const DashboardDataProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const assetData = useAssetData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return React.cloneElement(children, {
    dashboardData: assetData,
    isAuthenticated,
  });
};
