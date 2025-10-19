import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: { locked: false },
  reducers: {
    setLocked: (state, action) => {
      state.locked = action.payload;
    },
  },
});

export const { setLocked } = uiSlice.actions;
export default uiSlice.reducer;
