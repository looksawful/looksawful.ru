import type { EntityBase } from "../../types/entity.ts";

export type SoftwareCategory =
  | "design"
  | "graphic-design"
  | "3d"
  | "color"
  | "development"
  | "testing"
  | "audio"
  | "shooting"
  | "video"
  | "motion"
  | "ai";

export interface SoftwareData extends EntityBase {
  categories: readonly SoftwareCategory[];
}

export const software = [
  {
    id: "figma",
    name: "Figma",
    categories: ["design"],
  },
  {
    id: "photoshop",
    name: "Adobe Photoshop",
    categories: ["design", "graphic-design"],
  },
  {
    id: "illustrator",
    name: "Adobe Illustrator",
    categories: ["design", "graphic-design"],
  },
  {
    id: "indesign",
    name: "Adobe InDesign",
    categories: ["design", "graphic-design"],
  },
  {
    id: "corel-draw",
    name: "CorelDRAW",
    categories: ["design", "graphic-design"],
  },
  {
    id: "krita",
    name: "Krita",
    categories: ["design", "graphic-design"],
  },
  {
    id: "font-forge",
    name: "FontForge",
    categories: ["design", "graphic-design"],
  },
  {
    id: "blender",
    name: "Blender",
    categories: ["design", "3d"],
  },
  {
    id: "maya",
    name: "Maya",
    categories: ["3d"],
  },
  {
    id: "zbrush",
    name: "ZBrush",
    categories: ["3d"],
  },
  {
    id: "material-designer",
    name: "Material Designer",
    categories: ["design", "3d"],
  },
  {
    id: "vscode",
    name: "Visual Studio Code",
    categories: ["development"],
  },
  {
    id: "webstorm",
    name: "WebStorm",
    categories: ["development"],
  },
  {
    id: "zed",
    name: "Zed",
    categories: ["development"],
  },
  {
    id: "devtools",
    name: "DevTools",
    categories: ["development", "testing"],
  },
  {
    id: "lightroom",
    name: "Adobe Lightroom",
    categories: ["design", "color"],
  },
  {
    id: "capture-one",
    name: "Capture One",
    categories: ["color", "shooting"],
  },
  {
    id: "set-a-light",
    name: "Set a Light",
    categories: ["shooting"],
  },
  {
    id: "premiere-pro",
    name: "Adobe Premiere Pro",
    categories: ["video"],
  },
  {
    id: "after-effects",
    name: "Adobe After Effects",
    categories: ["video", "motion", "design"],
  },
  {
    id: "final-cut",
    name: "Final Cut",
    categories: ["video"],
  },
  {
    id: "ableton",
    name: "Ableton",
    categories: ["audio"],
  },
  {
    id: "audition",
    name: "Adobe Audition",
    categories: ["audio", "video"],
  },
  {
    id: "codex",
    name: "Codex",
    categories: ["ai", "development"],
  },
  {
    id: "claude",
    name: "Claude",
    categories: ["ai"],
  },
  {
    id: "ollama",
    name: "Ollama",
    categories: ["ai", "development"],
  },
  {
    id: "open-claw",
    name: "Open Claw",
    categories: ["ai"],
  },
  {
    id: "comfyui",
    name: "ComfyUI",
    categories: ["ai", "design"],
  },
  {
    id: "automatic1111",
    name: "AUTOMATIC1111",
    categories: ["ai", "design"],
  },
  {
    id: "swarmui",
    name: "SwarmUI",
    categories: ["ai", "design"],
  },
  {
    id: "imagemagick",
    name: "ImageMagick",
    categories: ["development", "design"],
  },
  {
    id: "ffmpeg",
    name: "FFmpeg",
    categories: ["development", "video", "audio"],
  },
] as const satisfies readonly SoftwareData[];

export type Software = (typeof software)[number];
export type SoftwareId = Software["id"];
