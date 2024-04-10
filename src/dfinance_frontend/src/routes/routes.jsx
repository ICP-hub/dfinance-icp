import Home from "../pages/Home/Home";
import Login from "../pages/login/Login";

const routes = [
  {
    path: "/",
    component: <Home></Home>,
  },
  {
    path: '/login',
    component: <Login></Login>
  }
]
export default routes;