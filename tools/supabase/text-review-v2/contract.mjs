export const ROUND_ID="round_2_2026_09_22";
export const ROUND1_SNAPSHOT_ID="round_1_2026_09_22";

export const optionFor=(item,optionId)=>item.options.find(option=>option.id===optionId);

export function buildReviewState(persisted=[],snapshots=[],items=[]){
  const answerMap=new Map((persisted||[]).map(row=>[row.item_id,{...row,inherited:false}]));
  const snapshotMap=new Map((snapshots||[]).map(row=>[row.item_id,row]));

  for(const item of items){
    if(answerMap.has(item.id)||!item.round1||!item.current) continue;
    if(item.current.production!==item.round1.expectedCurrent) continue;
    const snapshot=snapshotMap.get(item.round1.itemId);
    if(!snapshot) continue;
    const optionId=item.round1.optionByChoice[snapshot.choice];
    if(!optionId) continue;
    if(optionId!=="custom"&&!optionFor(item,optionId)) continue;
    answerMap.set(item.id,{
      item_id:item.id,
      option_id:optionId,
      custom_text:snapshot.custom_text||"",
      updated_at:snapshot.answered_at,
      inherited:true,
      inherited_from:{snapshot_id:ROUND1_SNAPSHOT_ID,item_id:item.round1.itemId}
    });
  }

  const answers=Object.fromEntries(answerMap);
  for(const item of items){
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
    answers,
    progress:{answered:items.filter(item=>answers[item.id]).length,total:items.length}
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
