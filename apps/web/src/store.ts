import { configureStore } from "@reduxjs/toolkit";
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { lmsApi } from "./api";
import authReducer from "./slices/authSlice";
import playerReducer from "./slices/playerSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    [lmsApi.reducerPath]: lmsApi.reducer,
    auth: authReducer,
    player: playerReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(lmsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
