import type { LogoFamilyData } from "../../types/logo.ts";

export const logoFamilies = [
  {
    id: "kursovoy",
    name: "KURSOVOY",
    subjects: [{ type: "client", id: "kursovoy" }],
  },
  {
    id: "players-club",
    name: "PLAYERS CLUB",
    subjects: [{ type: "client", id: "players-club" }],
  },
  {
    id: "vk-music",
    name: "VK Музыка",
    subjects: [{ type: "client", id: "vk-music" }],
  },
  {
    id: "sensetique",
    name: "Sensetique",
    subjects: [{ type: "case", id: "sensetique" }],
    description:
      "Семейство логотипов Sensetique включает множество ситуативных вариантов и локапов; сейчас в каталог внесены только версии, которые можно однозначно связать с текущим кодом и logo wall.",
  },
  {
    id: "48-jewelry",
    name: "48 Jewelry",
    subjects: [{ type: "client", id: "48-jewelry" }],
  },
  {
    id: "second-friends-store",
    name: "Second Friends Store",
    subjects: [{ type: "client", id: "second-friends-store" }],
  },
  {
    id: "li-ne-agency",
    name: "LI-NE Agency",
    subjects: [{ type: "client", id: "li-ne-agency" }],
  },
  {
    id: "moch-fashn",
    name: "Moch Fashn",
    subjects: [{ type: "client", id: "moch-fashn" }],
  },
  {
    id: "jestei-pool",
    name: "Jestei Pool",
    subjects: [
      { type: "client", id: "jestei-pool" },
      { type: "case", id: "jestei-pool" },
    ],
  },
  {
    id: "lyve-moscow",
    name: "LYVÈ Moscow",
    subjects: [{ type: "client", id: "lyve-moscow" }],
  },
  {
    id: "mad-cow-films",
    name: "Mad Cow Films",
    subjects: [{ type: "client", id: "mad-cow-films" }],
  },
  {
    id: "moskovskie-novosti",
    name: "Газета «Московские Новости»",
    subjects: [{ type: "client", id: "moskovskie-novosti" }],
  },
  {
    id: "progress-tradition",
    name: "Прогресс-Традиция",
    subjects: [{ type: "client", id: "progress-tradition" }],
  },
  {
    id: "puma",
    name: "PUMA",
    subjects: [{ type: "client", id: "puma" }],
  },
  {
    id: "buro-24-7",
    name: "BURO 24/7",
    subjects: [{ type: "client", id: "buro-24-7" }],
  },
  {
    id: "channel-one",
    name: "Первый канал",
    subjects: [{ type: "client", id: "channel-one" }],
  },
  {
    id: "lenfilm",
    name: "Ленфильм",
    subjects: [{ type: "client", id: "lenfilm" }],
  },
  {
    id: "stereotactic",
    name: "STEREOTACTIC",
    subjects: [{ type: "client", id: "stereotactic" }],
  },
  {
    id: "kaltblut",
    name: "KALTBLUT",
    subjects: [{ type: "client", id: "kaltblut" }],
  },
  {
    id: "s-and-s",
    name: "S&S",
    subjects: [{ type: "client", id: "s-and-s" }],
  },
  {
    id: "offmi",
    name: "OFFMi",
    subjects: [{ type: "client", id: "offmi" }],
  },
  {
    id: "evasha",
    name: "EVASHA",
    subjects: [{ type: "client", id: "evasha" }],
  },
  {
    id: "inna-honour",
    name: "Inna Honour",
    subjects: [{ type: "client", id: "inna-honour" }],
  },
  {
    id: "flashin",
    name: "FLASHIN",
    subjects: [{ type: "client", id: "flashin" }],
  },
  {
    id: "kislak",
    name: "Ki$lak",
    subjects: [{ type: "client", id: "kislak" }],
  },
  {
    id: "dava",
    name: "DAVA",
    subjects: [{ type: "client", id: "dava" }],
  },
  {
    id: "styx-jewel",
    name: "Styx Jewel",
    subjects: [
      { type: "client", id: "styx-jewel" },
      { type: "case", id: "styx" },
    ],
  },
  {
    id: "affa-media",
    name: "AFFA MEDIA",
    subjects: [{ type: "client", id: "affa-media" }],
  },
  {
    id: "vinne",
    name: "VINNE",
    subjects: [{ type: "client", id: "vinne" }],
  },
  {
    id: "illumihand",
    name: "illumihand",
    subjects: [{ type: "client", id: "illumihand" }],
  },
] as const satisfies readonly LogoFamilyData[];

export type LogoFamily = (typeof logoFamilies)[number];
export type LogoFamilyId = LogoFamily["id"];
