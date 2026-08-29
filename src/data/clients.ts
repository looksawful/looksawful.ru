import visibilityJson from "../content/client-logo-visibility.json" with { type: "json" };

export interface ClientLogoDefinition {
  id: string;
  name: string;
  file: string;
  alt?: string;
}

const clientLogoDefinitions = [
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
] as const satisfies readonly ClientLogoDefinition[];

export type ClientLogoId = (typeof clientLogoDefinitions)[number]["id"];

export interface ClientLogoVisibility {
  id: ClientLogoId;
  visible: boolean;
}

export interface ClientLogoData extends ClientLogoDefinition {
  id: ClientLogoId;
  visible: boolean;
}

const clientLogoIds = new Set<string>(clientLogoDefinitions.map(({ id }) => id));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseVisibilityItem(value: unknown, index: number): ClientLogoVisibility {
  const label = `clientLogoVisibility[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);

  const idValue = value.id;
  if (typeof idValue !== "string" || idValue.length === 0) {
    throw new Error(`${label}.id must be a non-empty string`);
  }
  if (!clientLogoIds.has(idValue)) {
    throw new Error(`unexpected client logo id: ${idValue}`);
  }
  const id = clientLogoDefinitions.find(({ id }) => id === idValue)?.id;
  if (!id) throw new Error(`unexpected client logo id: ${idValue}`);

  if (typeof value.visible !== "boolean") {
    throw new Error(`${label}.visible must be a boolean`);
  }

  return { id, visible: value.visible };
}

export function parseClientLogoVisibility(value: unknown): readonly ClientLogoVisibility[] {
  if (!Array.isArray(value)) {
    throw new Error("client logo visibility content must be an array");
  }

  const parsed = value.map(parseVisibilityItem);
  const byId = new Map<ClientLogoId, ClientLogoVisibility>();

  for (const item of parsed) {
    if (byId.has(item.id)) {
      throw new Error(`duplicate client logo id: ${item.id}`);
    }
    byId.set(item.id, item);
  }

  for (const { id } of clientLogoDefinitions) {
    if (!byId.has(id)) {
      throw new Error(`missing required client logo id: ${id}`);
    }
  }

  if (parsed.length !== clientLogoDefinitions.length) {
    throw new Error(
      `client logo visibility count must remain ${clientLogoDefinitions.length}; got ${parsed.length}`,
    );
  }

  return Object.freeze(clientLogoDefinitions.map(({ id }) => {
    const item = byId.get(id);
    if (!item) throw new Error(`missing required client logo id: ${id}`);
    return Object.freeze({ ...item });
  }));
}

const rawVisibility: unknown = visibilityJson;
const clientLogoVisibility = parseClientLogoVisibility(rawVisibility);
const visibilityById = new Map(clientLogoVisibility.map(({ id, visible }) => [id, visible]));

export const clientLogos: readonly ClientLogoData[] = Object.freeze(
  clientLogoDefinitions.map((definition) => {
    const visible = visibilityById.get(definition.id);
    if (visible === undefined) {
      throw new Error(`missing required client logo id: ${definition.id}`);
    }
    return Object.freeze({ ...definition, visible });
  }),
);

export function getVisibleClientLogos(
  source: readonly ClientLogoData[] = clientLogos,
): readonly ClientLogoData[] {
  return source.filter((logo) => logo.visible);
}

export type ClientLogo = ClientLogoData;
