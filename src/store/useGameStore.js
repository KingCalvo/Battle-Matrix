"use client";
import { create } from "zustand";

const useGameStore = create((set) => ({
  player1: null,
  player2: null,
  musicOn: true,

  setPlayer1: (player) => set({ player1: player }),
  setPlayer2: (player) => set({ player2: player }),

  clearPlayers: () =>
    set({
      player1: null,
      player2: null,
    }),

  toggleMusic: () =>
    set((state) => ({
      musicOn: !state.musicOn,
    })),
}));

export default useGameStore;
