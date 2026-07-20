import { configureStore } from "@reduxjs/toolkit";
import adminReducer from "./slices/authSlice";

const store = configureStore({
  reducer: {
    admin: adminReducer,
  },
});

export default store;
