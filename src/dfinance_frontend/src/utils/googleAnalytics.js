import ReactGA from "react-ga4";
import { toast } from "react-toastify";

export const initGA = (trackingId) => {
  ReactGA.initialize(trackingId, {
    debug_mode: true,
    gaOptions: {
      settings: {
        enhanced_measurement_settings: {
          scrolls: false, 
          page_views: false,
        },
      },
    }
  });
};

export const setUserId = (userId) => {
  try {
    if (userId && typeof userId === "string") {
      ReactGA.set({ userId });
    } else {
      throw new Error("Invalid user ID provided");
    }
  } catch (error) {
    toast.error(error.message);
  }
};

export const setUserProperties = (properties) => {
  ReactGA.set(properties);
};

export const trackEvent = (action, category, label) => {
  ReactGA.event({
    category: category,
    action: action,
    label: label,
  });
};

export const trackWalletSwitchEvent = (previousPrincipalId, newPrincipalId) => {
  ReactGA.event({
    category: "Wallet",
    action: "Switch",
    label: "Wallet Switch",
    nonInteraction: true,
    customParameters: {
      previous_principal_id: previousPrincipalId,
      new_principal_id: newPrincipalId,
    },
  });
};
