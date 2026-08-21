import type { EntityBase } from "../../types/entity.ts";

export interface ProjectTypeData extends EntityBase {}

export const projectTypes = [
  {
    id: "rebranding",
    name: "Ребрендинг",
    description: "Существенное изменение того, как бренд определяет и представляет себя.",
  },

  {
    id: "special-project",
    name: "Спецпроект",
    description:
      "Отдельный проект, созданный под конкретную задачу, событие, кампанию, партнёрство или нестандартный сценарий и обычно находящийся вне основного продуктового потока.",
  },

  {
    id: "launch",
    name: "Запуск",
    description:
      "Вывод нового продукта, функции, бренда, сервиса или существенного обновления в реальное использование.",
  },
] as const satisfies readonly ProjectTypeData[];

export type ProjectType = (typeof projectTypes)[number];

export type ProjectTypeId = ProjectType["id"];
