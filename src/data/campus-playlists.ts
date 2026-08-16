export type CampusTrack = {
  id: string;
  title: string;
  artist: string;
  audio: string;
  cover: string;
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

export const campusTracks: CampusTrack[] = POLITICAL_FILES.map(trackFromFile);
