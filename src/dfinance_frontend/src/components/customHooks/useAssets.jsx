import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../../utils/useAuthClient";
import useFormatNumber from "./useFormatNumber";
import useFetchConversionRate from "./useFetchConversionRate";
import {  useSelector } from "react-redux";

/**
 * Custom hook to fetch and manage asset data, including supply, borrow, and market details.
 * It integrates with backend actors, fetches conversion rates, and processes financial calculations.
 * @param {string} searchQuery - Search string to filter assets.
 * @returns {Object} - Returns asset data and utility functions.
 */
const useAssetData = (searchQuery = "") => {
  const dashboardRefreshTrigger = useSelector(
    (state) => state.dashboardUpdate.refreshDashboardTrigger
  );
  const { principal, fetchReserveData, backendActor, isAuthenticated } =
    useAuth();

  const [assets, setAssets] = useState([]);
  const [reserveData, setReserveData] = useState(null);
  const [totalMarketSize, setTotalMarketSize] = useState(0);
  const [totalSupplySize, setTotalSupplySize] = useState(0);
  const [totalBorrowSize, setTotalBorrowSize] = useState(0);
  const [totalReserveFactor, setTotalReserveFactor] = useState(0);
  const [interestAccure, setInterestAccure] = useState(0);
  const [loading, setLoading] = useState(true);

  const assetSupplyRef = useRef({});
  const assetBorrowRef = useRef({});

  const {
    ckBTCUsdRate,
    ckETHUsdRate,
    ckUSDCUsdRate,
    ckICPUsdRate,
    ckUSDTUsdRate,
    fetchConversionRate,
  } = useFetchConversionRate();

  useEffect(() => {
    fetchConversionRate();
  }, [fetchConversionRate, dashboardRefreshTrigger]);

  // Fetch list of all assets from the backend
  useEffect(() => {
    const fetchAssets = async () => {
      if (!backendActor) return;
  
      try {
        const assetNames = await backendActor.get_all_assets();
        setAssets((prevAssets) =>
          JSON.stringify(prevAssets) !== JSON.stringify(assetNames) ? assetNames : prevAssets
        );
      } catch (error) {
        console.error(error.message);
      }
    };
  
    fetchAssets();
  }, [backendActor, dashboardRefreshTrigger]);
  

  /**
   * Fetches the total supply of a specific asset.
   * @param {string} asset - The asset.
   */
  const fetchAssetSupply = useCallback(
    async (asset) => {
      if (backendActor && isAuthenticated) {
        try {
          const reserveDataForAsset = await fetchReserveData(asset);
          if (reserveDataForAsset.Ok?.id) {
            const result = await backendActor.user_normalized_supply(
              reserveDataForAsset.Ok
            );
            assetSupplyRef.current = {
              ...assetSupplyRef.current,
              [asset]: result.Ok,
            };
          } else {
            console.error("Missing id in reserveDataForAsset.");
          }
        } catch (error) {
          console.error("Error fetching asset supply:", error.message);
        }
      } else {
        console.warn("Backend actor or authentication missing.");
      }
    },
    [backendActor, isAuthenticated, fetchReserveData, dashboardRefreshTrigger]
  );

  /**
   * Fetches the total borrowed amount of a specific asset.
   * @param {string} asset - The asset.
   */
  const fetchAssetBorrow = useCallback(
    async (asset) => {
      if (backendActor && isAuthenticated) {
        try {
          const reserveDataForAsset = await fetchReserveData(asset);
          if (reserveDataForAsset.Ok?.id) {
            const result = await backendActor.user_normalized_debt(
              reserveDataForAsset.Ok
            );
            assetBorrowRef.current = {
              ...assetBorrowRef.current,
              [asset]: result.Ok,
            };
          } else {
            console.error("Missing id in reserveDataForAsset.");
          }
        } catch (error) {
          console.error("Error fetching asset borrow:", error.message);
        }
      } else {
        console.warn("Backend actor or authentication missing.");
      }
    },
    [backendActor, isAuthenticated, fetchReserveData, dashboardRefreshTrigger]
  );

  /**
   * Fetches asset details and calculates supply, borrow, and reserve factors.
   */
  useEffect(() => {
    const fetchData = async () => {
      if (assets.length === 0 || !fetchReserveData) {
        return;
      }
      setLoading(true);
      try {
        const data = {};
        let totalMarketSizeTemp = 0;
        let totalSupplies = 0;
        let totalBorrowes = 0;
        let reserveFactors = 0;
        let totalAccruedValue = 0;

        const results = await Promise.all(
          assets.map(async (asset) => {
            try {
              const reserveDataForAsset = await fetchReserveData(asset);
              return { asset, reserveDataForAsset };
            } catch (err) {
              console.warn(
                `Error fetching data for asset ${asset}:`,
                err.message
              );
              return null;
            }
          })
        );

        results.forEach((result) => {
          if (!result || !result.reserveDataForAsset) return;

          const { asset, reserveDataForAsset } = result;
          data[asset] = reserveDataForAsset;

          const assetName = reserveDataForAsset.Ok.asset_name.toString();
          let assetRate = 0;

          switch (assetName) {
            case "ckBTC":
              assetRate = ckBTCUsdRate;
              break;
            case "ckETH":
              assetRate = ckETHUsdRate;
              break;
            case "ckUSDC":
              assetRate = ckUSDCUsdRate;
              break;
            case "ICP":
              assetRate = ckICPUsdRate;
              break;
            case "ckUSDT":
              assetRate = ckUSDTUsdRate;
              break;
            default:
              assetRate = 0;
          }

          const supplyCap = parseFloat(
            Number(reserveDataForAsset.Ok.configuration.supply_cap) / 100000000
          );
          const totalSupply = parseFloat(
            (Number(reserveDataForAsset.Ok.asset_supply) * (assetRate / 1e8)) /
              100000000
          );
          const totalBorrow = parseFloat(
            (Number(reserveDataForAsset.Ok.asset_borrow) * (assetRate / 1e8)) /
              100000000
          );
          const reserveFactor = parseFloat(
            Number(reserveDataForAsset.Ok.configuration.reserve_factor) /
              100000000
          );
          const interestAccure = parseFloat(
            Number(reserveDataForAsset.Ok.accure_to_platform) / 100000000
          );
          const accruedValue = interestAccure * (assetRate / 1e8);

          totalAccruedValue += accruedValue;
          totalMarketSizeTemp += supplyCap;
          totalSupplies += parseInt(totalSupply);
          totalBorrowes += parseInt(totalBorrow);
          reserveFactors = reserveFactor;
        });

        setReserveData(data);
        setTotalMarketSize(formatNumber(totalMarketSizeTemp));
        setTotalSupplySize(formatNumber(totalSupplies));
        setTotalBorrowSize(formatNumber(totalBorrowes));
        setTotalReserveFactor(formatNumber(reserveFactors));
        setInterestAccure(formatNumber(totalAccruedValue));

        console.log("Data successfully fetched and state updated.");
      } catch (err) {
        console.error("Error during fetch:", err.message);
      } finally {
        console.log("Fetch completed.");
        setLoading(false);
      }
    };
    fetchData();
  }, [
    assets,
    fetchReserveData,
    principal,
    ckUSDTUsdRate,
    ckICPUsdRate,
    ckUSDCUsdRate,
    ckETHUsdRate,
    ckBTCUsdRate,
    dashboardRefreshTrigger
  ]);

  // Filter assets based on search query
  const filteredItems = useMemo(() => {
    if (!reserveData || Object.keys(reserveData).length === 0) return [];
    return Object.entries(reserveData).filter(
      ([asset, data]) =>
        asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (data.asset_supply &&
          data.asset_supply.toString().includes(searchQuery)) ||
        (data.borrow_rate &&
          data.borrow_rate.some((rate) =>
            rate.toString().includes(searchQuery)
          ))
    );
  }, [reserveData, searchQuery]);

  const formatNumber = useFormatNumber();

  return {
    assets,
    assets,
    reserveData,
    filteredItems,
    totalMarketSize,
    totalSupplySize,
    totalBorrowSize,
    totalReserveFactor,
    interestAccure,
    asset_supply: assetSupplyRef.current,
    asset_borrow: assetBorrowRef.current,
    loading,
    setLoading,
    fetchAssetBorrow,
    fetchAssetSupply,
  };
};

export default useAssetData;
