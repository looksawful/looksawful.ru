document.querySelectorAll('a[href^="https://www.looksawful.ru/#"]').forEach((link) => {
  const url = new URL(link.href);
  link.href = `/${url.hash}`;
});
