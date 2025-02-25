import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useRoutes } from "react-router-dom";
import { useAuth } from "./utils/useAuthClient";
import routesList from "./routes/routes";
import { useSelector } from "react-redux";
import { usePageLoading } from "./components/customHooks/useLoading";
import { useDispatch } from "react-redux";
import { setLedgerActor } from "./redux/reducers/ledgerRedcuer";
import { idlFactory as ledgerIdlFactory } from "../../declarations/token_ledger";
import { Principal } from "@dfinity/principal";
import useAssetData from "./components/customHooks/useAssets";
import Joyride from "react-joyride";
import { getSteps, getStyles } from "../src/components/Common/joyrideConfig";
import { joyRideTrigger } from "./redux/reducers/joyRideReducer";

export default function App() {
  /* ===================================================================================
   *                                  HOOKS
   * =================================================================================== */

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useAssetData();
  const isLoading = usePageLoading();
  const routes = useRoutes(routesList);

  const {
    isAuthenticated,
    principal,
    backendActor,
    createLedgerActor,
    reloadLogin,
  } = useAuth();

  const isTourRunning = useSelector((state) => state.joyride.joyRideTrigger);
  const theme = useSelector((state) => state.theme.theme);

  /* ===================================================================================
   *                 Derived State, UI Variables
   * =================================================================================== */

  const joyRideBackground = theme === "dark" ? "#29283B" : "#fcfafa";
  const joyTextColor = theme === "dark" ? "#fff" : "#4a5568";
  const isMobile = window.innerWidth <= 1115;
  const isMobile2 = window.innerWidth <= 640;

  /* ===================================================================================
   *                                  STATE MANAGEMENT
   * =================================================================================== */

  const [isTourVisible, setIsTourVisible] = React.useState(isTourRunning);
  const [assetPrincipal, setAssetPrincipal] = useState({});
  const [triggerDispatch, setTriggerDispatch] = useState(false);
  const [joyrideState, setJoyrideState] = useState({
    run: true,
    steps: [],
    styles: {},
  });

  /* ===================================================================================
   *                                  EFFECTS & FUNCTIONS
   * =================================================================================== */

  useEffect(() => {
    setIsTourVisible(isTourRunning);
  }, [isTourRunning]);

  /**
   * Updates the joyride state when theme or screen size changes.
   */
  useEffect(() => {
    setJoyrideState((prevState) => ({
      ...prevState,
      steps: getSteps(theme, isMobile2, isMobile),
      styles: getStyles(joyRideBackground, joyTextColor),
    }));
  }, [
    theme,
    isMobile2,
    isMobile,
    joyRideBackground,
    joyTextColor,
    isTourRunning,
  ]);

  useEffect(() => {
    const fetchAssetPrinciple = async () => {
      if (backendActor) {
        try {
          const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP", "ckUSDT"];
          for (const asset of assets) {
            const result = await getAssetPrinciple(asset);
            setAssetPrincipal((prev) => ({
              ...prev,
              [asset]: result,
            }));
          }
        } catch (error) {}
      } else {
      }
    };

    fetchAssetPrinciple();
  }, [principal, backendActor]);

  /**
   * Fetches the principal ID of a given asset from the backend.
   * @param {string} asset - The asset symbol (e.g., "ckBTC").
   * @returns {string} - The asset principal ID as a string.
   */
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
        case "ckUSDT":
          result = await backendActor.get_asset_principal("ckUSDT");
          break;

        default:
          throw new Error(`Unknown asset: ${asset}`);
      }
      return result.Ok.toText();
    } catch (error) {
      throw error;
    }
  };

  /**
   * Creates ledger actors for all fetched asset principals.
   */
  useEffect(() => {
    if (assetPrincipal.ckBTC) {
      const actor = createLedgerActor(assetPrincipal.ckBTC, ledgerIdlFactory);
      dispatch(setLedgerActor({ asset: "ckBTC", actor }));
    }
    if (assetPrincipal.ckETH) {
      const actor = createLedgerActor(assetPrincipal.ckETH, ledgerIdlFactory);
      dispatch(setLedgerActor({ asset: "ckETH", actor }));
    }
    if (assetPrincipal.ckUSDC) {
      const actor = createLedgerActor(assetPrincipal.ckUSDC, ledgerIdlFactory);
      dispatch(setLedgerActor({ asset: "ckUSDC", actor }));
    }
    if (assetPrincipal.ICP) {
      const actor = createLedgerActor(assetPrincipal.ICP, ledgerIdlFactory);
      dispatch(setLedgerActor({ asset: "ICP", actor }));
    }
    if (assetPrincipal.ckUSDT) {
      const actor = createLedgerActor(assetPrincipal.ckUSDT, ledgerIdlFactory);
      dispatch(setLedgerActor({ asset: "ckUSDT", actor }));
    }
  }, [assetPrincipal, dispatch]);

  useEffect(() => {
    reloadLogin();
  }, []);

  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#070a18";
    }
  }, [theme]);

  const [isLoadingPage, setIsLoadingPage] = useState(
    isAuthenticated ? loading : isLoading
  );

  useEffect(() => {
    if (isAuthenticated && principal) {
      const storedData = localStorage.getItem("userGuideData");
      const parsedData = storedData ? JSON.parse(storedData) : {};

      if (parsedData[principal]) {
        if (isTourVisible) {
          setJoyrideState((prevState) => ({ ...prevState, run: true }));
          return;
        }
        setJoyrideState((prevState) => ({ ...prevState, run: false }));
      }
    }
  }, [isAuthenticated, principal, isTourVisible]);

  useEffect(() => {
    if (triggerDispatch) {
      dispatch(joyRideTrigger());
      setTriggerDispatch(false);
    }
  }, [triggerDispatch, dispatch]);

  /**
   * Handles Joyride navigation logic and tour completion.
   * @param {Object} data - Joyride callback data.
   */
  const handleJoyrideCallback = (data) => {
    const { status } = data;
    console.log("data.index", data.index);
    if (status === "finished" || status === "skipped") {
      if (isAuthenticated && principal) {
        const storedData = localStorage.getItem("userGuideData");
        const parsedData = storedData ? JSON.parse(storedData) : {};
        parsedData[principal] = true;
        if (isTourRunning) {
          setTriggerDispatch(true);
          setJoyrideState((prevState) => ({ ...prevState, run: true }));
          return;
        }
        localStorage.setItem("userGuideData", JSON.stringify(parsedData));
        setJoyrideState((prevState) => ({ ...prevState, run: false }));
      }
    }

    if (data.action === "next" && data.index === 0) {
      navigate("/Faucet");
    }
    if (data.action === "next" && data.index === 2) {
      navigate("/dashboard");
    }
    if (data.index === 10) {
      navigate("/market");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    if (data.action === "next" && data.index === 12) {
      navigate("/liquidate");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    if (data.action === "next" && data.index === 13) {
      navigate("/liquidate");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    if (data.action === "prev" && data.index === 1) {
      navigate("/dashboard");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    if (data.action === "prev" && data.index === 3) {
      navigate("/Faucet");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    if (data.action === "prev" && data.index === 10) {
      navigate("/dashboard");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    if (data.action === "prev" && data.index === 12) {
      navigate("/market");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    if (status === "paused") {
      navigate("/dashboard");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoadingPage) {
        setIsLoadingPage(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isLoadingPage]);

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <>
      {isAuthenticated && !isLoadingPage && (
        <Joyride
          steps={joyrideState.steps}
          run={joyrideState.run || isTourVisible}
          continuous={true}
          showSkipButton={true}
          styles={joyrideState.styles}
          locale={{
            back: "Previous",
            close: "Close",
            last: "Finish",
            next: "Next",
            skip: "Skip",
          }}
          callback={handleJoyrideCallback}
          disableOverlayClose={true}
        />
      )}

      {routes}
    </>
  );
}
