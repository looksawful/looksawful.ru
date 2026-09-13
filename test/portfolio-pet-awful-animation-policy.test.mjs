import assert from "node:assert/strict";
import test from "node:test";
import {
  AWFUL_DECORATIVE_ANIMATION_POLICY,
  resolveAwfulPromptAnimation,
} from "../src/features/portfolio-pet/awful-animation-policy.ts";

test("Awful maps real chat contexts to the approved decorative scenes", () => {
  assert.equal(resolveAwfulPromptAnimation("обработай эту фотографию"), "camera-pro-flash");
  assert.equal(resolveAwfulPromptAnimation("у меня сейчас созвон по телефону"), "phone-pacing");
  assert.equal(resolveAwfulPromptAnimation("спроектируй архитектуру и схему"), "flipchart");
  assert.equal(resolveAwfulPromptAnimation("нарисуй эскиз иллюстрации"), "drawing-cross-legged");
  assert.equal(resolveAwfulPromptAnimation("включи музыку в наушниках"), "music-house-dance");
  assert.equal(resolveAwfulPromptAnimation("пора немного поспать"), "sleep-cross-legged");
  assert.equal(resolveAwfulPromptAnimation("расскажи обо мне"), null);
});

test("Awful policy preserves authored priority, cooldown and complete-cycle limits", () => {
  const policy = AWFUL_DECORATIVE_ANIMATION_POLICY;
  assert.ok(policy["camera-pro-flash"].priority > policy.camera.priority);
  assert.ok(policy.camera.priority > policy["phone-pacing"].priority);
  assert.ok(policy["phone-pacing"].priority > policy.flipchart.priority);
  assert.ok(policy.flipchart.priority > policy["drawing-cross-legged"].priority);
  assert.ok(policy["drawing-cross-legged"].priority > policy["music-house-dance"].priority);
  assert.ok(policy["music-house-dance"].priority > policy.laptop.priority);
  assert.ok(policy.laptop.priority > policy.coffee.priority);
  assert.ok(policy.coffee.priority > policy["sleep-cross-legged"].priority);
  assert.equal(policy["camera-pro-flash"].cooldownMs, 60_000);
  assert.equal(policy.laptop.cooldownMs, 45_000);
  assert.equal(policy["phone-pacing"].cooldownMs, 30_000);
  assert.equal(policy.coffee.cooldownMs, 900_000);
  assert.equal(policy["sleep-cross-legged"].cooldownMs, 600_000);
  assert.equal(policy["phone-pacing"].maxPlaybackMs % 1_375, 0);
  assert.equal(policy["sleep-cross-legged"].maxPlaybackMs, 3_050 * 3);
});
