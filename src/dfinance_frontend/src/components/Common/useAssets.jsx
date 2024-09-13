import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/useAuthClient';

const useAssetData = (searchQuery = '') => {

  const {
    fetchReserveData,
    backendActor
  } = useAuth();

  const [assets, setAssets] = useState([]);
  const [reserveData, setReserveData] = useState(null);
  const [totalMarketSize, setTotalMarketSize] = useState(0);
  const [totalSupplySize, setTotalSupplySize] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!backendActor) return;

      try {
        const assetNames = await backendActor.get_all_assets();
        console.log("Asset names:", assetNames);
        setAssets(assetNames);
      } catch (error) {
        console.error('Error fetching asset names:', error);
        setError(error.message);
      }
    };

    fetchAssets();
  }, [backendActor]);

  useEffect(() => {
    const fetchData = async () => {
      if (assets.length === 0 || !fetchReserveData) return;
      try {
        const data = {};
        let totalMarketSizeTemp = 0;
        let totalSupplies = 0

        for (const asset of assets) {
          const reserveDataForAsset = await fetchReserveData(asset);
          data[asset] = reserveDataForAsset;
          console.log(`${asset} reserve data:`, reserveDataForAsset);
          const supplyCap = parseFloat(reserveDataForAsset.Ok.configuration.supply_cap);
          const totalSupply = parseFloat(reserveDataForAsset.Ok.total_supply);
          console.log("supplyCap", supplyCap)
          console.log("TotalSupplies", totalSupply)
          totalMarketSizeTemp += supplyCap;
          totalSupplies += totalSupply;
        }

        console.log("All reserve data before setting state:", data);
        setReserveData(data);
        setTotalMarketSize(formatNumber(totalMarketSizeTemp));
        setTotalSupplySize(formatNumber(totalSupplies))
      } catch (err) {
        console.error('Error fetching reserve data:', err);
        setError(err.message);
      }
    };

    fetchData();
  }, [assets, fetchReserveData]);

  useEffect(() => {
    console.log("Updated reserveData state:", reserveData);
    console.log("Total market size", totalMarketSize);
  }, [reserveData]);


  const filteredItems = reserveData && Object.keys(reserveData).length > 0
    ? Object.entries(reserveData).filter(([asset, data]) =>
      asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (data.total_supply && data.total_supply.toString().includes(searchQuery)) ||
      (data.borrow_rate && data.borrow_rate.some(rate => rate.toString().includes(searchQuery)))
    )
    : [];

  function formatNumber(num) {
    if (num === null || num === undefined) {
      return '0';
    }
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  }

  return { assets, reserveData, filteredItems, totalMarketSize, totalSupplySize };
};

export default useAssetData;