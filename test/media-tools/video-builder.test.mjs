import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canReuseVideoOutput,
  classifyVideoProbe,
  plannedVideoOutputSrc,
} from "../../tools/build-video-media.mjs";

test("video classifier keeps compatible web mp4 unchanged", () => {
  const result = classifyVideoProbe({
    path: "/media/fixtures/clip.mp4",
    probe: {
      format: { format_name: "mov,mp4,m4a,3gp,3g2,mj2", bit_rate: "2800000", duration: "3.2", size: "1000000" },
      streams: [
        { codec_type: "video", codec_name: "h264", profile: "High", width: 1280, height: 720, pix_fmt: "yuv420p", r_frame_rate: "30/1" },
        { codec_type: "audio", codec_name: "aac", channels: 2 },
      ],
      faststart: true,
    },
  });

  assert.equal(result.status, "unchanged");
  assert.deepEqual(result.reasons, []);
});

test("video classifier marks mov and non-yuv420p sources for web mp4 generation", () => {
  const result = classifyVideoProbe({
    path: "/media/fixtures/source.mov",
    probe: {
      format: { format_name: "mov,mp4,m4a,3gp,3g2,mj2", bit_rate: "52000000", duration: "8.4", size: "54600000" },
      streams: [
        { codec_type: "video", codec_name: "prores", profile: "HQ", width: 3840, height: 2160, pix_fmt: "yuv422p10le", r_frame_rate: "25/1" },
        { codec_type: "audio", codec_name: "pcm_s16le", channels: 2 },
      ],
      faststart: false,
    },
  });

  assert.equal(result.status, "transcode");
  assert.match(result.reasons.join("\n"), /mov container/i);
  assert.match(result.reasons.join("\n"), /codec prores/i);
  assert.match(result.reasons.join("\n"), /pixel format yuv422p10le/i);
  assert.equal(plannedVideoOutputSrc("/media/fixtures/source.mov"), "/media/generated/video/fixtures/source.web.mp4");
});


test("video builder reuses only an output produced from the same source and config", () => {
  const previousItem = {
    sourceHash: "source-a",
    configHash: "config-a",
    outputSrc: "/media/generated/video/clip.web.mp4",
    outputBytes: 1234,
  };

  assert.equal(canReuseVideoOutput({
    previousItem,
    sourceHash: "source-a",
    configHash: "config-a",
    outputSrc: "/media/generated/video/clip.web.mp4",
    outputBytes: 1234,
  }), true);

  assert.equal(canReuseVideoOutput({
    previousItem,
    sourceHash: "changed-source",
    configHash: "config-a",
    outputSrc: "/media/generated/video/clip.web.mp4",
    outputBytes: 1234,
  }), false);

  assert.equal(canReuseVideoOutput({
    previousItem,
    sourceHash: "source-a",
    configHash: "changed-config",
    outputSrc: "/media/generated/video/clip.web.mp4",
    outputBytes: 1234,
  }), false);

  assert.equal(canReuseVideoOutput({
    previousItem,
    sourceHash: "source-a",
    configHash: "config-a",
    outputSrc: "/media/generated/video/clip.web.mp4",
    outputBytes: 999,
  }), false);
});
