import React from "react"
import { Drawer } from "@mui/material"
import { NavLink } from "react-router-dom"
import { DASHBOARD_TOP_NAV_LINK, HOME_TOP_NAV_LINK } from "../../utils/constants"
import { X } from "lucide-react"

const MobileTobNav = ({ isMobileNav, setIsMobileNav, isHomeNav }) => {
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

        <button
          type="button"
          className="d_color border border-[#517688] p-2 mt-4 text-sm rounded-full"
        >
          Create Internet Identity
        </button>
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
