import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/useAuthClient';
import useFormatNumber from '../customHooks/useFormatNumber';

const useAssetData = (searchQuery = '') => {

  const {
    fetchReserveData,
    backendActor
  } = useAuth();

  const [assets, setAssets] = useState([]);
  const [reserveData, setReserveData] = useState(null);
  const [totalMarketSize, setTotalMarketSize] = useState(0);
  const [totalSupplySize, setTotalSupplySize] = useState(0);
  const [totalBorrowSize, setTotalBorrowSize] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!backendActor) return;

      try {
        const assetNames = await backendActor.get_all_assets();
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
        let totalSupplies = parseInt(0);
        let totalBorrowes = parseFloat(0.0);

        for (const asset of assets) {
          const reserveDataForAsset = await fetchReserveData(asset);
          data[asset] = reserveDataForAsset;
          console.log(`${asset} reserve data:`, reserveDataForAsset);
          const supplyCap = parseFloat(Number(reserveDataForAsset.Ok.configuration.supply_cap) / 100000000);
          const totalSupply = parseFloat(Number(reserveDataForAsset.Ok.total_supply) / 100000000);
          const totalBorrow = parseFloat(Number(reserveDataForAsset.Ok.total_borrowed) / 100000000);
          
          
          console.log("supplyCap", supplyCap)
          console.log("TotalSupplies", totalSupply)
          console.log("TotalBorrow", totalBorrow)
          totalMarketSizeTemp += supplyCap;
          totalSupplies += parseInt(totalSupply);
          totalBorrowes +=totalBorrow
        }
        console.log("TotalSupplies ::", totalSupplies);
        // console.log("All reserve data before setting state:", data);
        setReserveData(data);
        setTotalMarketSize(formatNumber(totalMarketSizeTemp));
        setTotalSupplySize(formatNumber(totalSupplies))
        setTotalBorrowSize(formatNumber(totalBorrowes))
      } catch (err) {
        console.error('Error fetching reserve data:', err);
        setError(err.message);
      }
    };

    fetchData();
  }, [assets, fetchReserveData]);

  useEffect(() => {
    // console.log("Updated reserveData state:", reserveData);
    // console.log("Total market size", totalMarketSize);
  }, [reserveData]);


  const filteredItems = reserveData && Object.keys(reserveData).length > 0
    ? Object.entries(reserveData).filter(([asset, data]) =>
      asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (data.total_supply && data.total_supply.toString().includes(searchQuery)) ||
      (data.borrow_rate && data.borrow_rate.some(rate => rate.toString().includes(searchQuery)))
    )
    : [];

    const formatNumber = useFormatNumber();

  return { assets, reserveData, filteredItems, totalMarketSize, totalSupplySize, totalBorrowSize };
};

export default useAssetData;