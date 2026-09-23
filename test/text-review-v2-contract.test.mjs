import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReviewState,
  normalizeSubmission
} from "../tools/supabase/text-review-v2/contract.mjs";

const copyItem=({
  id="copy",
  production="current",
  expectedCurrent="current",
  requiredFactChoice
}={})=>({
  id,
  current:{
    production,
    source:production,
    sourceMismatch:false,
    productionProvenance:"production",
    sourceProvenance:"source"
  },
  options:[
    {id:"keep",label:"Keep",text:production},
    {id:"strong",label:"Strong",text:"candidate",requiredFactChoice}
  ],
  round1:{
    itemId:"round1-copy",
    expectedCurrent,
    optionByChoice:{a:"strong",b:"keep",custom:"custom"}
  }
});

test("Round 1 carry-forward requires an exact current-text match",()=>{
  const snapshots=[{item_id:"round1-copy",choice:"b",custom_text:"",answered_at:"2026-01-01T00:00:00Z"}];
  const exact=buildReviewState([],snapshots,[copyItem()]);
  assert.equal(exact.answers.copy.option_id,"keep");
  assert.equal(exact.answers.copy.inherited,true);
  assert.equal(exact.progress.answered,1);

  const stale=buildReviewState([],snapshots,[copyItem({production:"changed"})]);
  assert.equal(stale.answers.copy,undefined);
  assert.equal(stale.progress.answered,0);
});

test("persisted Round 2 answers override inherited Round 1 decisions",()=>{
  const item=copyItem();
  const state=buildReviewState(
    [{item_id:"copy",option_id:"strong",custom_text:"",updated_at:"2026-01-02T00:00:00Z"}],
    [{item_id:"round1-copy",choice:"b",custom_text:"",answered_at:"2026-01-01T00:00:00Z"}],
    [item]
  );
  assert.equal(state.answers.copy.option_id,"strong");
  assert.equal(state.answers.copy.inherited,false);
});

test("fact-dependent choices stay blocked until the required fact choice exists",()=>{
  const fact={
    id:"fact",
    options:[
      {id:"yes",label:"Yes",text:"yes"},
      {id:"no",label:"No",text:"no"}
    ]
  };
  const copy=copyItem({requiredFactChoice:{itemId:"fact",optionId:"yes"}});
  const blocked=buildReviewState(
    [{item_id:"copy",option_id:"strong",custom_text:""}],
    [],
    [copy,fact]
  );
  assert.equal(blocked.answers.copy.application_blocked,true);

  const clear=buildReviewState(
    [
      {item_id:"copy",option_id:"strong",custom_text:""},
      {item_id:"fact",option_id:"yes",custom_text:""}
    ],
    [],
    [copy,fact]
  );
  assert.equal(clear.answers.copy.application_blocked,false);
});

test("submission validation only accepts declared options or non-empty custom text",()=>{
  const item=copyItem();
  assert.equal(normalizeSubmission({item_id:"copy",option_id:"missing"},[item]).ok,false);
  assert.equal(normalizeSubmission({item_id:"copy",option_id:"custom",custom_text:"   "},[item]).ok,false);

  const custom=normalizeSubmission({item_id:"copy",option_id:"custom",custom_text:"  my edit  "},[item]);
  assert.equal(custom.ok,true);
  assert.equal(custom.customText,"my edit");
});
