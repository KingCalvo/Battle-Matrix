"use client";

import { useEffect } from "react";
import { Howl, Howler } from "howler";
import { usePathname } from "next/navigation";

const isMenuRoute = (pathname) => {
  return /^\/(es|en)(\/(mode|lobby|local-mode))?$/.test(pathname);
};

let backgroundMusic = null;

export default function BackgroundMusic() {
  const pathname = usePathname();

  useEffect(() => {
    const allowed = isMenuRoute(pathname);

    if (!allowed) {
      if (backgroundMusic) {
        backgroundMusic.stop();
        backgroundMusic.unload();
        backgroundMusic = null;
      }
      return;
    }

    if (!backgroundMusic) {
      backgroundMusic = new Howl({
        src: ["/sounds/OTS-Home.mp3"],
        volume: 0.1,
        loop: true,
        preload: true,
      });
    }

    const startMusic = async () => {
      try {
        if (Howler.ctx?.state !== "running") {
          await Howler.ctx?.resume();
        }

        if (!backgroundMusic.playing()) {
          backgroundMusic.play();
        }
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

    void startMusic();

    return () => {
      window.removeEventListener("user-interacted", handleCustomEvent);
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
    };
  }, [pathname]);

  return null;
}
