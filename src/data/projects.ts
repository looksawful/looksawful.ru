export interface ProjectCardData {
  id: string;
  title: string;
  focus: string;
  role: string;
  period: string;

  cover: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

export const projects: readonly ProjectCardData[] = [
  {
    id: "jestei",
    title: "Jestei Pool",
    focus: "Музыкальный сервис для диджеев",
    role: "Арт-директор",
    period: "2024–2026",
    cover: {
      src: "/media/projects/index/jestei-pool-cover.webp",
      alt: "Коллаж интерфейсов и промоматериалов Jestei Pool",
      width: 1580,
      height: 1360,
    },
  },

  {
    id: "styx",
    title: "Styx Jewel",
    focus: "Айдентика, арт-дирекшн и съёмки",
    role: "Digital artist",
    period: "2021–2025",
    cover: {
      src: "/media/projects/index/styx-jewel-cover.webp",
      alt: "Мокап экранов Styx Jewel с объёмным логотипом",
      width: 1580,
      height: 1360,
    },
  },

  {
    id: "sensetique",
    title: "Sensetique",
    focus: "Фотостудия и продакшн",
    role: "Основатель",
    period: "2017–2018",
    cover: {
      src: "/media/projects/index/sensetique-cover.webp",
      alt: "Коллаж фотографий Sensetique",
      width: 1580,
      height: 1360,
    },
  },

  {
    id: "shootings",
    title: "Shootings",
    focus: "Фотография, обложки и микс-медиа",
    role: "Фотограф",
    period: "2016–2025",
    cover: {
      src: "/media/projects/index/shootings-cover.webp",
      alt: "Фотография Evasha с печатным разворотом",
      width: 1580,
      height: 1360,
    },
  },
];
