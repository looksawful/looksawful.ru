export interface ClientLogoData {
  id: string;
  name: string;
  file: string;
  alt?: string;
}

export const clientLogos = [
  {
    id: "client-01",
    name: "Название клиента",
    file: "01",
    alt: "Название клиента",
  },
  {
    id: "client-02",
    name: "Название клиента",
    file: "02",
    alt: "Название клиента",
  },
  {
    id: "client-03",
    name: "Название клиента",
    file: "03",
    alt: "Название клиента",
  },
] as const satisfies readonly ClientLogoData[];
