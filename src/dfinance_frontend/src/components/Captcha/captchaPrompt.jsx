import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

const CaptchaPrompt = ({ captchaData, onSubmit, isVerified }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const modalRef = useRef();

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(input.trim()); 
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  useEffect(() => {
    setInput("");
    setLoading(false);
  }, [captchaData]);

  useEffect(() => {
    if (isVerified && loading) {
      setLoading(false);
    }
  }, [isVerified]);

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-40 bg-gray-900 opacity-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          ref={modalRef}
          className="bg-white dark:bg-[#252347] shadow-xl rounded-xl p-6 w-full max-w-sm lg:max-w-md"
        >
          <h3 className="text-lg font-medium text-[#2A1F9D] dark:text-darkText mb-4">
            Please verify you are human
          </h3>

          <div className="bg-gray-100 dark:bg-darkBackground/30 text-[#2A1F9D] dark:text-darkText p-3 rounded-md mb-4 text-center font-mono text-2xl tracking-widest">
            {captchaData.Ok?.base64_img && (
              <img
                src={captchaData.Ok.base64_img}
                alt="Captcha"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder="Enter captcha text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-gray-100 dark:bg-darkBackground/30 text-[#2A1F9D] dark:text-darkText px-3 py-2 border border-gray-800 rounded-md focus:outline-none mb-4"
            onKeyDown={handleKeyPress}
            disabled={loading || isVerified}
          />

          <button
            className={`w-full bg-gradient-to-tr from-[#ffaf5a] to-[#81198E] text-white rounded-md p-2 px-6 shadow-md font-semibold text-sm mt-4 transition duration-500 ${
              loading || isVerified ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleSubmit}
            disabled={loading || isVerified}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default CaptchaPrompt;
