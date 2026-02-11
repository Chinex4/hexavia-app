import type {
  ChannelResource,
  ChannelResourceCategory,
} from "./resources.types";

export const CATEGORY_ORDER: ChannelResourceCategory[] = [
  "image",
  "document",
  "audio",
  "video",
  "folder",
  "other",
];

export const prettyCategory = (c: ChannelResourceCategory) => {
  switch (c) {
    case "image":
      return "Images";
    case "document":
      return "Documents";
    case "audio":
      return "Audio";
    case "video":
      return "Videos";
    case "folder":
      return "Folders";
    default:
      return "Others";
  }
};

export const ext = (name?: string | null) => {
  if (!name) return "";
  const m = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(name);
  return (m?.[1] || "").toLowerCase();
};

export const detectCategory = (r: ChannelResource): ChannelResourceCategory => {
  if (r.category && CATEGORY_ORDER.includes(r.category)) return r.category;

  const raw = (r.resourceUpload || "").toLowerCase();
  const dataMime =
    raw.startsWith("data:") && raw.includes(";")
      ? raw.slice(5, raw.indexOf(";"))
      : "";
  const m = (r.mimetype || r.mime || dataMime || raw || "").toLowerCase();
  const e = ext(r.name || r.resourceUpload);

  if (m.includes("image/")) return "image";
  if (m === "application/pdf" || e === "pdf") return "document";
  if (
    m.includes("audio/") ||
    ["mp3", "wav", "m4a", "aac", "ogg"].includes(e)
  )
    return "audio";
  if (
    m.includes("video/") ||
    ["mp4", "mov", "avi", "mkv", "webm"].includes(e)
  )
    return "video";
  if (["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(e))
    return "image";
  // console.log(r.category)
  return "other";
};
