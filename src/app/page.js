"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="panel neon-border rounded-3xl p-10 max-w-xl w-full text-center relative scanlines">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black glow-text"
        >
          BATTLE MATRIX
        </motion.h1>

        <p className="mt-4 text-cyan-300 tracking-[.35em] text-sm md:text-base">
          Night City 2077
        </p>

        <p className="mt-6 text-gray-300">
          Entra en la arena y elige tu unidad cibernética.
        </p>

        <button
          onClick={() => router.push("/select")}
          className="mt-8 px-8 py-4 rounded-2xl bg-cyan-400 text-black font-bold hover:scale-105 transition"
        >
          INICIAR
        </button>
      </div>
    </main>
  );
}
