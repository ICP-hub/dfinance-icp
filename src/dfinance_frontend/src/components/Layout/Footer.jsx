import React from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { HOME_TOP_NAV_LINK, FOOTER_LINK_1, FOOTER_LINK_2 } from '../../utils/constants';
import Ellipse from '../Common/Ellipse';
import DFinanceDark from "../../../public/logo/DFinance-Dark.svg"
const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      // Scroll to top if on the home page
      window.scrollTo(0, 0);
    } else {
      // Navigate to '/dashboard' if not on the home page
      navigate('/dashboard');
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100); 
    }
  };

  return (
    <div className="w-full bg-[#233D63] font-poppins mt-24">
      <footer className="w-full xl3:w-[80%] xl4:w-[60%] xl3:mx-auto px-3 xl:px-24 py-[3rem] relative">
        {/* Background Overlay */}
        <div className="absolute top-[-30%] md:top-[-110%] left-0 xl:w-auto xl:h-auto -z-10">
          <Ellipse
            position={"bottom-left"}
            className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
          />
        </div>
        <div className="w-full flex flex-wrap p-4">
          <div className="w-full md:w-3/12 text-white mb-10 md:mb-0 lg:mb-0">
            <img 
              src={DFinanceDark}
              alt="DFinance" 
              onClick={handleLogoClick}
              style={{ cursor: 'pointer' }} 
            />
            <p className="mt-6 font-light text-[13px]">
              DFinance is a decentralized lending and borrowing protocol on ICP. The protocol uniquely combines liquidity mining with deflationary buy and burn mechanics.
            </p>
          </div>
          <div className="w-full sxs3:w-6/12 md:w-3/12 text-white mb-5 md:mb-0 md:px-8 xl:px-24 text-sm mt-[8px]">
            <h1 className="font-semibold">Useful Links</h1>
            <div className="w-full flex flex-col mt-5">
              {
                FOOTER_LINK_1 && FOOTER_LINK_1.map((link, index) => (
                  <NavLink key={index} to={link.route} className={`pb-2 font-light`}>{link.title}</NavLink>
                ))
              }
            </div>
          </div>
          <div className="w-full sxs3:w-6/12 md:w-3/12 text-white mb-5 md:mb-0 md:px-8 xl:px-24 text-sm mt-[8px]">
            <h1 className="font-semibold">Community</h1>
            <div className="w-full flex flex-col mt-5">
              {
                FOOTER_LINK_2 && FOOTER_LINK_2.map((link, index) => (
                  <NavLink key={index} to={link.route} className={`pb-2 font-light`}>{link.title}</NavLink>
                ))
              }
            </div>
          </div>
          <div className="w-full md:w-3/12 text-white mb-5 md:mb-0 md:px-8 xl:px-24 text-sm mt-2">
            <h1 className="font-semibold">Follow us on</h1>
            <div className="flex gap-2 mt-6">
              <span className="bg-[#8CC0D7] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                <img src="./social/discord.svg" alt="discord" className="w-full h-full object-contain" />
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
  );
};

export default Footer;
