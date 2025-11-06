import { useCallback, useRef } from "react";
import { Howl } from "howler";

export const useSound = (sources: string[] | string, volume: number = 0.5) => {
  const soundRefs = useRef<Howl[]>([]);

  // Initialize Howl objects only once
  if (soundRefs.current.length === 0) {
    const srcArray = Array.isArray(sources) ? sources : [sources];
    soundRefs.current = srcArray.map(src => new Howl({ src: [src], volume }));
  }

  // Play a random sound
  const play = useCallback(() => {
    if (soundRefs.current.length > 0) {
      const randomIndex = Math.floor(Math.random() * soundRefs.current.length);
      soundRefs.current[randomIndex].play();
    }
  }, []);

  return play;
};
