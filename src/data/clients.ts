import visibilityJson from "../content/client-logo-visibility.json" with { type: "json" };
import { clients, type Client, type ClientId } from "./catalog/clients.ts";

export interface ClientLogoDefinition {
  id: string;
  clientId?: ClientId;
  name: string;
  file: string;
  alt?: string;
}

const clientById = new Map<ClientId, Client>(
  clients.map((client) => [client.id, client]),
);

function defineClientLogo<const TId extends ClientId, const TFile extends string>(
  clientId: TId,
  file: TFile,
  alt?: string,
) {
  const client = clientById.get(clientId);
  if (!client) throw new Error(`unknown canonical Client for logo: ${clientId}`);

  return {
    id: clientId,
    clientId,
    name: client.name,
    file,
    ...(alt ? { alt } : {}),
  } as const;
}

export const clientLogoDefinitions = [
  defineClientLogo("kursovoy", "01"),
  defineClientLogo("players-club", "02"),
  defineClientLogo("vk-music", "03"),
  { id: "sensetique-photostudio", name: "Sensetique Photostudio", file: "05" },
  defineClientLogo("48-jewelry", "06"),
  defineClientLogo("second-friends-store", "08"),
  defineClientLogo("li-ne-agency", "09"),
  defineClientLogo("moch-fashn", "10"),
  defineClientLogo("jestei-pool", "11"),
  defineClientLogo("lyve-moscow", "12", "Lyve Moscow"),
  defineClientLogo("mad-cow-films", "13"),
  defineClientLogo("moskovskie-novosti", "14", "Газета Московские Новости"),
  defineClientLogo("progress-tradition", "15", "Издательство Прогресс-Традиция"),
  defineClientLogo("puma", "16"),
  { id: "sensetique-production-agency", name: "Sensetique Production Agency", file: "17" },
  defineClientLogo("buro-24-7", "18"),
  defineClientLogo("channel-one", "19"),
  defineClientLogo("lenfilm", "20"),
  defineClientLogo("stereotactic", "21"),
  defineClientLogo("kaltblut", "22"),
  defineClientLogo("s-and-s", "23"),
  defineClientLogo("offmi", "24"),
  defineClientLogo("evasha", "25"),
  defineClientLogo("inna-honour", "26"),
  defineClientLogo("flashin", "27"),
  defineClientLogo("kislak", "28"),
  defineClientLogo("dava", "29"),
  defineClientLogo("styx-jewel", "30"),
  defineClientLogo("affa-media", "31"),
  defineClientLogo("vinne", "32"),
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

const allClientLogos: readonly ClientLogoData[] = Object.freeze(
  clientLogoDefinitions.map((definition) => {
    const visible = visibilityById.get(definition.id);
    if (visible === undefined) {
      throw new Error(`missing required client logo id: ${definition.id}`);
    }
    return Object.freeze({ ...definition, visible });
  }),
);

export function getVisibleClientLogos(
  source: readonly ClientLogoData[] = allClientLogos,
): readonly ClientLogoData[] {
  return source.filter((logo) => logo.visible);
}

export const clientLogos: readonly ClientLogoData[] = Object.freeze(
  getVisibleClientLogos(),
);

export type ClientLogo = ClientLogoData;
