import CreateWallet from "../components/Dashboard/CreateWallet"
import WalletDetails from "../components/Dashboard/WalletDetails"
import MainDashboard from "../pages/Dashboard/MainDashboard"
import Home from "../pages/Home/Home"
import Login from "../pages/login/Login"
import AssetDetails from "../components/Dashboard/AssetDetails"
import DFinanceGov from "../components/Dashboard/DFinanceGov"
import ProposalDetails from "../components/Dashboard/ProposalDetails"
import MySupply from "../components/Dashboard/MySupply"

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
        path: "my-supply",
        element: (
          <MainDashboard>
            <MySupply />
          </MainDashboard>
        ),
      },
      {
        path: "dfinance-gov",
        element: (
          <MainDashboard isDGov={true}>
            <DFinanceGov />
          </MainDashboard>
        )
      }, {
        path: "dfinance-gov/proposal-details",
        element: (
          <MainDashboard isDGov={true}>
            <ProposalDetails />
          </MainDashboard>
        )
      }
    ],
  },
]
