import CreateWallet from "../components/Dashboard/CreateWallet"
import WalletDetails from "../components/Dashboard/WalletDetails"
import MainDashboard from "../pages/Dashboard/MainDashboard"
import Home from "../pages/Home/Home"
import Login from "../pages/login/Login"
import {useSelector} from 'react-redux';
import { store } from "../redux/store"
import AssetDetails from "../components/Dashboard/AssetDetails"
import DFinanceGov from "../components/Dashboard/DFinanceGov"


const { utility } = store.getState()

export default [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login></Login>,
  },
  {
    path: "/dashboard",
    children: [
      {
        path: "main",
        element: (
          <MainDashboard>
            <CreateWallet />
          </MainDashboard>
        ),
      },
      {
        path: "wallet-details",
        element: (
          <MainDashboard>
            <WalletDetails />
          </MainDashboard>
        ),
      },
      {
        path: "asset-details",
        element: (
          <MainDashboard>
            <AssetDetails />
          </MainDashboard>
        ),
      },
      {
        path: "dfinance-gov",
        element: (
          <MainDashboard isDGov={true}>
            <DFinanceGov />
          </MainDashboard>
        ),
      }
    ],
  },
]
