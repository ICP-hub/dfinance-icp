import React, { useState, useEffect, useRef } from "react";
import { Drawer, useMediaQuery } from "@mui/material";
import { NavLink } from "react-router-dom";
import { DASHBOARD_TOP_NAV_LINK, HOME_TOP_NAV_LINK } from "../../utils/constants";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/useAuthClient";
import { Switch } from "@mui/material";
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from "../../redux/reducers/themeReducer";
import CustomizedSwitches from "../../components/MaterialUISwitch";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toggleTestnetMode } from "../../redux/reducers/testnetReducer";

const MobileTopNav = ({ isMobileNav, setIsMobileNav, isHomeNav, handleCreateInternetIdentity, handleLogout }) => {
  const { isAuthenticated } = useAuth();
  const theme = useSelector((state) => state.theme.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('isDarkMode');
    return savedTheme ? JSON.parse(savedTheme) : theme === 'dark';
  });

  const isTestnetMode = useSelector((state) => state.testnetMode.isTestnetMode);
  const previousIsTestnetMode = useRef(isTestnetMode);

  const handleTestnetModeToggle = () => {
    navigate("/dashboard");
    dispatch(toggleTestnetMode());
  };

  useEffect(() => {
    if (previousIsTestnetMode.current !== isTestnetMode) {
      if (previousIsTestnetMode.current !== undefined) {
        toast.dismiss(); // Dismiss any existing toasts
      }
      toast.success(
        `Testnet mode ${isTestnetMode ? "enabled" : "disabled"} successfully!`
      );
      previousIsTestnetMode.current = isTestnetMode;
    }
  }, [isTestnetMode]);

  const handleDarkModeToggle = () => {
    dispatch(toggleTheme());
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('isDarkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      bodyElement.classList.add('dark');
      bodyElement.style.backgroundColor = '#070a18';
      setIsDarkMode(true);
    } else {
      htmlElement.classList.remove('dark');
      bodyElement.classList.remove('dark');
      bodyElement.style.backgroundColor = '';
      setIsDarkMode(false);
    }
  }, [theme]);

  // Check screen size and conditionally render Drawer for mobile view
  const isLargeScreen = useMediaQuery('(min-width: 1134px)');

  if (isLargeScreen) {
    return null; // Return null if it's a large screen
  }

  const handleClose = () => {
    setIsMobileNav(false);
  };

  return (
    <Drawer
      anchor={"right"}
      open={isMobileNav}
      onClose={handleClose}
      PaperProps={{
        style: {
          marginTop: "88px", // Adjust the margin as needed
          borderRadius: "12px",
          className: "drawer-right-to-left",
        },
      }}
    >
      <div className="flex flex-col pt-6 p-4 dark:bg-darkOverlayBackground font-poppins w-full h-full">
        <h2 className="text-sm font-semibold text-[#AEADCB] dark:text-darkTextPrimary mb-2">Menu</h2>

        {!isHomeNav ? (
          DASHBOARD_TOP_NAV_LINK.map((link, index) => {
            if (link.alwaysPresent) {
              return (
                <NavLink
                  key={index}
                  to={link.route}
                  className="text-[#2A1F9D] mt-5 p-3 font-bold dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2 my-1"
                  onClick={handleClose}
                >
                  {link.title}
                </NavLink>
              );
            } else if (isTestnetMode && link.testnet) {
              return (
                <React.Fragment key={index}>
                  <NavLink
                    to={link.route}
                    className="text-[#2A1F9D] mt-5 p-3 font-bold dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2 my-1"
                    onClick={handleClose}
                  >
                    {link.title}
                  </NavLink>
                  {link.title === "Faucet" && (
                    <>
                      {/* Additional content for Faucet */}
                    </>
                  )}
                </React.Fragment>
              );
            } else if (!isTestnetMode && !link.testnet) {
              return (
                <NavLink
                  key={index}
                  to={link.route}
                  className="text-[#2A1F9D] mt-5 p-3 font-bold dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2 my-1"
                  onClick={handleClose}
                >
                  {link.title}
                </NavLink>
              );
            }
            return null;
          })
        ) : (
          HOME_TOP_NAV_LINK.map((link, index) => (
            <NavLink
              key={index}
              to={link.route}
              className="text-[#2A1F9D] mt-5 p-3 font-bold dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2 my-1"
              onClick={handleClose}
            >
              {link.title}
            </NavLink>
          ))
        )}

        <h2 className="text-sm my-4 font-semibold text-[#AEADCB] dark:text-darkTextPrimary mb-2 mt-8">Settings</h2>
        <div className="p-2 dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 transition-colors duration-300 ease-in-out mx-2 my-1">
          <div className="flex items-center">
            <label htmlFor="darkMode" className="ml-2 text-lg text-[#2A1F9D] dark:text-darkTextSecondary">Dark Mode</label>
            <span className="ml-auto text-[#2A1F9D] dark:text-darkTextSecondary">{isDarkMode ? 'On' : 'Off'}</span>
            <div className="flex align-center justify-center ml-3">
              <CustomizedSwitches checked={isDarkMode} onChange={handleDarkModeToggle} />
            </div>
          </div>
        </div>

        <div className="p-2 dark:text-darkTextSecondary rounded-md shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 transition-colors duration-300 ease-in-out mx-2 my-1">
          <div className="flex items-center">
            <label htmlFor="testnetMode" className="ml-2 text-lg text-[#2A1F9D] dark:text-darkTextSecondary">Testnet Mode</label>
            <span className="ml-8 text-[#2A1F9D] dark:text-darkTextSecondary">{isTestnetMode ? 'On' : 'Off'}</span>
            <div className="flex align-center justify-center ml-3">
              <CustomizedSwitches checked={isTestnetMode} onChange={handleTestnetModeToggle} />
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default MobileTopNav;
