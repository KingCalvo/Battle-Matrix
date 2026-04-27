"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useGameStore from "@/store/useGameStore";

export default function ArenaPage() {
  const router = useRouter();
  const { player1, player2 } = useGameStore();

  useEffect(() => {
    if (!player1 || !player2) {
      router.replace("/select");
    }
  }, [player1, player2, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-5xl glow-text">ARENA ⚔️</h1>
    </main>
  );
}
