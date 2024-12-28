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
import DebtInformationLight from "../public/Helpers/DebtInformationLight.png";
import CollateralInformation from "../public/Helpers/CollateralInformation.png";
import CollateralInformationLight from "../public/Helpers/CollateralInformationLight.png";
import WarningPopup from "../public/Helpers/WarningPopup.png";
import WarningPopupLight from "../public/Helpers/WarningPopupLight.png";
import LiquidationSuccessfull from "../public/Helpers/Liquidation Successfull.png";
import LiquidationSuccessfullLight from "../public/Helpers/LiquidationSuccessfullLight.png";
import CollateralInformationCall from "../public/Helpers/colateralInformationCall.png";
import CollateralInformationCallLight from "../public/Helpers/colateralInformationCallLight.png";
import DashboarNavDetailsDarkSmall from "../public/Helpers/DashboarNavDetailsDarkSmall.png";
import DashboarNavDetailsLightSmall from "../public/Helpers/DashboarNavDetailsLightSmall.png";
import marketNavDetailsDarkSmall from "../public/Helpers/marketNavDetailsDarkSmall.png";
import marketNavDetailsLightSmall from "../public/Helpers/marketNavDetailsLightSmall.png";
import DfinanceHomeDarkSmall from "../public/Helpers/DfinanceHomeDarkSmall.png";
import DfinanceHomeLightSmall from "../public/Helpers/DfinanceHomeLightSmall.png";
import FaucetSmall from "../public/Helpers/FaucetSmall.png";
import FaucetSmallLight from "../public/Helpers/FaucetSmallLight.png";
import DashboardPageSmall from "../public/Helpers/DashboardPageSmall.png";
import DashboardPageSmallLight from "../public/Helpers/DashboardPageSmallLight.png";
import MarketPageSmall from "../public/Helpers/MarketPageSmall.png";
import MarketPageSmallLight from "../public/Helpers/MarketPageSmallLight.png";

export const getSteps = (theme, isMobile2, isMobile) => [
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
        {isMobile2 ? (
          <img
            src={
              theme === "dark" ? DfinanceHomeDarkSmall : DfinanceHomeLightSmall
            }
            alt="dFinanceHomePage"
            className="rounded-lg shadow-2xl ring-1 ring-black/15 dark:ring-white/30"
          />
        ) : (
          <img
            src={theme === "dark" ? dFinanceHomePage : dfinanceHomePageLight}
            alt="dFinanceHomePage"
            className="rounded-lg shadow-2xl ring-1 ring-black/15 dark:ring-white/30"
          />
        )}
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
          This is the Faucet page. Here, you can view a list of assets available
          to faucet. Simply choose an asset from the list to proceed.
        </p>
        {isMobile2 ? (
          <img
            src={theme === "dark" ? FaucetSmall : FaucetSmallLight}
            alt="Faucet Button"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        ) : (
          <img
            src={theme === "dark" ? faucetPage : faucetPageLight}
            alt="Faucet Button"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        )}
      </div>
    ),
    placement: "center",
  },
  {
    target: "body",
    content: (
      <div className="text-justify relative flex flex-col">
        <p className="mb-4">
          On this page, you can click the faucet button for the desired asset.
        </p>
        <img
          src={theme === "dark" ? faucetbutton : faucetbuttonLight}
          alt="Faucet Button"
          className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
        <p className="mb-4">
          This will open a popup where you can enter the amount of the asset you
          wish to faucet.
        </p>
        <img
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
          Welcome to the dashboard! Here, you can manage your assets seamlessly.
          Use this page to <span className="font-semibold">supply</span> assets,{" "}
          <span className="font-semibold">borrow</span> against collateral,{" "}
          <span className="font-semibold">withdraw</span> your supplied assets,
          or <span className="font-semibold">repay</span> your borrowed amounts.
        </p>
        {isMobile2 ? (
          <img
            src={
              theme === "dark" ? DashboardPageSmall : DashboardPageSmallLight
            }
            alt="dashboardPage"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        ) : (
          <img
            src={theme === "dark" ? dashboardPage : dashboardPageLight}
            alt="dashboardPage"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        )}
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
          amount, approve the transaction, and click "Supply" to complete the
          process.
        </p>
        <img
          src={
            theme === "dark" ? assetsToSupplyPopup : assetsToSupplyPopupLight
          }
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
          src={
            theme === "dark" ? assetsToBorrowPopup : assetsToBorrowPopupLight
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
          In the "Your Borrow" section, select the asset you wish to repay or
          additionaly you can borrow from here also.
        </p>
        <img
          src={
            theme === "dark"
              ? yourBorrowRepayButton
              : yourBorrowRepayButtonLight
          }
          alt="yourBorrowRepayButton"
          className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
        <p className="mb-4">
          After clicking the repay button, a popup will appear. Enter the amount
          , approve the transaction, and click "Repay" to complete the process.
        </p>
        <img
          src={
            theme === "dark" ? yourBorrowRepayPopup : yourBorrowRepayPopupLight
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
          In the "Your Supplies" section, select the asset you wish to withdraw
          or additionaly you can supply from here also.
        </p>
        <img
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
      <>
        {isMobile2 ? (
          <div className="relative flex flex-col text-justify">
            <p className="mb-4">Here Click on the menu button</p>
            <p className="mb-4">
              Here we can see Net Worth, Net APY, and Health Factor (when
              available).
            </p>
            <img
              src={
                theme === "dark"
                  ? DashboarNavDetailsDarkSmall
                  : DashboarNavDetailsLightSmall
              }
              alt="Faucet Button"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30 mb-4"
            />
            <p className="mb-4">
              On clicking the "Risk Details" button, a popup will appear showing
              the Health Factor, Current LTV, Max LTV, and Liquidation
              Threshold.
            </p>
            <img
              src={theme === "dark" ? riskDetails : riskDetailsLight}
              alt="Faucet Button"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ) : (
          <div className="relative flex flex-col text-justify">
            <p className="mb-4">
              In here we can see Net Worth, Net APY, and Health Factor (when
              available).
            </p>
            <img
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
              src={theme === "dark" ? riskDetails : riskDetailsLight}
              alt="Faucet Button"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        )}
      </>
    ),
    placement: isMobile ? "center" : "bottom",
  },
  {
    target: "#market-page1",
    content: (
      <div className="relative flex flex-col text-justify">
        <h1 className="text-[22px] font-bold mb-3">Market</h1>
        <p className="mb-4">
          The Market page shows all assets on the platform with details like
          Total Supplied, Supply APY, Total Borrowing, and Borrowing APY. Use it
          to evaluate assets for supply or borrowing.
        </p>
        {isMobile2 ? (
          <img
            src={theme === "dark" ? MarketPageSmall : MarketPageSmallLight}
            alt="Faucet Button"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        ) : (
          <img
            src={theme === "dark" ? marketPage : marketPageLight}
            alt="Faucet Button"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        )}
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
          Total Supplied, Supply APY, Total Borrowing, and Borrowing APY. Use it
          to evaluate assets for supply or borrowing.
        </p>
        {isMobile2 ? (
          <img
            src={theme === "dark" ? MarketPageSmall : MarketPageSmallLight}
            alt="Faucet Button"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        ) : (
          <img
            src={theme === "dark" ? marketPage : marketPageLight}
            alt="Faucet Button"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        )}
      </div>
    ),
    placement: "center",
  },
  {
    target: ".market-nav-details",
    content: (
      <div className="relative flex flex-col text-justify">
        <p className="mb-4">Click on the menu button</p>
        <p className="mb-4">
          In here we can see Total Market Size, Total Available, and Total
          Borrows.
        </p>
        {isMobile2 ? (
          <img
            src={
              theme === "dark"
                ? marketNavDetailsDarkSmall
                : marketNavDetailsLightSmall
            }
            alt="marketeNavbarDetails"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        ) : (
          <img
            src={
              theme === "dark"
                ? marketeNavbarDetails
                : marketeNavbarDetailsLight
            }
            alt="marketeNavbarDetails"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        )}
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
          Click on the 'Liquidation' button at the bottom of the page to
          navigate to the liquidation page.
        </p>
      </div>
    ),
    placement: "center",
  },
  {
    target: "#liquidation",
    content: (
      <div className="relative flex flex-col text-justify">
        <h1 className="text-[22px] font-bold mb-3">Liquidation</h1>
        <p className="mb-4">
          In the "Liquidation" section, click on the "Get Debt Status Button" to
          see the liquidation List (if available).
        </p>
        <img
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
          Here it will show the list of users with a health factor less than 1
        </p>
        <img
          src={theme === "dark" ? liquidationTable : liquidationTableLight}
          alt="Faucet Popup"
          className="mb-4 rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
        <p className="mb-4">
          Click the 'Liquidate' button in the 'Liquidation' list to view debt
          details and open the user information popup.
        </p>
        <img
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
          This will now open the 'User Information' popup, displaying the user's
          principal and health factor.
        </p>

        <img
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
          "Now, select the collateral asset to view the details and rewards
          given to the liquidator based on the selected asset, and then click on
          'Approve Liquidation' to proceed with the call."
        </p>
        <img
          src={
            theme === "dark"
              ? CollateralInformation
              : CollateralInformationLight
          }
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
          src={
            theme === "dark"
              ? CollateralInformationCall
              : CollateralInformationCallLight
          }
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
          A warning popup will appear—click 'YES, Call Liquidation' to proceed,
          then click 'Call Liquidation' to complete the process."
        </p>
        <img
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
        <p className="mb-4">Liquidation successful. You’re done!</p>
        <img
          src={
            theme === "dark"
              ? LiquidationSuccessfull
              : LiquidationSuccessfullLight
          }
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
          This is the end of your tour. You're all set to explore the site and
          start using all the features!
        </p>
        <div className="text-center mb-4">
          <span className="text-green-500 text-[40px]">&#10003;</span>{" "}
          {/* Checkmark symbol */}
        </div>
      </div>
    ),
    placement: "center",
  },
];

export const getStyles = (joyRideBackground, joyTextColor) => ({
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
});
