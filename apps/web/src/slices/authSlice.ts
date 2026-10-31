import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Role } from "@fs03/shared";

export interface AuthUserState {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthState {
  user: AuthUserState | null;
  isAuthenticated: boolean;
  checkedInitialSession: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  checkedInitialSession: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUserState | null>) {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.checkedInitialSession = true;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.checkedInitialSession = true;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
