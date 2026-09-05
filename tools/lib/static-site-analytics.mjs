const STATIC_ANALYTICS_MARKER = "data-static-site-analytics";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseCounterId(value) {
  const normalized = typeof value === "number" ? String(value) : clean(value);
  if (!/^[1-9]\d*$/.test(normalized)) return null;
  const counterId = Number(normalized);
  return Number.isSafeInteger(counterId) ? counterId : null;
}

function serializeInline(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function consentStyles() {
  return `<style ${STATIC_ANALYTICS_MARKER}>\n.site-analytics-consent{position:fixed;z-index:110;left:clamp(1rem,2.2vw,2.5rem);right:auto;bottom:max(.5rem,env(safe-area-inset-bottom,0px));display:flex;align-items:center;flex-wrap:wrap;gap:.5rem;max-width:min(24rem,calc(100vw - 2*clamp(1rem,2.2vw,2.5rem)));border:1px solid rgb(0 0 0/.12);background:rgb(255 255 255/.94);color:#000;padding:.45rem .55rem;box-shadow:0 2px 10px rgb(0 0 0/.06);font:inherit;font-size:.72rem;line-height:1.2;backdrop-filter:blur(8px)}.site-analytics-consent__copy{flex:1 1 12rem;margin:0;max-width:28ch}.site-analytics-consent__privacy{color:inherit;opacity:.62;text-underline-offset:.14em}.site-analytics-consent__actions{display:flex;align-items:center;gap:.3rem;margin-left:auto}.site-analytics-consent__button{min-height:2rem;border:0;border-radius:0;background:transparent;color:inherit;padding:0 .45rem;font:inherit;cursor:pointer;opacity:.62}.site-analytics-consent__button:first-child{background:#000;color:#fff;opacity:1}.site-analytics-consent__button:focus-visible,.site-analytics-consent__privacy:focus-visible{outline:2px solid currentColor;outline-offset:.12rem}@media(hover:hover){.site-analytics-consent__button:hover,.site-analytics-consent__privacy:hover{opacity:1}}@media(max-width:32rem){.site-analytics-consent{right:clamp(1rem,2.2vw,2.5rem);max-width:none}.site-analytics-consent__copy{max-width:none}}\n</style>`;
}

function analyticsBootstrap(config) {
  const serialized = serializeInline(config);
  return `<script ${STATIC_ANALYTICS_MARKER}>\n(()=>{\n  const config=${serialized};\n  const consentKey="looksawful:analytics-consent";\n  const optedOut=navigator.globalPrivacyControl===true||navigator.doNotTrack==="1";\n  if(optedOut)return;\n\n  const readConsent=()=>{try{const value=localStorage.getItem(consentKey);return value==="granted"||value==="denied"?value:null}catch{return null}};\n  const storeConsent=(value)=>{try{localStorage.setItem(consentKey,value);return true}catch{return false}};\n\n  const loadCloudflare=()=>{\n    if(!config.cloudflareToken||document.querySelector('script[data-site-analytics="cloudflare"]'))return;\n    const script=document.createElement("script");\n    script.src="https://static.cloudflareinsights.com/beacon.min.js";\n    script.type="module";\n    script.setAttribute("data-site-analytics","cloudflare");\n    script.setAttribute("data-cf-beacon",JSON.stringify({token:config.cloudflareToken}));\n    document.head.append(script);\n  };\n\n  let goalsMounted=false;\n  const ensureYandexQueue=()=>{\n    if(window.ym)return window.ym;\n    const ym=(...args)=>{ym.a??=[];ym.a.push(args)};\n    ym.a=[];ym.l=Date.now();window.ym=ym;return ym;\n  };\n  const mountGoals=(ym)=>{\n    if(goalsMounted)return;\n    goalsMounted=true;\n    document.addEventListener("click",(event)=>{\n      const source=event.target;\n      if(!(source instanceof Element))return;\n      const anchor=source.closest("a[href]");\n      if(!(anchor instanceof HTMLAnchorElement))return;\n      const href=(anchor.getAttribute("href")||"").trim();\n      const lower=href.toLowerCase();\n      let goal=null;\n      let targetPath=null;\n      if(lower.startsWith("mailto:"))goal="contact_email";\n      else if(lower.startsWith("tel:"))goal="contact_phone";\n      else{\n        try{\n          const url=new URL(href,location.href);\n          if(anchor.hasAttribute("download")){goal="download";targetPath=url.pathname}\n          else if(url.hostname==="t.me"||url.hostname==="telegram.me")goal="contact_telegram";\n          else if(url.origin===location.origin){\n            const path=url.pathname.endsWith("/")?url.pathname:url.pathname+"/";\n            if(path==="/cv/")goal="cv_open";\n            else if(path.startsWith("/work/")){goal="project_open";targetPath=url.pathname}\n          }\n        }catch{}\n      }\n      if(!goal)return;\n      const action_info={page:location.pathname||"/"};\n      if(targetPath)action_info.target=targetPath;\n      ym(config.yandexCounterId,"reachGoal",goal,{action_info});\n    },true);\n  };\n  const loadYandex=()=>{\n    if(!config.yandexCounterId||document.querySelector('script[data-site-analytics="yandex"]'))return;\n    const ym=ensureYandexQueue();\n    ym(config.yandexCounterId,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});\n    mountGoals(ym);\n    const script=document.createElement("script");\n    script.src="https://mc.yandex.ru/metrika/tag.js";\n    script.async=true;\n    script.setAttribute("data-site-analytics","yandex");\n    document.head.append(script);\n  };\n\n  const removeConsent=()=>document.querySelector("[data-site-analytics-consent]")?.remove();\n  const renderConsent=()=>{\n    if(!config.yandexCounterId||readConsent()!==null||document.querySelector("[data-site-analytics-consent]"))return;\n    const panel=document.createElement("aside");\n    panel.className="site-analytics-consent";\n    panel.setAttribute("data-site-analytics-consent","");\n    panel.setAttribute("aria-label","Настройки cookies");\n    const copy=document.createElement("p");\n    copy.className="site-analytics-consent__copy";\n    copy.append("Этот сайт использует cookies. ");\n    const privacy=document.createElement("a");\n    privacy.className="site-analytics-consent__privacy";privacy.href="/privacy/";privacy.textContent="Подробнее";copy.append(privacy);\n    const actions=document.createElement("div");\n    actions.className="site-analytics-consent__actions";\n    const accept=document.createElement("button");\n    accept.type="button";accept.className="site-analytics-consent__button";accept.textContent="Принять";\n    const reject=document.createElement("button");\n    reject.type="button";reject.className="site-analytics-consent__button";reject.textContent="Отклонить";\n    accept.addEventListener("click",()=>{if(!storeConsent("granted"))return;loadYandex();removeConsent()});\n    reject.addEventListener("click",()=>{if(!storeConsent("denied"))return;removeConsent()});\n    actions.append(accept,reject);panel.append(copy,actions);document.body.append(panel);\n  };\n\n  loadCloudflare();\n  const consent=readConsent();\n  if(consent==="granted")loadYandex();\n  else if(consent===null)renderConsent();\n})();\n</script>`;
}

export function injectStaticSiteAnalytics(html, config = {}) {
  if (typeof html !== "string" || !html) return html;
  if (html.includes(STATIC_ANALYTICS_MARKER)) return html;

  const cloudflareToken = clean(config.cloudflareToken);
  const yandexCounterId = parseCounterId(config.yandexCounterId);
  if (!cloudflareToken && !yandexCounterId) return html;

  const runtimeConfig = {
    cloudflareToken: cloudflareToken || null,
    yandexCounterId,
  };
  const styles = consentStyles();
  const bootstrap = analyticsBootstrap(runtimeConfig);

  let output = html.includes("</head>")
    ? html.replace("</head>", `${styles}</head>`)
    : `${styles}${html}`;
  output = output.includes("</body>")
    ? output.replace("</body>", `${bootstrap}</body>`)
    : `${output}${bootstrap}`;
  return output;
}
