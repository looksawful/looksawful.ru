export interface SearchPresentation {
  readonly title: string;
  readonly description: string;
}

export const homeSearchPresentation = {
  title: "Иван Крушинский — арт-директор цифровых продуктов",
  description:
    "Арт-директор цифровых продуктов и дизайнер. Проектирую интерфейсы, айдентику и визуальные системы, руковожу командами и довожу продукты до релиза.",
} as const satisfies SearchPresentation;

export const cvSearchPresentation = {
  title: "Иван Крушинский — резюме",
  description:
    "Резюме Ивана Крушинского — арт-директора цифровых продуктов и дизайнера: опыт, компетенции, инструменты и образование.",
} as const satisfies SearchPresentation;

const entitySearchPresentations: Readonly<Record<string, SearchPresentation>> = {
  "case:jestei-pool": {
    title: "Jestei Pool — арт-дирекшн, UX/UI и дизайн-система | Иван Крушинский",
    description:
      "Кейс Jestei Pool: арт-дирекшн музыкального сервиса, UX/UI-стратегия, дизайн-система, ребрендинг, продуктовые сценарии и результаты 2024–2026.",
  },
  "case:styx": {
    title: "Styx Jewel — айдентика, арт-дирекшн и съёмки | Иван Крушинский",
    description:
      "Кейс Styx Jewel: айдентика, арт-дирекшн, упаковка, каталоги, рекламная графика, fashion-съёмки и экспериментальный визуальный продакшен.",
  },
  "case:sensetique": {
    title: "Sensetique — фотостудия и продакшен | Иван Крушинский",
    description:
      "Кейс Sensetique: запуск и управление fashion-фотостудией и продакшеном полного цикла, команда, съёмки, сайты и рекламная коммуникация.",
  },
  "collection:music-photography": {
    title: "Shootings — фотография и микс-медиа | Иван Крушинский",
    description:
      "Фотография и микс-медиа Ивана Крушинского: съёмки для музыкантов, брендов и выставок, обложки, портреты, коллажи и визуальные эксперименты.",
  },
};

export function getEntitySearchPresentation(pageId: string): SearchPresentation | undefined {
  return entitySearchPresentations[pageId];
}
