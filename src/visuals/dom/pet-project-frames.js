export function mountPetProjectFrames(root = document) {
  const frames = Array.from(root.querySelectorAll('[data-pet-project-frame]'));
  for (const frame of frames) {
    const id = frame.getAttribute('data-pet-project-frame') || '';
    const lock = () => {
      frame.style.width = '100%';
      frame.style.border = '0';
      frame.style.display = 'block';
      frame.style.height = '100svh';
      frame.style.maxHeight = '100svh';
      frame.style.minHeight = '100svh';
      if (id === 'awful-audit') frame.style.overflow = 'hidden';
    };
    lock();
    frame.addEventListener('load', lock, { once: false });
  }
}
