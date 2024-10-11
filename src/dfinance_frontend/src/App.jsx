import React, { useEffect, useState ,useMemo } from "react";
import { useRoutes } from "react-router-dom";
import { useAuth } from "./utils/useAuthClient";
import routesList from './routes/routes';
import { useSelector } from 'react-redux';
import Loading from "./components/Common/Loading";
import { usePageLoading } from "./components/Common/useLoading";
import { useDispatch } from 'react-redux';
import { setLedgerActor } from './redux/reducers/ledgerRedcuer';
import { idlFactory as ledgerIdlFactory } from "../../declarations/token_ledger";
import { Principal } from "@dfinity/principal";
import { useCallback } from "react";
export default function App() {
  const theme = useSelector((state) => state.theme.theme);
 
  
  const {
    isAuthenticated,
    login,
    logout,
    updateClient,
    authClient,
    identity,
    principal,
    backendActor,
    accountId,
    createLedgerActor,
    reloadLogin,
    accountIdString,
  } = useAuth();

  const [assetPrincipal, setAssetPrincipal] = useState({});
  const dispatch = useDispatch();
  const principalObj = useMemo(
    () => Principal.fromText(principal),
    [principal]
  );
  useEffect(() => {
    const fetchAssetPrinciple = async () => {
      if (backendActor) {
        try {
          const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP"];
          for (const asset of assets) {
            const result = await getAssetPrinciple(asset);
            setAssetPrincipal((prev) => ({
              ...prev,
              [asset]: result,
            }));
          }
        } catch (error) {
          console.error("Error fetching asset principal:", error);
        }
      } else {
        console.error("Backend actor initialization failed.");
      }
    };
  
    fetchAssetPrinciple();
  }, [principal, backendActor]);
  
  const getAssetPrinciple = async (asset) => {
    if (!backendActor) {
      throw new Error("Backend actor not initialized");
    }
    try {
      let result;
      switch (asset) {
        case "ckBTC":
          result = await backendActor.get_asset_principal("ckBTC");
          break;
        case "ckETH":
          result = await backendActor.get_asset_principal("ckETH");
          break;
        case "ckUSDC":
          result = await backendActor.get_asset_principal("ckUSDC");
          break;
        case "ICP":
          result = await backendActor.get_asset_principal("ICP");
          break;
        default:
          throw new Error(`Unknown asset: ${asset}`);
      }
      return result.Ok.toText();
    } catch (error) {
      console.error(`Error fetching asset principal for ${asset}:`, error);
      throw error;
    }
  };
  
  useEffect(() => {
    if (assetPrincipal.ckBTC) {
      const actor = createLedgerActor(assetPrincipal.ckBTC, ledgerIdlFactory);
      console.log("Created actor for ckBTC:", actor);
      
      dispatch(setLedgerActor({ asset: 'ckBTC', actor }));
    }
    if (assetPrincipal.ckETH) {
      const actor = createLedgerActor(assetPrincipal.ckETH, ledgerIdlFactory);
      
      dispatch(setLedgerActor({ asset: 'ckETH', actor }));
    }
    if (assetPrincipal.ckUSDC) {
      const actor = createLedgerActor(assetPrincipal.ckUSDC, ledgerIdlFactory);
      dispatch(setLedgerActor({ asset: 'ckUSDC', actor }));
    }
    if (assetPrincipal.ICP) {
      const actor = createLedgerActor(assetPrincipal.ICP, ledgerIdlFactory);
      dispatch(setLedgerActor({ asset: 'ICP', actor }));
    }
  }, [assetPrincipal, dispatch]);

 

  useEffect(() => {
    reloadLogin();
  }, []);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#070a18';
    }
  }, [theme]);

  const isLoading = usePageLoading();
  const routes = useRoutes(routesList)

  if (isLoading) {
    return <Loading isLoading={isLoading} />
  }

  return routes;

}