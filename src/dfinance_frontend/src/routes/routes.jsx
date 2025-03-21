import CreateWallet from "../components/Dashboard/CreateWallet"
import Market from "../pages/Market/Market"
import MainDashboard from "../pages/Dashboard/MainDashboard"
import Home from "../pages/Home/Home"
import Error from "../pages/Error"
import AssetDetails from "../components/Dashboard/AssetDetails"
import TransactionHistoryBox from "../components/Dashboard/TransactionHistory"
import StakeDetails from "../pages/Stake/Stake"
import Faucet from "../pages/Faucet/faucet"
import TransactionDetail from "../components/Dashboard/Transaction"
import Liquidate from "../components/Liquidate/Liquidate"
import DebtStatus from "../components/Liquidate/DebtStatus"
import DashboardCards from "../pages/info/info"
import HealthFactorList from "../components/Dashboard/HealthFactorLIst"
import { Outlet } from "react-router-dom";
export default [
  {
    path: "/",
    element: <Home />,
  },
  
  {
    path: "*",
      element: (
      <MainDashboard includeDashboardNav={false}>
        <Error></Error> 
      </MainDashboard>
    ),
  },
  {
    path: "/2a45fg",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Outlet /> {/* ✅ Required for child routes to work */}
      </MainDashboard>
    ),
    children: [
      {
        index: true, // ✅ Loads DashboardCards when visiting /2a45fg
        element: <DashboardCards />,
      },
      {
        path: "health-factor-list", // ✅ This makes it /2a45fg/health-factor-list
        element: <HealthFactorList />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <MainDashboard>
        <CreateWallet />
      </MainDashboard>
    ),
  },
  {
    path: "/market/asset-details/:id?",
    element: (
      <MainDashboard>
        <AssetDetails />
      </MainDashboard>
    ),
  },
  {
    path: "/dashboard/asset-details/:id?",
    element: (
      <MainDashboard>
        <AssetDetails />
      </MainDashboard>
    ),
  },
  {
    path: "/dashboard/transaction-history",
    element: (
      <MainDashboard >
        <TransactionHistoryBox />
      </MainDashboard>
    ),
  },
  {
    path: "/dashboard/transaction/:id",
    element: (
      <MainDashboard >
        <TransactionDetail />
      </MainDashboard>
    ),
  },
  {
    path: "/market",
    element: (
      <MainDashboard>
        <Market/>
      </MainDashboard>
    ),
  },
 
  {
    path: "/stake",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <StakeDetails />
      </MainDashboard>
    ),
  },
  {
    path: "/Faucet",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Faucet/>
      </MainDashboard>
    ),
  },
  {
    path: "/Liquidate",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Liquidate/>
      </MainDashboard>
    ),
  },
];
