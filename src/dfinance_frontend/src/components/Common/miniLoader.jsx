import React, { useEffect, useState } from "react";
import loader from "../../../public/helper/loader.svg";

const MiniLoader = ({ isLoading }) => {
  const [isDebtUsersRoute, setIsDebtUsersRoute] = useState(false);

  useEffect(() => {
    // Handle body scroll lock
    if (isLoading) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    // This Check if we're on the debt-users-list route
    const currentPath = window.location.pathname;
    setIsDebtUsersRoute(currentPath === "/Liquidate/debt-users-list");

    return () => document.body.classList.remove("no-scroll");
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="bouncing-miniloader select-none mt-3 -mb-8">
      <div className="loader-element opacity-80">
        <img src={loader} className="w-4 h-4" alt="loader" />
      </div>
      <div className="loader-element opacity-80">
        <img src={loader} className="w-4 h-4" alt="loader" />
      </div>
      <div className="loader-element opacity-80">
        <img src={loader} className="w-4 h-4" alt="loader" />
      </div>
      <div className="loader-element opacity-80">
        <img src={loader} className="w-4 h-4" alt="loader" />
      </div>
      {isDebtUsersRoute && (
        <div className="absolute mt-6 w-full text-center">
          <p className="font-poppins dark:text-white text-[15px] text-gray-600">
            Fetching debt user list. It may take some time to load.
          </p>
        </div>
      )}
    </div>



  );
};

export default MiniLoader;