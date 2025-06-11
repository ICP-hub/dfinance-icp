import { Outlet } from "react-router-dom";
import { useAuths } from "../utils/useAuthClient";
import Error from "../pages/Error";
import MainDashboard from "../pages/Dashboard/MainDashboard";
import { Suspense } from "react";
import MiniLoader from "./Common/miniLoader";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuths();

    if (isAuthenticated === false) {
        return <MainDashboard includeDashboardNav={false}>
            <Suspense fallback={<div className="h-[60vh]"><MiniLoader /></div>}>
                <Error />
            </Suspense>
        </MainDashboard>;
    }

    if (isAuthenticated === undefined) {
        return ;
    }

    return children || <Outlet />;
};

export default ProtectedRoute;
