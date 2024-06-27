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
const MobileTobNav = ({ isMobileNav, setIsMobileNav, isHomeNav, handleCreateInternetIdentity, handleLogout }) => {
  const { isAuthenticated } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleDarkModeToggle = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };
  return (
    
      <Drawer
        anchor={"right"}
        open={isMobileNav}
        onClose={() => setIsMobileNav(false)}
        PaperProps={{
          style: {
            marginTop: "88px", // Adjust the margin as needed
            className: "drawer-right-to-left", 
          },
        }}
      >

      <div className="flex flex-col pt-6 p-4 dark:bg-darkBackground">
        <h2 className="text-lg font-semibold text-[#2A1F9D] dark:text-darkTextPrimary mb-2"> Menu</h2>

        {!isHomeNav
          ? DASHBOARD_TOP_NAV_LINK.map((link, index) => (
            <NavLink
              key={index}
              to={link.route}
              className={`text-[#2A1F9D] p-3 dark:text-darkTextSecondary`}
            >
              {link.title}
            </NavLink>
          ))
          : HOME_TOP_NAV_LINK.map((link, index) => (
            <NavLink
              key={index}
              to={link.route}
              className="text-[#2A1F9D] mt-5 p-3 dark:text-darkTextSecondary rounded-md border border-gray-300 bg-[#F6F6F6] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out mx-2 my-1"
            >
              {link.title}
            </NavLink>
          ))}
        <h2 className="text-lg my-4 font-semibold text-[#2A1F9D] dark:text-darkTextPrimary mb-2"> Setting</h2>
        <div className="p-3 border  border-gray-300 bg-[#F6F6F6] dark:bg-gray-800 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <label htmlFor="darkMode" className="ml-2 text-lg font-bold text-[#2A1F9D]">Dark Mode</label>
            <span className="ml-8">{isDarkMode ? 'ON' : 'OFF'}</span>
            <Switch
              checked={isDarkMode}
              onChange={handleDarkModeToggle}
              className="ml-8"
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
            />
          </div>
        </div>
      </div>
      <span
        className="absolute top-4 right-2 text-red-400 cursor-pointer"
        onClick={() => setIsMobileNav(false)}
      >
        <X />
      </span>
    </Drawer>
  )
}

export default MobileTobNav
