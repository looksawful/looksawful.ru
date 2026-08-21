import type { EntityBase } from "../../types/entity.ts";

export interface SkillData extends EntityBase {}

export const skills = [
  {
    id: "visual-concept",
    name: "Разработка визуальных концепций",
  },

  {
    id: "design-strategy",
    name: "Дизайн-стратегия",
  },

  {
    id: "information-architecture",
    name: "Информационная архитектура",
  },

  {
    id: "wireframing",
    name: "Вайрфрейминг",
  },

  {
    id: "prototyping",
    name: "Прототипирование",
  },

  {
    id: "design-systems",
    name: "Дизайн-системы",
  },

  {
    id: "ux-research",
    name: "UX-исследования",
  },

  {
    id: "ui-research",
    name: "UI-исследования",
  },

  {
    id: "user-research",
    name: "User Research",
  },

  {
    id: "audience-research",
    name: "Исследование аудитории",
  },

  {
    id: "competitor-research",
    name: "Исследование конкурентов",
  },

  {
    id: "competitive-analysis",
    name: "Competitive Analysis",
  },

  {
    id: "usability-testing",
    name: "Usability Testing",
  },

  {
    id: "customer-journey-mapping",
    name: "Customer Journey Mapping",
  },

  {
    id: "ux-audit",
    name: "UX-аудит",
  },

  {
    id: "ui-audit",
    name: "UI-аудит",
  },

  {
    id: "design-system-audit",
    name: "Аудит дизайн-системы",
  },

  {
    id: "hypothesis-development",
    name: "Формирование и проверка гипотез",
  },

  {
    id: "design-handoff",
    name: "Design Handoff",
  },

  {
    id: "design-qa",
    name: "Design QA",
  },

  {
    id: "design-review",
    name: "Дизайн-ревью",
  },

  {
    id: "mentoring",
    name: "Наставничество",
  },

  {
    id: "onboarding",
    name: "Онбординг",
  },

  {
    id: "typography",
    name: "Типографика",
  },

  {
    id: "layout",
    name: "Композиция и сетки",
  },

  {
    id: "identity-design",
    name: "Проектирование айдентики",
  },

  {
    id: "brand-communication",
    name: "Бренд-коммуникация",
  },

  {
    id: "ux-writing",
    name: "UX-writing",
  },

  {
    id: "editorial-design",
    name: "Редакционный дизайн",
  },

  {
    id: "photography",
    name: "Фотография",
  },

  {
    id: "photo-direction",
    name: "Фотодирекшн",
  },

  {
    id: "photo-production",
    name: "Организация фотопродакшена",
  },

  {
    id: "photo-retouching",
    name: "Обработка фотографий",
  },

  {
    id: "scanography",
    name: "Сканография",
  },

  {
    id: "illustration",
    name: "Иллюстрация",
  },

  {
    id: "motion-design",
    name: "Моушен-дизайн",
  },

  {
    id: "3d-modeling",
    name: "3D-моделирование",
  },

  {
    id: "3d-rendering",
    name: "3D-рендеринг",
  },

  {
    id: "frontend-development",
    name: "Фронтенд-разработка",
  },

  {
    id: "interactive-design",
    name: "Интерактивный дизайн",
  },
] as const satisfies readonly SkillData[];

export type Skill = (typeof skills)[number];

export type SkillId = Skill["id"];
