import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../utils/useAuthClient";
import { useReserveData } from "../../context/ReserveDataContext";
import useFormatNumber from "./useFormatNumber";
import useFetchConversionRate from "./useFetchConversionRate";
import { useSelector } from "react-redux";

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
  const { principal, backendActor, isAuthenticated } = useAuth();
  const { fetchReserveData, batchFetchReserveData, reserveDataCache } =
    useReserveData();

  const [assets, setAssets] = useState([]);
  const [AssetImages, setAssetImages] = useState([]);
  const [reserveData, setReserveData] = useState(null);
  const [totalMarketSize, setTotalMarketSize] = useState(0);
  const [totalSupplySize, setTotalSupplySize] = useState(0);
  const [totalBorrowSize, setTotalBorrowSize] = useState(0);
  const [totalReserveFactor, setTotalReserveFactor] = useState(0);
  const [interestAccure, setInterestAccure] = useState(0);
  const [asset_supply, setAssetSupply] = useState({});
  const [asset_borrow, setAssetBorrow] = useState({});
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchAssets = async () => {
      if (!backendActor) return;

      try {
        const assetData = await backendActor.get_all_assets();

        const names = assetData.map((asset) => asset.asset_name);
        const images = assetData.map((asset) => asset.image);

        setAssets(names);
        setAssetImages(images);
      } catch (error) {
        console.error("Failed to fetch assets:", error.message);
      }
    };

    fetchAssets();
  }, [backendActor, dashboardRefreshTrigger]);

  /**
   * Optimized to use batch fetching and leverage the cache
   */
  const fetchUserPositions = useCallback(
    async (assetsList = assets) => {
      if (!backendActor || !isAuthenticated || assetsList.length === 0) return;
      setLoading(true)
      try {
        const batchedReserveData = await batchFetchReserveData(assetsList);

        const assetReserveData = {};

        Object.entries(batchedReserveData).forEach(([asset, data]) => {
          if (data?.Ok?.id || (data?.Ok?.[0]?.id)) {
            assetReserveData[asset] = data.Ok?.id ? data.Ok : data.Ok[0];
          }
        });

        if (Object.keys(assetReserveData).length === 0) {
          console.warn("No valid reserve data found for any assets");
          return null;
        }

        const supplyPromises = Object.entries(assetReserveData).map(
          async ([asset, data]) => {
            try {
              const result = await backendActor.user_normalized_supply(data);
              return { asset, supply: result.Ok, success: true };
            } catch (error) {
              console.error(`Error fetching supply for ${asset}:`, error.message);
              return { asset, success: false };
            }
          }
        );

        const borrowPromises = Object.entries(assetReserveData).map(
          async ([asset, data]) => {
            try {
              const result = await backendActor.user_normalized_debt(data);
              return { asset, borrow: result.Ok, success: true };
            } catch (error) {
              console.error(`Error fetching borrow for ${asset}:`, error.message);
              return { asset, success: false };
            }
          }
        );

        const [supplyResults, borrowResults] = await Promise.all([
          Promise.all(supplyPromises),
          Promise.all(borrowPromises),
        ]);

        setAssetSupply(prevSupply => {
          const newSupplyData = { ...prevSupply };

          supplyResults.forEach(({ asset, supply, success }) => {
            if (success && supply !== undefined) {
              newSupplyData[asset] = supply;
            }
          });

          return newSupplyData;
        });

        setAssetBorrow(prevBorrow => {
          const newBorrowData = { ...prevBorrow };

          borrowResults.forEach(({ asset, borrow, success }) => {
            if (success && borrow !== undefined) {
              newBorrowData[asset] = borrow;
            }
          });

          return newBorrowData;
        });

        const newSupplyData = {};
        const newBorrowData = {};

        supplyResults.forEach(({ asset, supply, success }) => {
          if (success && supply !== undefined) {
            newSupplyData[asset] = supply;
          }
        });

        borrowResults.forEach(({ asset, borrow, success }) => {
          if (success && borrow !== undefined) {
            newBorrowData[asset] = borrow;
          }
        });

        return { supplyData: newSupplyData, borrowData: newBorrowData };
      } catch (error) {
        setLoading(false)
        console.error("Error fetching user positions:", error.message);
        return null;
      } finally {
        setLoading(false)
      }
    },
    [assets, backendActor, isAuthenticated, batchFetchReserveData]
  );

  /**
   * Legacy individual fetch functions - now optimized to use cached data
   */
  const fetchAssetSupply = useCallback(
    async (asset) => {
      if (!backendActor || !isAuthenticated) return;
      try {
        let assetReserveData = reserveData?.[asset]?.Ok;

        if (!assetReserveData) {
          const reserveDataForAsset = await fetchReserveData(asset);

          if (reserveDataForAsset?.Ok) {
            let dataToUse;

            if (reserveDataForAsset.Ok?.id) {
              dataToUse = reserveDataForAsset.Ok;
            } else if (Array.isArray(reserveDataForAsset.Ok) &&
              reserveDataForAsset.Ok.length > 0 &&
              reserveDataForAsset.Ok[0]?.id) {
              dataToUse = reserveDataForAsset.Ok[0];
            }

            if (dataToUse) {
              const result = await backendActor.user_normalized_supply(dataToUse);

              if (result?.Ok !== undefined) {
                setAssetSupply(prev => ({
                  ...prev,
                  [asset]: result.Ok
                }));
              }
            } else {
              console.error("Missing or invalid id in data:", reserveDataForAsset);
            }
          } else {
            console.error("Invalid format for reserveDataForAsset:", reserveDataForAsset);
          }
        } else {
          let dataToUse;

          if (assetReserveData?.id) {
            dataToUse = assetReserveData;
          } else if (Array.isArray(assetReserveData) &&
            assetReserveData.length > 0 &&
            assetReserveData[0]?.id) {
            dataToUse = assetReserveData[0];
          }

          if (dataToUse) {
            const result = await backendActor.user_normalized_supply(dataToUse);

            if (result?.Ok !== undefined) {
              setAssetSupply(prev => ({
                ...prev,
                [asset]: result.Ok
              }));
            }
          } else {
            console.error("Invalid format in cached reserveData for asset:", asset);
          }
        }
      } catch (error) {
        console.error("Error fetching asset supply:", error.message);
      }
    },
    [backendActor, isAuthenticated, reserveData, fetchReserveData]
  );

  const fetchAssetBorrow = useCallback(
    async (asset) => {
      if (!backendActor || !isAuthenticated) return;
      try {
        let assetReserveData = reserveData?.[asset]?.Ok;

        if (!assetReserveData) {
          const reserveDataForAsset = await fetchReserveData(asset);

          if (reserveDataForAsset?.Ok) {
            let dataToUse;

            if (reserveDataForAsset.Ok?.id) {
              dataToUse = reserveDataForAsset.Ok;
            } else if (Array.isArray(reserveDataForAsset.Ok) &&
              reserveDataForAsset.Ok.length > 0 &&
              reserveDataForAsset.Ok[0]?.id) {
              dataToUse = reserveDataForAsset.Ok[0];
            }

            if (dataToUse) {
              const result = await backendActor.user_normalized_debt(dataToUse);

              if (result?.Ok !== undefined) {
                setAssetBorrow(prev => ({
                  ...prev,
                  [asset]: result.Ok
                }));
              }
            } else {
              console.error("Missing or invalid id in data:", reserveDataForAsset);
            }
          } else {
            console.error("Invalid format for reserveDataForAsset:", reserveDataForAsset);
          }
        } else {
          let dataToUse;

          if (assetReserveData?.id) {

            dataToUse = assetReserveData;
          } else if (Array.isArray(assetReserveData) &&
            assetReserveData.length > 0 &&
            assetReserveData[0]?.id) {

            dataToUse = assetReserveData[0];
          }

          if (dataToUse) {
            const result = await backendActor.user_normalized_debt(dataToUse);

            if (result?.Ok !== undefined) {

              setAssetBorrow(prev => ({
                ...prev,
                [asset]: result.Ok
              }));
            }
          } else {
            console.error("Invalid format in cached reserveData for asset:", asset);
          }
        }
      } catch (error) {
        console.error("Error fetching asset borrow:", error.message);
      }
    },
    [backendActor, isAuthenticated, reserveData, fetchReserveData]
  );

  /**
   * Fetches asset details and calculates supply, borrow, and reserve factors.
   * Now optimized to use batch fetching
   */
  useEffect(() => {
    const fetchData = async () => {
      if (assets.length === 0) {
        return;
      }
      setLoading(true);
      try {
        const batchedData = await batchFetchReserveData(assets);
        const data = {};
        let totalMarketSizeTemp = 0;
        let totalSupplies = 0;
        let totalBorrowes = 0;
        let reserveFactors = 0;
        let totalAccruedValue = 0;

        Object.entries(batchedData).forEach(([asset, reserveDataForAsset]) => {
          if (!reserveDataForAsset || !reserveDataForAsset.Ok) return;

          data[asset] = reserveDataForAsset;

          const assetName = reserveDataForAsset.Ok[0].asset_name.toString();

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
            Number(reserveDataForAsset.Ok[0].configuration.supply_cap) / 100000000
          );
          const totalSupply = parseFloat(
            (Number(reserveDataForAsset.Ok[0].asset_supply) * (assetRate / 1e8)) /
            100000000
          );
          const totalBorrow = parseFloat(
            (Number(reserveDataForAsset.Ok[0].asset_borrow) * (assetRate / 1e8)) /
            100000000
          );
          const reserveFactor = parseFloat(
            Number(reserveDataForAsset.Ok[0].configuration.reserve_factor) /
            100000000
          );
          const interestAccure = parseFloat(
            Number(reserveDataForAsset.Ok[0].accure_to_platform) / 100000000
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
      } catch (err) {
        console.error("Error during fetch:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [
    assets,
    batchFetchReserveData,
    principal,
    ckUSDTUsdRate,
    ckICPUsdRate,
    ckUSDCUsdRate,
    ckETHUsdRate,
    ckBTCUsdRate,
  ]);

  const filteredItems =
    reserveData && Object.keys(reserveData).length > 0
      ? Object.entries(reserveData).filter(
        ([asset, data]) =>
          asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (data.asset_supply &&
            data.asset_supply.toString().includes(searchQuery)) ||
          (data.borrow_rate &&
            data.borrow_rate.some((rate) =>
              rate.toString().includes(searchQuery)
            ))
      )
      : [];

  const formatNumber = useFormatNumber();
  return {
    assets,
    AssetImages,
    reserveData,
    filteredItems,
    totalMarketSize,
    totalSupplySize,
    totalBorrowSize,
    totalReserveFactor,
    interestAccure,
    asset_supply,
    asset_borrow,
    loading,
    setLoading,
    fetchAssetBorrow,
    fetchAssetSupply,
    fetchUserPositions,
  };
};

export default useAssetData;
