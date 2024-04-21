import Home from "../pages/Home/Home";
import Login from "../pages/login/Login";
import Market from "../pages/market/Market";
const routes = [
  {
    path: "/",
    component: <Home></Home>,
  },
  {
    path: '/login',
    component: <Login></Login>
  },
  {
    path: '/market',
    component: <Market></Market>
  }
]
export default routes;