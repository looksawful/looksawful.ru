export function initializeMountedPreview(root, initialize) {
  let mounted = false;
  let cleanup = () => {};
  const reconcile = () => {
    if (root.isConnected) {
      if (mounted) return;
      mounted = true;
      cleanup = initialize(root);
      return;
    }
    if (!mounted) return;
    observer.disconnect();
    cleanup();
  };
  const observer = new MutationObserver(reconcile);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  reconcile();
  return root;
}
