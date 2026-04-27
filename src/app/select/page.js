"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { characters } from "@/data/characters";
import useGameStore from "@/store/useGameStore";

export default function SelectPage() {
  const router = useRouter();

  const {
    player1,
    player2,
    setPlayer1,
    setPlayer2,
    winsToVictory,
    setWinsToVictory,
    resetMatch,
  } = useGameStore();

  const [activePlayer, setActivePlayer] = useState(1);

  const handleSelect = (char) => {
    if (activePlayer === 1) {
      if (player2?.id === char.id) return;
      setPlayer1(char);
    } else {
      if (player1?.id === char.id) return;
      setPlayer2(char);
    }
  };

  const startBattle = () => {
    if (!player1 || !player2) return;
    resetMatch();
    router.push("/arena");
  };

  const renderCard = (player, num, activeColor) => {
    const Icon = player?.icon;

    return (
      <div
        className={`panel rounded-3xl p-6 border ${activeColor} self-center`}
      >
        <p className="tracking-[.3em] text-xs opacity-70 text-center">
          PLAYER {num}
        </p>

        <div className="mt-5 flex flex-col items-center justify-center">
          {player ? (
            <>
              <Icon className="text-7xl md:text-8xl" />

              <p className="mt-4 text-xl font-bold text-center leading-tight">
                {player.name}
              </p>
            </>
          ) : (
            <>
              <div className="text-7xl opacity-20">?</div>

              <p className="mt-4 opacity-50 text-center">Esperando...</p>
            </>
          )}
        </div>

        <button
          onClick={() => setActivePlayer(num)}
          className={`mt-6 w-full py-3 rounded-2xl font-bold transition hover:scale-[1.02]
        ${num === 1 ? "bg-cyan-400 text-black" : "bg-pink-500 text-white"}`}
        >
          SELECT PLAYER {num}
        </button>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="panel neon-border rounded-3xl w-full max-w-[1600px] p-6">
        <h1 className="text-center text-4xl md:text-6xl font-black glow-text">
          SELECCIÓN DE PERSONAJE
        </h1>

        {/* Rondas */}
        <div className="mt-6 text-center">
          <p className="mb-3 opacity-70">EL MEJOR DE:</p>

          <div className="flex justify-center gap-3 flex-wrap">
            {[1, 3, 5, 7].map((num) => (
              <button
                key={num}
                onClick={() => setWinsToVictory(num)}
                className={`px-5 py-2 rounded-xl font-bold ${
                  winsToVictory === num
                    ? "bg-cyan-400 text-black"
                    : "bg-white/5"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr_320px] gap-6 mt-8 items-center">
          {/* Izquierda */}
          {renderCard(
            player1,
            1,
            activePlayer === 1
              ? "border-cyan-400 shadow-[0_0_20px_rgba(0,245,255,.25)]"
              : "border-gray-700",
          )}

          {/* Grid de personajes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 content-start">
            {characters.map((char) => {
              const Icon = char.icon;

              const blocked =
                (activePlayer === 1 && player2?.id === char.id) ||
                (activePlayer === 2 && player1?.id === char.id);

              return (
                <button
                  key={char.id}
                  disabled={blocked}
                  onClick={() => handleSelect(char)}
                  className={`rounded-2xl p-4 border min-h-[115px] transition ${
                    blocked
                      ? "opacity-25 border-gray-700"
                      : activePlayer === 1
                        ? "border-cyan-400 hover:bg-cyan-400/10 hover:scale-105"
                        : "border-pink-500 hover:bg-pink-500/10 hover:scale-105"
                  }`}
                >
                  <Icon className="text-5xl mx-auto" />
                  <p className="mt-3 text-xs">{char.name}</p>
                </button>
              );
            })}
          </div>

          {/* Derecha */}
          {renderCard(
            player2,
            2,
            activePlayer === 2
              ? "border-pink-500 shadow-[0_0_20px_rgba(255,0,184,.25)]"
              : "border-gray-700",
          )}
        </div>

        <button
          onClick={startBattle}
          disabled={!player1 || !player2}
          className="mt-8 w-full py-4 rounded-2xl font-black bg-cyan-400 text-black disabled:opacity-40"
        >
          ENTRAR EN LA ARENA
        </button>
      </div>
    </main>
  );
}
