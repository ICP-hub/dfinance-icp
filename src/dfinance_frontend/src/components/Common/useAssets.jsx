import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/useAuthClient';
import useFormatNumber from '../customHooks/useFormatNumber';
import useFetchConversionRate from '../customHooks/useFetchConversionRate';
import {  idlFactory } from "../../../../declarations/dtoken";
import {  idlFactory  as idlFactory1} from "../../../../declarations/debttoken";
import { useDispatch } from "react-redux";
import { setDLedgerActor } from "../../redux/reducers/dledgerReducer";
const useAssetData = (searchQuery = '') => {
  const dispatch = useDispatch();
  const {principal,
    fetchReserveData,
    backendActor,
    isAuthenticated,
    createLedgerActor
  } = useAuth();

  const [assets, setAssets] = useState([]);
  const [reserveData, setReserveData] = useState(null);
  const [DtokenActor, setDtokenActor] = useState("");
  const [DebttokenActor, setDebtTokenActor] = useState("");
  const [dtokenId, setdtokenId] = useState([]);
  const [debtTokenId, setdebtTokenId] = useState("");
  const [totalMarketSize, setTotalMarketSize] = useState(0);
  const [totalSupplySize, setTotalSupplySize] = useState(0);
  const [totalBorrowSize, setTotalBorrowSize] = useState(0);
  const [totalReserveFactor, setTotalReserveFactor] = useState(0)
  const [interestAccure, setInterestAccure] = useState(0)
  const [error, setError] = useState(null);
  const [asset_supply, setAssetSupply] = useState({});
  const [asset_borrow, setAssetBorrow] = useState({});
  const [loading, setLoading] = useState(true); 
  const [dispatchedAssets, setDispatchedAssets] = useState(new Set());
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
    if (backendActor&& isAuthenticated ) {
      try {
        const result = await backendActor.get_asset_supply(asset,[]);
        setAssetSupply(prev => ({ ...prev, [asset]: result.Ok }));
      } catch (error) {
        console.error(error.message)
      }
    } else {
    }
  };
  
  const fetchAssetBorrow = async (asset) => {
    if (backendActor&& isAuthenticated) {
      try {
        const result = await backendActor.get_asset_debt(asset,[]);
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
        let totalSupplies = 0;
        let totalBorrowes = 0;
        let reserveFactors = 0;
        let totalAccruedValue = 0;
        let dtokenIds = [];  // Store all dtoken ids here
        let debtTokenIds = []; // Store all debtToken ids here
  
        // Fetch data for each asset
        for (const asset of assets) {
          const reserveDataForAsset = await fetchReserveData(asset);
          data[asset] = reserveDataForAsset;
  
          const dtokenId = reserveDataForAsset?.Ok?.d_token_canister;
          const debtTokenId = reserveDataForAsset?.Ok?.debt_token_canister;
          const supplyCap = parseFloat(Number(reserveDataForAsset.Ok.configuration.supply_cap) / 100000000);
          const totalSupply = parseFloat(Number(reserveDataForAsset.Ok.asset_supply) / 100000000);
          const totalBorrow = parseFloat(Number(reserveDataForAsset.Ok.asset_borrow) / 100000000);
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
          totalSupplies += totalSupply;
          totalBorrowes += totalBorrow;
          reserveFactors = reserveFactor;
  
          // Accumulate dtoken and debtToken values
          if (dtokenId) dtokenIds.push(dtokenId);
          if (debtTokenId) debtTokenIds.push(debtTokenId);
        }
  
        // Set accumulated dtoken and debtToken ids
        setdtokenId(dtokenIds);
        setdebtTokenId(debtTokenIds);
  
        // Set dtoken actors only once for each asset if the result is valid
        dtokenIds.forEach((dtoken, index) => {
          if (dtoken && !dispatchedAssets.has(assets[index])) {
            // Create and set dtoken actor locally only if dtoken is valid
            const dtokenActor = createLedgerActor(dtoken, idlFactory);
            if (dtokenActor) {
              console.log("Setting dtokenActor for asset:", assets[index], dtokenActor);
              setDtokenActor((prevState) => ({
                ...prevState,
                ["d"+assets[index]]: dtokenActor,  // Set actor for the specific asset
              }));
  
              // Mark this asset as dispatched
              setDispatchedAssets((prev) => new Set(prev.add(assets[index])));
            }
          }
        });
  
        // Set debtToken actors only once for each asset if the result is valid
        debtTokenIds.forEach((debtToken, index) => {
          if (debtToken && !dispatchedAssets.has(assets[index])) {
            // Create and set debtToken actor locally only if debtToken is valid
            const debtTokenActor = createLedgerActor(debtToken, idlFactory1);
            if (debtTokenActor) {
              console.log("Setting debtTokenActor for asset:", assets[index], debtTokenActor);
              setDebtTokenActor((prevState) => ({
                ...prevState,
                ["debt"+assets[index]]: debtTokenActor,  // Set actor for the specific asset
              }));
  
              // Mark this asset as dispatched
              setDispatchedAssets((prev) => new Set(prev.add(assets[index])));
            }
          }
        });
  
        // Set other calculated values
        setReserveData(data);
        setTotalMarketSize(formatNumber(totalMarketSizeTemp));
        setTotalSupplySize(formatNumber(totalSupplies));
        setTotalBorrowSize(formatNumber(totalBorrowes));
        setTotalReserveFactor(formatNumber(reserveFactors));
        setInterestAccure(formatNumber(totalAccruedValue));
      } catch (err) {
        setError(err.message);
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [assets, fetchReserveData, DebttokenActor ,DtokenActor , dispatchedAssets]);
  
  
  
  

  const filteredItems = reserveData && Object.keys(reserveData).length > 0
    ? Object.entries(reserveData).filter(([asset, data]) =>
      asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (data.asset_supply && data.asset_supply.toString().includes(searchQuery)) ||
      (data.borrow_rate && data.borrow_rate.some(rate => rate.toString().includes(searchQuery)))
    )
    : [];

  const formatNumber = useFormatNumber();
 
  
          return { assets, reserveData, filteredItems, totalMarketSize, totalSupplySize, totalBorrowSize, totalReserveFactor, interestAccure ,asset_supply ,asset_borrow,loading, setLoading, fetchAssetBorrow, fetchAssetSupply, DebttokenActor, DtokenActor};
};

export default useAssetData;