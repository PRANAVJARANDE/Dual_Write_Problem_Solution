import { createSlice } from '@reduxjs/toolkit';

const socketSlice = createSlice({
  name: 'socket',
  initialState: {
    isOrder1Connected: false,
    isOrder2Connected: false,
    isConsumerConnected: false,
  },
  reducers: {
    setOrder1Connected(state, action) {
      state.isOrder1Connected = action.payload;
    },
    setOrder2Connected(state, action) {
      state.isOrder2Connected = action.payload;
    },
    setConsumerConnected(state, action) {
      state.isConsumerConnected = action.payload;
    },
  },
});

export const { setOrder1Connected,setOrder2Connected,setConsumerConnected}=socketSlice.actions;

export default socketSlice.reducer;