"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSound from "use-sound";
import { Howler } from "howler";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiSpeakerWave,
  HiSpeakerXMark,
  HiArrowLeftOnRectangle,
} from "react-icons/hi2";
import { FaHeart, FaRegHeart, FaHeartBroken } from "react-icons/fa";
import useGameStore from "@/store/useGameStore";

const winLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const songs = [
  "/sounds/OTS-Game-1.mp3",
  "/sounds/OTS-Game-2.mp3",
  "/sounds/OTS-Game-3.mp3",
];

function stopAllAudio() {
  Howler.stop();
}

function getRandomSong() {
  return songs[((Date.now() + performance.now()) % songs.length) | 0];
}

const emptyBoard = Array(9).fill(null);

function getFreeCells(board) {
  return board
    .map((cell, i) => (cell === null ? i : null))
    .filter((v) => v !== null);
}

function checkWinner(board) {
  for (const [a, b, c] of winLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function getSmartMove(board) {
  const free = getFreeCells(board);

  // ganar
  for (const i of free) {
    const copy = [...board];
    copy[i] = 2;

    if (checkWinner(copy) === 2) return i;
  }

  // bloquear
  for (const i of free) {
    const copy = [...board];
    copy[i] = 1;

    if (checkWinner(copy) === 1) return i;
  }

  // centro
  if (board[4] === null) return 4;

  // esquinas
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);

  if (corners.length) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return free[Math.floor(Math.random() * free.length)];
}

function minimax(board, isMaximizing) {
  const winner = checkWinner(board);

  if (winner === 2) return 10;
  if (winner === 1) return -10;

  const free = getFreeCells(board);

  if (!free.length) return 0;

  if (isMaximizing) {
    let best = -999;

    for (const i of free) {
      const copy = [...board];
      copy[i] = 2;

      best = Math.max(best, minimax(copy, false));
    }

    return best;
  } else {
    let best = 999;

    for (const i of free) {
      const copy = [...board];
      copy[i] = 1;

      best = Math.min(best, minimax(copy, true));
    }

    return best;
  }
}

function getBestMove(board) {
  const free = getFreeCells(board);

  let bestScore = -999;
  let move = free[0];

  for (const i of free) {
    const copy = [...board];
    copy[i] = 2;

    const score = minimax(copy, false);

    if (score > bestScore) {
      bestScore = score;
      move = i;
    }
  }

  return move;
}

async function unlockAudio() {
  if (Howler.ctx && Howler.ctx.state !== "running") {
    await Howler.ctx.resume();
  }
}

export default function ArenaClient({ dict }) {
  const router = useRouter();

  const {
    player1,
    player2,
    winsToVictory,
    resetMatch,
    gameMode,
    aiDifficulty,
  } = useGameStore();

  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState(1);
  const [locked, setLocked] = useState(true);
  const [round, setRound] = useState(1);
  const [winner, setWinner] = useState(null);
  const [matchWinner, setMatchWinner] = useState(null);

  const [hp1, setHp1] = useState(winsToVictory);
  const [hp2, setHp2] = useState(winsToVictory);

  const [timeLeft, setTimeLeft] = useState(15);
  const [musicOn, setMusicOn] = useState(true);
  const [showRoundFx, setShowRoundFx] = useState(true);
  const [timeoutText, setTimeoutText] = useState("");
  const [breakingHeart, setBreakingHeart] = useState(null);

  const timeoutRef = useRef(null);
  const musicTimeoutRef = useRef(null);
  const roundFxRef = useRef(null);
  const timerRef = useRef(null);

  const [introOpen, setIntroOpen] = useState(true);
  const [introStep, setIntroStep] = useState("ROUND 1");

  const [track, setTrack] = useState(songs[0]);

  const [fatalityOpen, setFatalityOpen] = useState(false);
  const [fatalityWinner, setFatalityWinner] = useState(null);
  const [fatalityPhase, setFatalityPhase] = useState("idle");
  const [isMobile, setIsMobile] = useState(false);
  const fatalityTimeoutRef = useRef(null);
  const impactTimeoutRef = useRef(null);

  const [playHover] = useSound("/sounds/btnSound.mp3", {
    volume: 0.25,
  });

  const [playArena] = useSound("/sounds/btnSound-3.wav", {
    volume: 0.35,
  });

  const [playWin] = useSound("/sounds/PersonajeSelect.wav", {
    volume: 0.45,
  });

  const [playPunch] = useSound("/sounds/punchSound.mp3", {
    volume: 0.45,
  });

  const [playFatality] = useSound("/sounds/Fatality.mp3", {
    volume: 0.9,
    interrupt: true,
    preload: true,
  });

  const [playImpact] = useSound("/sounds/Impact.mp3", {
    volume: 0.9,
    interrupt: true,
    preload: true,
  });

  const [playWinnerTheme, { stop: stopWinnerTheme }] = useSound(
    "/sounds/WinSound.mp3",
    {
      volume: 0.1,
      loop: true,
    },
  );

  const [playCinematic, { stop: stopCinematic }] = useSound(
    "/sounds/Cinematica.mp3",
    {
      volume: 0.8,
      loop: false,
      interrupt: true,
      preload: true,
    },
  );

  const [playMusic, { stop: stopMusic }] = useSound(track, {
    volume: 0.2,
    loop: true,
    interrupt: true,
    soundEnabled: true,
    preload: true,
  });

  function nextSong() {
    setTrack(getRandomSong());
  }

  const startCinematicMusic = useCallback(
    (delay = 0) => {
      if (!musicOn) return;

      clearTimeout(musicTimeoutRef.current);

      musicTimeoutRef.current = setTimeout(async () => {
        try {
          await unlockAudio();
          stopAllAudio();
          stopWinnerTheme();
          playCinematic();
        } catch (error) {
          console.error("No se pudo iniciar la música cinemática:", error);
        }
      }, delay);
    },
    [musicOn, playCinematic, stopWinnerTheme],
  );

  const startArenaMusic = useCallback(
    (delay = 0) => {
      if (!musicOn) return;

      clearTimeout(musicTimeoutRef.current);

      musicTimeoutRef.current = setTimeout(async () => {
        try {
          await unlockAudio();
          stopAllAudio();
          stopCinematic();
          playMusic();
        } catch (error) {
          console.error("No se pudo iniciar la música de arena:", error);
        }
      }, delay);
    },
    [musicOn, playMusic],
  );

  const startFatalityCinematic = useCallback(
    (winnerNum) => {
      clearTimeout(fatalityTimeoutRef.current);
      clearTimeout(impactTimeoutRef.current);

      setFatalityWinner(winnerNum);
      setFatalityOpen(true);
      setFatalityPhase("intro");
      setLocked(true);

      stopAllAudio();
      playFatality();

      impactTimeoutRef.current = setTimeout(() => {
        setFatalityPhase("impact");
        playImpact();
      }, 1400);

      fatalityTimeoutRef.current = setTimeout(() => {
        setFatalityOpen(false);
        setFatalityPhase("idle");
        setMatchWinner(winnerNum);
      }, 2000);
    },
    [playFatality, playImpact],
  );

  const resetRound = useCallback(() => {
    setBoard(emptyBoard);
    setWinner(null);

    setRound((prevRound) => {
      const nextRound = prevRound + 1;

      // Round impar: empieza jugador 1
      // Round par: empieza jugador 2 / IA
      const nextTurn = nextRound % 2 === 1 ? 1 : 2;

      setTurn(nextTurn);

      return nextRound;
    });

    setLocked(false);
    setTimeLeft(15);
    setShowRoundFx(true);
    setTimeoutText("");
  }, []);

  const loseHeart = useCallback(
    (playerLose) => {
      setBreakingHeart(playerLose);

      setTimeout(() => {
        const winnerNum = playerLose === 1 ? 2 : 1;
        const winnerHasAllHearts =
          winnerNum === 1 ? hp1 === winsToVictory : hp2 === winsToVictory;

        if (playerLose === 1) {
          setHp1((prev) => {
            const newHp = prev - 1;
            return newHp;
          });
        } else {
          setHp2((prev) => {
            const newHp = prev - 1;
            return newHp;
          });
        }

        const loserHpAfter = playerLose === 1 ? hp1 - 1 : hp2 - 1;

        if (loserHpAfter <= 0) {
          setBreakingHeart(null);

          if (winnerHasAllHearts) {
            startFatalityCinematic(winnerNum);
          } else {
            setMatchWinner(winnerNum);
          }

          return;
        }

        setBreakingHeart(null);
        setLocked(true);

        timeoutRef.current = setTimeout(() => {
          resetRound();
        }, 1200);
      }, 500);
    },
    [hp1, hp2, winsToVictory, resetRound, startFatalityCinematic],
  );

  const handleTimeout = useCallback(() => {
    setLocked(true);

    const loser = turn;

    setTimeoutText(
      loser === 1
        ? `${player1.name} ${dict.arena.timeoutLose}`
        : `${player2.name} ${dict.arena.timeoutLose}`,
    );

    loseHeart(loser);
  }, [turn, player1, player2, loseHeart]);

  function handleMove(index, fromAI = false) {
    if (gameMode === "ai" && turn === 2 && !fromAI) return;

    if (locked || board[index] || matchWinner || introOpen) return;

    setLocked(true);

    playPunch();

    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);

    let foundWinner = null;

    for (const line of winLines) {
      const [a, b, c] = line;

      if (
        newBoard[a] &&
        newBoard[a] === newBoard[b] &&
        newBoard[a] === newBoard[c]
      ) {
        foundWinner = newBoard[a];
      }
    }

    if (foundWinner) {
      setWinner(foundWinner);
      setLocked(true);
      playWin();

      loseHeart(foundWinner === 1 ? 2 : 1);
      return;
    }

    if (newBoard.every(Boolean)) {
      setLocked(true);
      setTimeout(() => resetRound(), 1300);
      return;
    }

    setTurn(turn === 1 ? 2 : 1);
    setTimeLeft(15);

    setTimeout(() => {
      setLocked(false);
    }, 120);
  }

  function renderHearts(hp, playerNum) {
    return Array.from({ length: winsToVictory }).map((_, i) => {
      const lastHeart = i === hp - 1;
      const breaking = breakingHeart === playerNum && lastHeart;

      return (
        <motion.div
          key={i}
          animate={
            breaking
              ? { scale: [1, 1.5, 0], rotate: [0, -25, 25, 0] }
              : { scale: 1 }
          }
          transition={{ duration: 0.45 }}
        >
          {breaking ? (
            <FaHeartBroken className="text-red-500 text-lg" />
          ) : i < hp ? (
            <FaHeart className="text-red-500 text-lg" />
          ) : (
            <FaRegHeart className="text-black text-lg opacity-70" />
          )}
        </motion.div>
      );
    });
  }

  function restartBattle() {
    clearTimeout(timeoutRef.current);
    clearTimeout(musicTimeoutRef.current);
    clearTimeout(roundFxRef.current);
    clearTimeout(timerRef.current);
    clearTimeout(fatalityTimeoutRef.current);
    clearTimeout(impactTimeoutRef.current);

    stopAllAudio();
    playHover();
    Howler.stop();
    nextSong();

    // Reset cinemática fatality
    setFatalityOpen(false);
    setFatalityWinner(null);
    setFatalityPhase("idle");

    // Reset tablero / match
    setBoard(emptyBoard);
    setTurn(1);
    setLocked(true);
    setRound(1);
    setWinner(null);
    setMatchWinner(null);

    // Reset vida
    setHp1(winsToVictory);
    setHp2(winsToVictory);
    setBreakingHeart(null);

    // Reset timer / textos
    setTimeLeft(15);
    setTimeoutText("");

    // Intro
    setIntroOpen(true);
    setIntroStep("ROUND 1");

    // Round FX
    setShowRoundFx(true);

    roundFxRef.current = setTimeout(() => {
      setShowRoundFx(false);
    }, 1200);

    // Intro animación
    setTimeout(() => setIntroStep("ROUND 1"), 1000);

    setTimeout(() => setIntroStep("FIGHT"), 2000);

    setTimeout(() => {
      setIntroOpen(false);
      setLocked(false);
    }, 3000);
  }

  useEffect(() => {
    if (!player1 || !player2) {
      router.replace(`/${dict.locale}/select`);
    }
  }, [player1, player2, router, dict.locale]);

  useEffect(() => {
    if (matchWinner) {
      stopAllAudio();
    }
  }, [matchWinner]);

  useEffect(() => {
    if (matchWinner) {
      stopAllAudio();
      playWinnerTheme();
    } else {
      stopWinnerTheme();
    }

    return () => {
      stopWinnerTheme();
    };
  }, [matchWinner, playWinnerTheme, stopWinnerTheme]);

  useEffect(() => {
    if (locked || matchWinner) return;

    if (timeLeft <= 0) {
      const t = setTimeout(() => {
        handleTimeout();
      }, 0);

      return () => clearTimeout(t);
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((v) => v - 1);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [timeLeft, locked, matchWinner, handleTimeout]);

  useEffect(() => {
    roundFxRef.current = setTimeout(() => {
      setShowRoundFx(false);
    }, 1200);

    return () => clearTimeout(roundFxRef.current);
  }, [round]);

  useEffect(() => {
    if (!musicOn) return;

    if (introOpen) {
      startCinematicMusic(0);
    } else if (!matchWinner) {
      startArenaMusic(0);
    }
  }, [introOpen, musicOn, matchWinner, startArenaMusic, startCinematicMusic]);

  // Cinematica de inicio
  useEffect(() => {
    const t1 = setTimeout(() => setIntroStep("ROUND 1"), 1000);
    const t2 = setTimeout(() => setIntroStep("FIGHT"), 2000);
    const t3 = setTimeout(() => {
      setIntroOpen(false);
      setLocked(false);
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(musicTimeoutRef.current);
      stopAllAudio();
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(musicTimeoutRef.current);
      clearTimeout(roundFxRef.current);
      clearTimeout(timerRef.current);
      clearTimeout(fatalityTimeoutRef.current);
      clearTimeout(impactTimeoutRef.current);
      stopAllAudio();
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!musicOn) {
      clearTimeout(musicTimeoutRef.current);
      stopMusic();
      stopCinematic();
      stopWinnerTheme();
    }
  }, [musicOn, stopMusic, stopCinematic, stopWinnerTheme]);

  //Modo: IA
  useEffect(() => {
    if (gameMode !== "ai" || turn !== 2 || locked || introOpen || matchWinner)
      return;

    const free = getFreeCells(board);

    if (!free.length) return;

    const timer = setTimeout(() => {
      let move;

      if (aiDifficulty === "facil") {
        move = free[Math.floor(Math.random() * free.length)];
      }

      if (aiDifficulty === "normal") {
        const smart = Math.random() < 0.7;

        move = smart
          ? getSmartMove(board)
          : free[Math.floor(Math.random() * free.length)];
      }

      if (aiDifficulty === "dificil") {
        move = getBestMove(board);
      }

      handleMove(move, true);
    }, 700);

    return () => clearTimeout(timer);
  }, [turn, board, locked, introOpen, matchWinner, gameMode, aiDifficulty]);

  if (!player1 || !player2) return null;

  const Icon1 = player1.icon;
  const Icon2 = player2.icon;

  const currentTurn = turn === 1 ? player1.name : player2.name;

  const WinnerIcon = matchWinner === 1 ? Icon1 : Icon2;
  const iaName =
    aiDifficulty === "facil"
      ? dict.arena.iaEasy
      : aiDifficulty === "normal"
        ? dict.arena.iaNormal
        : dict.arena.iaHard;

  const winnerName =
    gameMode === "ai"
      ? matchWinner === 1
        ? dict.arena.player
        : iaName
      : matchWinner === 1
        ? dict.arena.player1
        : dict.arena.player2;

  let winningLine = null;

  for (const line of winLines) {
    const [a, b, c] = line;

    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      winningLine = line;
    }
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-4 md:px-8 flex items-center justify-center">
      <div
        className={`panel neon-border rounded-3xl p-3 sm:p-5 md:p-6 w-full max-w-5xl relative overflow-hidden transition-all duration-500 ${
          introOpen ? "min-h-[560px] sm:min-h-[620px] md:min-h-[720px]" : ""
        }`}
      >
        <AnimatePresence>
          {introOpen && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#0A1326] flex flex-col items-center justify-center px-4"
            >
              <p className="text-3xl text-center md:text-5xl font-black tracking-[.25em] text-white mb-10 drop-shadow-[0_0_18px_rgba(255,255,255,.65)]">
                {dict.arena.battleFor} {winsToVictory}{" "}
                {winsToVictory === 1 ? dict.arena.life : dict.arena.lives}
              </p>

              {/* Centro */}
              <div className="grid grid-cols-3 items-center gap-2 sm:gap-4 w-full max-w-5xl mt-7">
                {/* Player 1 */}
                <motion.div
                  initial={{ x: -220, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl border border-blue-400 bg-blue-400/10 shadow-[0_0_22px_rgba(59,130,246,.35)] p-5 sm:p-6 text-center min-w-0"
                >
                  <p className="text-[10px] sm:text-sm tracking-[.25em] text-blue-300 mb-4 font-bold">
                    {gameMode === "ai" ? dict.arena.player : dict.arena.player1}
                  </p>

                  <Icon1 className="text-7xl mx-auto text-blue-300" />

                  <p className="mt-2 sm:mt-4 font-black text-xs sm:text-base break-words">
                    {player1.name}
                  </p>
                </motion.div>

                {/* VS */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  transition={{ duration: 0.45 }}
                  className="text-center text-3xl md:text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,.8)]"
                >
                  VS
                </motion.div>

                {/* Player 2 */}
                <motion.div
                  initial={{ x: 220, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl border border-red-500 bg-red-500/10 shadow-[0_0_22px_rgba(255,0,0,.35)] p-5 sm:p-6 text-center min-w-0"
                >
                  <p className="text-[9px] sm:text-sm tracking-[.25em] text-red-400 mb-4 font-bold">
                    {gameMode === "ai" ? iaName : dict.arena.player2}
                  </p>

                  <Icon2 className="text-7xl mx-auto text-red-500" />

                  <p className="mt-2 sm:mt-4 font-black text-xs sm:text-base break-words">
                    {player2.name}
                  </p>
                </motion.div>
              </div>

              {/* Texto del round y del fight*/}
              <motion.div
                key={introStep}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mt-12 text-3xl md:text-5xl font-black text-white tracking-[.25em] drop-shadow-[0_0_20px_rgba(59,130,246,.7)] animate-pulse"
              >
                {introStep}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!introOpen && (
          <>
            {/* Top */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-center items-center">
              <div
                className={`rounded-3xl p-3 sm:p-4 border w-full max-w-[220px] mx-auto transition-all duration-500 ${
                  winsToVictory > 1 && hp1 === 1
                    ? "border-red-500 bg-red-500/10 animate-pulse shadow-[0_0_28px_rgba(255,0,0,.45)] scale-105"
                    : turn === 1 && !locked && !matchWinner
                      ? "border-blue-400 shadow-[0_0_22px_rgba(59,130,246,.35)] bg-blue-400/10 scale-105"
                      : "border-white/10"
                }`}
              >
                <Icon1 className="text-4xl sm:text-5xl mx-auto text-blue-300" />
                <p>{player1.name}</p>

                <div className="flex gap-1 justify-center mt-2 flex-wrap">
                  {renderHearts(hp1, 1)}
                </div>
              </div>

              <div>
                <div className="flex justify-center gap-3 items-center flex-wrap">
                  <button
                    onClick={() => {
                      clearTimeout(timeoutRef.current);
                      clearTimeout(musicTimeoutRef.current);
                      clearTimeout(roundFxRef.current);
                      clearTimeout(timerRef.current);

                      playArena();
                      stopAllAudio();
                      resetMatch();
                      router.push(`/${dict.locale}/select`);
                      clearTimeout(fatalityTimeoutRef.current);
                      clearTimeout(impactTimeoutRef.current);
                      setFatalityOpen(false);
                      setFatalityWinner(null);
                      setFatalityPhase("idle");
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition shrink-0"
                    title="Salir"
                  >
                    <HiArrowLeftOnRectangle className="text-lg text-red-500" />
                  </button>

                  <p className="text-white tracking-[.18em] sm:tracking-[.25em] text-xs sm:text-sm lg:text-sm font-black glow-text drop-shadow-[0_0_18px_rgba(59,130,246,.65)]">
                    {dict.arena.battleFor} {winsToVictory}{" "}
                    {winsToVictory === 1 ? dict.arena.life : dict.arena.lives}
                  </p>

                  <button
                    onClick={() => setMusicOn(!musicOn)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition shrink-0"
                  >
                    {musicOn ? (
                      <HiSpeakerWave className="text-blue-500 text-lg" />
                    ) : (
                      <HiSpeakerXMark className="text-red-500 text-lg" />
                    )}
                  </button>
                </div>

                <motion.p
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                  className="mt-3 text-sm font-bold tracking-wide"
                >
                  {matchWinner
                    ? dict.arena.completedMatch
                    : winner
                      ? dict.arena.completedRound
                      : locked
                        ? dict.arena.loading
                        : `${dict.arena.turnOf} ${currentTurn}`}
                </motion.p>

                <p className="mt-2 text-xs opacity-70">ROUND {round}</p>

                <div className="mt-3 w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{
                      width: `${(timeLeft / 15) * 100}%`,
                    }}
                  />
                </div>

                <p className="mt-1 text-xs opacity-70">{timeLeft}s</p>
              </div>

              <div
                className={`rounded-3xl p-3 sm:p-4 border w-full max-w-[220px] mx-auto transition-all duration-500 ${
                  winsToVictory > 1 && hp2 === 1
                    ? "border-red-500 bg-red-500/10 animate-pulse shadow-[0_0_28px_rgba(255,0,0,.45)] scale-105"
                    : turn === 2 && !locked && !matchWinner
                      ? "border-red-500 shadow-[0_0_22px_rgba(255,0,0,.35)] bg-red-500/10 scale-105"
                      : "border-white/10"
                }`}
              >
                <Icon2 className="text-4xl sm:text-5xl mx-auto text-red-500" />
                <p>{player2.name}</p>

                <div className="flex gap-1 justify-center mt-2 flex-wrap">
                  {renderHearts(hp2, 2)}
                </div>
              </div>
            </div>

            {/* Board */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-10 max-w-[320px] sm:max-w-xl mx-auto">
              {board.map((cell, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMove(i)}
                  disabled={
                    locked || matchWinner || (gameMode === "ai" && turn === 2)
                  }
                  className="aspect-square rounded-3xl sm:rounded-3xl panel border border-cyan-400/30 flex items-center justify-center relative min-h-[78px] sm:min-h-[110px]"
                >
                  {cell === 1 && (
                    <Icon1 className="text-3xl sm:text-5xl text-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,.95)]" />
                  )}

                  {cell === 2 && (
                    <Icon2 className="text-3xl sm:text-5xl text-red-500 drop-shadow-[0_0_12px_rgba(255,0,0,.95)]" />
                  )}

                  {winningLine?.includes(i) && (
                    <div className="absolute inset-0 rounded-3xl border-2 border-blue-300 animate-pulse" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Round FX */}
            <AnimatePresence>
              {(showRoundFx || timeoutText) && !matchWinner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/70 flex items-center justify-center z-30 px-4"
                >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center px-4 sm:px-6 leading-tight text-white drop-shadow-[0_0_18px_rgba(59,130,246,.65)]">
                    {timeoutText || `ROUND ${round}`}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {fatalityOpen && fatalityWinner && (
          <div className="absolute inset-0 z-50 bg-[#0A1326] flex flex-col items-center justify-center overflow-hidden">
            <motion.p
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="text-3xl md:text-5xl font-black text-white tracking-[.2em] sm:tracking-[.35em] text-center px-2 drop-shadow-[0_0_18px_rgba(255,255,255,.65)]"
            >
              {dict.arena.perfectWin}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: -12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="mt-5 text-3xl md:text-6xl font-black text-red-500 tracking-[.22em] sm:tracking-[.3em] text-center px-2"
            >
              {dict.arena.fatality}
            </motion.p>

            <div className="relative mt-8 sm:mt-12 w-full max-w-6xl px-3 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
                {/* Card del ganador */}
                <motion.div
                  initial={{
                    x: fatalityWinner === 1 ? -260 : 260,
                    opacity: 0,
                    scale: 0.95,
                  }}
                  animate={
                    fatalityPhase === "impact"
                      ? isMobile
                        ? {
                            y: [0, 35, 78, 62, 70],
                            x: 0,
                            rotate: [0, 0, 0, 0, 0],
                            scale: [1, 1.02, 1.08, 1.04, 1.06],
                            boxShadow: [
                              "0 0 0 rgba(255,0,0,0)",
                              "0 0 20px rgba(255,0,0,.22)",
                              "0 0 40px rgba(255,0,0,.42)",
                              "0 0 20px rgba(255,0,0,.22)",
                              "0 0 0 rgba(255,0,0,0)",
                            ],
                          }
                        : {
                            x: fatalityWinner === 1 ? -140 : 140,
                            y: [0, -6, 6, -4, 4, 0],
                            rotate: fatalityWinner === 1 ? 18 : -18,
                            scale: [1, 1.02, 0.98, 1.01, 0.97, 1],
                            boxShadow: [
                              "0 0 0 rgba(255,0,0,0)",
                              "0 0 25px rgba(255,0,0,.25)",
                              "0 0 45px rgba(255,0,0,.45)",
                              "0 0 25px rgba(255,0,0,.25)",
                              "0 0 0 rgba(255,0,0,0)",
                            ],
                          }
                      : { x: 0, opacity: 1, scale: 1 }
                  }
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className={`relative rounded-3xl p-4 sm:p-6 md:p-8 border-2 ${
                    fatalityWinner === 1
                      ? "border-blue-400 bg-blue-400/10 shadow-[0_0_22px_rgba(59,130,246,.35)]"
                      : "border-red-500 bg-red-500/10 shadow-[0_0_22px_rgba(255,0,0,.35)]"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    {fatalityWinner === 1 ? (
                      <Icon1 className="text-6xl sm:text-7xl md:text-9xl text-blue-300" />
                    ) : (
                      <Icon2 className="text-6xl sm:text-7xl md:text-9xl text-red-500" />
                    )}

                    <p className="text-xl md:text-2xl font-black">
                      {fatalityWinner === 1 ? player1.name : player2.name}
                    </p>
                  </div>
                </motion.div>

                {/* Card del perdedor */}
                <motion.div
                  initial={{
                    x: fatalityWinner === 1 ? 260 : -260,
                    opacity: 0,
                    scale: 0.95,
                  }}
                  animate={
                    fatalityPhase === "intro"
                      ? {
                          x: 0,
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                        }
                      : fatalityPhase === "impact"
                        ? isMobile
                          ? {
                              y: [0, 8, 18, 10, 14],
                              x: 0,
                              rotate: [0, -2, 2, -1, 1, 0],
                              scale: [1, 0.99, 0.97, 0.98, 0.96, 0.97],
                            }
                          : {
                              x: fatalityWinner === 1 ? -140 : 140,
                              y: [0, -6, 6, -4, 4, 0],
                              rotate: fatalityWinner === 1 ? 18 : -18,
                              scale: [1, 1.02, 0.98, 1.01, 0.97, 1],
                            }
                        : {
                            x: 0,
                            opacity: 1,
                            scale: 1,
                          }
                  }
                  transition={{
                    duration: 0.75,
                    ease: "easeOut",
                  }}
                  className={`relative rounded-3xl p-4 sm:p-6 md:p-8 border-2 overflow-hidden ${
                    fatalityWinner === 1
                      ? "border-red-500 bg-red-500/10 shadow-[0_0_22px_rgba(255,0,0,.35)]"
                      : "border-blue-400 bg-blue-400/10 shadow-[0_0_22px_rgba(59,130,246,.35)]"
                  }`}
                >
                  {/* Resplandor */}
                  {fatalityPhase === "impact" && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: -10, scaleY: 0 }}
                        animate={{
                          opacity: [0, 1, 1, 0.85, 0.95],
                          y: [-10, 0, 8, 18, 28],
                          scaleY: [0, 1, 1.15, 1.25, 1.3],
                        }}
                        transition={{ duration: 1.1, ease: "easeOut" }}
                        className="absolute top-0 left-[22%] w-2 h-24 bg-red-600/90 rounded-b-full blur-[0.2px] origin-top"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scaleY: 0 }}
                        animate={{
                          opacity: [0, 1, 1, 0.85, 0.95],
                          y: [-10, 0, 10, 22, 34],
                          scaleY: [0, 1, 1.1, 1.22, 1.35],
                        }}
                        transition={{
                          duration: 1.15,
                          ease: "easeOut",
                          delay: 0.1,
                        }}
                        className="absolute top-0 left-[52%] w-2.5 h-28 bg-red-500/95 rounded-b-full blur-[0.2px] origin-top"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scaleY: 0 }}
                        animate={{
                          opacity: [0, 1, 1, 0.8, 0.9],
                          y: [-10, 0, 6, 16, 26],
                          scaleY: [0, 1, 1.08, 1.18, 1.28],
                        }}
                        transition={{
                          duration: 1.05,
                          ease: "easeOut",
                          delay: 0.18,
                        }}
                        className="absolute top-0 right-[18%] w-2 h-20 bg-red-700/90 rounded-b-full blur-[0.2px] origin-top"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: [0, 0.8, 1, 0],
                          scale: [0.8, 1, 1.15, 1.3],
                        }}
                        transition={{ duration: 1.1, delay: 0.35 }}
                        className="absolute inset-0 bg-red-500/10 pointer-events-none"
                      />
                    </>
                  )}

                  {/* Lineas rotas */}
                  {fatalityPhase === "impact" && (
                    <>
                      {/* Verticales principales */}
                      <motion.div
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="absolute left-[20%] top-0 bottom-0 w-[2px] bg-red-600 origin-top rotate-[12deg]"
                      />

                      <motion.div
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.25, delay: 0.1 }}
                        className="absolute left-[38%] top-0 bottom-0 w-[2px] bg-red-600 origin-top rotate-[-6deg]"
                      />

                      <motion.div
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.25, delay: 0.16 }}
                        className="absolute left-[55%] top-0 bottom-0 w-[2px] bg-red-600 origin-top rotate-[8deg]"
                      />

                      <motion.div
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.25, delay: 0.22 }}
                        className="absolute left-[72%] top-0 bottom-0 w-[2px] bg-red-600 origin-top rotate-[16deg]"
                      />

                      {/* Horizontales */}
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.22, delay: 0.08 }}
                        className="absolute top-[26%] left-0 right-0 h-[2px] bg-red-600 origin-left rotate-[-8deg]"
                      />

                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.22, delay: 0.14 }}
                        className="absolute top-[46%] left-0 right-0 h-[2px] bg-red-600 origin-left rotate-[6deg]"
                      />

                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.22, delay: 0.2 }}
                        className="absolute top-[66%] left-0 right-0 h-[2px] bg-red-600 origin-left rotate-[-5deg]"
                      />

                      {/* Diagonales extras */}
                      <motion.div
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.24, delay: 0.12 }}
                        className="absolute left-[12%] top-[10%] bottom-[10%] w-[2px] bg-red-800 origin-top rotate-[28deg]"
                      />

                      <motion.div
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ duration: 0.24, delay: 0.18 }}
                        className="absolute right-[14%] top-[12%] bottom-[12%] w-[2px] bg-red-800 origin-top rotate-[-28deg]"
                      />

                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.24, delay: 0.26 }}
                        className="absolute top-[54%] left-[18%] right-[18%] h-[2px] bg-red-800 origin-left rotate-[14deg]"
                      />
                    </>
                  )}

                  {/* contenido */}
                  <motion.div
                    animate={
                      fatalityPhase === "impact"
                        ? {
                            x: [0, -10, 10, -8, 8, 0],
                            y: [0, 2, -2, 1, -1, 0],
                          }
                        : { x: 0, y: 0 }
                    }
                    transition={{ duration: 0.45 }}
                    className="relative flex flex-col items-center justify-center gap-3"
                  >
                    {fatalityWinner === 1 ? (
                      <Icon2 className="text-6xl sm:text-7xl md:text-9xl text-red-500" />
                    ) : (
                      <Icon1 className="text-6xl sm:text-7xl md:text-9xl text-blue-300" />
                    )}

                    <p className="text-xl md:text-2xl font-black">
                      {fatalityWinner === 1 ? player2.name : player1.name}
                    </p>

                    {/* Corazón roto mas polvo */}
                    {fatalityPhase === "impact" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: [0, 1, 0.9, 0],
                          scale: [0.8, 1.12, 1, 1.25],
                          rotate: [0, -8, 8, 0],
                        }}
                        transition={{ duration: 0.75 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <FaHeartBroken className="text-8xl md:text-[7.5rem] text-red-500 drop-shadow-[0_0_24px_rgba(255,0,0,.8)]" />
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Win modal */}
        {matchWinner && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center rounded-3xl p-3 sm:p-6 z-40">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="panel neon-border rounded-3xl p-5 sm:p-8 text-center w-full max-w-sm sm:max-w-md"
            >
              <WinnerIcon
                className={`text-6xl sm:text-7xl mx-auto animate-pulse ${
                  matchWinner === 1 ? "text-blue-300" : "text-red-500"
                }`}
              />

              <h2 className="text-xl sm:text-3xl font-black mt-4 glow-text break-words">
                {winnerName}
              </h2>

              <p className="mt-2 opacity-80">{dict.arena.winnerGame}</p>

              <div className="grid gap-4 mt-8">
                <button
                  onClick={restartBattle}
                  className="py-3 sm:py-4 rounded-2xl bg-blue-500 text-white font-bold text-sm sm:text-base border border-blue-400 shadow-[0_0_22px_rgba(59,130,246,.35)] hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,.55)] transition-all duration-300"
                >
                  {dict.arena.rematch}
                </button>

                <button
                  onClick={() => {
                    clearTimeout(timeoutRef.current);
                    clearTimeout(musicTimeoutRef.current);
                    clearTimeout(roundFxRef.current);
                    clearTimeout(timerRef.current);
                    playArena();
                    stopAllAudio();
                    resetMatch();
                    router.push(`/${dict.locale}/select`);
                    clearTimeout(fatalityTimeoutRef.current);
                    clearTimeout(impactTimeoutRef.current);
                    setFatalityOpen(false);
                    setFatalityWinner(null);
                    setFatalityPhase("idle");
                  }}
                  className="py-3 sm:py-4 rounded-2xl bg-blue-900 text-white font-bold text-sm sm:text-base hover:scale-105 hover:shadow-[0_0_18px_rgba(59,130,246,.22)] transition-all duration-300"
                >
                  {dict.arena.changeCharacter}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
