import type {
  ChannelResource,
  ChannelResourceCategory,
} from "./resources.types";

export const CATEGORY_ORDER: ChannelResourceCategory[] = [
  "image",
  "document",
  "audio",
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
  const m = (r.mimetype || r.mime || r.resourceUpload || "").toLowerCase();
  // console.log("m: ",m)
  const e = ext(r.name || r.resourceUpload);

  if (m.includes("image/")) return "image";
  if (m === "application/pdf" || e === "pdf") return "document";
  if (m.includes("audio/") || ["mp3", "wav", "m4a", "aac", "ogg"].includes(e))
    return "audio";
  // if (m.includes("video/") || ["mp4", "mov", "avi", "mkv"].includes(e)) return "video";
  // console.log(r.category)
  return "other";
};
