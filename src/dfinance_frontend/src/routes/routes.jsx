import { lazy, Suspense } from "react";
import CreateWallet from "../components/Dashboard/CreateWallet";
import Market from "../pages/Market/Market";
import MainDashboard from "../pages/Dashboard/MainDashboard";
import Home from "../pages/Home/Home";
import Faucet from "../pages/Faucet/faucet";
import { Outlet } from "react-router-dom";
import MiniLoader from "../components/Common/MiniLoader";
import Reward from "../pages/Reward/Reward";

const Error = lazy(() => import("../pages/Error"));
const AssetDetails = lazy(() => import("../components/Dashboard/AssetDetails"));
const TransactionHistoryBox = lazy(() =>
  import("../components/Dashboard/TransactionHistory")
);
const TransactionDetail = lazy(() =>
  import("../components/Dashboard/Transaction")
);
const Liquidate = lazy(() => import("../components/Liquidate/Liquidate"));
const DashboardCards = lazy(() => import("../pages/info/info"));
const HealthFactorList = lazy(() =>
  import("../components/Dashboard/HealthFactorLIst")
);
const DebtStatus = lazy(() => import("../components/Liquidate/DebtStatus"));

const ADMIN_ROUTE = process.env.DFX_ADMIN;
const HEALTH_FACTOR_ROUTE = process.env.DFX_HEALTH_FACTOR_ROUTE;

export default [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "*",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Suspense
          fallback={
            <div className="h-[60vh]">
              <MiniLoader />
            </div>
          }
        >
          <Error />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: ADMIN_ROUTE,
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Outlet />
      </MainDashboard>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense
            fallback={
              <div className="h-[60vh]">
                <MiniLoader />
              </div>
            }
          >
            <DashboardCards />
          </Suspense>
        ),
      },
      {
        path: HEALTH_FACTOR_ROUTE.replace(/^\//, ""),
        element: (
          <Suspense
            fallback={
              <div className="h-[60vh]">
                <MiniLoader />
              </div>
            }
          >
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
        <Suspense
          fallback={
            <div className="h-[60vh]">
              <MiniLoader />
            </div>
          }
        >
          <AssetDetails />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: "/dashboard/asset-details/:id?",
    element: (
      <MainDashboard>
        <Suspense
          fallback={
            <div className="h-[60vh]">
              <MiniLoader />
            </div>
          }
        >
          <AssetDetails />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: "/dashboard/transaction-history",
    element: (
      <MainDashboard>
        <Suspense
          fallback={
            <div className="h-[60vh]">
              <MiniLoader />
            </div>
          }
        >
          <TransactionHistoryBox />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: "/dashboard/transaction/:id",
    element: (
      <MainDashboard>
        <Suspense
          fallback={
            <div className="h-[60vh]">
              <MiniLoader />
            </div>
          }
        >
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
    path: "/Faucet",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Faucet />
      </MainDashboard>
    ),
  },
  {
    path: "/Reward",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Reward />
      </MainDashboard>
    ),
  },
  {
    path: "/Liquidate",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Suspense
          fallback={
            <div className="h-[60vh]">
              <MiniLoader />
            </div>
          }
        >
          <Liquidate />
        </Suspense>
      </MainDashboard>
    ),
    children: [
      {
        path: "debt-users-list",
        element: (
          <Suspense
            fallback={
              <div className="h-[60vh]">
                <MiniLoader />
              </div>
            }
          >
            <DebtStatus />
          </Suspense>
        ),
      },
    ],
  },
];
