import React from 'react'
import { HOME_TOP_NAV_LINK } from '../utils/constants'
import { NavLink } from 'react-router-dom'
import Ellipse from './Ellipse'

const Footer = () => {
    return (
        <div className="w-full bg-[#233D63]">
            <footer className="w-full xl3:w-[80%] xl4:w-[50%] xl3:mx-auto mt-24 px-3 xl:px-24 py-20 relative">
                {/* Background Overlay */}
                <div className="absolute top-[-30%] md:top-[-110%] left-0 xl:w-auto xl:h-auto -z-10">
                    <Ellipse
                        position={"bottom-left"}
                        className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
                    />
                </div>
                <div className="w-full flex flex-wrap ">
                    <div className="w-full md:w-3/12 text-white mb-5 md:mb-0">
                        <img src="/DFinance-Dark.svg" alt="DFinance" />
                        <p className="mt-6">Block Sec focuses on the security of the
                            whole life cycle of smart contracts,
                            specializing in rigorous testing</p>
                    </div>
                    <div className="w-full md:w-3/12 text-white mb-5 md:mb-0 md:px-8 xl:px-24">
                        <h1 className="font-semibold">Useful Links</h1>
                        <div className="w-full flex flex-col mt-5">
                            {
                                HOME_TOP_NAV_LINK && HOME_TOP_NAV_LINK.map((link, index) =>
                                    <NavLink key={index} to={link.route} className={`pb-2`}>{link.title}</NavLink>
                                )
                            }
                        </div>
                    </div>
                    <div className="w-full md:w-3/12 text-white mb-5 md:mb-0 md:px-8 xl:px-24">
                        <h1 className="font-semibold">Community</h1>
                        <div className="w-full flex flex-col mt-5">
                            {
                                HOME_TOP_NAV_LINK && HOME_TOP_NAV_LINK.map((link, index) =>
                                    <NavLink key={index} to={link.route} className={`pb-2`}>{link.title}</NavLink>
                                )
                            }
                        </div>
                    </div>
                    <div className="w-full md:w-3/12 text-white mb-5 md:mb-0 md:px-8 xl:px-24">
                        <h1 className="font-semibold">Follow us on</h1>
                        <div className="flex gap-2 mt-6">
                            <span className="bg-[#8CC0D7] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                                <img src="./social/facebook.svg" alt="facebook" className="w-full h-full object-contain" />
                            </span>
                            <span className="bg-[#8CC0D7] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                                <img src="./social/in.svg" alt="Linkedin" className="w-full h-full object-contain" />
                            </span>
                            <span className="bg-[#8CC0D7] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                                <img src="./social/instagram.svg" alt="instagram" className="w-full h-full object-contain" />
                            </span>
                            <span className="bg-[#8CC0D7] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                                <img src="./social/twitter.svg" alt="twitter" className="w-full h-full object-contain" />
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Footer