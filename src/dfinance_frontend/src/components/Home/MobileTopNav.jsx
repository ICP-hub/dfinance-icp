import React, { useState } from "react"
import { Drawer } from "@mui/material"
import { NavLink } from "react-router-dom"
import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
} from "../../utils/constants"
import { X } from "lucide-react"
import { useAuth } from "../../utils/useAuthClient"
import { Switch } from "@mui/material"
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from "../../redux/reducers/themeReducer"

const MobileTobNav = ({ isMobileNav, setIsMobileNav, isHomeNav, handleCreateInternetIdentity, handleLogout }) => {
  const { isAuthenticated } = useAuth()
  
  
  const theme = useSelector((state) => state.theme.theme);
  const dispatch = useDispatch();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('isDarkMode');
    return savedTheme ? JSON.parse(savedTheme) : theme === 'dark';
  });

  const handleDarkModeToggle = () => {
    dispatch(toggleTheme());
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem('isDarkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  React.useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      bodyElement.classList.add('dark');
      bodyElement.style.backgroundColor = '#070a18';
      setIsDarkMode(true)
    } else {
      htmlElement.classList.remove('dark');
      bodyElement.classList.remove('dark');
      bodyElement.style.backgroundColor = '';
      setIsDarkMode(false)
    }
  }, [theme]);


  return (
    
      <Drawer
        anchor={"right"}
        open={isMobileNav}
        onClose={() => setIsMobileNav(false)}
        PaperProps={{
          style: {
            marginTop: "88px", // Adjust the margin as needed
            borderRadius: "12px", 
            className: "drawer-right-to-left",
          
          },
        }}
      >

      <div className="flex flex-col pt-6 p-4 dark:bg-darkOverlayBackground font-poppins w-full h-full">
        <h2 className="text-lg font-semibold text-[#AEADCB] dark:text-darkTextPrimary mb-2">Menu</h2>

        {!isHomeNav
          ? DASHBOARD_TOP_NAV_LINK.map((link, index) => (
            <NavLink
              key={index}
              to={link.route}
              className="text-[#2A1F9D] mt-5 p-3 font-bold dark:text-darkTextSecondary rounded-md border shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2 my-1"
                         >
              {link.title}
            </NavLink>
          ))
          : HOME_TOP_NAV_LINK.map((link, index) => (
            <NavLink
              key={index}
              to={link.route}
              className="text-[#2A1F9D] mt-5 p-3 font-bold dark:text-darkTextSecondary rounded-md border shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2 my-1"
            >
              {link.title}
            </NavLink>
          ))}
        <h2 className="text-lg my-4 font-semibold text-[#AEADCB] dark:text-darkTextPrimary mb-2"> Setting</h2>
        <div className="p-3  dark:text-darkTextSecondary rounded-md border shadow-sm border-gray-300 dark:border-none bg-[#F6F6F6] dark:bg-darkBackground/40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2 my-1">
          <div className="flex items-center">
            <label htmlFor="darkMode" className="ml-2 text-lg text-[#2A1F9D] dark:text-darkTextSecondary">Dark Mode</label>
            <span className="ml-8">{isDarkMode ? 'ON' : 'OFF'}</span>
            <Switch
              checked={isDarkMode}
              onChange={handleDarkModeToggle}
              className="ml-8"
              id="darkMode"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#fff",
                },
                "& .MuiSwitch-track": {
                  backgroundColor: '#fff',
                  boxShadow: '0 0 10px black',
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#1939ea",
                },  
              }}
              style={{ minWidth: '40px' }}
            />
          </div>
        </div>
      </div>
      
    </Drawer>
  )
}

export default MobileTobNav
