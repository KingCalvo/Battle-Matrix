"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSound from "use-sound";
import { Howler } from "howler";
import { motion, AnimatePresence } from "framer-motion";
import { GiBatBlade } from "react-icons/gi";

export default function Home() {
  const router = useRouter();

  const [booted, setBooted] = useState(false);

  const [playMusic, { stop }] = useSound("/sounds/OTS-Home.mp3", {
    volume: 0.2,
    loop: true,
    preload: true,
  });

  useEffect(() => {
    const unlock = async () => {
      try {
        if (Howler.ctx?.state !== "running") {
          await Howler.ctx.resume();
        }

        playMusic();
        setBooted(true);

        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
      } catch (error) {
        console.log("Audio bloqueado");
      }
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });

    return () => {
      stop();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, [playMusic, stop]);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Overlay */}
      <AnimatePresence>
        {!booted && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 z-50 bg-[#05070d] flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.95, 1.03, 0.95],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="text-center"
            >
              <GiBatBlade className="mx-auto text-[6rem] text-blue-300 drop-shadow-[0_0_24px_rgba(59,130,246,.55)]" />

              <p className="mt-8 text-white text-xl md:text-3xl font-black tracking-[.28em]">
                PRESIONA CUALQUIER TECLA
              </p>

              <p className="mt-3 text-blue-300 tracking-[.22em] text-xs md:text-sm">
                CLICK · TOUCH · ENTER
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pantalla principal */}
      <div className="panel neon-border rounded-3xl w-full max-w-4xl relative overflow-hidden scanlines">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,.16),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,0,0,.10),transparent_30%)]" />

        <div className="relative z-10 p-6 md:p-12">
          <div className="flex flex-col items-center justify-center gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-3xl" />

              <GiBatBlade className="relative text-[7rem] md:text-[10rem] text-blue-300 drop-shadow-[0_0_24px_rgba(59,130,246,.55)]" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-2xl sm:text-5xl md:text-7xl font-black text-white whitespace-nowrap tracking-[.12em] drop-shadow-[0_0_14px_rgba(255,255,255,.35)]"
            >
              BATTLE MATRIX
            </motion.h1>

            <p className="max-w-2xl text-white/80 text-sm text-center md:text-base leading-relaxed">
              Entra en la arena, elige tu personaje y domina la batalla.
            </p>

            <button
              onClick={() => router.push("/select")}
              className="mt-5 px-10 py-4 rounded-2xl bg-blue-900 text-white font-black border border-blue-400 shadow-[0_0_18px_rgba(59,130,246,.22)] hover:scale-105 hover:shadow-[0_0_22px_rgba(59,130,246,.35)] transition-all duration-300"
            >
              PLAY
            </button>

            <div className="mt-8 flex items-center gap-3 text-[10px] sm:text-xs tracking-[.28em] text-white/60 whitespace-nowrap">
              <span className="h-px w-0 lg:w-10 bg-white/20" />
              <span>PRESENTADO POR ENRIQUE CALVO GARCIA</span>
              <span className="h-px w-0 lg:w-10 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
