export type PetProjectStatus = "live" | "coming-soon" | "hidden";

export type PetProjectBadge = "new";

export type PetProjectKind =
  | "app"
  | "library"
  | "extension"
  | "workflow"
  | "asset-library"
  | "scene-library"
  | "shader-library"
  | "project";

export type PetProjectId =
  | "awful-cases"
  | "moves-awful"
  | "berserk-timer"
  | "awful-studio"
  | "awful-mockups"
  | "awful-textures"
  | "photoshop-translation"
  | "keys"
  | "sea"
  | "comfy-workflows"
  | "photoshop-workflows"
  | "blender-scenes"
  | "shaders"
  | "3d-assets";

interface PetProjectBase {
  id: PetProjectId;
  title: string;
  kind: PetProjectKind;
}

export interface LivePetProject extends PetProjectBase {
  status: "live";
  description: string;
  href: `/work/${string}/`;
  badge?: PetProjectBadge;
}

export interface ComingSoonPetProject extends PetProjectBase {
  status: "coming-soon";
  description?: string;
  href?: never;
  badge?: never;
}

export interface HiddenPetProject extends PetProjectBase {
  status: "hidden";
  description?: never;
  href?: never;
  badge?: never;
}

export type PetProject =
  | LivePetProject
  | ComingSoonPetProject
  | HiddenPetProject;

export function petProjectWorkPath(id: PetProjectId): `/work/${string}/` {
  return `/work/${id}/`;
}

/**
 * Pet-project catalog. `hidden` records are architecture-only roadmap entries:
 * they must not render or create public routes until explicitly promoted.
 */
export const petProjects = [
  {
    id: "awful-cases",
    title: "Awful Cases",
    kind: "app",
    status: "live",
    description: "Утилита для Windows: регистр и типографика выделенного текста.",
    href: "/work/awful-cases/",
  },
  {
    id: "moves-awful",
    title: "Moves Awful",
    kind: "library",
    status: "live",
    description: "Библиотека с шаблонами анимированных canvas галерей для лендингов.",
    href: "/work/moves-awful/",
  },
  {
    id: "berserk-timer",
    title: "Berserk Timer",
    kind: "app",
    status: "live",
    description: "Консольный помодоро-таймер для Windows.",
    href: "/work/berserk-timer/",
  },
  {
    id: "awful-studio",
    title: "AWFUL STUDIO",
    kind: "extension",
    status: "live",
    description: "Расширение Blender для сборки виртуальной предметной студии.",
    href: "/work/awful-studio/",
  },
  {
    id: "awful-mockups",
    title: "Awful Mockups",
    kind: "asset-library",
    status: "hidden",
  },
  {
    id: "awful-textures",
    title: "Awful Textures",
    kind: "asset-library",
    status: "hidden",
  },
  {
    id: "photoshop-translation",
    title: "Photoshop Translation",
    kind: "project",
    status: "hidden",
  },
  {
    id: "keys",
    title: "Keys",
    kind: "project",
    status: "hidden",
  },
  {
    id: "sea",
    title: "Sea",
    kind: "project",
    status: "hidden",
  },
  {
    id: "comfy-workflows",
    title: "Comfy Workflows",
    kind: "workflow",
    status: "hidden",
  },
  {
    id: "photoshop-workflows",
    title: "Photoshop Workflows",
    kind: "workflow",
    status: "hidden",
  },
  {
    id: "blender-scenes",
    title: "Blender Scenes",
    kind: "scene-library",
    status: "hidden",
  },
  {
    id: "shaders",
    title: "Shaders",
    kind: "shader-library",
    status: "hidden",
  },
  {
    id: "3d-assets",
    title: "3D Assets",
    kind: "asset-library",
    status: "hidden",
  },
] as const satisfies readonly PetProject[];

export function getVisiblePetProjects(
  projects: readonly PetProject[] = petProjects,
): readonly (LivePetProject | ComingSoonPetProject)[] {
  return projects.filter(
    (project): project is LivePetProject | ComingSoonPetProject => project.status !== "hidden",
  );
}
