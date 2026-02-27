import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import storiesReducer from "./storiesSlice";
import wordsReducer from "./wordsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    stories: storiesReducer,
    words: wordsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
