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
  const m = (r.mime || "").toLowerCase();
  const e = ext(r.name || r.url);

  if (m.startsWith("image/")) return "image";
  if (m === "application/pdf" || e === "pdf") return "document";
  if (m.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "ogg"].includes(e))
    return "audio";
  if (r.category === "folder" || e === "") return "folder";
  return "other";
};
