import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/useAuthClient';
import useFormatNumber from '../customHooks/useFormatNumber';
import useFetchConversionRate from '../customHooks/useFetchConversionRate';

const useAssetData = (searchQuery = '') => {

  const {principal,
    fetchReserveData,
    backendActor
  } = useAuth();

  const [assets, setAssets] = useState([]);
  const [reserveData, setReserveData] = useState(null);
  const [totalMarketSize, setTotalMarketSize] = useState(0);
  const [totalSupplySize, setTotalSupplySize] = useState(0);
  const [totalBorrowSize, setTotalBorrowSize] = useState(0);
  const [totalReserveFactor, setTotalReserveFactor] = useState(0)
  const [interestAccure, setInterestAccure] = useState(0)
  const [error, setError] = useState(null);
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
  }, [fetchConversionRate]);

  useEffect(() => {

    const fetchAssets = async () => {
      if (!backendActor) return;

      try {
        const assetNames = await backendActor.get_all_assets();
        setAssets(assetNames);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchAssets();
  }, [backendActor]);

  const fetchAssetSupply = async (asset) => {
    if (backendActor) {
      try {
        const result = await backendActor.get_asset_supply(asset,[principal]);
        
        setAssetSupply(prev => ({ ...prev, [asset]: result.Ok }));
      } catch (error) {
        console.error(error.message)
      }
    } else {
    }
  };
  
  const fetchAssetBorrow = async (asset) => {
    if (backendActor) {
      try {
        const result = await backendActor.get_asset_debt(asset,[principal]);
        setAssetBorrow(prev => ({ ...prev, [asset]: result.Ok }));
      } catch (error) {
        console.error(error.message)
      }
    } else {
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      if (assets.length === 0 || !fetchReserveData) return;
      setLoading(true);
      try {
        const data = {};
        let totalMarketSizeTemp = 0;
        let totalSupplies = parseFloat(0);
        let totalBorrowes = parseFloat(0.0);
        let reserveFactors = 0;
        let totalAccruedValue = 0;

        for (const asset of assets) {
          await fetchAssetSupply(asset);
          await fetchAssetBorrow(asset);
          const reserveDataForAsset = await fetchReserveData(asset);
          data[asset] = reserveDataForAsset;
          const supplyCap = parseFloat(Number(reserveDataForAsset.Ok.configuration.supply_cap) / 100000000);
          const totalSupply = parseFloat(Number(reserveDataForAsset.Ok.total_supply) / 100000000);
          const totalBorrow = parseFloat(Number(reserveDataForAsset.Ok.total_borrowed) / 100000000);
          const reserveFactor = parseFloat(Number(reserveDataForAsset.Ok.configuration.reserve_factor) / 100000000);
          const interestAccure = parseFloat(Number(reserveDataForAsset.Ok.accure_to_platform) / 100000000);
          const assetName = (reserveDataForAsset.Ok.asset_name).toString();
          let assetRate = 0;
          switch (assetName) {
            case 'ckBTC':
              assetRate = ckBTCUsdRate;
              break;
            case 'ckETH':
              assetRate = ckETHUsdRate;
              break;
            case 'ckUSDC':
              assetRate = ckUSDCUsdRate;

              break;
            case 'ICP':
              assetRate = ckICPUsdRate;
              break;
            case 'ckUSDT':
              assetRate = ckUSDTUsdRate;
              break;
            default:
              assetRate = 0;
          }

          const accruedValue = interestAccure * (assetRate / 1e8);
          totalAccruedValue += accruedValue;

          totalMarketSizeTemp += supplyCap;
          totalSupplies +=(totalSupply);
          totalBorrowes += totalBorrow
          reserveFactors = reserveFactor
        }
        setReserveData(data);
        setTotalMarketSize(formatNumber(totalMarketSizeTemp));
        setTotalSupplySize(formatNumber(totalSupplies))
        setTotalBorrowSize(formatNumber(totalBorrowes))
        setTotalReserveFactor(formatNumber(reserveFactors))
        setInterestAccure(formatNumber(totalAccruedValue))
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error(error.message)
      } finally{
        setLoading(false);
      }
    };

    fetchData();
  }, [assets, fetchReserveData]);

  const filteredItems = reserveData && Object.keys(reserveData).length > 0
    ? Object.entries(reserveData).filter(([asset, data]) =>
      asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (data.total_supply && data.total_supply.toString().includes(searchQuery)) ||
      (data.borrow_rate && data.borrow_rate.some(rate => rate.toString().includes(searchQuery)))
    )
    : [];

  const formatNumber = useFormatNumber();

  return { assets, reserveData, filteredItems, totalMarketSize, totalSupplySize, totalBorrowSize, totalReserveFactor, interestAccure ,asset_supply ,asset_borrow,loading, setLoading};
};

export default useAssetData;