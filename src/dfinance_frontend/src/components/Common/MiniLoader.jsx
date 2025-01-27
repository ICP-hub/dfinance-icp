import React, { useEffect } from "react";
import loader from "../../../public/Helpers/loader.svg"
import { useSelector } from "react-redux";

const MiniLoader = ({ isLoading }) => {
    const theme = useSelector((state) => state.theme.theme);
    useEffect(() => {
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
        </div>
    );
};

export default MiniLoader;
