import ReactGA from "react-ga4";
import { toast } from "react-toastify";

export const initGA = (trackingId) => {
  ReactGA.initialize(trackingId, { debug_mode: false });
};

// Set the user ID
export const setUserId = (userId) => {
  try {
    // Ensure userId is a valid string before setting it
    if (userId && typeof userId === "string") {
      ReactGA.set({ userId });
      toast.success(`User ID set to: ${userId}`); // Show success toast
    } else {
      throw new Error("Invalid user ID provided");
    }
  } catch (error) {
    console.error(error);
    toast.error(error.message); // Show error toast
  }
};

export const setUserProperties = (properties) => {
  ReactGA.set(properties);
};

export const trackPageView = (path) => {
  ReactGA.send({ hitType: "pageview", page: path });
};

export const trackEvent = (action, category, label) => {
  ReactGA.event({
    category: category,
    action: action,
    label: label,
  });
};
