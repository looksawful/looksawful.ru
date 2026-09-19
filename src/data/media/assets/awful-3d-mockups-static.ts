import type { MediaAsset } from "../../../types/media.ts";

export const awful3dMockupsStaticMediaAssets = [
  { id: "awful-3d-iphone-17-contact", type: "image", src: "/media/projects/awful-3d-mockups/iphone-17-contact.jpg", width: 2180, height: 872 },
  { id: "awful-3d-ipad-pro-11-contact", type: "image", src: "/media/projects/awful-3d-mockups/ipad-pro-11-contact.jpg", width: 1848, height: 3696 },
  { id: "awful-3d-ipad-pro-13-contact", type: "image", src: "/media/projects/awful-3d-mockups/ipad-pro-13-contact.jpg", width: 1848, height: 3696 },
  { id: "awful-3d-macbook-pro-14-contact", type: "image", src: "/media/projects/awful-3d-mockups/macbook-pro-14-contact.jpg", width: 1848, height: 1848 },
] as const satisfies readonly MediaAsset[];
