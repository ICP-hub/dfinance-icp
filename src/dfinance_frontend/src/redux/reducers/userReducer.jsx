import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  loading: false,
  error: null,
  user: null,
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserData: (state, action) => {
      return{
        ...state,
        user: action.payload
      }
    },
  },
})

export const { setUserData } = userSlice.actions
export default userSlice.reducer
