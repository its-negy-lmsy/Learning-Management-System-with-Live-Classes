import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface PlayerState {
  currentLessonId: string | null;
  playbackRate: number;
  volume: number;
  muted: boolean;
  selectedQuality: string;
  theaterMode: boolean;
  autoAdvance: boolean;
}

const initialState: PlayerState = {
  currentLessonId: null,
  playbackRate: 1,
  volume: 1,
  muted: false,
  selectedQuality: "auto",
  theaterMode: false,
  autoAdvance: true,
};

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setCurrentLesson(state, action: PayloadAction<string | null>) {
      state.currentLessonId = action.payload;
    },
    setPlaybackRate(state, action: PayloadAction<number>) {
      state.playbackRate = action.payload;
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = Math.max(0, Math.min(1, action.payload));
      state.muted = state.volume === 0;
    },
    toggleMute(state) {
      state.muted = !state.muted;
    },
    setSelectedQuality(state, action: PayloadAction<string>) {
      state.selectedQuality = action.payload;
    },
    toggleTheaterMode(state) {
      state.theaterMode = !state.theaterMode;
    },
    toggleAutoAdvance(state) {
      state.autoAdvance = !state.autoAdvance;
    },
  },
});

export const {
  setCurrentLesson,
  setPlaybackRate,
  setVolume,
  toggleMute,
  setSelectedQuality,
  toggleTheaterMode,
  toggleAutoAdvance,
} = playerSlice.actions;

export default playerSlice.reducer;
