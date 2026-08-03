const stockImage = (index) => {
  const size = index % 3 === 0
    ? "900/1200"
    : index % 3 === 1
      ? "1200/900"
      : "1000/1000";

  return `https://picsum.photos/seed/moves-awful-${index}/${size}`;
};

export const demoItems = Array.from({ length: 16 }, (_, index) => ({
  src: stockImage(index + 1),
}));
