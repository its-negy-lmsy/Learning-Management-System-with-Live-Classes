import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export interface UiState {
  mobileNavOpen: boolean;
  activeToast: ToastMessage | null;
  activeLiveRoom: {
    sessionId: string;
    title: string;
    url: string;
    token: string;
    provider?: "livekit" | "local-webrtc";
  } | null;
}

const initialState: UiState = {
  mobileNavOpen: false,
  activeToast: null,
  activeLiveRoom: null,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleMobileNav(state) {
      state.mobileNavOpen = !state.mobileNavOpen;
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    showToast(state, action: PayloadAction<Omit<ToastMessage, "id">>) {
      state.activeToast = {
        id: String(Date.now()),
        type: action.payload.type,
        message: action.payload.message,
      };
    },
    clearToast(state) {
      state.activeToast = null;
    },
    openLiveRoom(
      state,
      action: PayloadAction<{
        sessionId: string;
        title: string;
        url: string;
        token: string;
        provider?: "livekit" | "local-webrtc";
      }>
    ) {
      state.activeLiveRoom = action.payload;
    },
    closeLiveRoom(state) {
      state.activeLiveRoom = null;
    },
  },
});

export const {
  toggleMobileNav,
  setMobileNavOpen,
  showToast,
  clearToast,
  openLiveRoom,
  closeLiveRoom,
} = uiSlice.actions;

export default uiSlice.reducer;
