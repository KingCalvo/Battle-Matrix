"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSound from "use-sound";
import { Howler } from "howler";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiArrowLeftOnRectangle,
  HiSpeakerWave,
  HiSpeakerXMark,
} from "react-icons/hi2";
import { FaHeart, FaRegHeart, FaHeartBroken } from "react-icons/fa";
import { characters } from "@/data/characters";
import { supabase } from "@/lib/supabaseClient";
import { clearOnlineSession, getOnlineSession } from "@/lib/onlineSession";

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

function getCharacter(characterId) {
  return characters.find((character) => character.id === characterId) || null;
}

function getWinningLine(board) {
  for (const line of winLines) {
    const [a, b, c] = line;

    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }

  return null;
}

async function unlockAudio() {
  if (Howler.ctx && Howler.ctx.state !== "running") {
    await Howler.ctx.resume();
  }
}

export default function ArenaOnlineClient({ dict }) {
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [musicOn, setMusicOn] = useState(true);
  const [introOpen, setIntroOpen] = useState(true);
  const [introStep, setIntroStep] = useState("ROUND 1");
  const [showRoundFx, setShowRoundFx] = useState(true);
  const [exitOpen, setExitOpen] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [timeoutText, setTimeoutText] = useState("");
  const [track] = useState(songs[0]);
  const [fatalityOpen, setFatalityOpen] = useState(false);
  const [fatalityWinner, setFatalityWinner] = useState(null);
  const [fatalityPhase, setFatalityPhase] = useState("idle");
  const [isMobile, setIsMobile] = useState(false);

  const roundFxRef = useRef(null);
  const resetRoundRef = useRef(null);
  const musicTimeoutRef = useRef(null);
  const timerRef = useRef(null);
  const timeoutLossRef = useRef(false);
  const fatalityShownRef = useRef(false);
  const fatalityTimeoutRef = useRef(null);
  const impactTimeoutRef = useRef(null);
  const resetRoundKeyRef = useRef("");
  const roundFxKeyRef = useRef("");
  const moveLockRef = useRef(false);
  const rematchResettingRef = useRef(false);
  const tieResetKeyRef = useRef("");
  const timeoutLoseText = dict.arenaOnline.timeoutLose;

  const roomId = room?.id;
  const roomRound = room?.round;
  const roomWinner = room?.winner;
  const roomMatchWinner = room?.match_winner;

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

  const player1 = useMemo(
    () => players.find((player) => player.slot === 1) || null,
    [players],
  );

  const player2 = useMemo(
    () => players.find((player) => player.slot === 2) || null,
    [players],
  );

  const currentPlayer = useMemo(
    () => players.find((player) => player.id === session?.playerId) || null,
    [players, session],
  );

  const rematchP1Ready = room?.rematch_p1 || false;
  const rematchP2Ready = room?.rematch_p2 || false;

  const myRematchReady =
    currentPlayer?.slot === 1 ? rematchP1Ready : rematchP2Ready;

  const player1Character = getCharacter(player1?.character_id);
  const player2Character = getCharacter(player2?.character_id);
  const board = Array.isArray(room?.board) ? room.board : Array(9).fill(null);
  const winningLine = getWinningLine(board);
  const isAdmin = currentPlayer?.role === "admin";
  const isMyTurn =
    currentPlayer &&
    room?.turn === currentPlayer.slot &&
    room?.winner === null &&
    !room?.match_winner &&
    !introOpen &&
    !showRoundFx;

  const currentTurnName = room?.turn === 1 ? player1?.name : player2?.name;
  const matchWinnerPlayer =
    room?.match_winner === 1
      ? player1
      : room?.match_winner === 2
        ? player2
        : null;
  const WinnerIcon =
    room?.match_winner === 1 ? player1Character?.icon : player2Character?.icon;
  const perfectWinner =
    room?.match_winner === 1
      ? room?.hp1 === room?.lives_to_win
      : room?.match_winner === 2
        ? room?.hp2 === room?.lives_to_win
        : false;
  const showWinModal = Boolean(room?.match_winner && !fatalityOpen);

  const fetchRoomState = useCallback(
    async (roomId) => {
      const [
        { data: roomData, error: roomError },
        { data: playerData, error: playersError },
      ] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", roomId).single(),
        supabase
          .from("players")
          .select("*")
          .eq("room_id", roomId)
          .eq("connected", true)
          .order("slot", { ascending: true }),
      ]);

      if (roomError || playersError) {
        setError(
          roomError?.message ||
            playersError?.message ||
            dict.arenaOnline.loadError,
        );
        return;
      }

      if (roomData.status === "lobby") {
        router.replace(`/${dict.locale}/lobby`);
        return;
      }

      if (roomData.status === "select") {
        router.replace(`/${dict.locale}/select-online`);
        return;
      }

      if (roomData.status === "ended") {
        clearOnlineSession();
        router.replace(`/${dict.locale}/mode`);
        return;
      }

      setRoom(roomData);
      setPlayers(playerData || []);
      if (
        roomData.status === "arena" &&
        roomData.winner === null &&
        roomData.match_winner === null
      ) {
        rematchResettingRef.current = false;
      }
      moveLockRef.current = false;
    },
    [router, dict.locale],
  );

  useEffect(() => {
    let active = true;
    const savedSession = getOnlineSession();

    if (!savedSession?.roomId || !savedSession?.playerId) {
      router.replace(`/${dict.locale}/lobby`);

      return () => {
        active = false;
      };
    }

    Promise.resolve().then(() => {
      if (!active) return;
      setSession(savedSession);
      fetchRoomState(savedSession.roomId);
    });

    return () => {
      active = false;
    };
  }, [fetchRoomState, router, dict.locale]);

  useEffect(() => {
    if (!session?.roomId) return;

    const channel = supabase
      .channel(`online-arena-${session.roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${session.roomId}`,
        },
        () => fetchRoomState(session.roomId),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${session.roomId}`,
        },
        () => fetchRoomState(session.roomId),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRoomState, session?.roomId]);

  useEffect(() => {
    if (!introOpen) return;

    const t1 = setTimeout(() => setIntroStep("ROUND 1"), 1000);
    const t2 = setTimeout(() => setIntroStep("FIGHT"), 2000);
    const t3 = setTimeout(() => setIntroOpen(false), 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(musicTimeoutRef.current);
      clearTimeout(fatalityTimeoutRef.current);
      clearTimeout(impactTimeoutRef.current);
      stopAllAudio();
    };
  }, [introOpen]);

  useEffect(() => {
    if (!roomId || roomWinner !== null || roomMatchWinner) return;

    const roundFxKey = `${roomId}-${roomRound}-${introOpen ? "intro" : "play"}`;

    if (roundFxKeyRef.current === roundFxKey) return;
    roundFxKeyRef.current = roundFxKey;

    clearTimeout(roundFxRef.current);

    setShowRoundFx(true);
    setTimeoutText("");

    roundFxRef.current = setTimeout(() => {
      setShowRoundFx(false);
      setTimeoutText("");
    }, 1200);

    return () => {
      clearTimeout(roundFxRef.current);
    };
  }, [roomId, roomRound, roomWinner, roomMatchWinner, introOpen]);

  useEffect(() => {
    if (
      !roomId ||
      roomWinner === null ||
      roomWinner === undefined ||
      roomWinner === 0 ||
      roomMatchWinner ||
      !session?.playerId
    ) {
      return;
    }

    const resetKey = `${roomId}-${roomRound}-${roomWinner}`;

    if (resetRoundKeyRef.current === resetKey) return;

    resetRoundKeyRef.current = resetKey;

    playWin();

    clearTimeout(resetRoundRef.current);

    resetRoundRef.current = setTimeout(async () => {
      const { error: rpcError } = await supabase.rpc("reset_online_round", {
        player_id_arg: session.playerId,
      });

      if (rpcError) {
        resetRoundKeyRef.current = "";
        setError(rpcError.message);
      }
    }, 1800);
  }, [
    playWin,
    roomId,
    roomRound,
    roomWinner,
    roomMatchWinner,
    session?.playerId,
  ]);

  useEffect(() => {
    if (!roomId || roomWinner !== 0 || roomMatchWinner || !session?.playerId) {
      return;
    }

    const tieKey = `${roomId}-${roomRound}-tie`;

    if (tieResetKeyRef.current === tieKey) return;
    tieResetKeyRef.current = tieKey;

    clearTimeout(resetRoundRef.current);
    resetRoundRef.current = setTimeout(async () => {
      const { error: rpcError } = await supabase.rpc("reset_online_round", {
        player_id_arg: session.playerId,
      });

      if (rpcError) {
        tieResetKeyRef.current = "";
        setError(rpcError.message);
      }
    }, 1300);
  }, [roomId, roomRound, roomWinner, roomMatchWinner, session?.playerId]);

  useEffect(() => {
    if (introOpen || rematchResettingRef.current) return;

    let active = true;

    Promise.resolve().then(() => {
      if (!active) return;

      setTimeLeft(15);
      setTimeoutText("");
      timeoutLossRef.current = false;
    });

    return () => {
      active = false;
    };
  }, [room?.round, room?.turn, room?.winner, room?.match_winner, introOpen]);

  useEffect(() => {
    if (!musicOn) {
      clearTimeout(musicTimeoutRef.current);
      stopMusic();
      stopCinematic();
      stopWinnerTheme();
      return;
    }

    clearTimeout(musicTimeoutRef.current);

    musicTimeoutRef.current = setTimeout(async () => {
      await unlockAudio();
      stopAllAudio();

      if (room?.match_winner && !fatalityOpen) {
        playWinnerTheme();
      } else if (fatalityOpen) {
        return;
      } else if (introOpen) {
        playCinematic();
      } else {
        playMusic();
      }
    }, 0);

    return () => clearTimeout(musicTimeoutRef.current);
  }, [
    introOpen,
    fatalityOpen,
    musicOn,
    playCinematic,
    playMusic,
    playWinnerTheme,
    room?.match_winner,
    stopCinematic,
    stopMusic,
    stopWinnerTheme,
  ]);

  useEffect(() => {
    if (introOpen || rematchResettingRef.current) return;

    if (!room?.match_winner) {
      fatalityShownRef.current = false;

      Promise.resolve().then(() => {
        setFatalityOpen(false);
        setFatalityWinner(null);
        setFatalityPhase("idle");
      });

      return;
    }

    if (!perfectWinner || fatalityShownRef.current) return;

    fatalityShownRef.current = true;
    clearTimeout(fatalityTimeoutRef.current);
    clearTimeout(impactTimeoutRef.current);
    clearTimeout(musicTimeoutRef.current);

    setFatalityWinner(room.match_winner);
    setFatalityOpen(true);
    setFatalityPhase("intro");

    stopAllAudio();
    playFatality();

    impactTimeoutRef.current = setTimeout(() => {
      setFatalityPhase("impact");
      playImpact();
    }, 1400);

    fatalityTimeoutRef.current = setTimeout(() => {
      setFatalityOpen(false);
      setFatalityPhase("idle");
    }, 2400);

    return () => {
      clearTimeout(fatalityTimeoutRef.current);
      clearTimeout(impactTimeoutRef.current);
    };
  }, [introOpen, perfectWinner, playFatality, playImpact, room?.match_winner]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (
      introOpen ||
      showRoundFx ||
      rematchResettingRef.current ||
      !room ||
      room.winner !== null ||
      room.match_winner
    ) {
      return;
    }

    if (timeLeft <= 0) {
      const loserName = room.turn === 1 ? player1?.name : player2?.name;

      Promise.resolve().then(() => {
        setTimeoutText(`${loserName} ${timeoutLoseText}`);
      });

      if (session?.playerId && !timeoutLossRef.current) {
        timeoutLossRef.current = true;

        Promise.resolve().then(async () => {
          const { error: rpcError } = await supabase.rpc(
            "apply_online_timeout_loss",
            {
              player_id_arg: session.playerId,
              expected_turn_arg: room.turn,
            },
          );

          if (rpcError) {
            setError(rpcError.message);
          }
        });
      }

      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [
    introOpen,
    showRoundFx,
    timeoutLoseText,
    player1?.name,
    player2?.name,
    room,
    room?.match_winner,
    room?.turn,
    room?.winner,
    session?.playerId,
    timeLeft,
  ]);

  useEffect(() => {
    return () => {
      clearTimeout(roundFxRef.current);
      clearTimeout(resetRoundRef.current);
      clearTimeout(musicTimeoutRef.current);
      clearTimeout(timerRef.current);
      clearTimeout(fatalityTimeoutRef.current);
      clearTimeout(impactTimeoutRef.current);
      stopAllAudio();
    };
  }, []);

  async function handleMove(index) {
    if (moveLockRef.current) return;

    if (!isMyTurn || board[index]) return;

    moveLockRef.current = true;

    playPunch();
    setError("");

    const { error: rpcError } = await supabase.rpc("play_online_move", {
      player_id_arg: currentPlayer.id,
      cell_index_arg: index,
    });

    if (rpcError) {
      setError(rpcError.message);
    }
  }

  async function leaveRoom() {
    if (!session?.playerId) return;

    playArena();
    await supabase.rpc("leave_online_room", {
      player_id_arg: session.playerId,
    });

    clearOnlineSession();
    stopAllAudio();
    router.push(`/${dict.locale}/mode`);
  }

  async function rematchBattle() {
    if (!session?.playerId || myRematchReady) return;

    playHover();
    setError("");

    const { data, error: rpcError } = await supabase.rpc(
      "rematch_online_game",
      {
        player_id_arg: session.playerId,
      },
    );

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    // Solo cuando los dos ya aceptaron
    if (data !== true) {
      return;
    }

    rematchResettingRef.current = true;
    timeoutLossRef.current = false;
    moveLockRef.current = false;
    fatalityShownRef.current = false;

    clearTimeout(timerRef.current);
    clearTimeout(musicTimeoutRef.current);
    clearTimeout(roundFxRef.current);
    clearTimeout(fatalityTimeoutRef.current);
    clearTimeout(impactTimeoutRef.current);

    setFatalityOpen(false);
    setFatalityWinner(null);
    setFatalityPhase("idle");

    setTimeLeft(15);
    setTimeoutText("");
    setShowRoundFx(true);
    setIntroOpen(true);
    setIntroStep("ROUND 1");

    resetRoundKeyRef.current = "";
    tieResetKeyRef.current = "";
    roundFxKeyRef.current = "";
  }

  async function changeCharacters() {
    if (!session?.playerId) return;

    playArena();
    setError("");

    const { error: rpcError } = await supabase.rpc("back_to_online_select", {
      player_id_arg: session.playerId,
    });

    if (rpcError) {
      setError(rpcError.message);
    }
  }

  function renderHearts(hp, playerNum) {
    return Array.from({ length: room?.lives_to_win || 3 }).map((_, index) => {
      const breaking =
        room?.winner &&
        room?.winner !== 0 &&
        room?.winner !== playerNum &&
        index === hp;

      return (
        <motion.div
          key={index}
          animate={
            breaking
              ? { scale: [1, 1.5, 0], rotate: [0, -25, 25, 0] }
              : { scale: 1 }
          }
          transition={{ duration: 0.45 }}
        >
          {breaking ? (
            <FaHeartBroken className="text-red-500 text-lg" />
          ) : index < hp ? (
            <FaHeart className="text-red-500 text-lg" />
          ) : (
            <FaRegHeart className="text-black text-lg opacity-70" />
          )}
        </motion.div>
      );
    });
  }

  if (!room || !player1 || !player2 || !player1Character || !player2Character) {
    return null;
  }

  const Icon1 = player1Character.icon;
  const Icon2 = player2Character.icon;

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
                {dict.arenaOnline.battleFor} {room.lives_to_win}{" "}
                {room.lives_to_win === 1
                  ? dict.arenaOnline.life
                  : dict.arenaOnline.lives}
              </p>

              <div className="grid grid-cols-3 items-center gap-2 sm:gap-4 w-full max-w-5xl mt-7">
                <motion.div
                  initial={{ x: -220, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl border border-blue-400 bg-blue-400/10 shadow-[0_0_22px_rgba(59,130,246,.35)] p-5 sm:p-6 text-center min-w-0"
                >
                  <p className="text-[10px] sm:text-sm tracking-[.25em] text-blue-300 mb-4 font-bold break-words">
                    {player1.name}
                  </p>

                  <Icon1 className="text-7xl mx-auto text-blue-300" />

                  <p className="mt-2 sm:mt-4 font-black text-xs sm:text-base break-words">
                    {player1Character.name}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  transition={{ duration: 0.45 }}
                  className="text-center text-3xl md:text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,.8)]"
                >
                  VS
                </motion.div>

                <motion.div
                  initial={{ x: 220, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl border border-red-500 bg-red-500/10 shadow-[0_0_22px_rgba(255,0,0,.35)] p-5 sm:p-6 text-center min-w-0"
                >
                  <p className="text-[10px] sm:text-sm tracking-[.25em] text-red-400 mb-4 font-bold break-words">
                    {player2.name}
                  </p>

                  <Icon2 className="text-7xl mx-auto text-red-500" />

                  <p className="mt-2 sm:mt-4 font-black text-xs sm:text-base break-words">
                    {player2Character.name}
                  </p>
                </motion.div>
              </div>

              <motion.div
                key={introStep}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mt-12 text-5xl md:text-7xl font-black text-white drop-shadow-[0_0_22px_rgba(59,130,246,.8)]"
              >
                {introStep}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!introOpen && (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-4">
              <div
                className={`rounded-3xl p-3 sm:p-4 border w-full max-w-[220px] mx-auto transition-all duration-500 ${
                  room.lives_to_win > 1 && room.hp1 === 1
                    ? "border-red-500 bg-red-500/10 animate-pulse shadow-[0_0_28px_rgba(255,0,0,.45)] scale-105"
                    : room.turn === 1 &&
                        room.winner === null &&
                        !room.match_winner
                      ? "border-blue-400 shadow-[0_0_22px_rgba(59,130,246,.35)] bg-blue-400/10 scale-105"
                      : "border-white/10"
                }`}
              >
                <Icon1 className="text-4xl sm:text-5xl mx-auto text-blue-300" />
                <p className="text-center font-bold break-words">
                  {player1.name}
                </p>

                <div className="flex gap-1 justify-center mt-2 flex-wrap">
                  {renderHearts(room.hp1, 1)}
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      playArena();
                      setExitOpen(true);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
                    title={dict.arenaOnline.exitGame}
                  >
                    <HiArrowLeftOnRectangle className="text-xl text-blue-300" />
                  </button>

                  <p className="text-white tracking-[.18em] sm:tracking-[.25em] text-xs sm:text-sm lg:text-sm font-black glow-text drop-shadow-[0_0_18px_rgba(59,130,246,.65)]">
                    {dict.arenaOnline.battleFor} {room.lives_to_win}{" "}
                    {room.lives_to_win === 1
                      ? dict.arenaOnline.life
                      : dict.arenaOnline.lives}
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

                <p className="mt-4 text-xs tracking-[.2em] text-white/60">
                  {dict.arenaOnline.round} {room.round}
                </p>
                <h1 className="mt-1 text-xl sm:text-3xl font-black text-white">
                  {dict.arenaOnline.turnOf} {currentTurnName}
                </h1>

                <div className="mx-auto mt-3 w-28 sm:w-36">
                  <div className="h-2 overflow-hidden rounded-full bg-black/50">
                    <div
                      className={`h-full transition-all duration-500 ${
                        timeLeft <= 5 ? "bg-red-500" : "bg-blue-400"
                      }`}
                      style={{
                        width: `${Math.max(0, (timeLeft / 15) * 100)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-xs opacity-70">{timeLeft}s</p>
                </div>

                {isMyTurn ? (
                  <p className="mt-1 text-xs text-blue-300">
                    {dict.arenaOnline.yourTurn}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-white/50">
                    {dict.arenaOnline.waiting}
                  </p>
                )}
              </div>

              <div
                className={`rounded-3xl p-3 sm:p-4 border w-full max-w-[220px] mx-auto transition-all duration-500 ${
                  room.lives_to_win > 1 && room.hp2 === 1
                    ? "border-red-500 bg-red-500/10 animate-pulse shadow-[0_0_28px_rgba(255,0,0,.45)] scale-105"
                    : room.turn === 2 &&
                        room.winner === null &&
                        !room.match_winner
                      ? "border-red-500 shadow-[0_0_22px_rgba(255,0,0,.35)] bg-red-500/10 scale-105"
                      : "border-white/10"
                }`}
              >
                <Icon2 className="text-4xl sm:text-5xl mx-auto text-red-500" />
                <p className="text-center font-bold break-words">
                  {player2.name}
                </p>

                <div className="flex gap-1 justify-center mt-2 flex-wrap">
                  {renderHearts(room.hp2, 2)}
                </div>
              </div>
            </div>

            {error && (
              <p className="mx-auto mt-5 max-w-2xl rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-200">
                {error}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-10 max-w-[320px] sm:max-w-xl mx-auto">
              {board.map((cell, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: isMyTurn && !cell ? 1.05 : 1 }}
                  whileTap={{ scale: isMyTurn && !cell ? 0.95 : 1 }}
                  onClick={() => handleMove(index)}
                  disabled={!isMyTurn || Boolean(cell)}
                  className="aspect-square rounded-3xl sm:rounded-3xl panel border border-cyan-400/30 flex items-center justify-center relative min-h-[78px] sm:min-h-[110px] disabled:cursor-default"
                >
                  {cell === 1 && (
                    <Icon1 className="text-3xl sm:text-5xl text-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,.95)]" />
                  )}

                  {cell === 2 && (
                    <Icon2 className="text-3xl sm:text-5xl text-red-500 drop-shadow-[0_0_12px_rgba(255,0,0,.95)]" />
                  )}

                  {winningLine?.includes(index) && (
                    <div className="absolute inset-0 rounded-3xl border-2 border-blue-300 animate-pulse" />
                  )}
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {(showRoundFx || timeoutText || room.winner === 0) &&
                !room.match_winner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center z-30 px-4"
                  >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center px-4 sm:px-6 leading-tight text-white drop-shadow-[0_0_18px_rgba(59,130,246,.65)]">
                      {timeoutText ||
                        (room.winner === 0
                          ? dict.arenaOnline.draw
                          : `${dict.arenaOnline.round} ${room.round}`)}
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
              {dict.arenaOnline.perfectWin}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: -12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="mt-5 text-3xl md:text-6xl font-black text-red-500 tracking-[.22em] sm:tracking-[.3em] text-center px-2"
            >
              {dict.arenaOnline.fatality}
            </motion.p>

            <div className="relative mt-8 sm:mt-12 w-full max-w-6xl px-3 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
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

                  {fatalityPhase === "impact" && (
                    <>
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

        {showWinModal && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center rounded-3xl p-3 sm:p-6 z-40">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="panel neon-border rounded-3xl p-5 sm:p-8 text-center w-full max-w-sm sm:max-w-md"
            >
              {WinnerIcon && (
                <WinnerIcon
                  className={`text-6xl sm:text-7xl mx-auto animate-pulse ${
                    room.match_winner === 1 ? "text-blue-300" : "text-red-500"
                  }`}
                />
              )}

              <h2 className="text-xl sm:text-3xl font-black mt-4 glow-text break-words">
                {matchWinnerPlayer?.name}
              </h2>

              <p className="mt-2 opacity-80">{dict.arenaOnline.winnerGame}</p>

              <div className="flex items-center justify-center gap-5 mt-5">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 ${
                      rematchP1Ready
                        ? "bg-blue-400 border-blue-300 shadow-[0_0_14px_rgba(59,130,246,.8)]"
                        : "border-white/30"
                    }`}
                  />

                  <p className="text-xs text-blue-300 font-bold">
                    {player1.name}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 ${
                      rematchP2Ready
                        ? "bg-red-500 border-red-400 shadow-[0_0_14px_rgba(255,0,0,.8)]"
                        : "border-white/30"
                    }`}
                  />

                  <p className="text-xs text-red-400 font-bold">
                    {player2.name}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 mt-8">
                <button
                  onClick={rematchBattle}
                  className="py-3 sm:py-4 rounded-2xl bg-blue-500 text-white font-bold text-sm sm:text-base border border-blue-400 shadow-[0_0_22px_rgba(59,130,246,.35)] hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,.55)] transition-all duration-300"
                >
                  {myRematchReady
                    ? dict.arenaOnline.waitingRematch
                    : dict.arenaOnline.rematch}
                </button>

                <button
                  onClick={changeCharacters}
                  className="py-3 sm:py-4 rounded-2xl bg-blue-900 text-white font-bold text-sm sm:text-base hover:scale-105 hover:shadow-[0_0_18px_rgba(59,130,246,.22)] transition-all duration-300"
                >
                  {dict.arenaOnline.changeCharacters}
                </button>

                <button
                  onClick={() => setExitOpen(true)}
                  className="py-3 sm:py-4 rounded-2xl bg-red-500 text-white font-bold text-sm sm:text-base border border-red-300 hover:scale-105 transition-all duration-300"
                >
                  {dict.arenaOnline.exit}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {exitOpen && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center rounded-3xl bg-black/75 p-4">
            <div className="panel neon-border w-full max-w-md rounded-3xl p-6 text-center">
              <h2 className="text-2xl font-black text-white">
                {dict.arenaOnline.confirmExit}
              </h2>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => {
                    playHover();
                    setExitOpen(false);
                  }}
                  className="rounded-2xl border border-red-300 bg-red-500 px-6 py-4 font-bold text-white hover:scale-105 transition"
                >
                  {dict.arenaOnline.cancel}
                </button>

                <button
                  onClick={leaveRoom}
                  className="rounded-2xl border border-blue-400 bg-blue-900 px-6 py-4 font-bold text-white hover:scale-105 transition"
                >
                  {dict.arenaOnline.confirm}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
