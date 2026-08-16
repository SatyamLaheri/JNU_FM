const bgClass =
  "pointer-events-none fixed inset-0 z-0 h-full w-full object-cover object-[30%_42%] sm:object-[38%_center] lg:object-center";

export function CampusBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#120c0a]"
      aria-hidden="true"
    >
      <img
        src="/jnu-campus-bg.png"
        alt=""
        className={bgClass}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}
