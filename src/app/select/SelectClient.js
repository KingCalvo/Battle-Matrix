"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { characters } from "@/data/characters";
import useGameStore from "@/store/useGameStore";
import useSound from "use-sound";
import { HiSpeakerWave, HiSpeakerXMark, HiOutlineHome } from "react-icons/hi2";
import { Howler } from "howler";
import { FaHeart } from "react-icons/fa";

import {
  GiSwordman,
  GiSkeletonInside,
  GiArtificialIntelligence,
} from "react-icons/gi";

export default function SelectClient() {
  const router = useRouter();

  const {
    player1,
    player2,
    setPlayer1,
    setPlayer2,
    winsToVictory,
    setWinsToVictory,
    resetMatch,
    setGameMode: saveGameMode,
    aiDifficulty,
    setAiDifficulty,
  } = useGameStore();

  const [activePlayer, setActivePlayer] = useState(1);
  const [musicOn, setMusicOn] = useState(true);

  const [gameMode, setGameMode] = useState(null);

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
    if (musicOn) playMusic();
    else stop();

    return () => stop();
  }, [musicOn, playMusic, stop]);

  const startBattle = () => {
    if (!player1 || !player2) return;
    resetMatch();
    router.push("/arena");
  };

  const pickRandomAI = (takenId) => {
    const available = characters.filter((c) => c.id !== takenId);

    setTimeout(() => {
      const index =
        crypto.getRandomValues(new Uint32Array(1))[0] % available.length;
      const random = available[index];

      setPlayer2(random);
      playSelect();
    }, 500);
  };

  const handleSelect = (char) => {
    playSelect();

    if (gameMode === "ai") {
      setPlayer1(char);
      pickRandomAI(char.id);
      return;
    }

    if (activePlayer === 1) {
      if (player2?.id === char.id) return;
      setPlayer1(char);
    } else {
      if (player1?.id === char.id) return;
      setPlayer2(char);
    }
  };

  const renderCard = (player, num, activeColor) => {
    const Icon = player?.icon;
    const isAI = gameMode === "ai" && num === 2;

    const CardTag = isAI ? "div" : "button";

    return (
      <CardTag
        type={!isAI ? "button" : undefined}
        onClick={!isAI ? () => setActivePlayer(num) : undefined}
        className={`panel rounded-3xl p-6 border transition-all duration-300 self-center text-left
      ${
        isAI
          ? "cursor-default select-none"
          : "hover:scale-[1.02] cursor-pointer"
      }
      ${activeColor}`}
      >
        <p className="tracking-[.3em] text-sm text-white text-center">
          {isAI ? "IA" : `Jugador ${num}`}
        </p>

        <div className="mt-5 flex flex-col items-center justify-center min-h-[180px]">
          {player ? (
            <>
              <Icon
                className={`text-7xl md:text-8xl ${
                  num === 1 ? "text-blue-300" : "text-red-500"
                }`}
              />

              <p className="mt-4 text-xl font-bold text-center text-white">
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

        {/* Jugador normal */}
        {!isAI && (
          <div
            className={`mt-6 w-full py-3 rounded-2xl font-bold text-center ${
              num === 1
                ? "bg-blue-900 text-white border border-blue-400"
                : "bg-red-500 text-white border border-red-200"
            }`}
          >
            Elegir personaje
          </div>
        )}

        {/* Dificultad de la IA */}
        {isAI && (
          <div className="mt-6 grid gap-2">
            {["facil", "normal", "dificil"].map((level) => (
              <button
                key={level}
                onClick={() => {
                  playBtn();
                  setAiDifficulty(level);
                }}
                className={`py-2 rounded-2xl font-black tracking-wider transition-all border
                ${
                  aiDifficulty === level
                    ? "bg-red-500 text-white border-red-300 scale-105 shadow-[0_0_18px_rgba(255,0,0,.45)]"
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </CardTag>
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div
        className={`panel neon-border rounded-3xl w-full max-w-[1600px] min-h-[720px] lg:min-h-[780px] xl:min-h-[880px] p-6 ${
          !gameMode ? "flex flex-col justify-center" : ""
        }`}
      >
        <h1 className="text-center text-4xl md:text-5xl font-black text-white mb-2">
          SELECCIÓN DE PERSONAJE
        </h1>

        <div
          className={`${!gameMode ? "mt-4" : "mt-6"} flex flex-col items-center gap-4`}
        >
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
            >
              <HiOutlineHome className="text-sm lg:text-xl text-blue-300" />
            </button>

            <p className="tracking-[.18em] text-sm lg:text-base text-white font-bold">
              Elige el número de vidas
            </p>

            <button
              onClick={() => setMusicOn(!musicOn)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
            >
              {musicOn ? (
                <HiSpeakerWave className="text-sm lg:text-xl text-blue-300" />
              ) : (
                <HiSpeakerXMark className="text-sm lg:text-xl text-red-500" />
              )}
            </button>
          </div>

          <div className="flex justify-center gap-5 flex-wrap mt-1">
            {[1, 3, 5, 7].map((num) => (
              <button
                key={num}
                onClick={() => {
                  playBtn();
                  setWinsToVictory(num);
                }}
                className={`relative transition-all hover:scale-110 ${
                  winsToVictory === num ? "scale-110" : ""
                }`}
              >
                <FaHeart
                  className={`text-[3.2rem] ${
                    winsToVictory === num
                      ? "text-red-500 drop-shadow-[0_0_14px_rgba(255,0,0,.55)]"
                      : "text-blue-950"
                  }`}
                />

                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">
                  {num}
                </span>
              </button>
            ))}
          </div>

          {/* Modos de juego */}
          {!gameMode && (
            <div className="w-full flex items-center justify-center min-h-[520px]">
              <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
                {/* VS amigo */}
                <button
                  onClick={() => {
                    playBtn();
                    setGameMode("friend");
                    saveGameMode("friend");
                  }}
                  className="panel rounded-3xl p-10 border border-blue-400 hover:scale-105 transition-all shadow-[0_0_24px_rgba(59,130,246,.25)]"
                >
                  <div className="flex justify-center gap-5">
                    <GiSwordman className="text-7xl text-blue-300" />
                    <GiSkeletonInside className="text-7xl text-blue-300" />
                  </div>

                  <p className="mt-8 text-2xl font-black text-white">
                    Jugar contra un amigo
                  </p>
                </button>

                {/* VS IA */}
                <button
                  onClick={() => {
                    playBtn();
                    setGameMode("ai");
                    saveGameMode("ai");
                    setActivePlayer(1);
                  }}
                  className="panel rounded-3xl p-10 border border-red-500 hover:scale-105 transition-all shadow-[0_0_24px_rgba(255,0,0,.22)]"
                >
                  <div className="flex justify-center">
                    <GiArtificialIntelligence className="text-7xl text-red-500" />
                  </div>

                  <p className="mt-8 text-2xl font-black text-white">
                    Jugar contra la IA
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Jugar */}
          {gameMode && (
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  playBtn();
                  setGameMode(null);
                  saveGameMode(null);
                  setPlayer1(null);
                  setPlayer2(null);
                }}
                className="px-8 py-4 rounded-2xl bg-blue-900 text-white font-bold hover:scale-105 hover:shadow-[0_0_18px_rgba(59,130,246,.22)] transition-all duration-300"
              >
                Modo de juego
              </button>

              <button
                onClick={async () => {
                  playArena();

                  if (Howler.ctx?.state !== "running") {
                    await Howler.ctx.resume();
                  }

                  setTimeout(() => startBattle(), 180);
                }}
                disabled={!player1 || !player2}
                className="px-12 py-4 rounded-2xl bg-blue-500 text-white font-bold text-sm sm:text-base border border-blue-400 shadow-[0_0_22px_rgba(59,130,246,.35)] hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,.55)] transition-all duration-300 disabled:opacity-40"
              >
                JUGAR
              </button>
            </div>
          )}
        </div>

        {/* Select normal */}
        {gameMode && (
          <div className="grid lg:grid-cols-[260px_1fr_260px] gap-3 mt-8 items-center">
            {renderCard(
              player1,
              1,
              activePlayer === 1
                ? "border-blue-400 shadow-[0_0_20px_rgba(59,130,246,.25)]"
                : "border-gray-700",
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-2 content-start max-h-[720px] overflow-y-auto pr-2 p-2 custom-scroll select-grid">
              {characters.map((char) => {
                const Icon = char.icon;

                const isP1 = player1?.id === char.id;
                const isP2 = player2?.id === char.id;

                const blocked =
                  (gameMode === "friend" &&
                    ((activePlayer === 1 && isP2) ||
                      (activePlayer === 2 && isP1))) ||
                  (gameMode === "ai" && isP2);

                return (
                  <button
                    key={char.id}
                    disabled={blocked}
                    onClick={() => handleSelect(char)}
                    onMouseEnter={() => !blocked && playHover()}
                    className={`rounded-2xl p-4 border min-h-[115px] transition-all relative ${
                      isP1
                        ? "border-blue-400 bg-blue-400/10 scale-105"
                        : isP2
                          ? "border-red-500 bg-red-500/10 scale-105"
                          : blocked
                            ? "opacity-40"
                            : "border-sky-400/60 hover:bg-sky-400/10 hover:scale-105"
                    }`}
                  >
                    {isP1 && (
                      <span className="absolute top-2 left-2 text-[10px] text-blue-300 font-bold">
                        P1
                      </span>
                    )}

                    {isP2 && (
                      <span className="absolute top-2 right-2 text-[10px] text-red-500 font-bold">
                        P2
                      </span>
                    )}

                    <Icon
                      className={`text-5xl mx-auto ${
                        isP1 ? "text-blue-300" : isP2 ? "text-red-500" : ""
                      }`}
                    />

                    <p className="mt-3 text-xs">{char.name}</p>
                  </button>
                );
              })}
            </div>

            {renderCard(
              player2,
              2,
              activePlayer === 2 && gameMode === "friend"
                ? "border-red-500 shadow-[0_0_20px_rgba(255,0,0,.25)]"
                : "border-gray-700",
            )}
          </div>
        )}
      </div>
    </main>
  );
}
