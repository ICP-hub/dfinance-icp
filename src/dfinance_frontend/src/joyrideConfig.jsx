import lightImages from "./components/Common/lightImages";
import darkImages from "./components/Common/darkImages";
import debtStatusImage from "../public/Helpers/debtStatusImage.png";
import debtStatusImageLight from "../public/Helpers/debtStatusImageLight.png";

export const getSteps = (theme, isMobile2, isMobile) => [
  {
    target: "body",
    content: (
      <div className="text-justify">
        <h1 className="text-[22px] font-bold mb-2">Dfinance</h1>
        <h2 className="text-[12px]">
          Welcome to the <strong>Dfinance App!</strong>
        </h2>
        <p className="mb-4 text-[12px]">
          This guide will walk you through the key features.
        </p>
        {isMobile2 ? (
          <img
            src={
              theme === "dark"
                ? darkImages.dfinanceHomeDarkSmall
                : lightImages.DfinanceHomeLightSmall
            }
            alt="dFinanceHomePage"
            className="rounded-lg shadow-2xl ring-1 ring-black/15 dark:ring-white/30"
          />
        ) : (
          <img
            src={
              theme === "dark"
                ? darkImages.dfinanceHomepage
                : lightImages.dfinanceHomepageLight
            }
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
        <h1 className="text-[22px] font-bold mb-2">Faucet</h1>
        <p className="mb-4 text-[12px]">
          This is the Faucet page. Here, you can view a list of assets available
          to faucet. Simply choose an asset from the list to proceed.
        </p>
        {isMobile2 ? (
          <img
            src={
              theme === "dark"
                ? darkImages.faucetSmall
                : lightImages.FaucetSmallLight
            }
            alt="Faucet Button"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        ) : (
          <img
            src={
              theme === "dark"
                ? darkImages.faucetPage
                : lightImages.faucetPageLight
            }
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
      <div className="text-justify relative flex flex-col text-[12px]">
        <p className="mb-4">
          On this page, you can click the faucet button for the desired asset.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.faucetButton
              : lightImages.faucetButtonLight
          }
          alt="Faucet Button"
          className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
        <p className="mb-4">
          This will open a popup where you can enter the amount of the asset you
          wish to faucet.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.faucetPopup
              : lightImages.faucetPopupLight
          }
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
        <h1 className="text-[22px] font-bold mb-2">Dashboard</h1>
        <p className="mb-4 text-[12px]">
          Welcome to the dashboard! Here, you can manage your assets seamlessly.
          Use this page to <span className="font-semibold">supply</span> assets,{" "}
          <span className="font-semibold">borrow</span> against collateral,{" "}
          <span className="font-semibold">withdraw</span> your supplied assets,
          or <span className="font-semibold">repay</span> your borrowed amounts.
        </p>
        {isMobile2 ? (
          <img
            src={
              theme === "dark"
                ? darkImages.dashboardPageSmall
                : lightImages.DashboardPageSmallLight
            }
            alt="dashboardPage"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        ) : (
          <img
            src={
              theme === "dark"
                ? darkImages.dashboardPage
                : lightImages.DashboardPageLight
            }
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
      <div className="relative flex flex-col text-justify text-[12px]">
        <p className="mb-4">
          In the "Assets to Supply" section, select the asset you wish to
          supply.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.assetsToSupply
              : lightImages.assetsToSupplyLight
          }
          alt="dashboardAssetsToSupplyButton"
          className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
        <p className="mb-2">
          After clicking the supply button, a popup will appear. Enter the
          amount and approve the transaction.
        </p>
        <p className="mb-4">And click "Supply" to complete the process.</p>
        <img
          src={
            theme === "dark" ? darkImages.supplyDark : lightImages.supplyLight
          }
          className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
      </div>
    ),
    placement: isMobile ? "center" : "right",
  },
  {
    target: isMobile ? "body" : "#dashboard-assets-to-borrow",
    content: (
      <div className="relative flex flex-col text-justify text-[12px]">
        <p className="mb-4">
          In the "Assets to Borrow" section, select the asset you wish to
          borrow.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.assetsToBorrow
              : lightImages.assetsToBorrowLight
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
            theme === "dark" ? darkImages.borrowDark : lightImages.borrowLight
          }
          alt="assetsToBorrowPopup"
          className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
      </div>
    ),
    placement: isMobile ? "center" : "left",
  },
  {
    target: isMobile ? "body" : "#your-borrow",
    content: (
      <div className="relative flex flex-col text-justify text-[12px]">
        <p className="mb-4">
          In the "Your Borrow" section, select the asset you wish to repay or
          additionaly you can borrow from here also.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.yourBorrow
              : lightImages.yourBorrowLight
          }
          alt="yourBorrowRepayButton"
          className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
        <p className="mb-2">
          After clicking the repay button, a popup will appear. Enter the amount
          , approve the transaction.
        </p>
        <p className="mb-4">And click "Repay" to complete the process.</p>
        <img
          src={theme === "dark" ? darkImages.repayDark : lightImages.repayLight}
          alt="yourBorrowRepayPopup"
          className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
      </div>
    ),
    placement: isMobile ? "center" : "left",
  },
  {
    target: isMobile ? "body" : "#your-supplies",
    content: (
      <div className="relative flex flex-col text-justify text-[12px]">
        <p className="mb-4">
          In the "Your Supplies" section, select the asset you wish to withdraw
          or additionaly you can supply from here also.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.youSupplies
              : lightImages.youSuppliesLight
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
              ? darkImages.withdrawDark
              : lightImages.withdrawLight
          }
          alt="yourSuppliesWithdrawPopup"
          className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
      </div>
    ),
    placement: isMobile ? "center" : "right",
  },
  {
    target: isMobile ? "body" : "#your-supplies",
    content: (
      <div className="relative flex flex-col text-justify text-[12px]">
        <p className="mb-4">
          In this section, You can toggle the collateral status of an asset by
          clicking the toggle button.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.collateralDark
              : lightImages.collateralLight
          }
          alt="yourSuppliesWithdrawButton"
          className="rounded-lg mb-4 shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
        <p className="mb-4">
          To disable collateral, click the toggle to open the popup and select
          "Disable as Collateral." To enable it, click the toggle and choose
          "Enable as Collateral."
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.collateralPopupDark
              : lightImages.collateralPopupLight
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
          <div className="relative flex flex-col text-justify text-[12px]">
            <p className="mb-4">Here Click on the menu button</p>
            <p className="mb-4">
              Here we can see Net Worth, Net APY, and Health Factor (when
              available).
            </p>
            <img
              src={
                theme === "dark"
                  ? darkImages.dashboardNavDetailsDarkSmall
                  : lightImages.DashboarNavDetailsLightSmall
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
              src={
                theme === "dark"
                  ? darkImages.riskDetails
                  : lightImages.riskDetailsLight
              }
              alt="Faucet Button"
              className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
            />
          </div>
        ) : (
          <div className="relative flex flex-col text-justify text-[12px]">
            <p className="mb-4">
              In here we can see Net Worth, Net APY, and Health Factor (when
              available).
            </p>
            <img
              src={
                theme === "dark"
                  ? darkImages.dashboardNavDark
                  : lightImages.dashboardNavLight
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
              src={
                theme === "dark"
                  ? darkImages.riskDetailsDark
                  : lightImages.riskDetailsLight
              }
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
    target: ".market-nav-details",
    content: (
      <div className="relative flex flex-col text-justify text-[12px]">
        <p className="mb-4">Click on the menu button</p>
        <p className="mb-4">
          In here we can see Total Market Size, Total Available, and Total
          Borrows.
        </p>
        {isMobile2 ? (
          <img
            src={
              theme === "dark"
                ? darkImages.marketNavDetailsDarkSmall
                : lightImages.marketNavDetailsLightSmall
            }
            alt="marketeNavbarDetails"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        ) : (
          <img
            src={
              theme === "dark"
                ? darkImages.dashboardNavMarketDark
                : lightImages.dashboardNavMarketLight
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
    target: "body",
    content: (
      <div className="relative flex flex-col text-justify">
        <h1 className="text-[22px] font-bold mb-2">Market</h1>
        <p className="mb-4 text-[12px]">
          The Market page shows all assets on the platform with details like
          Total Supplied, Supply APY, Total Borrowing, and Borrowing APY. Use it
          to evaluate assets for supply or borrowing.
        </p>
        {isMobile2 ? (
          <img
            src={
              theme === "dark"
                ? darkImages.marketPageSmall
                : lightImages.MarketPageSmallLight
            }
            alt="Faucet Button"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        ) : (
          <img
            src={
              theme === "dark"
                ? darkImages.marketPage
                : lightImages.marketPageLight
            }
            alt="Faucet Button"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        )}
      </div>
    ),
    placement: "center",
  },

  {
    target: "#footer-liquidation",
    content: (
      <div className="relative flex flex-col text-justify">
        <h1 className="text-[22px] font-bold mb-2">Liquidation</h1>
        <p className="mb-4 text-[12px]">
          Click on the 'Liquidation' button at the footer of the page to
          navigate to the liquidation page.
        </p>
        {isMobile2 ? (
          <img
            src={darkImages.footerSmallScreen}
            alt="footerSmallScreen"
            className="rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
          />
        ) : (
          <img
            src={darkImages.footerDesktop}
            alt="footerDesktop"
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
      <div className="relative flex flex-col text-justify">
        <h1 className="text-[22px] font-bold mb-2">Liquidation</h1>
        <p className="mb-4 text-[12px]">
          In the "Liquidation" section, click on the "Get Debt Status" button to
          see the liquidation List (if available).
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.liquidationGetDebtStatusDark
              : lightImages.liquidationGetDebtStatusLight
          }
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
        <h1 className="text-[22px] font-bold mb-2">Liquidation</h1>
        <p className="mb-4 text-[12px]">
          Here it will show the list of users with a health factor less than 1.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.liquidationTable
              : lightImages.liquidationTableLight
          }
          alt="Faucet Popup"
          className="mb-4 rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/30"
        />
        <p className="mb-4 text-[12px]">
          Click the 'Liquidate' button in the 'Liquidation' list to view debt
          details and open the user information popup.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.liquidateButton
              : lightImages.LiquidatebuttonLight
          }
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
        <h1 className="text-[22px] font-bold mb-2">Liquidation</h1>
        <p className="mb-4 text-[12px]">
          This will now open the 'User Information' popup, displaying the user's
          principal and health factor.
        </p>

        <img
          src={
            theme === "dark"
              ? darkImages.userInfoDark
              : lightImages.userInfoLight
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
        <h1 className="text-[22px] font-bold mb-2">Liquidation</h1>
        <p className="mb-4 text-[12px]">
          Select the debt asset to view repayments, then choose the collateral
          asset to see details and rewards. Click 'Approve' to proceed.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.approveLiquidationDark
              : lightImages.approveLiquidationLight
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
        <h1 className="text-[22px] font-bold mb-2">Liquidation</h1>
        <p className="mb-4 text-[12px]">
          Click on 'Call Liquidation' to proceed with the call.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.callLiquidationDark
              : lightImages.callLiquidationLight
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
        <h1 className="text-[22px] font-bold mb-2">Liquidation</h1>
        <p className="mb-4 text-[12px]">
          A warning popup will appear—click 'YES, Call Liquidation' to proceed,
          then click 'Call Liquidation' to complete the process.
        </p>
        <img
          src={
            theme === "dark"
              ? darkImages.warningPopupDark
              : lightImages.warningPopupLight
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
        <h1 className="text-[22px] font-bold mb-2">Liquidation</h1>
        <p className="mb-4 text-[12px]">Liquidation successful. You’re done!</p>
        <img
          src={
            theme === "dark"
              ? darkImages.liquidationSuccessful
              : lightImages.LiquidationSuccessfullLight
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
        <h1 className="text-[22px] font-bold mb-2">End of Tour</h1>
        <p className="mb-4 text-[12px]">
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
    display: "none",
  },
});
