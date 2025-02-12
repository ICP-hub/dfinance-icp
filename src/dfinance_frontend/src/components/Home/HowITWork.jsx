import React, { useEffect } from "react";
import { GoArrowRight } from "react-icons/go";
import Aos from "aos";
import "aos/dist/aos.css";
import ICPRequest from "../../../public/howitworks/ICP-request.png";
import supply from "../../../public/Helpers/supply.png";
import borrow from "../../../public/Helpers/borrow.png";
import Max from "../../../public/Helpers/max.png";
import Ltv from "../../../public/Helpers/Ltv.png";
import Points from "../../../public/Helpers/points.png";
import Calculator from "../../../public/howitworks/calculator.png";
import Button from "../../components/Common/Button";
import SubmitICPRequest from "../../../public/howitworks/Submit-ICPRequest.png";
const HowITWork = () => {
  useEffect(() => {
    Aos.init();
  }, []);
  return (
    <section className="mt-20 font-poppins" id="HowItWorks">
      <div className="w-full text-center text-[#2A1F9D] dark:text-darkText">
        <h1 className="text-[32px] md:text-[45px] font-extralight">
          How it Works
        </h1>
      </div>

      {}
      <div className="mt-[21px] lg:mt-[53px]">
        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-20 max-w-full">
          {}
          <div
            data-aos="fade-right"
            data-aos-duration="2000"
            className="w-full hidden lg:block mx-auto max-w-[309px] rounded-3xl border p-[24px] border-[#233D6324] bg-gradient-to-b from-[#FFDEFC] to-[#F7DAD0] dark:bg-[linear-gradient(to_bottom_right,#29283B,#29283B)]"
          >
            <div className="flex items-center justify-center gap-4 mt-[35px]">
              <p className="text-[#233D63] text-[56px] font-[700] font-poppins dark:text-darkText">
                1
              </p>
              <img
                className="w-[120px] h-[120px] object-contain"
                src={supply}
                draggable="false"
              />
            </div>
            <div className="text-[16px] text-center mt-[16px]">
              <p className="text-[#517687] font-[500] font-poppins dark:text-darkText text-center leading-relaxed max-w-[300px] mx-auto">
                Supply assets to earn yield and to use as collateral
              </p>
            </div>
          </div>
          {}
          <div
            data-aos="fade-left"
            data-aos-duration="2000"
            className="w-full mx-auto md:block lg:hidden max-w-[309px] rounded-3xl border p-[24px] border-[#233D6324] bg-gradient-to-b from-[#FFDEFC] to-[#F7DAD0] dark:bg-[linear-gradient(to_bottom_right,#29283B,#29283B)]"
          >
            <div className="flex items-center justify-center gap-2 mt-[35px]">
              <p className="text-[#233D63] text-[56px] font-[700] font-poppins dark:text-darkText">
                1
              </p>
              <img
                className="w-[120px] h-[120px] object-contain"
                src={supply}
                draggable="false"
              />
            </div>
            <div className="text-[16px] text-center mt-[16px]">
              <p className="text-[#517687] font-[500] font-poppins dark:text-darkText text-center leading-relaxed max-w-[300px] mx-auto">
                Supply assets to earn yield and to use as collateral
              </p>
            </div>
          </div>
          {}
          <div
            data-aos="fade-right"
            data-aos-duration="2000"
            className="w-full mx-auto max-w-[309px] rounded-3xl border p-[24px] border-[#233D6324] bg-gradient-to-b from-[#FFDEFC] to-[#F7DAD0] dark:bg-[linear-gradient(to_bottom_right,#29283B,#29283B)]"
          >
            <div className="flex items-center justify-center gap-2 mt-[35px]">
              <p className="text-[#233D63] text-[56px] font-[700] font-poppins dark:text-darkText">
                2
              </p>
              <img
                className="w-[120px] h-[120px] object-contain"
                src={borrow}
                draggable="false"
              />
            </div>
            <div className="text-[16px] text-center mt-[16px]">
              <p className="text-[#517687] font-[500] font-poppins dark:text-darkText text-center leading-relaxed max-w-[300px] mx-auto">
                Borrow assets against your deposited collateral
              </p>
            </div>
          </div>

          {}
          <div
            data-aos="fade-right"
            data-aos-duration="2000"
            className="w-full hidden lg:block mx-auto max-w-[309px] rounded-3xl border p-[24px] border-[#233D6324] bg-gradient-to-b from-[#FFDEFC] to-[#F7DAD0] dark:bg-[linear-gradient(to_bottom_right,#29283B,#29283B)]"
          >
            <div className="flex items-center justify-center gap-2 mt-[35px]">
              <p className="text-[#233D63] text-[56px] font-[700] font-poppins dark:text-darkText">
                3
              </p>
              <img
                className="w-[120px] h-[120px] object-contain"
                src={Max}
                draggable="false"
              />
            </div>
            <div className="text-[16px] text-center mt-[16px]">
              <p className="text-[#517687] font-[500] font-poppins dark:text-darkText text-center leading-relaxed max-w-[300px] mx-auto">
                Borrow up to Maximum loan-to-value (LTV) ratio, which is
                calculated using your specific Collateral x Debt combination
              </p>
            </div>
          </div>
          {}
          <div
            data-aos="fade-left"
            data-aos-duration="2000"
            className="w-full mx-auto md:block lg:hidden max-w-[309px] rounded-3xl border p-[24px] border-[#233D6324] bg-gradient-to-b from-[#FFDEFC] to-[#F7DAD0] dark:bg-[linear-gradient(to_bottom_right,#29283B,#29283B)]"
          >
            <div className="flex items-center justify-center gap-2 mt-[35px]">
              <p className="text-[#233D63] text-[56px] font-[700] font-poppins dark:text-darkText">
                3
              </p>
              <img
                className="w-[120px] h-[120px] object-contain"
                src={Max}
                draggable="false"
              />
            </div>
            <div className="text-[16px] text-center mt-[16px]">
              <p className="text-[#517687] font-[500] font-poppins dark:text-darkText text-center leading-relaxed max-w-[300px] mx-auto">
                Borrow up to Maximum loan-to-value (LTV) ratio, which is
                calculated using your specific Collateral x Debt combination
              </p>
            </div>
          </div>

          {}
          <div
            data-aos="fade-right"
            data-aos-duration="2000"
            className="w-full mx-auto max-w-[309px] rounded-3xl border p-[24px] border-[#233D6324] bg-gradient-to-b from-[#FFDEFC] to-[#F7DAD0] dark:bg-[linear-gradient(to_bottom_right,#29283B,#29283B)] lg:col-span-2 lg:row-start-2 lg:transform lg:translate-x-12 lg:translate-y-5"
          >
            <div className="flex items-center justify-center gap-2 mt-[35px]">
              <p className="text-[#233D63] text-[56px] font-[700] font-poppins dark:text-darkText">
                4
              </p>
              <img
                className="w-[120px] h-[120px] object-contain"
                src={Ltv}
                draggable="false"
              />
            </div>
            <div className="text-[16px] text-center mt-[16px]">
              <p className="text-[#517687] font-[500] font-poppins dark:text-darkText text-center leading-relaxed max-w-[300px] mx-auto">
                If you reach Liquidation LTV (&gt;Max LTV), you can lose your
                collateral via liquidation - while retaining your borrowed
                assets
              </p>
            </div>
          </div>

          {}
          <div
            data-aos="fade-left"
            data-aos-duration="2000"
            className="w-full mx-auto max-w-[309px] lg:-ml-44 rounded-3xl border p-[24px] border-[#233D6324] bg-gradient-to-b from-[#FFDEFC] to-[#F7DAD0] dark:bg-[linear-gradient(to_bottom_right,#29283B,#29283B)] lg:col-span-1 lg:row-start-2 lg:transform lg:translate-x-20 lg:translate-y-10"
          >
            <div className="flex items-center justify-center gap-2 mt-[35px]">
              <p className="text-[#233D63] text-[56px] font-[700] font-poppins dark:text-darkText">
                5
              </p>
              <img
                className="w-[120px] h-[120px] object-contain"
                src={Points}
                draggable="false"
              />
            </div>
            <div className="text-[16px] text-center mt-[16px]">
              <p className="text-[#517687] font-[500] font-poppins dark:text-darkText text-center leading-relaxed max-w-[300px] mx-auto">
                Earn points on the actions you take
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowITWork;
