import type { EntityBase } from "../../types/entity.ts";

export interface RoleData extends EntityBase {}

export const roles = [
  {
    id: "founder",
    name: "Основатель",
  },

  {
    id: "art-director",
    name: "Арт-директор",
  },

  {
    id: "creative-director",
    name: "Креативный директор",
  },

  {
    id: "design-director",
    name: "Дизайн-директор",
  },

  {
    id: "design-lead",
    name: "Дизайн-лид",
  },

  {
    id: "ui-ux-lead",
    name: "UI/UX-лид",
  },

  {
    id: "product-designer",
    name: "Продуктовый дизайнер",
  },

  {
    id: "ui-ux-designer",
    name: "UI/UX-дизайнер",
  },

  {
    id: "graphic-designer",
    name: "Графический дизайнер",
  },

  {
    id: "designer",
    name: "Дизайнер",
  },

  {
    id: "producer",
    name: "Продюсер",
  },

  {
    id: "creative-producer",
    name: "Креативный продюсер",
  },

  {
    id: "photographer",
    name: "Фотограф",
  },

  {
    id: "digital-artist",
    name: "Digital artist",
  },

  {
    id: "3d-artist",
    name: "3D artist",
  },

  {
    id: "motion-designer",
    name: "Motion designer",
  },

  {
    id: "developer",
    name: "Разработчик",
  },

{
  id: "assistant-producer",
  name: "Ассистент продюсера",
},

{
  id: "junior-producer",
  name: "Junior-продюсер",
},

{
  id: "smm-manager",
  name: "SMM-менеджер",
},

{
  id: "brand-manager",
  name: "Бренд-менеджер",
},

{
  id: "retail-manager",
  name: "Управляющий",
},

{
  id: "book-designer",
  name: "Книжный дизайнер",
},

{
  id: "layout-designer",
  name: "Дизайнер-верстальщик",
},

{
  id: "sound-editor",
  name: "Саунд-редактор",
},
] as const satisfies readonly RoleData[];

export type Role = (typeof roles)[number];

export type RoleId = Role["id"];
