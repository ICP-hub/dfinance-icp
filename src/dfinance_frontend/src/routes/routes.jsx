import CreateWallet from "../components/Dashboard/CreateWallet"
import WalletDetails from "../components/Dashboard/WalletDetails"
import MainDashboard from "../pages/Dashboard/MainDashboard"
import Home from "../pages/Home/Home"
import Login from "../pages/login/Login"
import {useSelector} from 'react-redux';
import { store } from "../redux/store"


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
      }
    ],
  },
]
