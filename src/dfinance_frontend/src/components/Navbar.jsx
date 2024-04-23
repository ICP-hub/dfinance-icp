import React from 'react'
import { DASHBOARD_TOP_NAV_LINK, HOME_TOP_NAV_LINK } from '../utils/constants';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import MobileTobNav from './Home/MobileTobNav';

export default function Navbar({ isHomeNav }) {
    const [isMobileNav, setIsMobileNav] = React.useState(false)
    return (
        <>
        <nav className="w-full py-10 flex items-center justify-between">
            <img src="/DFinance-Light.svg" alt="DFinance" className='w-[100px] md:w-[150px] lg:w-auto'/>

            <div className="gap-4 hidden md:flex">
                {
                    !isHomeNav ? DASHBOARD_TOP_NAV_LINK.map((link, index) =>
                        <NavLink key={index} to={link.route} className={`text-[#233D63] px-3`}>{link.title}</NavLink>
                    ) :
                        HOME_TOP_NAV_LINK.map((link, index) =>
                            <NavLink key={index} to={link.route} className={`text-[#233D63] px-3`}>{link.title}</NavLink>
                        )
                }
            </div>

            <button type="button" className="d_color border border-[#517688] p-2 text-sm rounded-full hidden md:flex">Create Internet Identity</button>

            {/* Mobile/Tablet Menu */}
            <button type="button" className="text-[#2A1F9D] cursor-pointer block md:hidden" onClick={() => { setIsMobileNav(true); console.log("Hello"); }}>
                <Menu />
            </button>
        </nav>

            <MobileTobNav isMobileNav={isMobileNav} setIsMobileNav={setIsMobileNav} isHomeNav={isHomeNav}/>
        </>
    )
}