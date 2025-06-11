import React, { useEffect } from "react";
import useAssetData from "../CustomHooks/useAssets";
import { useAuths } from "../../utils/useAuthClient";

export const DashboardDataProvider = ({ children }) => {
  const { isAuthenticated } = useAuths();
  const assetData = useAssetData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return React.cloneElement(children, {
    dashboardData: assetData,
    isAuthenticated,
  });
};
