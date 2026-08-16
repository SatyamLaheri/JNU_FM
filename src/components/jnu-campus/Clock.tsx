import { useClock } from "@/hooks/useClock";

export function Clock() {
  const { time, date } = useClock();

  return (
    <div className="select-none text-glow" aria-live="off">
      <p className="text-lg font-medium tracking-tight text-white text-glow sm:text-xl">
        {time || "\u00A0"}
      </p>
      <p className="mt-0.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-white/55 sm:text-[0.65rem]">
        {date || "\u00A0"}
      </p>
    </div>
  );
}
