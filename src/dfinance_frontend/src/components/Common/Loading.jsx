import React, { useEffect } from "react";
import loader from "../../../public/Helpers/loader.svg"
import { useSelector } from "react-redux";

const Loading = ({ isLoading }) => {
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
        <div className="bouncing-loader select-none">
            <div className="loader-element"><img src={loader} alt="loader" /></div>
            <div className="loader-element"><img src={loader} alt="loader" /></div>
            <div className="loader-element"><img src={loader} alt="loader" /></div>
            <div className="loader-element"><img src={loader} alt="loader" /></div>
            <div className="absolute mb-[-20px] bouncing-div">
                <p className="font-poppins dark:text-white text-[12px] mr-1 text-gray-600">Loading</p>
                <div className="loader-element bg-gray-600 dark:bg-white"></div>
                <div className="loader-element bg-gray-600 dark:bg-white"></div>
                <div className="loader-element bg-gray-600 dark:bg-white"></div>
            </div>
        </div>
    );
};

export default Loading;
