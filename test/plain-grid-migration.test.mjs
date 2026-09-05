import assert from "node:assert/strict";
import test from "node:test";

const expected = {
  styx: {
    module: "../src/data/content/styx.ts",
    groups: {
      styxPrintLinksGroup: [
        "styx-06-source-03-1x1-use-01",
        "styx-06-source-04-69x80-use-01",
        "styx-06-source-05-1x1-use-01",
      ],
      styxScanographyCampaignGroup: [
        "styx-07-source-01-4x5-use-03",
        "styx-07-source-02-4x5-use-03",
        "styx-07-source-03-4x5-use-02",
        "styx-07-source-04-4x5-use-02",
        "styx-07-source-05-4x5-use-03",
        "styx-07-source-06-591x640-use-03",
      ],
    },
  },
  sensetique: {
    module: "../src/data/content/sensetique.ts",
    groups: {
      sensetiqueBuro247Group: [
        "sensetique-04-source-12-544x763-use-02",
        "sensetique-04-source-13-4x5-use-02",
        "sensetique-05-source-03-375x538-use-02",
        "sensetique-11-source-22-937x1171-use-02",
        "sensetique-11-source-26-129x160-use-02",
      ],
      sensetiqueOlovoBookletGroup: [
        "sensetique-14-source-01-3508x2481-use-02",
        "sensetique-14-source-02-3508x2481-use-02",
      ],
      sensetiqueTatianaNikishinaEditorialGroup: [
        "sensetique-04-source-16-4x5-use-03",
        "sensetique-09-source-33-4x5-use-03",
        "sensetique-09-source-36-4x5-use-03",
        "sensetique-11-source-02-4x5-use-03",
        "sensetique-13-source-39-4x5-use-03",
        "sensetique-13-source-42-4x5-use-03",
        "sensetique-13-source-45-4x5-use-03",
        "sensetique-13-source-48-4x5-use-03",
      ],
      sensetiqueKatyaKnyazevaEditorialGroup: [
        "sensetique-04-source-10-4x5-use-03",
        "sensetique-09-source-11-857x1200-use-03",
        "sensetique-09-source-18-4x5-use-03",
        "sensetique-09-source-19-2x3-use-03",
      ],
      sensetiqueYuriIvanovEditorialGroup: [
        "sensetique-04-source-17-247x320-use-02",
        "sensetique-09-source-47-247x320-use-02",
      ],
    },
  },
  shootings: {
    module: "../src/data/content/shootings.ts",
    groups: {
      shootingsObladaetPortraitsGroup: [
        "obladaet-02-source-01-4x5-use-02",
        "obladaet-02-source-02-4x5-use-02",
        "obladaet-02-source-03-4x5-use-02",
        "obladaet-02-source-04-4x5-use-02",
      ],
      shootingsEvashaMixedGroup: [
        "evasha-08-source-01-99x140-use-02",
        "evasha-08-source-02-4x5-use-02",
      ],
      shootingsEvashaPortraitsGroup: [
        "evasha-10-source-01-3x4-use-02",
        "evasha-10-source-02-2x3-use-02",
      ],
      shootingsHypressionCollageGroup: [
        "hypression-15-source-01-1x1-use-02",
        "hypression-15-source-02-256x181-use-02",
      ],
      shootingsHypressionMixedMediaGroup: [
        "hypression-16-source-01-479x671-use-02",
        "hypression-16-source-02-2x3-use-02",
      ],
      shootingsHypressionPortraitsGroup: [
        "hypression-17-source-01-4x5-use-02",
        "hypression-17-source-02-121x175-use-02",
      ],
    },
  },
};

const layoutByGroup = {
  sensetiqueBuro247Group: "editorial",
};

test("typed media groups keep their expected layout contracts and media order", async () => {
  for (const { module, groups } of Object.values(expected)) {
    const exports = await import(module);

    for (const [name, entryIds] of Object.entries(groups)) {
      const group = exports[name];
      const expectedLayout = layoutByGroup[name] ?? "grid";
      assert.ok(group, `missing export ${name}`);
      assert.equal(group.layout, expectedLayout, `${name} must keep its expected layout`);
      if (expectedLayout === "grid") {
        assert.equal(group.mode ?? "plain", "plain", `${name} must stay plain`);
      } else {
        assert.equal("mode" in group, false, `${name} must not define grid-only mode`);
      }
      assert.equal(group.captionView, "overlay", `${name} must keep overlay captions`);
      assert.deepEqual(
        group.items.map((item) => item.entryId),
        entryIds,
        `${name} media order changed`,
      );
    }
  }
});
