import CreateWallet from "../components/Dashboard/CreateWallet"
import WalletDetails from "../components/Dashboard/WalletDetails"
import MainDashboard from "../pages/Dashboard/MainDashboard"
import Home from "../pages/Home/Home"
import Login from "../pages/login/Login"
import Error from "../pages/Error/Error"
import AssetDetails from "../components/Dashboard/AssetDetails"
import DFinanceGov from "../components/Dashboard/DFinanceGov"
import ProposalDetails from "../components/Dashboard/ProposalDetails"
import MySupply from "../components/Dashboard/MySupply"
import { elements } from "chart.js"
import TransactionHistoryBox from "../components/Dashboard/TransactionHistory"

export default [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
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
    path: "/dashboard",
    element: (
      <MainDashboard>
        <CreateWallet />
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
    path: "/market",
    element: (
      <MainDashboard>
        <WalletDetails />
      </MainDashboard>
    ),
  },
  {
    path: "/governance",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <DFinanceGov  />
      </MainDashboard>
    ),
  },
  {
    path: "/governance/proposal-details",
    element: (
      <MainDashboard>
        <ProposalDetails />
      </MainDashboard>
    ),
  },
];
