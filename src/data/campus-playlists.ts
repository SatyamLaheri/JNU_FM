export type PlaylistType = "political" | "campus";

export type CampusTrack = {
  id: string;
  title: string;
  artist: string;
  audio: string;
  cover: string;
};

export type CampusPlaylist = {
  id: PlaylistType;
  label: string;
  description: string;
  tracks: CampusTrack[];
  comingSoon?: boolean;
};

const POLITICAL_DIR = "/music/pollitical";

/** Files in `public/music/pollitical/` — keep numbered order (1, 2, 3 …) */
const POLITICAL_FILES = [
  "1.Kanhaiya Kumar JNUSU president azadi aazadi - Manshes IIMC (128k).mp3",
  "2.mp3",
  "3.aisa.mp3",
  "4.Abvp Theme Song National Conference (Official Video)Gyan Sheel EktaPundarikaksh DevKeerati - vagyakaar (128k).mp3",
  "5.Gunj Raha Vidyarthi Parishad Ka Jaikara - Rapperiya Baalam (128k).mp3",
  "6.Aaye Ho Meri Zindagi Mein - Female Version_spotdown.org.mp3",
  "7.Bol Ke Lab Azad Hain - Full Video Manto Nawazuddin Siddiqui Sneha Khanwalkar Vidya S & Rashid K - The Pop Culture (128k).mp3",
  "8.Hum Dekhenge - The Kashmir Files Darshan Kumaar & Pallavi Joshi Swapnil Bandodkar - Zee Music Company (128k).mp3",
  "9.Theme Song - ABVP ABVP Rashtrabhakti 69th ABVP National Conference Delhi - ABVP (128k).mp3",
];

function trackFromFile(file: string): CampusTrack {
  return {
    id: file,
    title: "",
    artist: "",
    audio: `${POLITICAL_DIR}/${encodeURIComponent(file)}`,
    cover: "",
  };
}

export const politicalPlaylist: CampusTrack[] = POLITICAL_FILES.map(trackFromFile);

export const campusPlaylist: CampusTrack[] = [];

export const campusPlaylists: CampusPlaylist[] = [
  {
    id: "political",
    label: "Political",
    description: "Kranti geet, student movement anthems, and campus protest songs",
    tracks: politicalPlaylist,
  },
  {
    id: "campus",
    label: "Campus",
    description: "Hostel nights, dhaba hour, and everyday JNU melodies",
    tracks: campusPlaylist,
    comingSoon: true,
  },
];

export function getPlaylistByType(type: PlaylistType): CampusPlaylist {
  const playlist = campusPlaylists.find((p) => p.id === type);
  return playlist ?? campusPlaylists[0]!;
}

export const defaultPlaylistType: PlaylistType = "political";
