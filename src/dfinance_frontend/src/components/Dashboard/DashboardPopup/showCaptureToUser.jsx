import React from "react";
import { createRoot } from "react-dom/client";
import CaptchaPrompt from "./CaptchPrompt";

export const showCaptchaToUser = (captchaData) => {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    // Function to handle the submission of the captcha
    const handleSubmit = (userInput) => {
      resolve({
        userInput,
        unmount: () => {
          root.unmount();
          document.body.removeChild(container);
        }
      });
    };

    root.render(<CaptchaPrompt captchaData={captchaData} onSubmit={handleSubmit} />);
  });
};
