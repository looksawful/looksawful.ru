import type { ProjectId } from "../catalog/projects/index.ts";

interface AssignableMediaEntry {
  id: string;
  assetId: string;
  projectIds?: readonly string[];
}

const projectByPrefix = [
  ["obladaet-", "shootings-obladaet"],
  ["evasha-", "shootings-evasha"],
  ["igguana-", "shootings-igguana"],
  ["esmi-", "shootings-esmi"],
  ["hypression-", "shootings-hypression"],
  ["ofelia-", "shootings-ofelia"],
  ["awful-cases-", "awful-cases"],
  ["moves-awful-", "moves-awful"],
  ["berry-", "berry-social-content-2020"],
  ["sands-01-", "s-and-s-first-lookbook"],
  ["sands-02-", "s-and-s-first-lookbook"],
  ["sands-04-", "s-and-s-first-lookbook"],
  ["sands-05-", "s-and-s-catalog-content"],
] as const satisfies readonly (readonly [string, ProjectId])[];

const projectByAssetId = new Map<string, ProjectId>([
  // Styx — identity / print / catalog
  ["styx-logo-source-styx-logo-volume", "styx-brand-system"],
  ["styx-01-source-01-1x1", "styx-packaging-2024"],
  ["styx-01-source-02-1x1", "styx-packaging-2024"],
  ["styx-01-source-04-9x16", "styx-packaging-2024"],
  ["styx-04-source-01-16x9", "styx-panoramic-catalog-2021"],
  ["styx-06-source-01-1920x913", "styx-print-materials-2023"],
  ["styx-06-source-02-1920x917", "styx-print-materials-2023"],
  ["styx-06-source-03-1x1", "styx-print-materials-2023"],
  ["styx-06-source-04-69x80", "styx-print-materials-2023"],
  ["styx-06-source-05-1x1", "styx-print-materials-2023"],
  ["styx-10-source-01-9x16", "styx-social-instructions"],
  ["styx-10-source-02-9x16", "styx-social-instructions"],
  ["styx-10-source-03-9x16", "styx-social-instructions"],
  ["styx-10-source-04-9x16", "styx-social-instructions"],

  // Styx — lookbooks and shoots. These are grouped by the actual shoot,
  // not by the media-group that happens to display each frame.
  ["styx-03-source-01-4x5", "styx-lookbook-2023"],
  ["styx-03-source-02-4x5", "styx-lookbook-2023"],
  ["styx-03-source-03-4x5", "styx-lookbook-2023"],
  ["styx-01-source-03-4x5", "styx-lookbook-2024"],
  ["styx-05-source-09-4x5", "styx-lookbook-2024"],
  ["styx-05-source-14-4x5", "styx-lookbook-2024"],
  ["styx-05-source-15-4x5", "styx-lookbook-2024"],
  ["styx-05-source-16-4x5", "styx-lookbook-2024"],
  ["styx-05-source-21-4x5", "styx-lookbook-2025"],
  ["styx-09-source-01-1x1", "styx-lookbook-2025"],
  ["styx-09-source-02-3x4", "styx-lookbook-2025"],
  ["styx-09-source-03-1x1", "styx-lookbook-2025"],
  ["styx-05-source-01-2x3", "styx-jacket-lookbook"],
  ["styx-05-source-08-4x5", "styx-founder-portraits-2022"],
  ["styx-05-source-18-2x3", "styx-founder-portraits-2022"],
  ["styx-05-source-02-2x3", "styx-evident-things-collaboration-2022"],
  ["styx-05-source-03-2x3", "styx-evident-things-collaboration-2022"],
  ["styx-05-source-04-4x5", "styx-evident-things-collaboration-2022"],
  ["styx-05-source-05-2x3", "styx-evident-things-collaboration-2022"],
  ["styx-05-source-06-4x5", "styx-evident-things-collaboration-2022"],
  ["styx-05-source-07-4x5", "styx-evident-things-collaboration-2022"],
  ["styx-05-source-19-2x3", "styx-evident-things-collaboration-2022"],
  ["styx-07-source-03-4x5", "styx-evident-things-collaboration-2022"],
  ["styx-07-source-04-4x5", "styx-evident-things-collaboration-2022"],

  // Styx — named scanography works. Generic scanography remains intentionally unassigned.
  ["styx-02-source-01-9x16", "styx-gift-sculpture-animation-2025"],
  ["styx-02-source-02-9x16", "styx-mystery-chest-animation-2024"],
  ["styx-02-source-03-1x1", "styx-apocriphon-scanography-2022"],
  ["styx-02-source-04-1x1", "styx-apocriphon-scanography-2022"],
  ["styx-07-source-02-4x5", "styx-scanographic-campaign-2022"],
  ["styx-07-source-05-4x5", "styx-scanographic-campaign-2022"],

  // Sensetique — named shoots / client projects.
  ["sensetique-11-source-69-320x213", "sensetique-harsh-light-2018"],
  ["sensetique-11-source-70-929x800", "sensetique-harsh-light-2018"],
  ["sensetique-04-source-14-4x5", "sensetique-harsh-light-2018"],
  ["sensetique-11-source-65-853x1280", "sensetique-harsh-light-2018"],
  ["sensetique-11-source-66-4x5", "sensetique-harsh-light-2018"],
  ["sensetique-11-source-68-4x5", "sensetique-harsh-light-2018"],

  ["sensetique-09-source-37-17x11", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-05-source-02-4x5", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-88-128x175", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-89-103x140", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-90-117x160", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-92-47x70", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-93-128x175", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-09-source-46-175x128", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-04-source-11-2x3", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-09-source-13-2x3", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-74-187x280", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-76-187x280", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-78-933x1400", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-80-1280x911", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-82-160x113", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-83-40x71", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-84-640x491", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-85-1280x911", "sensetique-young-pioneer-kaltblut"],
  ["sensetique-11-source-87-256x181", "sensetique-young-pioneer-kaltblut"],

  ["sensetique-09-source-56-16x9", "sensetique-krasota-dress-lookbook"],
  ["sensetique-13-source-38-1023x1400", "sensetique-krasota-dress-lookbook"],
  ["sensetique-04-source-02-2x3", "sensetique-krasota-dress-lookbook"],
  ["sensetique-09-source-02-2x3", "sensetique-krasota-dress-lookbook"],
  ["sensetique-09-source-38-2x3", "sensetique-krasota-dress-lookbook"],
  ["sensetique-09-source-40-2x3", "sensetique-krasota-dress-lookbook"],

  ["sensetique-04-source-03-3x2", "sensetique-olovo-campaign"],
  ["sensetique-09-source-08-2x3", "sensetique-olovo-campaign"],
  ["sensetique-13-source-58-853x1280", "sensetique-olovo-campaign"],
  ["sensetique-13-source-59-854x1280", "sensetique-olovo-campaign"],
  ["sensetique-11-source-98-187x280", "sensetique-olovo-lookbook-2016"],
  ["sensetique-11-source-99-187x280", "sensetique-olovo-lookbook-2016"],
  ["sensetique-11-source-100-187x280", "sensetique-olovo-lookbook-2016"],
  ["sensetique-11-source-28-16x9", "sensetique-olovo-lookbook-2017"],
  ["sensetique-11-source-104-853x1280", "sensetique-olovo-lookbook-2018"],
  ["sensetique-11-source-105-853x1280", "sensetique-olovo-lookbook-2018"],
  ["sensetique-11-source-106-853x1280", "sensetique-olovo-lookbook-2018"],

  ["sensetique-04-source-04-2x3", "sensetique-inna-honour-lookbook"],
  ["sensetique-04-source-09-2x3", "sensetique-inna-honour-lookbook"],
  ["sensetique-09-source-27-2x3", "sensetique-inna-honour-lookbook"],
  ["sensetique-12-source-16-853x1280", "sensetique-inna-honour-lookbook"],

  ["sensetique-04-source-12-544x763", "sensetique-buro-24-7-special"],
  ["sensetique-04-source-13-4x5", "sensetique-buro-24-7-special"],
  ["sensetique-05-source-03-375x538", "sensetique-buro-24-7-special"],
  ["sensetique-11-source-22-937x1171", "sensetique-buro-24-7-special"],
  ["sensetique-11-source-26-129x160", "sensetique-buro-24-7-special"],

  ["sensetique-11-source-101-1x1", "sensetique-olovo-brandbook-architecture"],
  ["sensetique-11-source-102-1x1", "sensetique-olovo-brandbook-architecture"],
  ["sensetique-11-source-103-1x1", "sensetique-olovo-brandbook-architecture"],
  ["sensetique-11-source-107-1x1", "sensetique-olovo-brandbook-architecture"],
  ["sensetique-11-source-108-1x1", "sensetique-olovo-brandbook-architecture"],
  ["sensetique-14-source-01-3508x2481", "sensetique-olovo-booklet-design"],
  ["sensetique-14-source-02-3508x2481", "sensetique-olovo-booklet-design"],

  ["sensetique-11-source-06-911x1280", "sensetique-digital-fear-of-love"],
  ["sensetique-11-source-07-85x128", "sensetique-digital-fear-of-love"],
  ["sensetique-11-source-08-431x640", "sensetique-digital-fear-of-love"],
  ["sensetique-11-source-11-913x1280", "sensetique-digital-fear-of-love"],
  ["sensetique-09-source-34-256x195", "sensetique-digital-fear-of-love"],
  ["sensetique-09-source-35-256x195", "sensetique-digital-fear-of-love"],

  ["sensetique-09-source-22-457x640", "sensetique-chapurin-editorial-2018"],
  ["sensetique-09-source-23-457x640", "sensetique-chapurin-editorial-2018"],
  ["sensetique-11-source-29-197x256", "sensetique-chapurin-editorial-2018"],
  ["sensetique-11-source-35-4x5", "sensetique-chapurin-editorial-2018"],
  ["sensetique-11-source-37-1023x1280", "sensetique-chapurin-editorial-2018"],
  ["sensetique-11-source-41-4x5", "sensetique-chapurin-editorial-2018"],
  ["sensetique-11-source-45-853x1280", "sensetique-chapurin-editorial-2018"],
  ["sensetique-11-source-47-853x1280", "sensetique-chapurin-editorial-2018"],
  ["sensetique-11-source-50-853x1280", "sensetique-chapurin-editorial-2018"],
  ["sensetique-11-source-55-853x1280", "sensetique-chapurin-editorial-2018"],
  ["sensetique-11-source-64-457x640", "sensetique-chapurin-editorial-2018"],

  ["sensetique-04-source-15-3x4", "sensetique-wood-metal-panic"],
  ["sensetique-11-source-71-263x320", "sensetique-wood-metal-panic"],
  ["sensetique-11-source-72-427x640", "sensetique-wood-metal-panic"],
  ["sensetique-11-source-73-640x427", "sensetique-wood-metal-panic"],
  ["sensetique-11-source-09-183x256", "sensetique-wood-metal-panic"],
  ["sensetique-11-source-10-457x640", "sensetique-wood-metal-panic"],
  ["sensetique-11-source-12-427x640", "sensetique-wood-metal-panic"],
  ["sensetique-12-source-08-427x640", "sensetique-wood-metal-panic"],
  ["sensetique-12-source-09-427x640", "sensetique-wood-metal-panic"],
  ["sensetique-12-source-10-223x320", "sensetique-wood-metal-panic"],
  ["sensetique-12-source-11-427x640", "sensetique-wood-metal-panic"],
  ["sensetique-12-source-12-427x640", "sensetique-wood-metal-panic"],
  ["sensetique-12-source-13-427x640", "sensetique-wood-metal-panic"],
  ["sensetique-12-source-14-427x640", "sensetique-wood-metal-panic"],

  // Sensetique — unnamed editorials are grouped only where the credits/context are coherent.
  ["sensetique-01-source-08-3x2", "sensetique-editorial-daniil-korotechenkov"],
  ["sensetique-05-source-01-3x4", "sensetique-editorial-daniil-korotechenkov"],
  ["sensetique-09-source-12-2x3", "sensetique-editorial-daniil-korotechenkov"],
  ["sensetique-11-source-03-7x8", "sensetique-editorial-daniil-korotechenkov"],
  ["sensetique-11-source-04-1159x1280", "sensetique-editorial-daniil-korotechenkov"],
  ["sensetique-11-source-05-969x1280", "sensetique-editorial-daniil-korotechenkov"],
  ["sensetique-11-source-95-640x457", "sensetique-editorial-daniil-korotechenkov"],
  ["sensetique-11-source-96-457x640", "sensetique-editorial-daniil-korotechenkov"],
  ["sensetique-11-source-97-16x9", "sensetique-editorial-daniil-korotechenkov"],
  ["sensetique-12-source-15-953x1280", "sensetique-editorial-daniil-korotechenkov"],
  ["sensetique-13-source-34-985x1280", "sensetique-editorial-daniil-korotechenkov"],

  ["sensetique-04-source-16-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-09-source-33-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-09-source-36-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-11-source-02-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-13-source-39-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-13-source-42-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-13-source-45-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-13-source-48-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-13-source-52-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-13-source-53-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-13-source-54-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-13-source-55-4x5", "sensetique-editorial-tatiana-nikishina"],
  ["sensetique-13-source-56-4x5", "sensetique-editorial-tatiana-nikishina"],

  ["sensetique-04-source-10-4x5", "sensetique-editorial-katya-knyazeva"],
  ["sensetique-09-source-11-857x1200", "sensetique-editorial-katya-knyazeva"],
  ["sensetique-09-source-18-4x5", "sensetique-editorial-katya-knyazeva"],
  ["sensetique-09-source-19-2x3", "sensetique-editorial-katya-knyazeva"],

  ["sensetique-04-source-17-247x320", "sensetique-editorial-yuri-ivanov"],
  ["sensetique-09-source-47-247x320", "sensetique-editorial-yuri-ivanov"],
  ["sensetique-09-source-03-2x3", "sensetique-editorial-ivan-krushinski"],
  ["sensetique-09-source-04-2x3", "sensetique-editorial-ivan-krushinski"],
  ["sensetique-09-source-05-3x2", "sensetique-editorial-ivan-krushinski"],

  ["sensetique-04-source-07-2x3", "sensetique-editorial-andrey-raputo-01"],
  ["sensetique-04-source-08-2x3", "sensetique-editorial-andrey-raputo-01"],
  ["sensetique-13-source-50-5x7", "sensetique-editorial-andrey-raputo-02"],
  ["sensetique-13-source-51-5x4", "sensetique-editorial-andrey-raputo-02"],
  ["sensetique-12-source-05-233x350", "sensetique-editorial-andrey-raputo-02"],
]);

export function resolveAssignedProjectIds(
  entry: AssignableMediaEntry,
): readonly ProjectId[] | undefined {
  if (entry.projectIds?.length) {
    return entry.projectIds as readonly ProjectId[];
  }

  for (const [prefix, projectId] of projectByPrefix) {
    if (entry.id.startsWith(prefix)) {
      return [projectId];
    }
  }

  const projectId = projectByAssetId.get(entry.assetId);

  return projectId ? [projectId] : undefined;
}
