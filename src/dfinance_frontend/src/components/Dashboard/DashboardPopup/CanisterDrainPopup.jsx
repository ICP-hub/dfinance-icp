import { useNavigate } from "react-router-dom";

const FreezeCanisterPopup = ({ onClose }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white shadow-xl rounded-xl  w-[325px] lg1:w-[420px] p-6 text-[#2A1F9D] dark:bg-[#252347] dark:text-darkText font-poppins max-w-sm text-center">
        <h2 className="text-xl font-bold text-red-600">
          Canister Out of Cycles
        </h2>
        <p className="text-[#2A1F9D] dark:text-darkText mt-2">
          The canister is out of cycles. <strong>Your funds are safe.</strong>{" "}
          Controllers have been notified of the scenario.
        </p>

        <button
          className="mt-4 px-6 py-2  bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] text-white rounded-lg hover:bg-blue-600 transition"
          onClick={handleClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default FreezeCanisterPopup;
