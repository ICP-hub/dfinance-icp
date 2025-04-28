import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useRoutes } from "react-router-dom";
import { useAuth } from "./utils/useAuthClient";
import routesList from "./routes/routes";
import { useSelector } from "react-redux";
import { usePageLoading } from "./components/customHooks/useLoading";
import { useDispatch } from "react-redux";
import { setLedgerActor } from "./redux/reducers/ledgerRedcuer";
import { idlFactory as ledgerIdlFactory } from "../../declarations/token_ledger";
import useAssetData from "./components/customHooks/useAssets";
import Joyride from "react-joyride";
import { getSteps, getStyles } from "../src/components/Common/joyrideConfig";
import { joyRideTrigger } from "./redux/reducers/joyRideReducer";
import { Suspense } from "react";
import MiniLoader from "./components/Common/MiniLoader";

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
    const fetchAssetPrincipals = async () => {
      if (!backendActor) return;

      try {
        const assets = ["ckBTC", "ckETH", "ckUSDC", "ICP", "ckUSDT"];
        const results = await Promise.all(
          assets.map((asset) => backendActor.get_asset_principal(asset))
        );

        setAssetPrincipal(
          assets.reduce((acc, asset, index) => {
            acc[asset] = results[index]?.Ok?.toText() || null;
            return acc;
          }, {})
        );
      } catch (error) {
        console.error("Error fetching asset principals:", error);
      }
    };

    fetchAssetPrincipals();
  }, [principal, backendActor]);

  /**
   * Creates ledger actors for all fetched asset principals.
   */
  useEffect(() => {
    Object.entries(assetPrincipal).forEach(([asset, principal]) => {
      if (principal) {
        const actor = createLedgerActor(principal, ledgerIdlFactory);
        dispatch(setLedgerActor({ asset, actor }));
      }
    });
  }, [assetPrincipal, dispatch]);

  useEffect(() => {
    reloadLogin();
  }, []);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.style.backgroundColor =
      theme === "dark" ? "#070a18" : "#ffffff";
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
      if (isLoadingPage) setIsLoadingPage(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isLoadingPage]);

  /* ===================================================================================
   *                                  RENDER COMPONENT
   * =================================================================================== */

  return (
    <>
      <Suspense fallback={<MiniLoader minHeight="50vh" />}>
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
      </Suspense>
    </>
  );
}
