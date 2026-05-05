"use client";

import { useEffect, useRef } from "react";
import useSound from "use-sound";
import { Howler } from "howler";
import { usePathname } from "next/navigation";

const MENU_ROUTES = new Set(["/", "/mode", "/lobby", "/local-mode"]);

export default function BackgroundMusic() {
  const pathname = usePathname();
  const startedRef = useRef(false);

  const [playMusic, { stop }] = useSound("/sounds/OTS-Home.mp3", {
    volume: 0.2,
    loop: true,
    preload: true,
  });

  useEffect(() => {
    const allowed = MENU_ROUTES.has(pathname);

    const startMusic = async () => {
      if (startedRef.current) return;

      try {
        if (Howler.ctx?.state !== "running") {
          await Howler.ctx?.resume();
        }

        if (Howler.ctx?.state === "running") {
          playMusic();
          startedRef.current = true;
        }
      } catch (error) {
        console.log("No se pudo iniciar la música global:", error);
      }
    };

    const handleUserGesture = () => {
      void startMusic();
    };

    if (!allowed) {
      stop();
      startedRef.current = false;
      return;
    }

    if (Howler.ctx?.state === "running") {
      void startMusic();
    }

    window.addEventListener("pointerdown", handleUserGesture);
    window.addEventListener("keydown", handleUserGesture);
    window.addEventListener("touchstart", handleUserGesture);

    return () => {
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
    };
  }, [pathname, playMusic, stop]);

  return null;
}
