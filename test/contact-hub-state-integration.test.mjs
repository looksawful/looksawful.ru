import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const stateUrl = new URL("../src/features/contact-hub/state.ts", import.meta.url);

async function loadStateContract() {
  assert.equal(
    existsSync(stateUrl),
    true,
    "RED: Contact Hub state contract is not implemented on current dev",
  );
  return import(stateUrl.href);
}

test("site contact and Awful open one shared Hub in the intended mode", async () => {
  const { createContactHubState, transitionContactHub } = await loadStateContract();

  const initial = createContactHubState({ aiAvailable: false });

  const fromCta = transitionContactHub(initial, {
    type: "OPEN",
    entryPoint: "site-contact",
  });
  assert.equal(fromCta.visibility, "open");
  assert.equal(fromCta.mode, "form");

  const closed = transitionContactHub(fromCta, { type: "CLOSE" });
  const fromPet = transitionContactHub(closed, {
    type: "OPEN",
    entryPoint: "pet",
  });
  assert.equal(fromPet.visibility, "open");
  assert.equal(fromPet.mode, "ai");
  assert.equal(fromPet.aiAvailable, false);
});

test("collapse and restore preserve the logical Hub mode", async () => {
  const { createContactHubState, transitionContactHub } = await loadStateContract();

  let state = createContactHubState({ aiAvailable: true });
  state = transitionContactHub(state, { type: "OPEN", entryPoint: "pet" });
  state = transitionContactHub(state, { type: "SET_MODE", mode: "form" });
  state = transitionContactHub(state, { type: "COLLAPSE" });

  assert.equal(state.visibility, "collapsed");
  assert.equal(state.mode, "form");

  state = transitionContactHub(state, { type: "RESTORE" });
  assert.equal(state.visibility, "open");
  assert.equal(state.mode, "form");
});
