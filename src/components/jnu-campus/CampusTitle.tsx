import { useCampusPresence } from "@/hooks/useCampusPresence";

export function CampusTitle() {
  const listeningCount = useCampusPresence();

  return (
    <div className="flex flex-col items-center text-center text-glow">
      <h1 className="brand-mark font-display text-[2.8rem] leading-none text-white sm:text-[4.5rem] lg:text-[5.5rem]">
        जे.एन.यू.
      </h1>
      <p className="mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.55em] text-white/55 sm:text-[0.62rem]">
        Campus Radio
      </p>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.65rem] font-medium text-white/50 sm:text-xs">
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-online opacity-40" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-online" />
        </span>
        <span>
          {listeningCount === null
            ? "Counting listeners…"
            : `${listeningCount} listening across campus`}
        </span>
      </p>
    </div>
  );
}
