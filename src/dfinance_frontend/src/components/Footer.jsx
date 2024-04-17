import React from 'react'
import { HOME_TOP_NAV_LINK } from '../utils/constants'
import { NavLink } from 'react-router-dom'

const Footer = () => {
  return (
      <footer className="bg-[#233D63] mt-24 z-0 px-3 xl:px-24 py-20">
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
  )
}

export default Footer