"use client";
import { create } from "zustand";

const emptyBoard = Array(9).fill(null);

const wins = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const useGameStore = create((set, get) => ({
  player1: null,
  player2: null,
  gameMode: null,
  aiDifficulty: "normal",
  winsToVictory: 3,

  board: emptyBoard,
  turn: 1,
  locked: false,
  round: 1,
  score1: 0,
  score2: 0,
  winner: null,
  matchWinner: null,

  setPlayer1: (player) => set({ player1: player }),
  setPlayer2: (player) => set({ player2: player }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setAiDifficulty: (level) => set({ aiDifficulty: level }),

  setWinsToVictory: (num) => set({ winsToVictory: num }),

  resetMatch: () =>
    set({
      board: emptyBoard,
      turn: 1,
      locked: false,
      round: 1,
      score1: 0,
      score2: 0,
      winner: null,
      matchWinner: null,
    }),

  playMove: (index) => {
    const state = get();

    if (state.locked || state.board[index] || state.matchWinner) return;

    const newBoard = [...state.board];
    newBoard[index] = state.turn;

    let winner = null;

    for (const line of wins) {
      const [a, b, c] = line;

      if (
        newBoard[a] &&
        newBoard[a] === newBoard[b] &&
        newBoard[a] === newBoard[c]
      ) {
        winner = newBoard[a];
      }
    }

    const full = newBoard.every(Boolean);

    if (winner) {
      const score1 = winner === 1 ? state.score1 + 1 : state.score1;

      const score2 = winner === 2 ? state.score2 + 1 : state.score2;

      const matchWinner =
        score1 >= state.winsToVictory
          ? 1
          : score2 >= state.winsToVictory
            ? 2
            : null;

      set({
        board: newBoard,
        winner,
        locked: true,
        score1,
        score2,
        matchWinner,
      });

      if (matchWinner) return;

      setTimeout(() => {
        set({
          board: emptyBoard,
          turn: 1,
          winner: null,
          locked: false,
          round: get().round + 1,
        });
      }, 1800);

      return;
    }

    if (full) {
      set({ board: newBoard, locked: true });

      setTimeout(() => {
        set({
          board: emptyBoard,
          turn: 1,
          locked: false,
          round: get().round + 1,
        });
      }, 1400);

      return;
    }

    set({
      board: newBoard,
      turn: state.turn === 1 ? 2 : 1,
    });
  },
}));

export default useGameStore;
