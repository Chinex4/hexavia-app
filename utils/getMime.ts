// No Node deps. Works in React Native.
const TABLE: Record<string, string> = {
  // images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
  bmp: "image/bmp",
  // docs
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  html: "text/html",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  json: "application/json",
  // audio
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  aac: "audio/aac",
  ogg: "audio/ogg",
  // video (if you’ll ever upload)
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  // archives
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
};

const EXT_RE = /\.([a-z0-9]+)(?:\?|#|$)/i;

export function extOf(nameOrUrl?: string | null): string {
  if (!nameOrUrl) return "";
  const m = EXT_RE.exec(nameOrUrl);
  return (m?.[1] || "").toLowerCase();
}

export function getMimeFromName(nameOrUrl?: string | null): string | null {
  const ext = extOf(nameOrUrl);
  if (!ext) return null;
  return TABLE[ext] || null;
}
