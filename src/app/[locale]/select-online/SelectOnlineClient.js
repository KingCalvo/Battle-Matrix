"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSound from "use-sound";
import { Howler } from "howler";
import { FaHeart } from "react-icons/fa";
import {
  HiArrowLeftOnRectangle,
  HiSpeakerWave,
  HiSpeakerXMark,
} from "react-icons/hi2";
import { characters } from "@/data/characters";
import { supabase } from "@/lib/supabaseClient";
import { clearOnlineSession, getOnlineSession } from "@/lib/onlineSession";

function getCharacter(characterId) {
  return characters.find((character) => character.id === characterId) || null;
}

export default function SelectOnlineClient({ dict }) {
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [musicOn, setMusicOn] = useState(true);
  const [exitOpen, setExitOpen] = useState(false);
  const [error, setError] = useState("");

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

  const isAdmin = currentPlayer?.role === "admin";
  const player1Character = getCharacter(player1?.character_id);
  const player2Character = getCharacter(player2?.character_id);
  const readyToPlay = Boolean(player1Character && player2Character);

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
            dict.selectOnline.errorLoading,
        );
        return;
      }

      if (roomData.status === "lobby") {
        router.replace(`/${dict.locale}/lobby`);
        return;
      }

      if (roomData.status === "arena") {
        router.push(`/${dict.locale}/arena-online`);
        return;
      }

      if (roomData.status === "ended") {
        clearOnlineSession();
        router.replace(`/${dict.locale}/mode`);
        return;
      }

      setRoom(roomData);
      setPlayers(playerData || []);
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
      .channel(`online-select-${session.roomId}`)
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
    if (musicOn) playMusic();
    else stop();

    return () => stop();
  }, [musicOn, playMusic, stop]);

  async function setLives(num) {
    if (!currentPlayer || !isAdmin) return;

    playBtn();
    setError("");

    const { error: rpcError } = await supabase.rpc("set_lives_to_win", {
      player_id_arg: currentPlayer.id,
      lives_arg: num,
    });

    if (rpcError) {
      setError(rpcError.message);
    }
  }

  async function selectCharacter(character) {
    if (!currentPlayer) return;

    const rivalCharacterId =
      currentPlayer.slot === 1 ? player2?.character_id : player1?.character_id;

    if (rivalCharacterId === character.id) return;

    playSelect();
    setError("");

    const { error: rpcError } = await supabase.rpc("select_online_character", {
      player_id_arg: currentPlayer.id,
      character_id_arg: character.id,
    });

    if (rpcError) {
      setError(rpcError.message);
    }
  }

  async function startBattle() {
    if (!currentPlayer || !isAdmin || !readyToPlay) return;

    playArena();

    if (Howler.ctx?.state !== "running") {
      await Howler.ctx.resume();
    }

    setError("");

    const { error: rpcError } = await supabase.rpc("start_online_game", {
      player_id_arg: currentPlayer.id,
    });

    if (rpcError) {
      setError(rpcError.message);
    }
  }

  async function leaveRoom() {
    if (!session?.playerId) return;

    playBtn();
    await supabase.rpc("leave_online_room", {
      player_id_arg: session.playerId,
    });

    clearOnlineSession();
    router.push(`/${dict.locale}/mode`);
  }

  const renderCard = (player, character, num, activeColor) => {
    const Icon = character?.icon;
    const isMine = currentPlayer?.slot === num;

    return (
      <div
        className={`panel rounded-3xl p-6 border transition-all duration-300 self-center text-left ${activeColor}`}
      >
        <p className="tracking-[.3em] text-sm text-white text-center">
          {player?.name || `Jugador ${num}`}
        </p>

        <div className="mt-5 flex flex-col items-center justify-center min-h-[180px]">
          {character ? (
            <>
              <Icon
                className={`text-7xl md:text-8xl ${
                  num === 1 ? "text-blue-300" : "text-red-500"
                }`}
              />

              <p className="mt-4 text-xl font-bold text-center text-white">
                {character.name}
              </p>
            </>
          ) : (
            <>
              <div className="text-7xl opacity-20">?</div>

              <p className="mt-4 opacity-50 text-center text-white">
                {dict.selectOnline.waiting}
              </p>
            </>
          )}
        </div>

        <div
          className={`mt-6 w-full py-3 rounded-2xl font-bold text-center ${
            isMine
              ? num === 1
                ? "bg-blue-900 text-white border border-blue-400"
                : "bg-red-500 text-white border border-red-200"
              : "bg-white/5 text-white/45 border border-white/10"
          }`}
        >
          {isMine ? dict.selectOnline.yourCharacter : dict.selectOnline.rival}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="panel neon-border rounded-3xl w-full max-w-[1600px] min-h-[720px] lg:min-h-[780px] xl:min-h-[880px] p-6 relative">
        <h1 className="text-center text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-[0_0_14px_rgba(255,255,255,.35)]">
          {dict.selectOnline.title}
        </h1>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <button
              onClick={() => {
                playBtn();
                setExitOpen(true);
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
              title={dict.selectOnline.leaveGame}
            >
              <HiArrowLeftOnRectangle className="text-sm lg:text-xl text-blue-300" />
            </button>

            <p className="tracking-[.18em] text-sm lg:text-base text-white font-bold">
              {dict.selectOnline.chooseLives}
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
                onClick={() => setLives(num)}
                disabled={!isAdmin}
                className={`relative transition-all ${
                  isAdmin ? "hover:scale-110" : "cursor-default opacity-70"
                } ${room?.lives_to_win === num ? "scale-110" : ""}`}
              >
                <FaHeart
                  className={`text-[3.2rem] ${
                    room?.lives_to_win === num
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

          {!isAdmin && (
            <p className="text-xs text-white/50">
              {dict.selectOnline.adminOnly}
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={startBattle}
              disabled={!isAdmin || !readyToPlay}
              className="px-12 py-4 rounded-2xl bg-blue-500 text-white font-bold text-sm sm:text-base border border-blue-400 shadow-[0_0_22px_rgba(59,130,246,.35)] hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,.55)] transition-all duration-300 disabled:opacity-40"
            >
              {dict.selectOnline.play}
            </button>
          </div>
        </div>

        {error && (
          <p className="mx-auto mt-5 max-w-2xl rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-200">
            {error}
          </p>
        )}

        <div className="grid lg:grid-cols-[260px_1fr_260px] gap-3 mt-8 items-center">
          {renderCard(
            player1,
            player1Character,
            1,
            currentPlayer?.slot === 1
              ? "border-blue-400 shadow-[0_0_20px_rgba(59,130,246,.25)]"
              : "border-gray-700",
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-2 content-start max-h-[720px] overflow-y-auto pr-2 p-2 custom-scroll select-grid">
            {characters.map((character) => {
              const Icon = character.icon;
              const isP1 = player1?.character_id === character.id;
              const isP2 = player2?.character_id === character.id;
              const isTakenByRival =
                currentPlayer?.slot === 1
                  ? isP2
                  : currentPlayer?.slot === 2 && isP1;

              return (
                <button
                  key={character.id}
                  disabled={!currentPlayer || isTakenByRival}
                  onClick={() => selectCharacter(character)}
                  onMouseEnter={() => !isTakenByRival && playHover()}
                  className={`rounded-2xl p-4 border min-h-[115px] transition-all relative ${
                    isP1
                      ? "border-blue-400 bg-blue-400/10 scale-105"
                      : isP2
                        ? "border-red-500 bg-red-500/10 scale-105"
                        : isTakenByRival
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

                  <p className="mt-3 text-[10px]">{character.name}</p>
                </button>
              );
            })}
          </div>

          {renderCard(
            player2,
            player2Character,
            2,
            currentPlayer?.slot === 2
              ? "border-red-500 shadow-[0_0_20px_rgba(255,0,0,.25)]"
              : "border-gray-700",
          )}
        </div>

        {exitOpen && (
          <div className="absolute inset-0 z-50 flex items-start md:items-center justify-center rounded-3xl bg-black/75 p-4 pt-10 md:pt-4">
            <div className="panel neon-border w-full max-w-md rounded-3xl p-6 text-center">
              <h2 className="text-2xl font-black text-white">
                {dict.selectOnline.exitTitle}
              </h2>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => {
                    playBtn();
                    setExitOpen(false);
                  }}
                  className="rounded-2xl border border-red-300 bg-red-500 px-6 py-4 font-bold text-white hover:scale-105 transition"
                >
                  {dict.selectOnline.cancel}
                </button>

                <button
                  onClick={leaveRoom}
                  className="rounded-2xl border border-blue-400 bg-blue-900 px-6 py-4 font-bold text-white hover:scale-105 transition"
                >
                  {dict.selectOnline.confirm}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
