import { useEffect, useState } from "react";

const TAGLINES = [
  "Now streaming: kranti geet.",
  "Now streaming: hostel nights.",
  "Now streaming: dhaba hour.",
  "Now streaming: campus after dark.",
];

const LISTENING_COUNT = 42;

export function CampusTitle() {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTaglineIndex((i) => (i + 1) % TAGLINES.length);
        setFade(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center text-center text-glow">
      <h1 className="brand-mark font-display text-[2.8rem] leading-none text-white sm:text-[4.5rem] lg:text-[5.5rem]">
        जे.एन.यू.
      </h1>
      <p className="mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.55em] text-white/55 sm:text-[0.62rem]">
        Campus Radio
      </p>
      <p
        className={`mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[0.65rem] font-medium text-white/50 sm:text-xs transition-opacity duration-400 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-online opacity-40" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-online" />
          </span>
          <span>{LISTENING_COUNT} listening across campus</span>
        </span>
        <span className="text-white/25" aria-hidden="true">
          •
        </span>
        <span className="italic">{TAGLINES[taglineIndex]}</span>
      </p>
    </div>
  );
}
