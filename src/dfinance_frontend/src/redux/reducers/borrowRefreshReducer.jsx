import { createSlice } from "@reduxjs/toolkit";

const borrowRefreshReducer = createSlice({
  name: "dashboard",
  initialState: {
    borrowTrigger: false, 
  },
  reducers: {
    toggleBorrowRefresh: (state) => {
      state.borrowTrigger = !state.borrowTrigger; 
    },
  },
});

export const { toggleBorrowRefresh } = borrowRefreshReducer.actions;
export default borrowRefreshReducer.reducer;
