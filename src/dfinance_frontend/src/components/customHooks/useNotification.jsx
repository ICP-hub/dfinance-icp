import { useRef, useCallback } from 'react';
import emailjs from "emailjs-com";

/**
 * Custom hook for handling notification emails based on cycle and token status
 * @returns {Function} checkAndNotify - Function to check status and send notifications
 */
const useNotificationSystem = () => {
  // Use refs to persist timestamps between renders
  const lastCycleExhaustedEmailTimestamp = useRef(0);
  const lastCycleWarningEmailTimestamp = useRef(0);
  const lastTokenExhaustedEmailTimestamp = useRef(0);
  const lastTokenWarningEmailTimestamp = useRef(0);

  /**
   * Sends email notifications when cycle or token thresholds are breached.
   * @param {string} subject - Email subject.
   * @param {string} htmlMessage - Email body.
   */
  const sendEmailNotification = async (subject, htmlMessage) => {
    try {
      const templateParams = {
        to_name: "Admin",
        subject,
        message: htmlMessage,
      };
      await emailjs.send(
        "service_7pu7uvh",
        "template_1k2eq7a",
        templateParams,
        "uWDc83b20aMxTTyrz"
      );
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  };

  /**
   * Main notification function to be called during transactions
   * @param {Object} statusData - Status data from backend
   * @param {Object} statusData.cycle - Cycle status flags
   * @param {boolean} statusData.cycle.isExhausted - Whether cycles are exhausted
   * @param {boolean} statusData.cycle.isWarning - Whether cycles are at warning level
   * @param {Object} statusData.token - Token status flags
   * @param {string} statusData.token.assetName - Name of the token
   * @param {boolean} statusData.token.isExhausted - Whether token is exhausted
   * @param {boolean} statusData.token.isWarning - Whether token is at warning level
   * @returns {Promise<void>}
   */
  const checkAndNotify = useCallback(async (statusData) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const currentTime = Date.now();

    // Check cycle status
    if (statusData.cycle) {
      // Handle cycle exhausted
      if (statusData.cycle.is_exhausted &&
        (currentTime - lastCycleExhaustedEmailTimestamp.current > oneDay)) {
        const htmlMessage = `
        Your cycles are exhausted! Please renew your cycles immediately to continue services.
        `;
        await sendEmailNotification("Cycle Exhausted", htmlMessage);
        lastCycleExhaustedEmailTimestamp.current = currentTime;
      }

      // Handle cycle warning
      else if (statusData.cycle.is_warning &&
        (currentTime - lastCycleWarningEmailTimestamp.current > oneDay)) {
        const htmlMessage = `
        Your cycles are close to the threshold value. Please renew your cycles to avoid interruption.
        `;
        await sendEmailNotification("Cycle Warning", htmlMessage);
        lastCycleWarningEmailTimestamp.current = currentTime;
      }
    }

    // Check token status
    if (statusData.token) {
      const assetName = statusData.token.assetName;

      // Handle token exhausted
      if (statusData.token.is_exhausted &&
        (currentTime - lastTokenExhaustedEmailTimestamp.current > oneDay)) {
        const htmlMessage = `
        Your balance of ${assetName} is exhausted! Please mint ${assetName} above threshold value.
        `;
        await sendEmailNotification(`${assetName} Exhausted`, htmlMessage);
        lastTokenExhaustedEmailTimestamp.current = currentTime;
      }

      // Handle token warning
      else if (statusData.token.is_warning &&
        (currentTime - lastTokenWarningEmailTimestamp.current > oneDay)) {
        const htmlMessage = `
        Your balance of ${assetName} is approaching the threshold. Please mint ${assetName} above threshold value.
        `;
        await sendEmailNotification(`${assetName} Warning`, htmlMessage);
        lastTokenWarningEmailTimestamp.current = currentTime;
      }
    }
  }, []);

  return checkAndNotify;
};

export default useNotificationSystem;