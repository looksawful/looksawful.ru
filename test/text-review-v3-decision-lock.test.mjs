import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDecisionLockState,
  contextKey
} from "../tools/supabase/text-review-v3/contract.mjs";

const item=({
  id="r3-home-hero",
  source="old",
  production=source,
  sourceMismatch=false,
  priorDecisionId="decision-home-hero",
  expectedContextKey="home|Hero|Lead",
  pageId="home",
  section="Hero",
  role="Lead"
}={})=>({
  id,
  kind:"copy",
  pageId,
  pageLabel:"Главная",
  section,
  role,
  current:{
    source,
    production,
    sourceMismatch,
    sourceProvenance:"dev",
    productionProvenance:"prod"
  },
  options:[
    {id:"keep",label:"Оставить",text:source},
    {id:"strong",label:"Улучшить",text:"new"}
  ],
  priorDecision:priorDecisionId?{
    decisionId:priorDecisionId,
    expectedContextKey
  }:undefined
});

const decision=({
  decision_id="decision-home-hero",
  original_text="old",
  chosen_text="new",
  chosen_option="strong"
}={})=>({
  decision_id,
  source_round:"prior_owner_review",
  source_item_id:"home-hero",
  original_text,
  chosen_text,
  chosen_option,
  custom_text:"",
  source_provenance:"confirmed owner decision",
  decided_at:"2026-09-22T00:00:00Z"
});

test("context key is stable across the material occurrence identity",()=>{
  assert.equal(contextKey(item()),"home|Hero|Lead");
});

test("accepted prior rewrite that is not in source becomes approved pending apply, not a new review",()=>{
  const state=buildDecisionLockState([item()],[decision()]);
  assert.deepEqual(state.reviewItems,[]);
  assert.equal(state.pendingApply.length,1);
  assert.equal(state.pendingApply[0].item.id,"r3-home-hero");
  assert.equal(state.pendingApply[0].chosenText,"new");
  assert.equal(state.summary.pendingApply,1);
  assert.equal(state.summary.reviewRequired,0);
});

test("accepted prior wording already present in source is locked and not reviewed again",()=>{
  const state=buildDecisionLockState(
    [item({source:"new"})],
    [decision()]
  );
  assert.equal(state.locked.length,1);
  assert.equal(state.locked[0].status,"already-current");
  assert.equal(state.reviewItems.length,0);
});

test("prior Keep remains locked when the same current text is still present",()=>{
  const state=buildDecisionLockState(
    [item()],
    [decision({chosen_text:"old",chosen_option:"keep"})]
  );
  assert.equal(state.locked.length,1);
  assert.equal(state.locked[0].status,"kept-current");
  assert.equal(state.reviewItems.length,0);
});

test("changed current text invalidates the old decision and returns the item to review",()=>{
  const state=buildDecisionLockState(
    [item({source:"drifted"})],
    [decision()]
  );
  assert.equal(state.reviewItems.length,1);
  assert.equal(state.conflicts[0].reason,"stale-current");
});

test("material context mismatch invalidates inheritance",()=>{
  const state=buildDecisionLockState(
    [item({section:"Projects"})],
    [decision()]
  );
  assert.equal(state.reviewItems.length,1);
  assert.equal(state.conflicts[0].reason,"context-mismatch");
});

test("source/production drift is a sync conflict and cannot auto-lock",()=>{
  const state=buildDecisionLockState(
    [item({source:"old",production:"prod-drift",sourceMismatch:true})],
    [decision()]
  );
  assert.equal(state.reviewItems.length,1);
  assert.equal(state.conflicts[0].reason,"source-production-mismatch");
});

test("unlinked or unrecovered prior decision stays reviewable without inventing a lock",()=>{
  const state=buildDecisionLockState(
    [item({priorDecisionId:null})],
    []
  );
  assert.equal(state.reviewItems.length,1);
  assert.equal(state.unresolved.length,1);
  assert.equal(state.unresolved[0].reason,"no-confirmed-prior-decision");
});

test("one prior decision cannot silently lock multiple current occurrences",()=>{
  assert.throws(
    ()=>buildDecisionLockState(
      [
        item({id:"one"}),
        item({id:"two"})
      ],
      [decision()]
    ),
    /linked to multiple current occurrences/
  );
});
