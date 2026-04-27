"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { characters } from "@/data/characters";
import useGameStore from "@/store/useGameStore";

export default function SelectPage() {
  const router = useRouter();

  const { player1, player2, setPlayer1, setPlayer2 } = useGameStore();

  const [activePlayer, setActivePlayer] = useState(1);

  const handleSelect = (char) => {
    if (activePlayer === 1) {
      if (player2?.id === char.id) return;
      setPlayer1(char);
    }

    if (activePlayer === 2) {
      if (player1?.id === char.id) return;
      setPlayer2(char);
    }
  };

  const startBattle = () => {
    if (player1 && player2) {
      router.push("/arena");
    }
  };

  const renderCard = (player, number, color) => {
    const Icon = player?.icon;

    return (
      <div
        className={`panel rounded-3xl p-5 border transition
        ${activePlayer === number ? color : "border-gray-700"}`}
      >
        <p className="text-sm tracking-[.25em] opacity-80">PLAYER {number}</p>

        <div className="mt-4 min-h-[110px] flex flex-col items-center justify-center">
          {player ? (
            <>
              <Icon className="text-6xl" />
              <p className="mt-3 font-bold">{player.name}</p>
            </>
          ) : (
            <>
              <div className="text-5xl opacity-30">?</div>
              <p className="mt-3 text-gray-400">Esperando...</p>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="panel neon-border rounded-3xl w-full max-w-7xl p-6">
        <h1 className="text-center text-4xl md:text-6xl font-black glow-text">
          SELECCIÓN DE PERSONAJE
        </h1>

        <p className="text-center mt-3 text-cyan-300 tracking-[.35em] text-xs md:text-sm">
          Elige tu personaje
        </p>

        {/* Player cards */}
        <div className="grid md:grid-cols-2 gap-5 mt-8">
          {renderCard(
            player1,
            1,
            "border-cyan-400 shadow-[0_0_18px_rgba(0,245,255,.25)]",
          )}

          {renderCard(
            player2,
            2,
            "border-pink-500 shadow-[0_0_18px_rgba(255,0,184,.25)]",
          )}
        </div>

        {/* Editar */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => setActivePlayer(1)}
            className={`py-3 rounded-2xl font-bold transition
            ${activePlayer === 1 ? "bg-cyan-400 text-black" : "bg-white/5"}`}
          >
            EDIT PLAYER 1
          </button>

          <button
            onClick={() => setActivePlayer(2)}
            className={`py-3 rounded-2xl font-bold transition
            ${activePlayer === 2 ? "bg-pink-500 text-white" : "bg-white/5"}`}
          >
            EDIT PLAYER 2
          </button>
        </div>

        <div className="grid grid-cols-[1fr_5fr_1fr] gap-3 items-start mt-8">
          {/* Left */}
          <div className="hidden md:flex justify-center pt-12">
            <p className="rotate-180 [writing-mode:vertical-rl] text-cyan-300 tracking-[.35em] text-sm">
              PLAYER 1 SELECT
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {characters.map((char) => {
              const Icon = char.icon;

              const blocked =
                (activePlayer === 1 && player2?.id === char.id) ||
                (activePlayer === 2 && player1?.id === char.id);

              return (
                <button
                  key={char.id}
                  onClick={() => handleSelect(char)}
                  disabled={blocked}
                  className={`rounded-2xl p-4 border transition min-h-[130px]
                  ${
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

          {/* Right */}
          <div className="hidden md:flex justify-center pt-12">
            <p className="[writing-mode:vertical-rl] text-pink-400 tracking-[.35em] text-sm">
              PLAYER 2 SELECT
            </p>
          </div>
        </div>

        {/* Start */}
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
