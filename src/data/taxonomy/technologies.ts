import type { EntityBase } from "../../types/entity.ts";

export type TechnologyCategory =
  | "code"
  | "frontend"
  | "computer-graphics"
  | "testing"
  | "ai";

export interface TechnologyData extends EntityBase {
  categories: readonly TechnologyCategory[];
}

export const technologies = [
  {
    id: "html",
    name: "HTML",
    categories: ["code", "frontend"],
  },
  {
    id: "css",
    name: "CSS",
    categories: ["code", "frontend"],
  },
  {
    id: "javascript",
    name: "JavaScript",
    categories: ["code", "frontend"],
  },
  {
    id: "typescript",
    name: "TypeScript",
    categories: ["code", "frontend"],
  },
  {
    id: "python",
    name: "Python",
    categories: ["code"],
  },
  {
    id: "react",
    name: "React",
    categories: ["code", "frontend"],
  },
  {
    id: "next-js",
    name: "Next.js",
    categories: ["code", "frontend"],
  },
  {
    id: "vite",
    name: "Vite",
    categories: ["code", "frontend"],
  },
  {
    id: "node-js",
    name: "Node.js",
    categories: ["code"],
  },
  {
    id: "web-components",
    name: "Web Components",
    categories: ["code", "frontend"],
  },
  {
    id: "three-js",
    name: "Three.js",
    categories: ["code", "frontend", "computer-graphics"],
  },
  {
    id: "react-three-fiber",
    name: "React Three Fiber",
    categories: ["code", "frontend", "computer-graphics"],
  },
  {
    id: "gsap",
    name: "GSAP",
    categories: ["code", "frontend", "computer-graphics"],
  },
  {
    id: "canvas",
    name: "Canvas",
    categories: ["code", "frontend", "computer-graphics"],
  },
  {
    id: "webgl",
    name: "WebGL",
    categories: ["code", "frontend", "computer-graphics"],
  },
  {
    id: "glsl",
    name: "GLSL",
    categories: ["code", "computer-graphics"],
  },
  {
    id: "svg",
    name: "SVG",
    categories: ["frontend", "computer-graphics"],
  },
  {
    id: "playwright",
    name: "Playwright",
    categories: ["code", "testing"],
  },
  {
    id: "git",
    name: "Git",
    categories: ["code"],
  },
] as const satisfies readonly TechnologyData[];

export type Technology = (typeof technologies)[number];
export type TechnologyId = Technology["id"];
