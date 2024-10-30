import ReactGA from "react-ga4";

export const initGA = (trackingId) => {
  ReactGA.initialize(trackingId, { debug_mode: true });
};

export const setUserId = (userId) => {
  ReactGA.set({ user_id: userId });
};

export const setUserProperties = (properties) => {
  ReactGA.set(properties);
};

export const trackPageView = (path) => {
  ReactGA.send({ hitType: "pageview", page: path });
};

export const trackEvent = (action, category, label, value, customParams = {}) => {
  ReactGA.event({
    category: category,
    action: action,
    label: label,
    value: value,
    ...customParams
  });
};