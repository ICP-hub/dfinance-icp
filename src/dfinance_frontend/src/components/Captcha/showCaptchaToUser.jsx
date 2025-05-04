import React from "react";
import { createRoot } from "react-dom/client";
import CaptchaPrompt from "./captchaPrompt";

export const showCaptchaToUser = (captchaData) => {
  return new Promise((resolve, reject) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleSubmit = (userInput) => {
      if (!userInput.trim()) {
        reject("Captcha input is empty.");
        return;
      }
      
      resolve({
        userInput,
        unmount: () => {
          root.unmount();
          document.body.removeChild(container);
        }
      });
    };

    const handleUnmount = () => {
      root.unmount();
      document.body.removeChild(container);
    };

    root.render(<CaptchaPrompt captchaData={captchaData} onSubmit={handleSubmit} />);

    return handleUnmount;
  });
};