const PROFILE_RULES = [
  {
    profile: "venus",
    matches(pathname) {
      return pathname.startsWith("public/pets/awful/")
        || pathname.startsWith("src/components/contact-hub")
        || pathname.startsWith("src/components/portfolio-pet")
        || pathname.startsWith("src/features/contact-hub/")
        || pathname.startsWith("src/features/portfolio-pet/")
        || pathname.startsWith("src/styles/contact-hub")
        || pathname.startsWith("src/styles/portfolio-pet");
    },
  },
  {
    profile: "gallery",
    matches(pathname) {
      return pathname === "gallery/index.html"
        || pathname.startsWith("src/components/gallery/")
        || pathname === "src/data/media/gallery.ts"
        || pathname === "src/site/renderers/gallery-page.ts"
        || pathname === "src/styles/gallery.css";
    },
  },
  {
    profile: "awful-studio",
    matches(pathname) {
      return pathname.startsWith("public/prototypes/pet-projects-awful-studio/");
    },
  },
];

function normalizedPaths(paths) {
  if (!Array.isArray(paths)) throw new Error("preview QA changed paths must be an array");
  return [...new Set(paths.map((value) => {
    if (typeof value !== "string") throw new Error("preview QA changed paths must contain strings only");
    return value.replaceAll("\\", "/").replace(/^\.\//u, "");
  }).filter(Boolean))].sort();
}

export function selectPreviewQaProfiles(paths) {
  const changedPaths = normalizedPaths(paths);
  const profiles = ["baseline"];
  for (const rule of PROFILE_RULES) {
    if (changedPaths.some((pathname) => rule.matches(pathname))) {
      profiles.push(rule.profile);
    }
  }
  return profiles;
}
