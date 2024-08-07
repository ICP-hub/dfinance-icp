import CreateWallet from "../components/Dashboard/CreateWallet"
import Market from "../pages/Market/Market"
import MainDashboard from "../pages/Dashboard/MainDashboard"
import Home from "../pages/Home/Home"

import Error from "../pages/Error"
import AssetDetails from "../components/Dashboard/AssetDetails"
import DFinanceGov from "../pages/Governance/DFinanceGov"
import ProposalDetails from "../components/Governance/ProposalDetails"
import MySupply from "../components/Dashboard/MySupply"
import { elements } from "chart.js"
import TransactionHistoryBox from "../components/Dashboard/TransactionHistory"
import StakeDetails from "../pages/Stake/Stake"
import Faucet from "../pages/Faucet/faucet"

import TransactionDetail from "../components/Dashboard/Transaction"
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
];
