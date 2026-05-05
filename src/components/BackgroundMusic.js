"use client";

import { useEffect, useRef } from "react";
import { Howl, Howler } from "howler";
import { usePathname } from "next/navigation";

const isMenuRoute = (pathname) => {
  return /^\/(es|en)(\/(mode|lobby|local-mode))?$/.test(pathname);
};

export default function BackgroundMusic() {
  const pathname = usePathname();
  const startedRef = useRef(false);
  const musicRef = useRef(null);

  useEffect(() => {
    const allowed = isMenuRoute(pathname);

    if (!allowed) {
      if (musicRef.current) {
        musicRef.current.stop();
      }
      startedRef.current = false;
      return;
    }

    if (!musicRef.current) {
      musicRef.current = new Howl({
        src: ["/sounds/OTS-Home.mp3"],
        volume: 0.2,
        loop: true,
        preload: true,
      });
    }

    const startMusic = async () => {
      if (startedRef.current) return;

      try {
        if (Howler.ctx?.state !== "running") {
          await Howler.ctx?.resume();
        }

        musicRef.current?.play();
        startedRef.current = true;
      } catch (error) {
        console.log("No se pudo iniciar la música global:", error);
      }
    };

    const handleUserGesture = () => {
      void startMusic();
    };

    const handleCustomEvent = () => {
      void startMusic();
    };

    window.addEventListener("user-interacted", handleCustomEvent);
    window.addEventListener("pointerdown", handleUserGesture, { once: true });
    window.addEventListener("keydown", handleUserGesture, { once: true });
    window.addEventListener("touchstart", handleUserGesture, { once: true });

    return () => {
      window.removeEventListener("user-interacted", handleCustomEvent);
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
    };
  }, [pathname]);

  return null;
}
