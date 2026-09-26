type StorageLike = Pick<Storage, "getItem" | "setItem">;

const STORAGE_KEY = "portfolio:work-archive-open";

export function mountWorkArchive(
  root: ParentNode = document,
  storage: StorageLike = sessionStorage,
): () => void {
  const details = root.querySelector<HTMLDetailsElement>("[data-work-archive]");
  if (!details) return () => {};

  try {
    if (storage.getItem(STORAGE_KEY) === "1") details.open = true;
  } catch {
    // The disclosure remains fully usable without storage.
  }

  const handleToggle = (): void => {
    try {
      storage.setItem(STORAGE_KEY, details.open ? "1" : "0");
    } catch {
      // Session persistence is optional; semantic details remains authoritative.
    }
  };

  details.addEventListener("toggle", handleToggle);
  return () => details.removeEventListener("toggle", handleToggle);
}
