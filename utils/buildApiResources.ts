import { extOf } from "@/utils/getMime";

type ApiResource = {
  name: string;
  description: string;
  category: "image" | "document" | "audio" | "folder" | "other";
  resourceUpload: string;
  mime?: string;
  filename?: string;
};

export function makeDescriptionFromName(name?: string | null) {
  if (!name) return "Resource";
  const e = extOf(name);
  return e ? name.replace(new RegExp(`\\.${e}$`, "i"), "") : name;
}

export function toApiResources(
  items: Array<{
    url: string;
    name: string;
    mime?: string;
    category: ApiResource["category"];
  }>
): ApiResource[] {
  return items.map((r) => ({
    name: r.name,
    description: makeDescriptionFromName(r.name),
    category: r.category,
    resourceUpload: r.url,
    // mime: r.mime,    
    // filename: r.name,
  }));
}
