import React from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import {
  HOME_TOP_NAV_LINK,
  FOOTER_LINK_1,
  FOOTER_LINK_2,
} from "../../utils/constants";
import Ellipse from "../Common/Ellipse";
import DFinanceDark from "../../../public/logo/DFinance-Dark.svg";
const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (location.pathname === "/") {
      window.scrollTo(0, 0);
    } else {
      navigate("/dashboard");
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }
  };

  return (
    <div className="w-full bg-[#233D63] font-poppins mt-20">
      <footer className="w-full xl3:w-[80%] xl4:w-[60%] xl3:mx-auto px-3 xl:px-24 py-[3rem] relative">
        {}
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
              className="w-[100px] md:w-[150px] lg:w-auto sxs3:w-[130px] md:mb-1 sxs3:mb-0 cursor-pointer"
              style={{
                imageRendering: "-webkit-optimize-contrast",
                imageRendering: "crisp-edges",
              }}
            />
            <p className="mt-6 text-sm">
              DFinance is a decentralized lending and borrowing protocol on ICP.
            </p>
            <p className="mt-6 text-[12px]">
              Copyright <span className="font-bold">©</span>{" "}
              {new Date().getFullYear()}{" "}
              <span className="font-semibold">DFinance.</span>
            </p>
          </div>
          <div className="w-full sxs3:w-6/12 md:w-3/12 text-white mb-5 md:mb-0 md:px-8 xl:px-24 text-sm mt-[8px]">
            <h1 className="font-semibold">Useful Links</h1>
            <div className="w-full flex flex-col mt-5">
              {FOOTER_LINK_1 &&
                FOOTER_LINK_1.map((link, index) => (
                  <NavLink
                    id={
                      link.title === "Liquidation"
                        ? "footer-liquidation"
                        : undefined
                    }
                    key={index}
                    to={link.route}
                    className={`pb-2 `}
                  >
                    {link.title}
                  </NavLink>
                ))}
            </div>
          </div>
          <div className="w-full sxs3:w-6/12 md:w-3/12 text-white mb-5 md:mb-0 md:px-8 xl:px-24 text-sm mt-[8px]">
            <h1 className="font-semibold">Community</h1>
            <div className="w-full flex flex-col mt-5">
              {FOOTER_LINK_2 &&
                FOOTER_LINK_2.map((link, index) => (
                  <NavLink
                    key={index}
                    target={link.target}
                    to={link.route}
                    className={`pb-2 `}
                  >
                    {link.title}
                  </NavLink>
                ))}
            </div>
          </div>
          <div className="w-full md:w-3/12 text-white mb-5 md:mb-0 md:px-8 xl:px-24 text-sm mt-2">
            <h1 className="font-semibold">Follow us on</h1>
            <div className="flex gap-2 mt-6">
              {}
              <a
                target="_blank"
                href="https://www.linkedin.com/company/dfinanceprotocol/posts/?feedView=all"
              >
                <span className="bg-[#77b0c8] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                  <img
                    src="./social/linkedin.png"
                    alt="Linkedin"
                    className="w-full h-full object-contain"
                  />
                </span>
              </a>
              {}
              <a target="_blank" href="https://x.com/dfinance_app">
                <span className="bg-[#77b0c8] p-2 w-8 h-8 flex items-center justify-center rounded-md">
                  <img
                    src="./social/X.png"
                    alt="X"
                    className="w-full h-full object-contain"
                  />
                </span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
