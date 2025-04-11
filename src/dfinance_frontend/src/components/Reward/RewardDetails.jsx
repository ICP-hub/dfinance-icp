import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VestingSection from "./VestingSection";

const RewardDetails = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-1 py-4">
      <ToastContainer position="top-center" autoClose={3000} />
      <VestingSection />
    </div>
  );
};
export default RewardDetails;
