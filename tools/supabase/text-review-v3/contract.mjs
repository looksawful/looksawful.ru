export const ROUND_ID="round_3_2026_09_24";

export const optionFor=(item,optionId)=>item.options?.find(option=>option.id===optionId);

export const contextKey=(item)=>[
  item?.pageId||"",
  item?.section||"",
  item?.role||""
].join("|");

const unresolvedEntry=(item,reason,extra={})=>({item,reason,...extra});

export function buildDecisionLockState(items=[],priorDecisions=[]){
  const decisionMap=new Map();
  for(const decision of priorDecisions||[]){
    if(!decision?.decision_id) throw new Error("Invalid prior decision");
    if(decisionMap.has(decision.decision_id)) throw new Error(`Duplicate prior decision: ${decision.decision_id}`);
    decisionMap.set(decision.decision_id,decision);
  }

  const linkedDecisionIds=new Set();
  const locked=[];
  const pendingApply=[];
  const reviewItems=[];
  const unresolved=[];
  const conflicts=[];

  for(const item of items||[]){
    const link=item?.priorDecision;
    if(!link?.decisionId){
      reviewItems.push(item);
      unresolved.push(unresolvedEntry(item,"no-confirmed-prior-decision"));
      continue;
    }

    if(linkedDecisionIds.has(link.decisionId)){
      throw new Error(`Prior decision ${link.decisionId} linked to multiple current occurrences`);
    }
    linkedDecisionIds.add(link.decisionId);

    const decision=decisionMap.get(link.decisionId);
    if(!decision){
      reviewItems.push(item);
      unresolved.push(unresolvedEntry(item,"prior-decision-not-recovered",{decisionId:link.decisionId}));
      continue;
    }

    const actualContextKey=contextKey(item);
    if(actualContextKey!==link.expectedContextKey){
      reviewItems.push(item);
      conflicts.push(unresolvedEntry(item,"context-mismatch",{
        decisionId:link.decisionId,
        expectedContextKey:link.expectedContextKey,
        actualContextKey
      }));
      continue;
    }

    if(!item.current||typeof item.current.source!=="string"){
      reviewItems.push(item);
      unresolved.push(unresolvedEntry(item,"missing-exact-source",{decisionId:link.decisionId}));
      continue;
    }

    if(item.current.sourceMismatch){
      reviewItems.push(item);
      conflicts.push(unresolvedEntry(item,"source-production-mismatch",{decisionId:link.decisionId}));
      continue;
    }

    const currentText=item.current.source;
    if(currentText===decision.original_text&&decision.chosen_text===decision.original_text){
      locked.push({
        item,
        decision,
        status:"kept-current",
        chosenText:decision.chosen_text,
        chosenOption:decision.chosen_option
      });
      continue;
    }

    if(currentText===decision.chosen_text){
      locked.push({
        item,
        decision,
        status:"already-current",
        chosenText:decision.chosen_text,
        chosenOption:decision.chosen_option
      });
      continue;
    }

    if(currentText===decision.original_text){
      pendingApply.push({
        item,
        decision,
        status:"approved-pending-apply",
        chosenText:decision.chosen_text,
        chosenOption:decision.chosen_option
      });
      continue;
    }

    reviewItems.push(item);
    conflicts.push(unresolvedEntry(item,"stale-current",{
      decisionId:link.decisionId,
      originalText:decision.original_text,
      chosenText:decision.chosen_text,
      currentText
    }));
  }

  return {
    locked,
    pendingApply,
    reviewItems,
    unresolved,
    conflicts,
    summary:{
      total:(items||[]).length,
      locked:locked.length,
      pendingApply:pendingApply.length,
      reviewRequired:reviewItems.length,
      conflicts:conflicts.length,
      unresolved:unresolved.length
    }
  };
}

export function buildReviewState(persisted=[],items=[],priorDecisions=[]){
  const lockState=buildDecisionLockState(items,priorDecisions);
  const reviewIds=new Set(lockState.reviewItems.map(item=>item.id));
  const answerMap=new Map(
    (persisted||[])
      .filter(row=>reviewIds.has(row.item_id))
      .map(row=>[row.item_id,{...row,inherited:false}])
  );
  const answers=Object.fromEntries(answerMap);

  for(const item of lockState.reviewItems){
    const answer=answers[item.id];
    if(!answer) continue;
    const option=optionFor(item,answer.option_id);
    const requirement=option?.requiredFactChoice;
    if(requirement){
      const factAnswer=answers[requirement.itemId];
      answer.application_blocked=!factAnswer||factAnswer.option_id!==requirement.optionId;
      if(answer.application_blocked) answer.blocked_reason="Нужно подтвердить связанный факт.";
    }else{
      answer.application_blocked=false;
    }
  }

  return {
    ...lockState,
    answers,
    progress:{
      answered:lockState.reviewItems.filter(item=>answers[item.id]).length,
      total:lockState.reviewItems.length
    }
  };
}

export function normalizeSubmission(input,items=[]){
  const item=items.find(candidate=>candidate.id===input?.item_id);
  if(!item) return {ok:false,status:422,error:"Invalid item"};

  const optionId=String(input?.option_id||"");
  const customText=typeof input?.custom_text==="string"?input.custom_text:"";
  if(customText.length>10000) return {ok:false,status:422,error:"Invalid custom text"};

  if(optionId==="custom"){
    const normalized=customText.trim();
    if(!normalized) return {ok:false,status:422,error:"Invalid custom option"};
    return {ok:true,item,optionId,customText:normalized};
  }

  if(!optionFor(item,optionId)) return {ok:false,status:422,error:"Invalid option"};
  return {ok:true,item,optionId,customText:""};
}

export function hydrateItems(rows=[]){
  const seen=new Set();
  return rows.map(row=>{
    const item=row?.payload;
    if(!item||typeof item!=="object"||item.id!==row.item_id||seen.has(item.id)){
      throw new Error("Invalid review item payload");
    }
    seen.add(item.id);
    return item;
  });
}
