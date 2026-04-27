"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useGameStore from "@/store/useGameStore";

export default function ArenaPage() {
  const router = useRouter();

  const {
    player1,
    player2,
    board,
    turn,
    playMove,
    score1,
    score2,
    round,
    winner,
    locked,
    matchWinner,
    resetMatch,
  } = useGameStore();

  useEffect(() => {
    if (!player1 || !player2) {
      router.replace("/select");
    }
  }, [player1, player2, router]);

  if (!player1 || !player2) return null;

  const Icon1 = player1.icon;
  const Icon2 = player2.icon;

  const renderCell = (cell) => {
    if (cell === 1) return <Icon1 className="text-5xl text-cyan-300" />;
    if (cell === 2) return <Icon2 className="text-5xl text-pink-400" />;
    return null;
  };

  const currentTurn = turn === 1 ? player1.name : player2.name;

  const winnerName = matchWinner === 1 ? player1.name : player2.name;

  const WinnerIcon = matchWinner === 1 ? Icon1 : Icon2;

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="panel neon-border rounded-3xl p-6 w-full max-w-5xl relative">
        {/* SCORE */}
        <div className="grid grid-cols-3 text-center items-center gap-4">
          <div>
            <Icon1 className="text-5xl mx-auto text-cyan-300" />
            <p>{player1.name}</p>
            <p className="text-3xl font-black">{score1}</p>
          </div>

          <div>
            <p className="text-cyan-300 tracking-[.3em] text-xs">
              EL MEJOR DE 3
            </p>

            <p className="mt-3 text-sm">
              {matchWinner
                ? "MATCH COMPLETE"
                : winner
                  ? `ROUND WINNER P${winner}`
                  : locked
                    ? "RESETTING..."
                    : `${currentTurn} TURN`}
            </p>

            <p className="mt-2 text-xs opacity-70">ROUND {round}</p>
          </div>

          <div>
            <Icon2 className="text-5xl mx-auto text-pink-400" />
            <p>{player2.name}</p>
            <p className="text-3xl font-black">{score2}</p>
          </div>
        </div>

        {/* BOARD */}
        <div className="grid grid-cols-3 gap-4 mt-10 max-w-xl mx-auto">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => playMove(i)}
              disabled={locked || matchWinner}
              className="aspect-square rounded-3xl panel border border-cyan-400/30 hover:scale-105 transition flex items-center justify-center"
            >
              {renderCell(cell)}
            </button>
          ))}
        </div>

        {/* EXIT */}
        {!matchWinner && (
          <button
            onClick={() => router.push("/select")}
            className="mt-8 w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10"
          >
            CHANGE UNITS
          </button>
        )}

        {/* MODAL */}
        {matchWinner && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-3xl p-6">
            <div className="panel neon-border rounded-3xl p-8 text-center w-full max-w-md">
              <p className="tracking-[.4em] text-cyan-300 text-xs">
                VICTORIA DETECTADA
              </p>

              <WinnerIcon className="text-7xl mx-auto mt-5 text-cyan-300" />

              <h2 className="text-4xl font-black mt-4 glow-text">
                {winnerName}
              </h2>

              <p className="mt-2 opacity-80">GANA LA BATALLA</p>

              <div className="grid gap-4 mt-8">
                <button
                  onClick={resetMatch}
                  className="py-4 rounded-2xl bg-cyan-400 text-black font-bold"
                >
                  REVANCHA
                </button>

                <button
                  onClick={() => {
                    resetMatch();
                    router.push("/select");
                  }}
                  className="py-4 rounded-2xl bg-white/5"
                >
                  CAMBIAR PERSONAJES
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
