"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import useSound from "use-sound";
import { GiCrossedSwords, GiBattleAxe } from "react-icons/gi";
import { HiHome } from "react-icons/hi2";

export default function ModeClient({ dict }) {
  const router = useRouter();

  const [playBtn] = useSound("/sounds/btnSound-3.wav", {
    volume: 0.3,
  });

  const goOnline = () => {
    playBtn();

    setTimeout(() => {
      router.push(`/${dict.locale}/lobby`);
    }, 140);
  };

  const goSelect = () => {
    playBtn();

    setTimeout(() => {
      router.push(`/${dict.locale}/local-mode`);
    }, 140);
  };

  const goHome = () => {
    playBtn();

    setTimeout(() => {
      router.push(`/${dict.locale}/`);
    }, 140);
  };

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 flex items-center justify-center relative overflow-hidden">
      <div className="panel neon-border rounded-3xl w-full max-w-4xl relative overflow-hidden scanlines">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,.16),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,0,0,.10),transparent_30%)]" />

        <div className="relative z-10 p-6 md:p-12">
          <div className="flex flex-col items-center justify-center gap-8">
            {/* Título */}
            <motion.h1
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="text-center text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-[0_0_14px_rgba(255,255,255,.35)]"
            >
              {dict.mode.title}
            </motion.h1>

            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              onClick={goHome}
              className="mt-2 px-8 py-3 rounded-2xl bg-blue-900 text-white font-bold border border-blue-400 shadow-[0_0_18px_rgba(59,130,246,.22)] hover:scale-105 hover:shadow-[0_0_22px_rgba(59,130,246,.35)] transition-all duration-300 flex items-center gap-2"
            >
              <HiHome className="text-lg" />
              {dict.mode.home}
            </motion.button>

            {/* Cards */}
            <div className="grid md:grid-cols-2 gap-6 w-full">
              {/* Online */}
              <motion.button
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45 }}
                onClick={goOnline}
                className="panel border border-blue-400 hover:scale-105 transition-all shadow-[0_0_24px_rgba(59,130,246,.25)] rounded-3xl p-8 md:p-10 min-h-[260px] flex flex-col items-center justify-center gap-5"
              >
                <GiCrossedSwords className="text-7xl text-blue-300" />

                <h2 className="text-white text-2xl md:text-3xl font-black text-center">
                  {dict.mode.onlineTitle}
                </h2>

                <p className="text-white/60 text-sm text-center">
                  {dict.mode.onlineDesc}
                </p>
              </motion.button>

              {/* Local */}
              <motion.button
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
                onClick={goSelect}
                className="panel border border-red-500 hover:scale-105 transition-all shadow-[0_0_24px_rgba(255,0,0,.22)] rounded-3xl p-8 md:p-10 min-h-[260px] flex flex-col items-center justify-center gap-5"
              >
                <GiBattleAxe className="text-7xl text-red-500" />

                <h2 className="text-white text-2xl md:text-3xl font-black text-center">
                  {dict.mode.localTitle}
                </h2>

                <p className="text-white/60 text-sm text-center">
                  {dict.mode.localDesc}
                </p>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
