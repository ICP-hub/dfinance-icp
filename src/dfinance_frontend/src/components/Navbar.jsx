import React from 'react'
import { FAQ_QUESTION, HOME_TOP_NAV_LINK, MAIN_NAV_LINK, SHOWCASE_SECTION } from '../utils/constants';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';
function Navbar() {
    return (
        <nav className="w-full py-10 flex items-center justify-between">
            <Logo className="w-28" />

            <div className="gap-4 hidden md:flex">
                {
                    HOME_TOP_NAV_LINK && HOME_TOP_NAV_LINK.map((link, index) =>
                        <NavLink key={index} to={link.route} className={`text-[#233D63] px-3`}>{link.title}</NavLink>
                    )
                }
            </div>

            <button type="button" className="d_color border border-[#517688] p-2 text-sm rounded-full hidden md:flex">Create Internet Identity</button>

            {/* Mobile/Tablet Menu */}
            

        </nav>
    )
}

export default Navbar
