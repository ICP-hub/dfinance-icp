import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/useAuthClient';
const useAssetData = (searchQuery = '') => {
    
  const {
    isAuthenticated,
    login,
    fetchReserveData,
    backendActor
  } = useAuth();

  const [assets, setAssets] = useState([]);
  const [reserveData, setReserveData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch asset names
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

  // Fetch reserve data for each asset
  useEffect(() => {
    const fetchData = async () => {
      if (assets.length === 0 || !fetchReserveData) return;

      try {
        const data = {};
        for (const asset of assets) {
          const reserveDataForAsset = await fetchReserveData(asset); 
          data[asset] = reserveDataForAsset;
          console.log(`${asset} reserve data:`, reserveDataForAsset);
        }
        console.log("All reserve data before setting state:", data);
        setReserveData(data); 
      } catch (err) {
        console.error('Error fetching reserve data:', err);
        setError(err.message);
      }
    };

    fetchData(); 
  }, [assets, fetchReserveData]);

  useEffect(() => {
    console.log("Updated reserveData state:", reserveData);
  }, [reserveData]);

  // Filter items based on the search query
  const filteredItems = reserveData
    ? Object.entries(reserveData).filter(([asset, data]) =>
      asset.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (data.total_supply && data.total_supply.toString().includes(searchQuery)) || 
      (data.borrow_rate && data.borrow_rate.some(rate => rate.toString().includes(searchQuery))) 
    )
    : []; 



  return { assets, reserveData, filteredItems};
};

export default useAssetData;