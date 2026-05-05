"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import useSound from "use-sound";
import {
  HiCheck,
  HiClipboardDocument,
  HiClipboardDocumentCheck,
  HiNoSymbol,
  HiShieldCheck,
  HiUserMinus,
} from "react-icons/hi2";
import { supabase } from "@/lib/supabaseClient";
import {
  clearOnlineSession,
  getOnlineSession,
  saveOnlineSession,
} from "@/lib/onlineSession";

function normalizeCode(value) {
  return value.trim().toUpperCase();
}

export default function LobbyClient() {
  const router = useRouter();

  const [playBtn] = useSound("/sounds/btnSound-3.wav", {
    volume: 0.3,
  });

  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [session, setSession] = useState(null);
  const [kickedModal, setKickedModal] = useState(false);

  const currentPlayer = useMemo(
    () => players.find((player) => player.id === session?.playerId) || null,
    [players, session],
  );

  const adminPlayer = useMemo(
    () => players.find((player) => player.role === "admin") || null,
    [players],
  );

  const isAdmin = currentPlayer?.role === "admin";

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
            "No se pudo cargar la sala",
        );
        return;
      }

      setRoom(roomData);
      setPlayers(playerData || []);

      if (roomData.status === "select") {
        router.push("/select-online");
      }

      if (roomData.status === "ended") {
        clearOnlineSession();
        setSession(null);
        setRoom(null);
        setPlayers([]);
        setError("La sala terminó. Genera otro código para jugar de nuevo.");
      }
    },
    [router],
  );

  useEffect(() => {
    if (!session || !room) return;

    const exists = players.some((p) => p.id === session.playerId);

    if (!exists && players.length > 0) {
      clearOnlineSession();

      Promise.resolve().then(() => {
        setSession(null);
        setRoom(null);
        setPlayers([]);
        setKickedModal(true);
      });
    }
  }, [players, session, room]);

  useEffect(() => {
    let active = true;

    const savedSession = getOnlineSession();

    if (!savedSession?.roomId || !savedSession?.playerId) {
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
  }, [fetchRoomState]);

  useEffect(() => {
    if (!session?.roomId) return;

    const channel = supabase
      .channel(`online-lobby-${session.roomId}`)
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

  async function createRoom() {
    playBtn();
    setLoading(true);
    setError("");

    const { data, error: rpcError } = await supabase.rpc("create_online_room", {
      player_name: playerName,
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const createdRoom = data?.[0];

    if (!createdRoom) {
      setError("No se pudo crear la sala.");
      return;
    }

    const nextSession = {
      roomId: createdRoom.room_id,
      playerId: createdRoom.player_id,
      roomCode: createdRoom.room_code,
    };

    saveOnlineSession(nextSession);
    setSession(nextSession);
    setJoinCode(createdRoom.room_code);
    fetchRoomState(createdRoom.room_id);
  }

  async function joinRoom() {
    playBtn();
    setLoading(true);
    setError("");

    const { data, error: rpcError } = await supabase.rpc("join_online_room", {
      room_code_arg: normalizeCode(joinCode),
      player_name_arg: playerName,
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const joinedRoom = data?.[0];

    if (!joinedRoom) {
      setError("No se pudo entrar a la sala.");
      return;
    }

    const nextSession = {
      roomId: joinedRoom.room_id,
      playerId: joinedRoom.player_id,
      roomCode: joinedRoom.room_code,
    };

    saveOnlineSession(nextSession);
    setSession(nextSession);
    fetchRoomState(joinedRoom.room_id);
  }

  async function copyCode() {
    playBtn();

    if (!room?.code) return;

    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  async function pasteCode() {
    playBtn();

    try {
      const text = await navigator.clipboard.readText();
      setJoinCode(text.toUpperCase().slice(0, 6));
    } catch {
      setError("No se pudo pegar el código");
    }
  }

  async function updateName() {
    if (!currentPlayer || !playerName.trim()) return;

    playBtn();
    setError("");

    const { error: rpcError } = await supabase.rpc("update_player_name", {
      player_id_arg: currentPlayer.id,
      new_name: playerName,
    });

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    fetchRoomState(currentPlayer.room_id);
  }

  async function toggleReady() {
    if (!currentPlayer) return;

    playBtn();
    setError("");

    const { error: rpcError } = await supabase.rpc("set_lobby_ready", {
      player_id_arg: currentPlayer.id,
      ready_arg: !currentPlayer.ready_lobby,
    });

    if (rpcError) {
      setError(rpcError.message);
    }
  }

  async function kickPlayer(targetPlayer) {
    if (!currentPlayer || !targetPlayer || targetPlayer.role === "admin")
      return;

    playBtn();
    setError("");

    const { error: rpcError } = await supabase.rpc("kick_online_player", {
      admin_player_id_arg: currentPlayer.id,
      target_player_id_arg: targetPlayer.id,
    });

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    fetchRoomState(currentPlayer.room_id);
  }

  async function leaveRoom() {
    playBtn();

    if (session?.playerId) {
      await supabase.rpc("leave_online_room", {
        player_id_arg: session.playerId,
      });
    }

    clearOnlineSession();
    router.push("/mode");
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 flex items-center justify-center">
      <div className="panel neon-border rounded-3xl w-full max-w-4xl relative overflow-hidden scanlines">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,.16),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,0,0,.10),transparent_30%)]" />

        <div className="relative z-10 p-6 md:p-12">
          <div className="flex flex-col items-center justify-center gap-6">
            <motion.h1
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="text-center text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_14px_rgba(255,255,255,.35)]"
            >
              Bienvenido al lobby
            </motion.h1>

            <p className="max-w-2xl text-white/70 text-base md:text-lg text-center leading-relaxed">
              Genera un codigo y compartelo con tu rival, si te compartieron un
              codigo colocalo para jugar con tu rival
            </p>

            <button
              onClick={() => {
                playBtn();
                router.push("/mode");
              }}
              className="px-8 py-3 rounded-2xl bg-blue-900 text-white font-bold border border-blue-400 shadow-[0_0_18px_rgba(59,130,246,.22)] hover:scale-105 hover:shadow-[0_0_22px_rgba(59,130,246,.35)] transition-all duration-300"
            >
              Modos de juego
            </button>

            <div className="w-full grid gap-5">
              <div className="panel rounded-3xl border border-blue-400/50 p-4 md:p-5">
                <div className="flex justify-center mb-4">
                  <h2 className="text-white font-black text-center text-2xl">
                    Sala de juego
                  </h2>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-center">
                    <button
                      onClick={createRoom}
                      disabled={loading || Boolean(room)}
                      className="w-full px-6 py-3 rounded-2xl bg-blue-500 text-white font-bold border border-blue-300 shadow-[0_0_18px_rgba(59,130,246,.25)] hover:scale-105 transition-all disabled:opacity-40"
                    >
                      Generar código
                    </button>

                    <input
                      readOnly
                      value={room?.code || ""}
                      placeholder="Código de partida"
                      className="w-full rounded-2xl border border-blue-400/40 bg-black/25 px-4 py-3 text-center text-white font-black tracking-[.28em] outline-none"
                    />

                    <button
                      onClick={copyCode}
                      disabled={!room?.code}
                      className="min-w-[140px] px-6 py-3 rounded-2xl bg-blue-900 text-white font-bold border border-blue-400 hover:scale-105 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <HiClipboardDocument className="text-xl" />
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto_auto] lg:items-center">
                    <p className="text-white font-bold text-center lg:text-center whitespace-nowrap">
                      Ingresar código
                    </p>

                    <input
                      value={joinCode}
                      onChange={(event) =>
                        setJoinCode(event.target.value.toUpperCase())
                      }
                      placeholder="Pega el código"
                      maxLength={6}
                      className="w-full rounded-2xl border border-blue-400/40 bg-black/25 px-4 py-3 text-center text-white font-black tracking-[.28em] outline-none focus:border-blue-300"
                    />

                    <button
                      onClick={pasteCode}
                      disabled={loading || Boolean(room)}
                      className="px-4 py-3 rounded-2xl bg-blue-900 text-white font-bold border border-blue-400 hover:scale-105 transition-all disabled:opacity-40 flex items-center justify-center"
                    >
                      <HiClipboardDocumentCheck className="text-xl" />
                    </button>

                    <button
                      onClick={joinRoom}
                      disabled={loading || Boolean(room) || !joinCode.trim()}
                      className="min-w-[140px] px-6 py-3 rounded-2xl bg-blue-500 text-white font-bold border border-blue-300 hover:scale-105 transition-all disabled:opacity-40"
                    >
                      Ingresar
                    </button>
                  </div>
                </div>
              </div>

              <div className="panel rounded-3xl border border-blue-400/50 p-4 md:p-5">
                <h2 className="text-white font-black text-2xl text-center">
                  Cambia tu nombre
                </h2>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    placeholder={
                      currentPlayer?.name ||
                      "Cambia tu nombre al generar el código"
                    }
                    className="w-full rounded-2xl border border-blue-400/40 bg-black/25 px-4 py-3 text-white outline-none focus:border-blue-300"
                  />

                  {currentPlayer && (
                    <button
                      onClick={updateName}
                      disabled={!playerName.trim()}
                      className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-bold border border-blue-300 hover:scale-105 transition-all disabled:opacity-40"
                    >
                      Actualizar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <p className="w-full rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-200">
                {error}
              </p>
            )}

            <div className="w-full panel rounded-3xl border border-blue-400/40 p-4 md:p-5">
              <h2 className="text-center text-2xl font-black text-white">
                Lista de jugadores de la partida
              </h2>

              <div className="mt-5 overflow-x-auto custom-scroll">
                <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left">
                  <thead>
                    <tr className="text-sm text-white/60 text-center">
                      <th className="px-3 py-2">Jugador</th>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Rol</th>
                      <th className="px-3 py-2">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[1, 2].map((slot) => {
                      const player = players.find((item) => item.slot === slot);

                      return (
                        <tr
                          key={slot}
                          className="rounded-2xl bg-white/[.04] text-white text-center"
                        >
                          <td className="px-3 py-3 font-black">{slot}</td>
                          <td className="px-3 py-3">
                            {player?.name || "Esperando rival..."}
                          </td>
                          <td className="px-3 py-3">
                            {player ? (
                              <span className="inline-flex items-center gap-2">
                                {player.role === "admin" && (
                                  <HiShieldCheck className="text-blue-300" />
                                )}
                                {player.role === "admin" ? "Admin" : "Invitado"}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                disabled={
                                  !isAdmin || !player || player.role === "admin"
                                }
                                onClick={() => kickPlayer(player)}
                                title="Expulsar"
                                className="p-2 rounded-xl bg-white/5 text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                              >
                                <HiUserMinus className="text-lg" />
                              </button>

                              <span
                                title={
                                  player?.ready_lobby ? "Listo" : "Pendiente"
                                }
                                className={`p-2 rounded-xl ${
                                  player?.ready_lobby
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "bg-white/5 text-white/40"
                                }`}
                              >
                                {player?.ready_lobby ? (
                                  <HiCheck className="text-lg" />
                                ) : (
                                  <HiNoSymbol className="text-lg" />
                                )}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col items-center justify-center gap-4 md:flex-row">
                <button
                  onClick={toggleReady}
                  disabled={!currentPlayer || players.length < 2}
                  className="px-8 py-4 rounded-2xl bg-blue-500 text-white font-black border border-blue-300 shadow-[0_0_22px_rgba(59,130,246,.35)] hover:scale-105 transition-all disabled:opacity-40"
                >
                  {currentPlayer?.ready_lobby
                    ? "Cancelar inicio"
                    : "Iniciar partida"}
                </button>

                <div className="flex items-center gap-3">
                  {[1, 2].map((slot) => {
                    const player = players.find((item) => item.slot === slot);

                    return (
                      <span
                        key={slot}
                        title={player?.name || `Jugador ${slot}`}
                        className={`h-6 w-6 rounded-full border ${
                          player?.ready_lobby
                            ? "border-blue-300 bg-blue-400 shadow-[0_0_14px_rgba(59,130,246,.75)]"
                            : "border-white/30 bg-transparent"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {room && (
              <button
                onClick={leaveRoom}
                className="px-8 py-3 rounded-2xl bg-red-500 text-white font-bold border border-red-300 hover:scale-105 transition-all"
              >
                Salir de la sala
              </button>
            )}
          </div>
        </div>
      </div>

      {kickedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="panel neon-border rounded-3xl p-8 text-center max-w-sm w-full">
            <h2 className="text-2xl font-black text-white">
              Te han sacado de la partida
            </h2>

            <button
              onClick={() => {
                playBtn();
                setKickedModal(false);
                router.push("/mode");
              }}
              className="mt-6 w-full py-3 rounded-2xl bg-blue-500 text-white font-bold border border-blue-300 hover:scale-105 transition"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
