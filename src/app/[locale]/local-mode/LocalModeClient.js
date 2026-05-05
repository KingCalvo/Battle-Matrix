"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import useSound from "use-sound";
import useGameStore from "@/store/useGameStore";
import {
  GiSwordman,
  GiSkeletonInside,
  GiArtificialIntelligence,
} from "react-icons/gi";

export default function LocalModeClient({ dict }) {
  const router = useRouter();

  const { setGameMode, setPlayer1, setPlayer2 } = useGameStore();

  const [playBtn] = useSound("/sounds/btnSound-3.wav", {
    volume: 0.3,
  });

  const chooseFriend = () => {
    playBtn();

    setGameMode("friend");
    setPlayer1(null);
    setPlayer2(null);

    setTimeout(() => {
      router.push(`/${dict.locale}/select`);
    }, 140);
  };

  const chooseAI = () => {
    playBtn();

    setGameMode("ai");
    setPlayer1(null);
    setPlayer2(null);

    setTimeout(() => {
      router.push(`/${dict.locale}/select`);
    }, 140);
  };

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 flex items-center justify-center">
      <div className="panel neon-border rounded-3xl w-full max-w-4xl relative overflow-hidden scanlines">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,.16),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,0,0,.10),transparent_30%)]" />

        <div className="relative z-10 p-6 md:p-12">
          <div className="flex flex-col items-center justify-center gap-8">
            <motion.h1
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="text-center text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-[0_0_14px_rgba(255,255,255,.35)]"
            >
              {dict.localMode.title}
            </motion.h1>

            <p className="text-white/70 text-base md:text-lg text-center">
              {dict.localMode.subtitle}
            </p>

            <button
              onClick={() => {
                playBtn();
                setTimeout(() => router.push(`/${dict.locale}/mode`), 140);
              }}
              className="px-8 py-3 rounded-2xl bg-blue-900 text-white font-bold border border-blue-400 shadow-[0_0_18px_rgba(59,130,246,.22)] hover:scale-105 hover:shadow-[0_0_22px_rgba(59,130,246,.35)] transition-all duration-300"
            >
              {dict.localMode.back}
            </button>

            <div className="grid md:grid-cols-2 gap-6 w-full">
              {/* Friend */}
              <motion.button
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45 }}
                onClick={chooseFriend}
                className="panel rounded-3xl p-10 border border-blue-400 hover:scale-105 transition-all shadow-[0_0_24px_rgba(59,130,246,.25)]"
              >
                <div className="flex justify-center gap-5">
                  <GiSwordman className="text-7xl text-blue-300" />
                  <GiSkeletonInside className="text-7xl text-blue-300" />
                </div>

                <p className="mt-8 text-2xl font-black text-white text-center">
                  {dict.localMode.friend}
                </p>
              </motion.button>

              {/* AI */}
              <motion.button
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
                onClick={chooseAI}
                className="panel rounded-3xl p-10 border border-red-500 hover:scale-105 transition-all shadow-[0_0_24px_rgba(255,0,0,.22)]"
              >
                <div className="flex justify-center">
                  <GiArtificialIntelligence className="text-7xl text-red-500" />
                </div>

                <p className="mt-8 text-2xl font-black text-white text-center">
                  {dict.localMode.ai}
                </p>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
