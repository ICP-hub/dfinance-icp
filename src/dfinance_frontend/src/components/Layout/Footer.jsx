import React, { useState, useEffect } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { FOOTER_LINK_1, FOOTER_LINK_2 } from "../../utils/constants";
import Ellipse from "../Common/Ellipse";
import { useAuth } from "../../utils/useAuthClient";
import { Principal } from "@dfinity/principal";
import { useSelector } from "react-redux";
import { Plus, Minus, RefreshCw } from "lucide-react";
import DFinance from "../../../public/home/favicon.png";

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const savedZoom = localStorage.getItem("zoomLevel");
    if (savedZoom) {
      setZoomLevel(parseInt(savedZoom));
      document.documentElement.style.fontSize = `${savedZoom}%`;
    }
  }, []);

  const updateZoom = (newZoom) => {
    document.documentElement.style.fontSize = `${newZoom}%`;
    setZoomLevel(newZoom);
    localStorage.setItem("zoomLevel", newZoom);
  };

  const handleZoomIn = () => {
    if (zoomLevel < 150) updateZoom(zoomLevel + 10);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 80) updateZoom(zoomLevel - 10);
  };

  const handleReset = () => {
    updateZoom(100);
  };

  const { backendActor } = useAuth();

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
  const ledgerActors = useSelector((state) => state.ledger);
  const [loading, setLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isTester, setIsTester] = useState(false);

  useEffect(() => {
    const checkTesterStatus = async () => {
      try {
        const result = await backendActor.check_is_tester();
        setIsTester(result);
      } catch (error) {
        console.error("Error checking tester status:", error);
      }
    };

    checkTesterStatus();
  }, [backendActor]);

  const handleApprove = async () => {
    const ledgerActor = ledgerActors.ckUSDC;
    try {
      setLoading(true);
      const approval = await ledgerActor.icrc2_approve({
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: 34000000000, // Adjust amount if needed
        expected_allowance: [],
        expires_at: [],
        spender: {
          owner: Principal.fromText(process.env.CANISTER_ID_DFINANCE_BACKEND),
          subaccount: [],
        },
      });

      if (approval?.Ok && approval.Ok > 0n) {
        setIsApproved(true);

      } else {
        setIsApproved(false);

      }
    } catch (error) {
      console.error(`Approval failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUserReserve = async () => {
    if (!isApproved) {

      return;
    }

    try {
      setLoading(true);
      const response = await backendActor.create_user_reserve_with_low_health(
        "ckUSDC",
        "ckUSDC",
        34000000000,
        29000000000
      );
    } catch (error) {
      console.error(`Error creating reserve: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full bg-[#233D63] font-poppins mt-20">
      <footer className="w-full xl3:w-[80%] xl4:w-[60%] xl3:mx-auto px-3 xl:px-24 py-[3rem] pb-[6rem] relative">
        { }
        <div className="absolute top-[-30%] md:top-[-110%] left-0 xl:w-auto xl:h-auto -z-10">
          <Ellipse
            position={"bottom-left"}
            className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
          />
        </div>
        <div className="w-full flex flex-wrap p-4">
          <div className="w-full md:w-3/12 text-white mb-10 md:mb-0 lg:mb-0">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={handleLogoClick}
            >
              <img
                src={DFinance}
                alt="DFinance"
                className="w-[40px] md:w-[40px] lg:w-[40px] sxs3:w-[40px] cursor-pointer"
              />
              <h1 className="font-semibold text-[1.4rem] md:text-[2rem]">
                DFinance
              </h1>
            </div>
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
            {isTester && (
              <div>
                <button
                  onClick={handleApprove}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 transition rounded text-white"
                  disabled={loading || isApproved}
                >
                  {isApproved
                    ? "Approved"
                    : loading
                      ? "Approving..."
                      : "Approve"}
                </button>

                <button
                  onClick={handleCreateUserReserve}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition rounded text-white"
                  disabled={loading || !isApproved}
                >
                  {loading ? "Processing..." : "Create Reserve"}
                </button>
              </div>
            )}
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
              { }
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
              { }
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

        {/* Accessibility Zoom Controls */}
        <div className="absolute bottom-12 dxl:left-[6.8rem] left-6 flex items-center gap-2 bg-[#233D63]/50 p-2 rounded-lg text-white border border-gray-100/10">
          <button
            onClick={handleZoomOut}
            className="bg-[#2E5077] p-1 rounded-md hover:bg-gray-600"
          >
            <Minus size={13} />
          </button>
          <span className="text-[12px] font-semibold">{zoomLevel}%</span>
          <button
            onClick={handleZoomIn}
            className="bg-[#2E5077] p-1 rounded-md hover:bg-gray-600"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={handleReset}
            className="bg-[#2E5077] p-1 rounded-md hover:bg-gray-600"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
