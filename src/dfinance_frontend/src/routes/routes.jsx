import { lazy, Suspense } from "react";
import CreateWallet from "../pages/Dashboard/Dashboard";
import Market from "../pages/Market/Market";
import MainDashboard from "../pages/Dashboard/MainDashboard";
import Home from "../pages/Home/Home";
import Faucet from "../pages/Faucet/Faucet";
import { Outlet } from "react-router-dom";
import MiniLoader from "../components/Common/miniLoader";

const Error = lazy(() => import("../pages/Error"));
const AssetDetails = lazy(() => import("../components/Dashboard/AssetDetails"));
const Liquidate = lazy(() => import("../components/Liquidate/Liquidate"));
const DashboardCards = lazy(() => import("../pages/info/Info"));
const HealthFactorList = lazy(() =>
  import("../components/Dashboard/HealthFactorList")
);
const LiquidationList = lazy(() => import("../components/Liquidate/LiquidationList"));

const ADMIN_ROUTE = process.env.DFX_ADMIN;
const HEALTH_FACTOR_ROUTE = process.env.DFX_HEALTH_FACTOR_ROUTE;
const isProduction = process.env.DFX_PRODUCTION === 'true';
console.log("isProduction", isProduction)
const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "*",
    element: (
      <MainDashboard includeDashboardNav={false}>
        <Suspense fallback={<div className="h-[60vh]"><MiniLoader /></div>}>
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
          <Suspense fallback={<div className="h-[60vh]"><MiniLoader /></div>}>
            <DashboardCards />
          </Suspense>
        ),
      },
      {
        path: HEALTH_FACTOR_ROUTE.replace(/^\//, ""),
        element: (
          <Suspense fallback={<div className="h-[60vh]"><MiniLoader /></div>}>
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
        <Suspense fallback={<div className="h-[60vh]"><MiniLoader /></div>}>
          <AssetDetails />
        </Suspense>
      </MainDashboard>
    ),
  },
  {
    path: "/dashboard/asset-details/:id?",
    element: (
      <MainDashboard>
        <Suspense fallback={<div className="h-[60vh]"><MiniLoader /></div>}>
          <AssetDetails />
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
  // --- Faucet route only when not production ---
  !isProduction && {
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
        <Suspense fallback={<div className="h-[60vh]"><MiniLoader /></div>}>
          <Liquidate />
        </Suspense>
      </MainDashboard>
    ),
    children: [
      {
        path: "debt-users-list",
        element: (
          <Suspense fallback={<div className="h-[60vh]"><MiniLoader /></div>}>
            <LiquidationList />
          </Suspense>
        ),
      },
    ],
  },
];

export default routes.filter(Boolean);