import type { EntityBase } from "../../types/entity.ts";

export interface TechnologyData extends EntityBase {}

export const technologies = [
  {
    id: "html",
    name: "HTML",
  },

  {
    id: "css",
    name: "CSS",
  },

  {
    id: "javascript",
    name: "JavaScript",
  },

  {
    id: "typescript",
    name: "TypeScript",
  },

  {
    id: "react",
    name: "React",
  },

  {
    id: "next-js",
    name: "Next.js",
  },

  {
    id: "vite",
    name: "Vite",
  },

  {
    id: "node-js",
    name: "Node.js",
  },

  {
    id: "web-components",
    name: "Web Components",
  },

  {
    id: "three-js",
    name: "Three.js",
  },

  {
    id: "gsap",
    name: "GSAP",
  },

  {
    id: "canvas",
    name: "Canvas",
  },

  {
    id: "webgl",
    name: "WebGL",
  },

  {
    id: "glsl",
    name: "GLSL",
  },

  {
    id: "svg",
    name: "SVG",
  },

  {
    id: "git",
    name: "Git",
  },
] as const satisfies readonly TechnologyData[];

export type Technology = (typeof technologies)[number];

export type TechnologyId = Technology["id"];
