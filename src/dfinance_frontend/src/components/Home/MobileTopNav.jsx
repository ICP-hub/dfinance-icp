import React from "react"
import { Drawer } from "@mui/material"
import { NavLink } from "react-router-dom"
import {
  DASHBOARD_TOP_NAV_LINK,
  HOME_TOP_NAV_LINK,
} from "../../utils/constants"
import { X } from "lucide-react"
import { useAuth } from "../../utils/useAuthClient"

const MobileTobNav = ({ isMobileNav, setIsMobileNav, isHomeNav, handleCreateInternetIdentity, handleLogout }) => {
  const { isAuthenticated } = useAuth()
  return (
    <Drawer
      anchor={"top"}
      open={isMobileNav}
      onClose={() => setIsMobileNav(false)}
    >
      <div className="flex flex-col mt-6 p-4">
        {!isHomeNav
          ? DASHBOARD_TOP_NAV_LINK.map((link, index) => (
              <NavLink
                key={index}
                to={link.route}
                className={`text-[#233D63] p-3`}
              >
                {link.title}
              </NavLink>
            ))
          : HOME_TOP_NAV_LINK.map((link, index) => (
              <NavLink
                key={index}
                to={link.route}
                className={`text-[#233D63] p-3`}
              >
                {link.title}
              </NavLink>
            ))}

        {!isAuthenticated ? <button
          type="button"
          className="d_color border border-[#517688] p-2 mt-4 text-sm rounded-full"
          onClick={handleCreateInternetIdentity}
        >
          Create Internet Identity
        </button> : 
        <div className="w-full">
          <div
            className="bg-red-400 text-white shadow-md rounded-lg p-4 cursor-pointer hover:bg-red-500"
            onClick={handleLogout}
          >
            <p>Logout</p>
          </div>
        </div>}
      </div>
      <span
        className="absolute top-2 right-2 text-red-400 cursor-pointer"
        onClick={() => setIsMobileNav(false)}
      >
        <X />
      </span>
    </Drawer>
  )
}

export default MobileTobNav
