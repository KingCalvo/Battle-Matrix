"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { characters } from "@/data/characters";
import useGameStore from "@/store/useGameStore";
import useSound from "use-sound";
import { HiSpeakerWave, HiSpeakerXMark, HiOutlineHome } from "react-icons/hi2";
import { Howler, Howl } from "howler";

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

  const [musicOn, setMusicOn] = useState(true);

  const [playHover] = useSound("/sounds/PersonajeHover.wav", {
    volume: 0.09,
  });

  const [playSelect] = useSound("/sounds/PersonajeSelect.wav", {
    volume: 0.2,
  });

  const [playBtn] = useSound("/sounds/btnSound-3.wav", {
    volume: 0.35,
  });

  const [playArena] = useSound("/sounds/btnSound-3.wav", {
    volume: 0.3,
  });

  const [playMusic, { stop }] = useSound("/sounds/OTS-Select.mp3", {
    volume: 0.2,
    loop: true,
  });

  useEffect(() => {
    if (musicOn) {
      playMusic();
    } else {
      stop();
    }

    return () => {
      setTimeout(() => stop(), 400);
    };
  }, [musicOn, playMusic, stop]);

  const handleSelect = (char) => {
    playSelect();

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
      <button
        type="button"
        onClick={() => setActivePlayer(num)}
        className={`panel rounded-3xl p-6 border transition-all duration-300 hover:scale-[1.02] ${activeColor} self-center text-left`}
        aria-pressed={activePlayer === num}
      >
        <p className="tracking-[.3em] text-xs text-white text-center">
          PLAYER {num}
        </p>

        <div className="mt-5 flex flex-col items-center justify-center">
          {player ? (
            <>
              <Icon
                className={`text-7xl md:text-8xl ${
                  num === 1 ? "text-blue-300" : "text-red-500"
                }`}
              />

              <p className="mt-4 text-xl font-bold text-center text-white leading-tight">
                {player.name}
              </p>
            </>
          ) : (
            <>
              <div className="text-7xl opacity-20">?</div>

              <p className="mt-4 opacity-50 text-center text-white">
                Esperando...
              </p>
            </>
          )}
        </div>

        <div
          className={`mt-6 w-full py-3 rounded-2xl font-bold transition text-center
        ${
          num === 1
            ? "bg-blue-900 text-white border border-blue-400 shadow-[0_0_18px_rgba(59,130,246,.22)]"
            : "bg-red-500 text-white border border-red-200 shadow-[0_0_18px_rgba(255,0,0,.28)]"
        }`}
        >
          SELECT PLAYER {num}
        </div>
      </button>
    );
  };
  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="panel neon-border rounded-3xl w-full max-w-[1600px] p-6">
        <h1 className="text-center text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_14px_rgba(255,255,255,.35)]">
          SELECCIÓN DE PERSONAJE
        </h1>

        {/* Rondas */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
              title="Home"
            >
              <HiOutlineHome className="text-xl text-blue-300" />
            </button>

            <p className="tracking-[.25em] text-sm text-blue-300">
              ⚔ MATCH RULES ⚔
            </p>

            <button
              onClick={() => setMusicOn(!musicOn)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
            >
              {musicOn ? (
                <HiSpeakerWave className="text-xl text-blue-300" />
              ) : (
                <HiSpeakerXMark className="text-xl text-red-500" />
              )}
            </button>
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            {[1, 3, 5, 7].map((num) => (
              <button
                key={num}
                onClick={() => {
                  playBtn();
                  setWinsToVictory(num);
                }}
                className={`min-w-[56px] py-3 rounded-2xl font-black transition-all
                ${
                  winsToVictory === num
                    ? "bg-blue-500 text-white scale-110 shadow-[0_0_18px_rgba(59,130,246,.35)]"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={async () => {
                playArena();

                if (Howler.ctx?.state !== "running") {
                  await Howler.ctx.resume();
                }

                setTimeout(() => {
                  startBattle();
                }, 180);
              }}
              disabled={!player1 || !player2}
              className="px-12 py-4 rounded-2xl font-black bg-blue-900 text-white border border-blue-400 shadow-[0_0_18px_rgba(59,130,246,.22)] hover:scale-[1.02] hover:shadow-[0_0_18px_rgba(59,130,246,.22)] transition-all duration-300 disabled:opacity-40"
            >
              PLAY
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr_260px] gap-3 mt-8 items-center">
          {/* Izquierda */}
          {renderCard(
            player1,
            1,
            activePlayer === 1
              ? "border-blue-400 shadow-[0_0_20px_rgba(0,245,255,.25)]"
              : "border-gray-700",
          )}

          {/* Grid de personajes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-2 content-start max-h-[720px] overflow-y-auto pr-2 p-2 custom-scroll select-grid">
            {characters.map((char) => {
              const Icon = char.icon;
              const isP1Selected = player1?.id === char.id;
              const isP2Selected = player2?.id === char.id;

              const blocked =
                (activePlayer === 1 && isP2Selected) ||
                (activePlayer === 2 && isP1Selected);

              return (
                <button
                  key={char.id}
                  disabled={blocked}
                  onClick={() => handleSelect(char)}
                  onMouseEnter={() => !blocked && playHover()}
                  className={`rounded-2xl p-4 border min-h-[115px] transition-all duration-200 hover:z-20 relative z-0 ${
                    isP1Selected
                      ? "border-blue-400 bg-blue-400/10 shadow-[0_0_18px_rgba(59,130,246,.35)] scale-105"
                      : isP2Selected
                        ? "border-red-500 bg-red-500/10 shadow-[0_0_18px_rgba(255,0,0,.35)] scale-105"
                        : blocked
                          ? "opacity-40 border-sky-400/20 bg-sky-400/5"
                          : "border-sky-400/60 hover:bg-sky-400/10 hover:scale-105 hover:shadow-[0_0_14px_rgba(56,189,248,.22)]"
                  }`}
                >
                  {player1?.id === char.id && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold text-blue-300">
                      P1
                    </span>
                  )}

                  {player2?.id === char.id && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-red-500">
                      P2
                    </span>
                  )}
                  <Icon
                    className={`text-5xl mx-auto ${
                      isP1Selected
                        ? "text-blue-300"
                        : isP2Selected
                          ? "text-red-500"
                          : ""
                    }`}
                  />
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
              ? "border-red-500 shadow-[0_0_20px_rgba(255,0,0,.25)]"
              : "border-gray-700",
          )}
        </div>
      </div>
    </main>
  );
}
