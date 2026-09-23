// cspell:disable
export const ROUND_ID="round_2_2026_09_22";
export const ROUND1_SNAPSHOT_ID="round_1_2026_09_22";

const HERO_CURRENT="Проектирую выразительные визуальные системы и интерфейсы. Разрабатываю айдентику и язык бренда, руковожу дизайнерами и помогаю им расти.";
const SENSETIQUE_CURRENT="Продакшен-агентство для моды и искусства и коммерческая фотостудия";
const SHOOTINGS_CURRENT="Фотография и микс-медиа для музыкантов, выставок и брендов";

export const ITEMS=[
  {
    id:"r2-home-hero-role",
    pageId:"home",
    pageLabel:"Главная",
    section:"Hero",
    role:"H1 / роль",
    kind:"copy",
    label:"Главная · Hero · роль",
    current:{
      production:"артдиректор цифровых продуктов",
      source:"артдиректор цифровых продуктов",
      sourceMismatch:false,
      productionProvenance:"production / · h1 .hero__role aria-label",
      sourceProvenance:"dev · index.html · h1 .hero__role aria-label"
    },
    options:[
      {id:"keep",label:"Оставить",text:"артдиректор цифровых продуктов"},
      {
        id:"minimal",
        label:"Минимально исправленный",
        text:"арт-директор цифровых продуктов",
        reasons:["грамматика"],
        explanation:"Нормативное дефисное написание сложного наименования должности."
      }
    ],
  },
  {
    id:"r2-home-hero-intro",
    pageId:"home",
    pageLabel:"Главная",
    section:"Hero",
    role:"Лид",
    kind:"copy",
    label:"Главная · Hero · лид",
    current:{
      production:HERO_CURRENT,
      source:HERO_CURRENT,
      sourceMismatch:false,
      productionProvenance:"production / · hero footer",
      sourceProvenance:"dev · index.html · .hero footer p"
    },
    options:[
      {id:"keep",label:"Оставить",text:HERO_CURRENT},
      {
        id:"strong",
        label:"Сильно улучшенный",
        text:"Проектирую цифровые продукты и визуальные системы: от айдентики и интерфейсов до языка бренда. Руковожу дизайнерами и помогаю командам расти.",
        reasons:["ясность","конкретность"],
        explanation:"Точнее называет продуктовую работу и убирает повтор конструкции «разрабатываю»."
      }
    ],
    round1:{
      itemId:"home-hero",
      expectedCurrent:HERO_CURRENT,
      optionByChoice:{a:"strong",b:"keep",custom:"custom"}
    }
  },
  {
    id:"r2-home-projects-heading",
    pageId:"home",
    pageLabel:"Главная",
    section:"Проекты",
    role:"H2",
    kind:"copy",
    label:"Главная · Проекты · заголовок",
    current:{
      production:"Проекты",
      source:"Проекты",
      sourceMismatch:false,
      productionProvenance:"production / · #projects-grid-title",
      sourceProvenance:"dev · index.html · #projects-grid-title"
    },
    options:[
      {id:"keep",label:"Оставить",text:"Проекты"}
    ],
  },
  {
    id:"r2-home-sensetique-focus",
    pageId:"home",
    pageLabel:"Главная",
    section:"Проекты",
    role:"Sensetique · описание карточки",
    kind:"copy",
    label:"Главная · Sensetique · карточка",
    current:{
      production:SENSETIQUE_CURRENT,
      source:SENSETIQUE_CURRENT,
      sourceMismatch:false,
      productionProvenance:"production / · карточка Sensetique",
      sourceProvenance:"dev · src/content/editorial/home-project-cards.json · sensetique.focus"
    },
    options:[
      {id:"keep",label:"Оставить",text:SENSETIQUE_CURRENT},
      {
        id:"minimal",
        label:"Минимально исправленный",
        text:"Продакшен-агентство для моды и искусства, коммерческая фотостудия",
        reasons:["ясность"],
        explanation:"Убирает тяжёлую связку «и … и …», не меняя смысл."
      },
      {
        id:"strong",
        label:"Сильно улучшенный",
        text:"Продакшен для моды, рекламы и искусства, коммерческая фотостудия",
        reasons:["ясность","конкретность","краткость"],
        explanation:"Короче формулирует тип бизнеса и добавляет подтверждённое направление рекламного продакшена."
      }
    ],
    round1:{
      itemId:"home-sensetique",
      expectedCurrent:SENSETIQUE_CURRENT,
      optionByChoice:{a:"strong",b:"keep",custom:"custom"}
    }
  },
  {
    id:"r2-home-shootings-focus",
    pageId:"home",
    pageLabel:"Главная",
    section:"Проекты",
    role:"Shootings · описание карточки",
    kind:"copy",
    label:"Главная · Shootings · карточка",
    current:{
      production:SHOOTINGS_CURRENT,
      source:SHOOTINGS_CURRENT,
      sourceMismatch:false,
      productionProvenance:"production / · карточка Shootings",
      sourceProvenance:"dev · src/content/editorial/home-project-cards.json · shootings.focus"
    },
    options:[
      {id:"keep",label:"Оставить",text:SHOOTINGS_CURRENT},
      {
        id:"strong",
        label:"Сильно улучшенный",
        text:"Фотография и микс-медиа для музыкантов, брендов и выставочных проектов",
        reasons:["ясность","конкретность"],
        explanation:"Уточняет, что речь об участии в выставочных проектах, а не о работе «для выставок» как заказчика."
      }
    ],
    round1:{
      itemId:"home-shootings",
      expectedCurrent:SHOOTINGS_CURRENT,
      optionByChoice:{a:"strong",b:"keep",custom:"custom"}
    }
  },
  {
    id:"r2-home-sensetique-period",
    pageId:"home",
    pageLabel:"Главная",
    section:"Проекты",
    role:"Sensetique · период",
    kind:"copy",
    label:"Главная · Sensetique · период",
    current:{
      production:"2017–2018",
      source:"2017–2018",
      sourceMismatch:false,
      productionProvenance:"production / · карточка Sensetique · период",
      sourceProvenance:"dev · src/data/catalog/cases.ts · sensetique.periodLabel"
    },
    options:[
      {id:"keep",label:"Оставить",text:"2017–2018"},
      {
        id:"strong",
        label:"Сильно улучшенный",
        text:"2016–2018",
        reasons:["факт/нужно подтвердить"],
        explanation:"В каталоге Case поле date и Engagement указывают 2016–2018, но публичная подпись periodLabel указывает 2017–2018.",
        requiredFactChoice:{itemId:"fact-home-sensetique-period",optionId:"2016-2018"}
      }
    ],
  },
  {
    id:"fact-home-sensetique-period",
    pageId:"home",
    pageLabel:"Главная",
    section:"Проверка факта",
    role:"Sensetique · период",
    kind:"fact",
    label:"Проверка факта · Sensetique · период",
    evidence:[
      {
        label:"Case / Engagement",
        text:"2016–2018",
        provenance:"dev · src/data/catalog/cases.ts date; src/data/catalog/engagements.ts date"
      },
      {
        label:"Публичная подпись",
        text:"2017–2018",
        provenance:"production / · карточка Sensetique; dev · src/data/catalog/cases.ts periodLabel"
      }
    ],
    options:[
      {
        id:"2016-2018",
        label:"2016–2018",
        text:"2016–2018",
        reasons:["факт/нужно подтвердить"],
        explanation:"Считать 2016–2018 каноническим периодом проекта."
      },
      {
        id:"2017-2018",
        label:"2017–2018",
        text:"2017–2018",
        reasons:["факт/нужно подтвердить"],
        explanation:"Считать 2017–2018 каноническим публичным периодом проекта."
      }
    ],
  }
];

export const ITEM_BY_ID=new Map(ITEMS.map(item=>[item.id,item]));

export const optionFor=(item,optionId)=>item.options.find(option=>option.id===optionId);

export function buildReviewState(persisted=[],snapshots=[],items=ITEMS){
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

export function normalizeSubmission(input,items=ITEMS){
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
