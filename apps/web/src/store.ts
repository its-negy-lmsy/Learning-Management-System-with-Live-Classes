import { configureStore } from "@reduxjs/toolkit";
import { lmsApi } from "./api";
export const store = configureStore({ reducer: { [lmsApi.reducerPath]: lmsApi.reducer }, middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(lmsApi.middleware) });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
