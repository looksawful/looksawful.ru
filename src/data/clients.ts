export interface ClientLogoData {
  id: string;
  name: string;
  file: string;
  alt?: string;
}

export const clientLogos = [
  {
    id: "kursovoy",
    name: "KURSOVOY",
    file: "01",
  },
  {
    id: "players-club",
    name: "PLAYERS CLUB",
    file: "02",
  },
  {
    id: "vk-music",
    name: "VK Музыка",
    file: "03",
  },
  {
    id: "sensetique-photostudio",
    name: "Sensetique Photostudio",
    file: "05",
  },
  {
    id: "48-jewelry",
    name: "48 Jewelry",
    file: "06",
  },
  {
    id: "second-friends-store",
    name: "Second Friends Store",
    file: "08",
  },
  {
    id: "li-ne-agency",
    name: "LI-NE Agency",
    file: "09",
  },
  {
    id: "moch-fashn",
    name: "Moch Fashn",
    file: "10",
  },
  {
    id: "jestei-pool",
    name: "Jestei Pool",
    file: "11",
  },
  {
    id: "lyve-moscow",
    name: "Lyve Moscow",
    file: "12",
  },
  {
    id: "mad-cow-films",
    name: "Mad Cow Films",
    file: "13",
  },
  {
    id: "moskovskie-novosti",
    name: "Газета Московские Новости",
    file: "14",
  },
  {
    id: "progress-tradition",
    name: "Издательство Прогресс-Традиция",
    file: "15",
  },
  {
    id: "puma",
    name: "PUMA",
    file: "16",
  },
  {
    id: "sensetique-production-agency",
    name: "Sensetique Production Agency",
    file: "17",
  },
  {
    id: "buro-24-7",
    name: "BURO 24/7",
    file: "18",
  },
  {
    id: "channel-one",
    name: "Первый канал",
    file: "19",
  },
  {
    id: "lenfilm",
    name: "Ленфильм",
    file: "20",
  },
  {
    id: "stereotactic",
    name: "STEREOTACTIC",
    file: "21",
  },
  {
    id: "kaltblut",
    name: "KALTBLUT",
    file: "22",
  },
  {
    id: "s-and-s",
    name: "S&S",
    file: "23",
  },
  {
    id: "offmi",
    name: "OFFMi",
    file: "24",
  },
  {
    id: "evasha",
    name: "EVASHA",
    file: "25",
  },
  {
    id: "inna-honour",
    name: "Inna Honour",
    file: "26",
  },
  {
    id: "flashin",
    name: "FLASHIN",
    file: "27",
  },
  {
    id: "kislak",
    name: "Ki$lak",
    file: "28",
  },
  {
    id: "dava",
    name: "DAVA",
    file: "29",
  },
  {
    id: "styx-jewel",
    name: "Styx Jewel",
    file: "30",
  },
  {
    id: "affa-media",
    name: "AFFA MEDIA",
    file: "31",
  },
  {
    id: "vinne",
    name: "VINNE",
    file: "32",
  },
] as const satisfies readonly ClientLogoData[];

export type ClientLogo = (typeof clientLogos)[number];

export type ClientLogoId = ClientLogo["id"];
