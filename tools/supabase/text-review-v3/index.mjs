import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  ROUND_ID,
  buildReviewState,
  hydrateItems,
  normalizeSubmission
} from "./contract.mjs";

// Deployment replaces this marker with the private SHA-256 of the shared review key.
const KEY_HASH="__TEXT_REVIEW_KEY_HASH__";
const ALLOWED_ORIGINS=new Set(["https://www.looksawful.ru","https://looksawful.ru"]);

const cors=(req)=>{
  const origin=req.headers.get("origin")||"";
  const headers={
    "access-control-allow-methods":"GET,POST,OPTIONS",
    "access-control-allow-headers":"content-type,x-review-key",
    "cache-control":"no-store",
    "vary":"Origin"
  };
  if(ALLOWED_ORIGINS.has(origin)) headers["access-control-allow-origin"]=origin;
  return headers;
};

const db=()=>createClient(Deno.env.get("SUPABASE_URL"),Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const hex=(buffer)=>[...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,"0")).join("");
const sha=async(value)=>hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));
const authorized=async(req)=>{
  const key=req.headers.get("x-review-key")||"";
  return !!key && await sha(key)===KEY_HASH;
};

async function loadState(client){
  const [itemsResult,answersResult,decisionsResult]=await Promise.all([
    client.from("temp_text_review_round_3_items")
      .select("item_id,sort_order,payload")
      .eq("active",true)
      .order("sort_order",{ascending:true}),
    client.from("temp_text_review_round_3_answers")
      .select("item_id,option_id,custom_text,updated_at"),
    client.from("temp_text_review_round_3_prior_decisions")
      .select("decision_id,source_round,source_item_id,original_text,chosen_text,chosen_option,custom_text,source_provenance,decided_at,metadata")
  ]);
  if(itemsResult.error||answersResult.error||decisionsResult.error){
    throw itemsResult.error||answersResult.error||decisionsResult.error;
  }
  const items=hydrateItems(itemsResult.data||[]);
  return buildReviewState(answersResult.data||[],items,decisionsResult.data||[]);
}

Deno.serve(async(req)=>{
  const CORS=cors(req);
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:CORS});
  if(!(await authorized(req))) return new Response("Unauthorized",{status:401,headers:CORS});

  const client=db();

  if(req.method==="GET"){
    let state;
    try{state=await loadState(client)}
    catch(error){
      console.error(error);
      return new Response("Database error",{status:500,headers:CORS});
    }
    return Response.json({
      round:{id:ROUND_ID,label:"Round 3 · полный аудит текстов"},
      items:state.reviewItems,
      answers:state.answers,
      progress:state.progress,
      decisionLock:{
        locked:state.locked,
        pendingApply:state.pendingApply,
        conflicts:state.conflicts,
        unresolved:state.unresolved,
        summary:state.summary
      }
    },{headers:CORS});
  }

  if(req.method==="POST"){
    let input;
    try{input=await req.json()}catch{return new Response("Bad JSON",{status:400,headers:CORS})}

    let state;
    try{state=await loadState(client)}
    catch(error){
      console.error(error);
      return new Response("Database error",{status:500,headers:CORS});
    }

    const parsed=normalizeSubmission(input,state.reviewItems);
    if(!parsed.ok) return new Response(parsed.error,{status:parsed.status,headers:CORS});

    const {error}=await client.from("temp_text_review_round_3_answers").upsert({
      item_id:parsed.item.id,
      option_id:parsed.optionId,
      custom_text:parsed.customText,
      updated_at:new Date().toISOString()
    });
    if(error){
      console.error(error);
      return new Response("Database error",{status:500,headers:CORS});
    }
    return Response.json({ok:true},{headers:CORS});
  }

  return new Response("Method not allowed",{status:405,headers:CORS});
});
