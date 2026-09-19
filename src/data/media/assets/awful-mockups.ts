import type { MediaAsset } from "../../../types/media.ts";

export const awfulMockupsMediaAssets = [
  { id: "awful-mockups-02-monitor", type: "image", src: "/media/projects/awful-mockups/02-monitor.jpg", width: 1122, height: 1402 },
  { id: "awful-mockups-03-phone-fashion", type: "image", src: "/media/projects/awful-mockups/03-phone-fashion.jpg", width: 1448, height: 1086 },
  { id: "awful-mockups-11-square", type: "image", src: "/media/projects/awful-mockups/11-square.jpg", width: 1024, height: 1024 },
  { id: "awful-mockups-16-landscape", type: "image", src: "/media/projects/awful-mockups/16-landscape.jpg", width: 1536, height: 1024 },
  { id: "awful-mockups-17-dual-phone", type: "image", src: "/media/projects/awful-mockups/17-dual-phone.jpg", width: 1024, height: 1536 },
  { id: "awful-mockups-18-phone", type: "image", src: "/media/projects/awful-mockups/18-phone.jpg", width: 1122, height: 1402 },
  { id: "awful-mockups-28-phone-camera", type: "image", src: "/media/projects/awful-mockups/28-phone-camera.jpg", width: 1122, height: 1402 },
  { id: "awful-mockups-39-print-case", type: "image", src: "/media/projects/awful-mockups/39-print-case.jpg", width: 1122, height: 1402 },
  { id: "awful-mockups-photoshop-layers-full", type: "image", src: "/media/projects/awful-mockups/photoshop-layers-full.png", width: 2560, height: 1440 },
  { id: "awful-mockups-photoshop-layers-detail", type: "image", src: "/media/projects/awful-mockups/photoshop-layers-detail.jpg", width: 1408, height: 1200 },
] as const satisfies readonly MediaAsset[];
