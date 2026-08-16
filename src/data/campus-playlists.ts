export type CampusTrack = {
  id: string;
  title: string;
  artist: string;
  audio: string;
  cover: string;
};

export type WingPreference = "neutral" | "left" | "right";

export type WingOption = {
  id: WingPreference;
  label: string;
  shortLabel: string;
};

const POLITICAL_DIR = "/music/pollitical";

/** Tracks in `public/music/pollitical/Left/` — 1.mp3, 2.mp3, … */
const LEFT_TRACK_COUNT = 11;

/** Tracks in `public/music/pollitical/Right/` — 1.mp3, 2.mp3, … */
const RIGHT_TRACK_COUNT = 9;

export const wingOptions: WingOption[] = [
  { id: "neutral", label: "मिश्रित विचारधारा", shortLabel: "मिश्रित" },
  { id: "left", label: "वामपंथी विचारधारा", shortLabel: "वाम" },
  { id: "right", label: "दक्षिणपंथी विचारधारा", shortLabel: "दक्षिण" },
];

export function getWingOption(wing: WingPreference) {
  return wingOptions.find((option) => option.id === wing) ?? wingOptions[0]!;
}

export const defaultWingPreference: WingPreference = "neutral";

function trackAudioPath(relativePath: string) {
  return `${POLITICAL_DIR}/${relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

function numberedFolderTracks(folder: "Left" | "Right", count: number): CampusTrack[] {
  return Array.from({ length: count }, (_, index) => {
    const file = `${index + 1}.mp3`;
    const relativePath = `${folder}/${file}`;

    return {
      id: relativePath,
      title: "",
      artist: "",
      audio: trackAudioPath(relativePath),
      cover: "",
    };
  });
}

const leftTracks = numberedFolderTracks("Left", LEFT_TRACK_COUNT);
const rightTracks = numberedFolderTracks("Right", RIGHT_TRACK_COUNT);

function buildNeutralPlaylist(left: CampusTrack[], right: CampusTrack[]) {
  const playlist: CampusTrack[] = [];
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftTrack = left[index];
    const rightTrack = right[index];

    if (leftTrack) playlist.push(leftTrack);
    if (rightTrack) playlist.push(rightTrack);
  }

  return playlist;
}

export function getTracksForWing(wing: WingPreference): CampusTrack[] {
  switch (wing) {
    case "left":
      return leftTracks;
    case "right":
      return rightTracks;
    default:
      return buildNeutralPlaylist(leftTracks, rightTracks);
  }
}

export const campusTracks = getTracksForWing(defaultWingPreference);
