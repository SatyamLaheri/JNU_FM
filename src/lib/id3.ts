export type ID3Metadata = {
  title?: string;
  artist?: string;
  album?: string;
  coverUrl?: string;
};

const metadataCache = new Map<string, ID3Metadata>();

/**
 * Reads ID3v2 tag metadata (Title, Artist, Album, Cover Picture) directly
 * from the first 256KB of an MP3 audio file on-demand.
 */
export async function extractID3Metadata(audioUrl: string): Promise<ID3Metadata> {
  if (metadataCache.has(audioUrl)) {
    return metadataCache.get(audioUrl)!;
  }

  try {
    // Fetch only the first 256KB to keep byte payload minimal
    let res = await fetch(audioUrl, {
      headers: { Range: "bytes=0-262144" },
    });

    if (!res.ok && res.status !== 206) {
      res = await fetch(audioUrl);
    }

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for ID3 header magic bytes 'I' 'D' '3'
    if (bytes.length < 10 || bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
      const fallback: ID3Metadata = {};
      metadataCache.set(audioUrl, fallback);
      return fallback;
    }

    const version = bytes[3];
    const tagSize =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);

    let offset = 10;
    const maxOffset = Math.min(bytes.length, 10 + tagSize);

    const meta: ID3Metadata = {};

    while (offset + 10 < maxOffset) {
      let frameId = "";
      let frameSize = 0;

      if (version === 3 || version === 4) {
        frameId = String.fromCharCode(...bytes.slice(offset, offset + 4));
        if (version === 4) {
          frameSize =
            ((bytes[offset + 4] & 0x7f) << 21) |
            ((bytes[offset + 5] & 0x7f) << 14) |
            ((bytes[offset + 6] & 0x7f) << 7) |
            (bytes[offset + 7] & 0x7f);
        } else {
          frameSize =
            (bytes[offset + 4] << 24) |
            (bytes[offset + 5] << 16) |
            (bytes[offset + 6] << 8) |
            bytes[offset + 7];
        }
        offset += 10;
      } else if (version === 2) {
        frameId = String.fromCharCode(...bytes.slice(offset, offset + 3));
        frameSize = (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
        offset += 6;
      } else {
        break;
      }

      if (frameSize <= 0 || offset + frameSize > maxOffset) break;

      const frameData = bytes.subarray(offset, offset + frameSize);

      if (frameId === "TIT2" || frameId === "TT2") {
        meta.title = parseTextFrame(frameData);
      } else if (frameId === "TPE1" || frameId === "TP1") {
        meta.artist = parseTextFrame(frameData);
      } else if (frameId === "TALB" || frameId === "TAL") {
        meta.album = parseTextFrame(frameData);
      } else if (frameId === "APIC" || frameId === "PIC") {
        const cover = parsePictureFrame(frameData, version === 2);
        if (cover) {
          meta.coverUrl = cover;
        }
      }

      offset += frameSize;
    }

    metadataCache.set(audioUrl, meta);
    return meta;
  } catch (e) {
    console.warn("ID3 metadata extraction fallback for:", audioUrl, e);
    const fallback: ID3Metadata = {};
    metadataCache.set(audioUrl, fallback);
    return fallback;
  }
}

function parseTextFrame(data: Uint8Array): string {
  if (data.length <= 1) return "";
  const encoding = data[0];
  const textBytes = data.subarray(1);

  if (encoding === 1 || encoding === 2) {
    // UTF-16
    return new TextDecoder("utf-16").decode(textBytes).replace(/\0/g, "").trim();
  } else if (encoding === 3) {
    // UTF-8
    return new TextDecoder("utf-8").decode(textBytes).replace(/\0/g, "").trim();
  } else {
    // ISO-8859-1
    return new TextDecoder("iso-8859-1").decode(textBytes).replace(/\0/g, "").trim();
  }
}

function parsePictureFrame(data: Uint8Array, isV2: boolean): string | null {
  try {
    if (data.length < 10) return null;
    let mimeType = "image/jpeg";
    let pos = 1; // skip encoding byte

    if (isV2) {
      const format = String.fromCharCode(...data.subarray(pos, pos + 3));
      pos += 3;
      if (format.toLowerCase() === "png") mimeType = "image/png";
    } else {
      let mimeEnd = pos;
      while (mimeEnd < data.length && data[mimeEnd] !== 0) mimeEnd++;
      mimeType = new TextDecoder("iso-8859-1").decode(data.subarray(pos, mimeEnd));
      pos = mimeEnd + 1;
    }

    // Skip picture type byte (1 byte)
    pos++;

    // Skip description string until null terminator
    while (pos < data.length && data[pos] !== 0) pos++;
    pos++;

    if (pos >= data.length) return null;

    const imgData = data.subarray(pos);
    const blob = new Blob([imgData], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
