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
      alt: "Коллаж с ноутбуками, планшетами и мобильными устройствами с интерфейсами сервиса Jestei Pool на экранах",
      width: 1580,
      height: 1360,
    },
  },

  {
    id: "styx",
    title: "Styx Jewel",
    focus: "Готический бренд ювелирных изделий и одежды",
    role: "Digital artist",
    period: "2021–2025",
    cover: {
      src: "/media/projects/index/styx-jewel-cover.webp",
      alt: "Два мобильных устройства с логотипом Styx Jewel и интерфейсом интернет магазина бренда на экранах",
      width: 1580,
      height: 1360,
    },
  },

  {
    id: "sensetique",
    title: "Sensetique",
    focus:
      "Продакшен агентство полного цикла в индустрии моды и искусства и коммерческая фотостудия",
    role: "Основатель",
    period: "2016–2018",
    cover: {
      src: "/media/projects/index/sensetique-cover.webp",
      alt: "Коллаж с фотографиями продакшена Sensetique и интерьерами залов фотостудии",
      width: 1580,
      height: 1360,
    },
  },

  {
    id: "shootings",
    title: "Shootings",
    focus: "Фотографии и микс-медиа арт для музыкантов, выставок и брендов",
    role: "Фотограф",
    period: "2016–2025",
    cover: {
      src: "/media/projects/index/shootings-cover.webp",
      alt: "Печатный разворот с фотографией Evasha",
      width: 1580,
      height: 1360,
    },
  },
];
