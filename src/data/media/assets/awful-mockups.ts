import type { MediaAsset } from "../../../types/media.ts";

export const awfulMockupsMediaAssets = [
  {
    id: "awful-mockups-03-phone-fashion",
    type: "image",
    src: "/media/projects/awful-mockups/03-phone-fashion.jpg",
    width: 1448,
    height: 1086,
  },
  {
    id: "awful-mockups-17-dual-phone",
    type: "image",
    src: "/media/projects/awful-mockups/17-dual-phone.jpg",
    width: 1024,
    height: 1536,
  },
  {
    id: "awful-mockups-28-phone-camera",
    type: "image",
    src: "/media/projects/awful-mockups/28-phone-camera.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "awful-mockups-39-print-case",
    type: "image",
    src: "/media/projects/awful-mockups/39-print-case.jpg",
    width: 1122,
    height: 1402,
  },
] as const satisfies readonly MediaAsset[];
