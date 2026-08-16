import { Instagram } from "lucide-react";

const INSTAGRAM_HANDLE = "bhaturee_chhhole";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

export function InstagramHandle() {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Instagram @${INSTAGRAM_HANDLE}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.04em] text-white/75 backdrop-blur-md transition-all hover:border-white/35 hover:bg-black/55 hover:text-white active:scale-95 sm:px-3.5 sm:text-[0.68rem]"
    >
      <Instagram className="h-3.5 w-3.5 shrink-0" />
      <span>@{INSTAGRAM_HANDLE}</span>
    </a>
  );
}
