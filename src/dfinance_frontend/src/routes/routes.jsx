import { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import MainDashboard from "../pages/Dashboard/MainDashboard";
import Home from "../pages/Home/Home";
import MiniLoader from "../components/Common/MiniLoader";
import CreateWallet from "../components/Dashboard/CreateWallet";
import Market from "../pages/Market/Market";
import Faucet from "../pages/Faucet/faucet";

// Lazy loaded components
const Error = lazy(() => import("../pages/Error"));
const DashboardCards = lazy(() => import("../pages/info/info"));
const HealthFactorList = lazy(() => import("../components/Dashboard/HealthFactorLIst"));
const TransactionHistoryBox = lazy(() => import("../components/Dashboard/TransactionHistory"));
const TransactionDetail = lazy(() => import("../components/Dashboard/Transaction"));
const Liquidate = lazy(() => import("../components/Liquidate/Liquidate"));
const StakeDetails = lazy(() => import("../pages/Stake/Stake"));
const AssetDetails = lazy(() => import("../components/Dashboard/AssetDetails"));

export default [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "*",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Suspense fallback={<MiniLoader />}>
          <Error />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: "/2a45fg",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Suspense fallback={<MiniLoader />}>
          <Outlet />
        </Suspense>
      </MainDashboard>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<MiniLoader />}>
            <DashboardCards />
          </Suspense>
        ),
      },
      {
        path: "health-factor-list",
        element: (
          <Suspense fallback={<MiniLoader />}>
            <HealthFactorList />
          </Suspense>
        ),
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
        <Suspense fallback={<MiniLoader />}>
          <AssetDetails />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: "/dashboard/asset-details/:id?",
    element: (
      <MainDashboard>
        <Suspense fallback={<MiniLoader />}>
          <AssetDetails />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: "/dashboard/transaction-history",
    element: (
      <MainDashboard>
        <Suspense fallback={<MiniLoader />}>
          <TransactionHistoryBox />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: "/dashboard/transaction/:id",
    element: (
      <MainDashboard>
        <Suspense fallback={<MiniLoader />}>
          <TransactionDetail />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: "/market",
    element: (
      <MainDashboard>
        <Market />
      </MainDashboard>
    ),
  },
  {
    path: "/stake",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Suspense fallback={<MiniLoader />}>
          <StakeDetails />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: "/Faucet",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Faucet />
      </MainDashboard>
    ),
  },
  {
    path: "/Liquidate",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Suspense fallback={<MiniLoader />}>
          <Liquidate />
        </Suspense>
      </MainDashboard>
    ),
  },
];
