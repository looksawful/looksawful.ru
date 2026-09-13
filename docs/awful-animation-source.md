# Awful animation source

The current preview uses the owner-approved **Awful v6** package under
`public/pets/awful/v6/`. The previous
`public/pets/awful/awful-v2-spritesheet.webp` and `awful-idle.webp` files are
deliberately retained for rollback and must not be overwritten by a future
asset update.

## Runtime sources

- `v6/spritesheet.webp` — 1536×2288, 8×11 grid, 192×208 cells. This is the
  default source for idle, drag, open, thinking, review, success and error.
- `v6/extras/extra-animations.webp` — 1536×1040, 8×5 grid for coffee, laptop,
  camera, flipchart and drawing while seated cross-legged.
- `v6/extras/animations/*.webp` — 2304×208, 12×1 strips for house dance,
  professional camera with flash, phone pacing and seated sleep.
- `v6/extras/extra-animations.json` — the owner-authored timing, priority and
  cooldown reference. The TypeScript manifest is the executable web contract.
- `v6/ANIMATION-ACTIVATION-GUIDE-RU.txt` — the complete human-readable
  activation policy. `pet.json` describes the upstream Codex package and is
  retained as provenance; it is not read by the website.

The v6 main atlas replaces the old jump row with the approved full-body glasses
gesture. Portrait-only experiments are not part of the runtime package.

## Activation contract

Contact Hub continues to own semantic states through `portfolio-pet:state`.
Visual contexts may request a decorative scene without taking ownership of the
renderer:

```ts
document.dispatchEvent(
  new CustomEvent("portfolio-pet:animation", {
    detail: { animation: "camera-pro-flash" },
  }),
);
```

Accepted names are `coffee`, `laptop`, `camera`, `flipchart`,
`drawing-cross-legged`, `music-house-dance`, `camera-pro-flash`,
`phone-pacing` and `sleep-cross-legged`. Unknown names are ignored. Error and
active dragging take priority over decorative requests. A higher-priority
decorative request may interrupt a lower-priority one; cooldowns and the exact
ordering from the activation guide are enforced by
`awful-animation-policy.ts`.

The live Contact Hub resolves explicit photo, phone, planning, drawing, music
and sleep context from the submitted message. Work lasting at least 12 seconds
switches to laptop. While the pet is otherwise idle, coffee becomes eligible
after 15 seconds and seated sleep after 3 minutes; pointer or keyboard activity
immediately ends a passive sleep/coffee scene. One-shot scenes return to the
current semantic state after their final frame, while looping scenes stop only
at the bounded complete-cycle limits from the guide.

Each 12-frame strip uses its authored `frameDurationsMs`; replacing these with a
single FPS value makes the motion visibly abrupt and is a contract regression.

## Failure and rollback

Assets load on demand. If any requested v6 source fails to decode or load, the
launcher switches to the retained v2 main atlas, cancels decorative playback
and continues to expose the existing Contact Hub control. The launcher reports
`data-asset-version="v6"` or `data-asset-version="v2-fallback"` for browser
verification.
