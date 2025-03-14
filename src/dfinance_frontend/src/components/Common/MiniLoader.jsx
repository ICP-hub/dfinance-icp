import React, { useEffect ,useState } from "react";
import loader from "../../../public/Helpers/loader.svg"
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
const MiniLoader = ({ isLoading }) => {
    const theme = useSelector((state) => state.theme.theme);
    const location = useLocation(); 
    const [isLiquidateRoute, setIsLiquidateRoute] = useState(false);
    useEffect(() => {
        setIsLiquidateRoute(location.pathname === "/Liquidate");

        if (isLoading) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => document.body.classList.remove('no-scroll');
    }, [isLoading]);

    if (!isLoading) return null;

    return (
        <div className="bouncing-miniloader select-none mt-3 -mb-6">
            <div className="loader-element opacity-80"><img src={loader} className="w-4 h-4" alt="loader" /></div>
            <div className="loader-element opacity-80"><img src={loader} className="w-4 h-4" alt="loader" /></div>
            <div className="loader-element opacity-80"><img src={loader} className="w-4 h-4" alt="loader" /></div>
            <div className="loader-element opacity-80"><img src={loader} className="w-4 h-4" alt="loader" /></div>
            {isLiquidateRoute && (
                <div className="absolute mb-[-20px] bouncing-div">
                    <p className="font-poppins dark:text-white text-[12px] mr-1 text-gray-600">
                        Processing multiple users. This may take a moment. Thank you for your patience.
                    </p>
                </div>
            )}
        </div>
        
    );
};

export default MiniLoader;
