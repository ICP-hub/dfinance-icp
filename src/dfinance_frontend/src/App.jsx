import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useRoutes } from "react-router-dom";
import { useAuth } from "./utils/useAuthClient";
import routesList from "./routes/routes";
import { useSelector } from "react-redux";
import { usePageLoading } from "./components/Common/useLoading";
import { useDispatch } from "react-redux";
import { setLedgerActor } from "./redux/reducers/ledgerRedcuer";
import { idlFactory as ledgerIdlFactory } from "../../declarations/token_ledger";
import { Principal } from "@dfinity/principal";
import useAssetData from "./components/Common/useAssets";
import Joyride from "react-joyride";
import faucetbutton from "../public/Helpers/faucet-button.png";
import faucetPopup from "../public/Helpers/faucet-popup.png";
import dashboardPage from "../public/Helpers/dashboard-page.png";
import dashboardAssetsToSupplyButton from "../public/Helpers/assets-to-supply.png";
import dashboardAssetsToBorrowButton from "../public/Helpers/assets-to-borrow.png";
import yourBorrowRepayButton from "../public/Helpers/your-borrow.png";
import yourSuppliesWithdrawButton from "../public/Helpers/you-supplies.png";
import assetsToSupplyPopup from "../public/Helpers/assets-to-supply-popup.png";
import assetsToBorrowPopup from "../public/Helpers/assets-to-borrow-popup.png";
import yourBorrowRepayPopup from "../public/Helpers/your-borrow-repay-popup.png";
import yourSuppliesWithdrawPopup from "../public/Helpers/your-supplies-withdraw-popup.png";
import dashboarNavDetails from "../public/Helpers/dashboard-nav-details.png";
import riskDetails from "../public/Helpers/risk-details.png";
import marketPage from "../public/Helpers/market-page.png";
import marketeNavbarDetails from "../public/Helpers/market-page-details.png";
import liquidationTable from "../public/Helpers/liquidation-table.png";
import debtStatusImage from "../public/Helpers/get-debt-status-button.png";
import faucetPage from "../public/Helpers/faucet-page.png";
import dFinanceHomePage from "../public/Helpers/dfinance-homepage.png";
import dfinanceHomePageLight from "../public/Helpers/dfinance-homepageLight.png";
import faucetPageLight from "../public/Helpers/faucet-pageLight.png";
import faucetbuttonLight from "../public/Helpers/faucet-buttonLight.png";
import faucetPopupLight from "../public/Helpers/faucet-popupLight.png";
import dashboardPageLight from "../public/Helpers/Dashboard-page-light.png";
import dashboardAssetsToSupplyButtonLight from "../public/Helpers/assetsToSupplyLight.png";
import assetsToSupplyPopupLight from "../public/Helpers/assets-to-supply-popupLight.png";
import dashboardAssetsToBorrowButtonLight from "../public/Helpers/assets-to-borrowLight.png";
import assetsToBorrowPopupLight from "../public/Helpers/assets-to-borrow-popupLight.png";
import yourBorrowRepayButtonLight from "../public/Helpers/your-borrowLight.png";
import yourBorrowRepayPopupLight from "../public/Helpers/your-borrow-repay-popupLight.png";
import yourSuppliesWithdrawButtonLight from "../public/Helpers/you-suppliesLight.png";
import yourSuppliesWithdrawPopupLight from "../public/Helpers/your-supplies-withdraw-popupLight.png";
import dashboarNavDetailsLight from "../public/Helpers/dashboard-nav-detailsLight.png";
import riskDetailsLight from "../public/Helpers/risk-detailsLight.png";
import marketPageLight from "../public/Helpers/market-pageLight.png";
import marketeNavbarDetailsLight from "../public/Helpers/market-page-detailsLight.png";
import debtStatusImageLight from "../public/Helpers/get-debt-status-buttonLight.png";
import liquidationTableLight from "../public/Helpers/liquidation-tableLight.png";
import liquidationButton from "../public/Helpers/Liquidate-button.png";
import liquidationButtonLight from "../public/Helpers/Liquidate-buttonLight.png";
import userInformation from "../public/Helpers/userInformation.png";
import userInformationLight from "../public/Helpers/userInformationLight.png";
import DebtInformation from "../public/Helpers/DebtInfomation.png";
import DebtInformationLight  from "../public/Helpers/DebtInformationLight.png";
import CollateralInformation from "../public/Helpers/CollateralInformation.png";
import CollateralInformationLight from "../public/Helpers/CollateralInformationLight.png";
import WarningPopup from "../public/Helpers/WarningPopup.png";
import WarningPopupLight from "../public/Helpers/WarningPopupLight.png";
import LiquidationSuccessfull  from "../public/Helpers/Liquidation Successfull.png";
import LiquidationSuccessfullLight  from "../public/Helpers/LiquidationSuccessfullLight.png";
import CollateralInformationCall from "../public/Helpers/colateralInformationCall.png";
import CollateralInformationCallLight from "../public/Helpers/colateralInformationCallLight.png";

export default function App() {
  const theme = useSelector((state) => state.theme.theme);
  const joyRideBackground = theme === "dark" ? "#29283B" : "#fcfafa";
  const joyTextColor = theme === "dark" ? "#fff" : "#4a5568";
  const isMobile = window.innerWidth <= 1115;
  const isMobile2 = window.innerWidth <= 640;

  const targetElement = isMobile ? "body" : "#dashboard-assets-to-supply";

  let TRACKING_ID = "G-EVCJPRHQYX";
  const { filteredItems, loading } = useAssetData();

  const {
    isAuthenticated,
    principal,
    backendActor,
    createLedgerActor,
    reloadLogin,
  } = useAuth();

  const [joyrideState, setJoyrideState] = useState({
    run: true,
    steps: [
      {
        target: "body",
        content: (
          <div className="text-justify">
            <h1 className="text-[22px] font-bold mb-3">Dfinance</h1>
            <h2>
              Welcome to the <strong>Dfinance App!</strong>
            </h2>
            <p className="mb-4">
              This guide will walk you through the key features.
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? dFinanceHomePage : dfinanceHomePageLight}
              alt="dFinanceHomePage"
              className="rounded-lg shadow-2xl ring-1 ring-black/15 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "body",
        content: (
          <div className="text-justify relative flex flex-col justify-center">
            <h1 className="text-[22px] font-bold mb-3">Faucet</h1>
            <p className="mb-4">
              This is the Faucet page. Here, you can view a list of assets
              available to faucet. Simply choose an asset from the list to
              proceed.
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? faucetPage : faucetPageLight}
              alt="Faucet Button"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "body",
        content: (
          <div className="text-justify relative flex flex-col">
            <p className="mb-4">
              On this page, you can click the faucet button for the desired
              asset.
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? faucetbutton : faucetbuttonLight}
              alt="Faucet Button"
              className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
            <p className="mb-4">
              This will open a popup where you can enter the amount of the asset
              you wish to faucet.
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? faucetPopup : faucetPopupLight}
              alt="Faucet Popup"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "body",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Dashboard</h1>
            <p className="mb-4">
              Welcome to the dashboard! Here, you can manage your assets
              seamlessly. Use this page to{" "}
              <span className="font-semibold">supply</span> assets,{" "}
              <span className="font-semibold">borrow</span> against collateral,{" "}
              <span className="font-semibold">withdraw</span> your supplied
              assets, or <span className="font-semibold">repay</span> your
              borrowed amounts.
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? dashboardPage : dashboardPageLight}
              alt="dashboardPage"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "#dashboard-assets-to-supply",
        content: (
          <div className="relative flex flex-col text-justify">
            <p className="mb-4">
              In the "Assets to Supply" section, select the asset you wish to
              supply.
            </p>
            <img
              loading="lazy"
              src={
                theme === "dark"
                  ? dashboardAssetsToSupplyButton
                  : dashboardAssetsToSupplyButtonLight
              }
              alt="dashboardAssetsToSupplyButton"
              className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
            <p className="mb-4">
              After clicking the supply button, a popup will appear. Enter the
              amount, approve the transaction, and click "Supply" to complete
              the process.
            </p>
            <img
              loading="lazy"
              src={
                theme === "dark"
                  ? assetsToSupplyPopup
                  : assetsToSupplyPopupLight
              }
              alt="assetsToSupplyPopup"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: isMobile ? "center" : "right",
      },
      {
        target: "#dashboard-assets-to-borrow",
        content: (
          <div className="relative flex flex-col text-justify">
            <p className="mb-4">
              In the "Assets to Borrow" section, select the asset you wish to
              borrow.
            </p>
            <img
              loading="lazy"
              src={
                theme === "dark"
                  ? dashboardAssetsToBorrowButton
                  : dashboardAssetsToBorrowButtonLight
              }
              alt="dashboardAssetsToBorrowButton"
              className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
            <p className="mb-4">
              After clicking the borrow button, a popup will appear. Enter the
              amount and click "Borrow" to complete the process.
            </p>
            <img
              loading="lazy"
              src={
                theme === "dark"
                  ? assetsToBorrowPopup
                  : assetsToBorrowPopupLight
              }
              alt="assetsToBorrowPopup"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: isMobile ? "center" : "left",
      },
      {
        target: "#your-borrow",
        content: (
          <div className="relative flex flex-col text-justify">
            <p className="mb-4">
              In the "Your Borrow" section, select the asset you wish to repay
              or additionaly you can borrow from here also.
            </p>
            <img
              loading="lazy"
              src={
                theme === "dark"
                  ? yourBorrowRepayButton
                  : yourBorrowRepayButtonLight
              }
              alt="yourBorrowRepayButton"
              className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
            <p className="mb-4">
              After clicking the repay button, a popup will appear. Enter the
              amount , approve the transaction, and click "Repay" to complete
              the process.
            </p>
            <img
              loading="lazy"
              src={
                theme === "dark"
                  ? yourBorrowRepayPopup
                  : yourBorrowRepayPopupLight
              }
              alt="yourBorrowRepayPopup"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: isMobile ? "center" : "left",
      },
      {
        target: "#your-supplies",
        content: (
          <div className="relative flex flex-col text-justify">
            <p className="mb-4">
              In the "Your Supplies" section, select the asset you wish to
              withdraw or additionaly you can supply from here also.
            </p>
            <img
              loading="lazy"
              src={
                theme === "dark"
                  ? yourSuppliesWithdrawButton
                  : yourSuppliesWithdrawButtonLight
              }
              alt="yourSuppliesWithdrawButton"
              className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
            <p className="mb-4">
              After clicking the withdraw button, a popup will appear. Enter the
              amount and click "Withdraw" to complete the process.
            </p>
            <img
              loading="lazy"
              src={
                theme === "dark"
                  ? yourSuppliesWithdrawPopup
                  : yourSuppliesWithdrawPopupLight
              }
              alt="yourSuppliesWithdrawPopup"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: isMobile ? "center" : "right",
      },
      {
        target: "#dashboard-nav-details",
        content: (
          <div className="relative flex flex-col text-justify">
            <p className="mb-4">
              In here we can see Net Worth, Net APY, and Health Factor (when
              available).
            </p>
            <img
              loading="lazy"
              src={
                theme === "dark" ? dashboarNavDetails : dashboarNavDetailsLight
              }
              alt="dashboarNavDetails"
              className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
            <p className="mb-4">
              On clicking the "Risk Details" button, a popup will appear showing
              the Health Factor, Current LTV, Max LTV, and Liquidation
              Threshold.
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? riskDetails : riskDetailsLight}
              alt="Faucet Button"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: isMobile ? "center" : "right",
      },
      {
        target: "#market-page1",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Market</h1>
            <p className="mb-4">
              The Market page shows all assets on the platform with details like
              Total Supplied, Supply APY, Total Borrowing, and Borrowing APY.
              Use it to evaluate assets for supply or borrowing.
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? marketPage : marketPageLight}
              alt="Faucet Button"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "#market-page1",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Market</h1>
            <p className="mb-4">
              The Market page shows all assets on the platform with details like
              Total Supplied, Supply APY, Total Borrowing, and Borrowing APY.
              Use it to evaluate assets for supply or borrowing.
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? marketPage : marketPageLight}
              alt="Faucet Button"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: ".market-nav-details",
        content: (
          <div className="relative flex flex-col text-justify">
            <p className="mb-4">
              In here we can see Total Market Size, Total Available, and Total
              Borrows.
            </p>
            <img
              loading="lazy"
              src={
                theme === "dark"
                  ? marketeNavbarDetails
                  : marketeNavbarDetailsLight
              }
              alt="marketeNavbarDetails"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: isMobile ? "center" : "bottom",
      },
      {
        target: "#footer-liquidation",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Liquidation</h1>
            <p className="mb-4">
            Click on the 'Liquidation' button at the bottom of the page to navigate to the liquidation page.
            </p>
          </div>
        ),
        placement: isMobile ? "center" : "center",
      },
      {
        target: "#liquidation",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Liquidation</h1>
            <p className="mb-4">
              In the "Liquidation" section, click on the "Get Debt Status
              Button" to see the liquidation List (if available).
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? debtStatusImage : debtStatusImageLight}
              alt="Faucet Button"
              className="mb-4 rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
            
          </div>
        ),
        placement: "center",
      },
      {
        target: "#liquidation1",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Liquidation</h1>
            <p className="mb-4">
            Here it will show  the list of users with a health factor less than 1
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? liquidationTable : liquidationTableLight}
              alt="Faucet Popup"
              className="mb-4 rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
             <p className="mb-4">
             Click the 'Liquidate' button in the 'Liquidation' list to view debt details and open the user information popup.
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? liquidationButton : liquidationButtonLight}
              alt="Faucet Button"
              className="mb-4 rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
            
          </div>
        ),
        placement: "center",
      },
      {
        target: "#liquidation1",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Liquidation</h1>
            <p className="mb-4">
            This will now open the 'User Information' popup, displaying the user's principal and health factor.
            </p>
            
            <img
              loading="lazy"
              src={theme === "dark" ? userInformation : userInformationLight}
              alt="Faucet Popup"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "#liquidation2",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Liquidation</h1>
            <p className="mb-4">
            Now select the debt asset to view the repayment details.
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? DebtInformation : DebtInformationLight}
              alt="Faucet Button"
              className="mb-4 rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "#liquidation-guide",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Liquidation</h1>
            <p className="mb-4">
            "Now, select the collateral asset to view the details and rewards given to the liquidator based on the selected asset, and then click on 'Approve Liquidation' to proceed with the call."
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? CollateralInformation : CollateralInformationLight}
              alt="Faucet Popup"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "#liquidation-guide",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Liquidation</h1>
            <p className="mb-4">
            "Click on 'Call Liquidation' to proceed with the call."
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? CollateralInformationCall : CollateralInformationCallLight}
              alt="Faucet Popup"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "#liquidation-guide",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Liquidation</h1>
            <p className="mb-4">
            A warning popup will appear—click 'YES, Call Liquidation' to proceed, then click 'Call Liquidation' to complete the process."
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? WarningPopup : WarningPopupLight}
              alt="Faucet Popup"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "#liquidation-guide",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">Liquidation</h1>
            <p className="mb-4">
            Liquidation successful. You’re done!
            </p>
            <img
              loading="lazy"
              src={theme === "dark" ? LiquidationSuccessfull : LiquidationSuccessfullLight}
              alt="Faucet Popup"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ),
        placement: "center",
      },
      {
        target: "#liquidation-guide",
        content: (
          <div className="relative flex flex-col text-justify">
            <h1 className="text-[22px] font-bold mb-3">End of Tour</h1>
            <p className="mb-4">
              This is the end of your tour. You're all set to explore the site and start using all the features!
            </p>
            <div className="text-center mb-4">
              <span className="text-green-500 text-[40px]">&#10003;</span> {/* Checkmark symbol */}
            </div>
          </div>
        ),
        placement: "center",
      }
      
      
    ],
    styles: {
      options: {
        arrowColor: joyRideBackground,
        zIndex: 10000000,
        primaryColor: "#00bfff",
        position: "absolute",
      },
      tooltip: {
        backgroundColor: joyRideBackground,
        color: joyTextColor,
        borderRadius: "12px",
        fontFamily: "'Poppins', sans-serif",
        fontSize: "13px",
        border: "2px solid #525355",
      },
      buttonNext: {
        backgroundImage: "linear-gradient(to right, #4659CF, #2A1F9D)",
        color: "#fff",
        border: "none",
        padding: "9px 20px",
        borderRadius: "7px",
        cursor: "pointer",
        fontSize: "12px",
      },
      buttonBack: {
        color: joyTextColor,
        fontSize: "12px",
      },
      buttonSkip: {
        color: joyTextColor,
        fontSize: "12px",
      },
      buttonClose: {
        color: "#f25c54",
      },
    },
  });

  const [assetPrincipal, setAssetPrincipal] = useState({});
  const dispatch = useDispatch();

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

  const isLoading = usePageLoading();
  const routes = useRoutes(routesList);

  const [isLoadingPage, setIsLoadingPage] = useState(
    isAuthenticated ? loading : isLoading
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && principal) {
      const storedData = localStorage.getItem("userGuideData");
      const parsedData = storedData ? JSON.parse(storedData) : {};

      if (parsedData[principal]) {
        setJoyrideState((prevState) => ({ ...prevState, run: false }));
      }
    }
  }, [isAuthenticated, principal]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;

    if (status === "finished" || status === "skipped") {
      if (isAuthenticated && principal) {
        const storedData = localStorage.getItem("userGuideData");
        const parsedData = storedData ? JSON.parse(storedData) : {};
        parsedData[principal] = true;
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
    if (data.action === "next" && data.index === 9) {
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
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoadingPage) {
        setIsLoadingPage(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isLoadingPage]);

  return (
    <>
      {isAuthenticated && !isLoadingPage && (
        <Joyride
          steps={joyrideState.steps}
          run={joyrideState.run}
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
        />
      )}

      {routes}
    </>
  );
}
