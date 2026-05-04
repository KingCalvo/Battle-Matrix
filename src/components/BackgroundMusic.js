"use client";

import { useEffect, useRef } from "react";
import useSound from "use-sound";
import { Howler } from "howler";
import { usePathname } from "next/navigation";

export default function BackgroundMusic() {
  const pathname = usePathname();
  const startedRef = useRef(false);

  const [playMusic, { stop }] = useSound("/sounds/OTS-Home.mp3", {
    volume: 0.2,
    loop: true,
    preload: true,
  });

  useEffect(() => {
    const unlock = async () => {
      if (startedRef.current) return;

      if (Howler.ctx?.state !== "running") {
        await Howler.ctx.resume();
      }

      playMusic();
      startedRef.current = true;
    };

    if (pathname === "/" || pathname === "/mode") {
      window.addEventListener("pointerdown", unlock);
      window.addEventListener("keydown", unlock);
    } else {
      stop();
      startedRef.current = false;
    }

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [pathname, playMusic, stop]);

  return null;
}
