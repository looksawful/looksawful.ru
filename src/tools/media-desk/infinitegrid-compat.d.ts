import type { OnRequestAppend } from "@egjs/infinitegrid";

declare module "@egjs/infinitegrid" {
  interface MasonryInfiniteGrid {
    on(eventName: "requestAppend", handler: (event: OnRequestAppend) => void): this;
  }

  interface JustifiedInfiniteGrid {
    on(eventName: "requestAppend", handler: (event: OnRequestAppend) => void): this;
  }
}
