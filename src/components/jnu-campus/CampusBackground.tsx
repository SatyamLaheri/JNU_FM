const bgClass =
  "pointer-events-none fixed inset-0 z-0 h-full w-full object-cover object-center sm:object-[38%_center] lg:object-center";

export function CampusBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#120c0a]"
      aria-hidden="true"
    >
      <picture>
        <source media="(max-width: 639px)" srcSet="/backgrounds/Mobile.png" />
        <img
          src="/jnu-campus-bg.png"
          alt=""
          className={bgClass}
          decoding="async"
          fetchPriority="high"
        />
      </picture>
    </div>
  );
}
