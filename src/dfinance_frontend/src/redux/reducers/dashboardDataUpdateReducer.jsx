import { createSlice } from "@reduxjs/toolkit";

const dashboardDataUpdateReducer = createSlice({
  name: "dashboard",
  initialState: {
    refreshDashboardTrigger: false, 
  },
  reducers: {
    toggleDashboardRefresh: (state) => {
      state.refreshDashboardTrigger = !state.refreshDashboardTrigger; 
    },
  },
});

export const { toggleDashboardRefresh } = dashboardDataUpdateReducer.actions;
export default dashboardDataUpdateReducer.reducer;
