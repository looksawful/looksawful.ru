import { joinMarkup, projectAsset } from "./shared.js";

const screenUiCurrent = projectAsset("jestei/macbook/screen/screen-ui-current.png");
const recordPoolScreen = projectAsset("jestei/ui/record-pool-screen.png");
const paletteGrid = projectAsset("jestei/palette/jestei-palette-grid.png");
const colorAssets = {
  adsBlock: projectAsset("jestei/colors/ads-block.png"),
  adsBlockAlt: projectAsset("jestei/colors/ads-block-1.png"),
  adsBlockWide: projectAsset("jestei/colors/ads-block-2.png"),
  bilobaFlower: projectAsset("jestei/colors/biloba-flower.png"),
  bilobaFlowerStrip: projectAsset("jestei/colors/biloba-flower-strip.png"),
  blueLetters: projectAsset("jestei/colors/blue-letters.png"),
  dodgerBlue: projectAsset("jestei/colors/dodger-blue.png"),
  event: projectAsset("jestei/colors/event.png"),
  feature: projectAsset("jestei/colors/feature.png"),
  frameStrip: projectAsset("jestei/colors/frame-strip.png"),
  goldDrop: projectAsset("jestei/colors/gold-drop.png"),
  goldDropTall: projectAsset("jestei/colors/gold-drop-tall.png"),
  groupCard: projectAsset("jestei/colors/group-card.png"),
  groupSmall: projectAsset("jestei/colors/group-small.png"),
  groupTall: projectAsset("jestei/colors/group-tall.png"),
  pear: projectAsset("jestei/colors/pear.png"),
  rectangleBlue: projectAsset("jestei/colors/rectangle-blue.png"),
  rectangleGreen: projectAsset("jestei/colors/rectangle-green.png"),
};

const renderSvgImage = (href, attributes) =>
  `<image href="${href}" ${attributes} preserveAspectRatio="xMidYMid slice" />`;

const renderSvgNumber = (value, x, y, small = false) =>
  `<text class="interface-cases__svg-num${small ? " interface-cases__svg-num--small" : ""}" x="${x}" y="${y}">${value}</text>`;

const renderStage = (content, label = "") => `
  ${label ? `<div class="interface-cases__label">${label}</div>` : ""}
  <div class="interface-cases__stage">${content}</div>
`;

export const renderTalkMedia = () =>
  renderStage(
    `<svg class="interface-cases__desktop interface-cases__desktop--talk" viewBox="0 0 1200 760" aria-hidden="true">
      <defs>
        <linearGradient id="jesteipoolStandGradientA" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#eeeeee" />
          <stop offset="0.55" stop-color="#cfcfcf" />
          <stop offset="1" stop-color="#f5f5f5" />
        </linearGradient>
      </defs>
      <rect x="112" y="96" width="976" height="556" rx="10" fill="#000" />
      <rect x="128" y="112" width="944" height="510" fill="#fff" />
      <rect x="128" y="112" width="944" height="30" fill="#fff" />
      <rect x="128" y="142" width="944" height="1" fill="#e2e2e2" />
      <rect x="150" y="120" width="28" height="28" fill="#000" />
      <rect x="196" y="122" width="70" height="18" fill="#eeeeee" />
      <rect x="272" y="122" width="74" height="18" fill="#eeeeee" />
      <rect x="352" y="122" width="70" height="18" fill="#eeeeee" />
      <rect x="430" y="122" width="54" height="18" fill="#d8d8d8" />
      <rect x="492" y="122" width="72" height="18" fill="#eeeeee" />
      <rect x="570" y="122" width="58" height="18" fill="#eeeeee" />
      <rect x="942" y="122" width="50" height="18" fill="#f0f0f0" />
      <rect x="994" y="120" width="54" height="22" fill="#000" />
      <rect x="324" y="168" width="118" height="12" fill="#111" />
      <rect x="324" y="208" width="388" height="36" fill="#111" />
      <rect x="324" y="252" width="316" height="34" fill="#111" />
      <rect x="324" y="324" width="108" height="26" fill="#000" />
      <rect x="444" y="324" width="112" height="26" fill="#e7e7e7" />
      <line x1="128" y1="382" x2="1072" y2="382" stroke="#e7e7e7" />
      <rect x="320" y="426" width="250" height="150" fill="#f7f7f7" stroke="#dddddd" />
      <rect x="340" y="444" width="118" height="80" fill="#000" />
      ${renderSvgImage(screenUiCurrent, 'x="340" y="444" width="118" height="80"')}
      ${renderSvgNumber("01", 399, 493)}
      <rect x="470" y="444" width="76" height="16" fill="#000" />
      <rect x="470" y="470" width="56" height="8" fill="#d0d0d0" />
      <rect x="470" y="488" width="82" height="8" fill="#d0d0d0" />
      <rect x="592" y="426" width="250" height="150" fill="#f7f7f7" stroke="#dddddd" />
      <circle cx="626" cy="458" r="13" fill="#000" />
      <rect x="648" y="446" width="118" height="18" rx="2" fill="#ececec" />
      <rect x="646" y="478" width="150" height="36" rx="4" fill="#000" />
      <rect x="654" y="526" width="108" height="8" fill="#cfcfcf" />
      <rect x="864" y="426" width="160" height="150" fill="#f7f7f7" stroke="#dddddd" />
      <rect x="878" y="444" width="132" height="18" fill="#eeeeee" />
      <circle cx="894" cy="482" r="13" fill="#000" />
      <rect x="914" y="470" width="80" height="11" fill="#000" />
      <rect x="884" y="512" width="126" height="8" fill="#cfcfcf" />
      <rect x="884" y="532" width="108" height="8" fill="#cfcfcf" />
      <rect x="530" y="652" width="140" height="145" fill="url(#jesteipoolStandGradientA)" />
      <rect x="528" y="782" width="144" height="16" fill="#bdbdbd" />
      <rect x="528" y="798" width="144" height="8" fill="#e2e2e2" />
    </svg>`,
    "МЯГКИЙ МАКЕТ",
  );

export const renderGridMedia = () => {
  const gridItems = [
    [recordPoolScreen, 'x="158" y="192" width="116" height="74"', "02", 216, 238],
    [paletteGrid, 'x="324" y="176" width="116" height="108"', "03", 382, 239],
    [colorAssets.adsBlock, 'x="510" y="182" width="72" height="98"', "04", 546, 240],
    [colorAssets.adsBlockAlt, 'x="664" y="174" width="104" height="116"', "05", 716, 241],
    [colorAssets.adsBlockWide, 'x="832" y="178" width="88" height="98"', "06", 876, 236],
    [colorAssets.bilobaFlower, 'x="990" y="184" width="50" height="80"', "07", 1015, 232, true],
    [colorAssets.bilobaFlowerStrip, 'x="158" y="340" width="116" height="82"', "08", 216, 390],
    [colorAssets.blueLetters, 'x="328" y="320" width="108" height="122"', "09", 382, 390],
    [colorAssets.dodgerBlue, 'x="514" y="334" width="70" height="108"', "10", 549, 398],
    [colorAssets.event, 'x="660" y="354" width="112" height="62"', "11", 716, 394],
    [colorAssets.feature, 'x="836" y="324" width="80" height="114"', "12", 876, 390],
    [colorAssets.frameStrip, 'x="974" y="320" width="92" height="136"', "13", 1020, 398],
    [colorAssets.goldDrop, 'x="170" y="502" width="92" height="92"', "14", 216, 557],
    [colorAssets.goldDropTall, 'x="318" y="508" width="122" height="70"', "15", 379, 552],
    [colorAssets.groupCard, 'x="526" y="492" width="58" height="118"', "16", 555, 560, true],
    [colorAssets.groupSmall, 'x="650" y="510" width="136" height="72"', "17", 718, 555],
    [colorAssets.groupTall, 'x="830" y="494" width="96" height="116"', "18", 878, 561],
    [colorAssets.pear, 'x="982" y="492" width="78" height="118"', "19", 1021, 560],
  ];

  return renderStage(`<svg class="interface-cases__desktop interface-cases__desktop--grid" viewBox="0 0 1200 760" aria-hidden="true">
    <defs>
      <linearGradient id="jesteipoolStandGradientB" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#eeeeee" />
        <stop offset="0.55" stop-color="#cccccc" />
        <stop offset="1" stop-color="#f8f8f8" />
      </linearGradient>
    </defs>
    <rect x="118" y="120" width="964" height="534" rx="9" fill="#000" />
    <rect x="134" y="136" width="932" height="484" fill="#fff" />
    <rect x="134" y="136" width="932" height="24" fill="#fff" />
    <line x1="134" y1="160" x2="1066" y2="160" stroke="#d5d5d5" />
    <line x1="300" y1="136" x2="300" y2="620" stroke="#d5d5d5" />
    <line x1="466" y1="136" x2="466" y2="620" stroke="#d5d5d5" />
    <line x1="632" y1="136" x2="632" y2="620" stroke="#d5d5d5" />
    <line x1="798" y1="136" x2="798" y2="620" stroke="#d5d5d5" />
    <line x1="964" y1="136" x2="964" y2="620" stroke="#d5d5d5" />
    <line x1="134" y1="300" x2="1066" y2="300" stroke="#d5d5d5" />
    <line x1="134" y1="460" x2="1066" y2="460" stroke="#d5d5d5" />
    <rect x="158" y="192" width="116" height="74" fill="#000" />
    <rect x="324" y="176" width="116" height="108" fill="#000" />
    <rect x="510" y="182" width="72" height="98" fill="#000" />
    <rect x="664" y="174" width="104" height="116" fill="#000" />
    <rect x="832" y="178" width="88" height="98" fill="#000" />
    <rect x="990" y="184" width="50" height="80" fill="#000" />
    <rect x="158" y="340" width="116" height="82" fill="#000" />
    <rect x="328" y="320" width="108" height="122" fill="#000" />
    <rect x="514" y="334" width="70" height="108" fill="#000" />
    <rect x="660" y="354" width="112" height="62" fill="#000" />
    <rect x="836" y="324" width="80" height="114" fill="#000" />
    <rect x="974" y="320" width="92" height="136" fill="#000" />
    <rect x="170" y="502" width="92" height="92" rx="46" fill="#000" />
    <rect x="318" y="508" width="122" height="70" fill="#000" />
    <rect x="526" y="492" width="58" height="118" fill="#000" />
    <rect x="650" y="510" width="136" height="72" fill="#000" />
    <rect x="830" y="494" width="96" height="116" fill="#000" />
    <rect x="982" y="492" width="78" height="118" fill="#000" />
    ${joinMarkup(gridItems, ([href, attrs, label, x, y, small]) => `${renderSvgImage(href, attrs)}${renderSvgNumber(label, x, y, small)}`)}
    <rect x="520" y="654" width="160" height="132" fill="url(#jesteipoolStandGradientB)" />
    <rect x="520" y="772" width="160" height="16" fill="#bdbdbd" />
    <rect x="520" y="788" width="160" height="8" fill="#e3e3e3" />
  </svg>`);
};

export const renderPhoneCatalogMedia = () => {
  const phoneItems = [
    [colorAssets.rectangleBlue, 'x="132" y="192" width="74" height="54"', "20", 169, 228, true],
    [colorAssets.rectangleGreen, 'x="274" y="182" width="74" height="74"', "21", 311, 228, true],
    [screenUiCurrent, 'x="142" y="344" width="54" height="74"', "22", 169, 390, true],
    [recordPoolScreen, 'x="278" y="342" width="72" height="74"', "23", 314, 389, true],
    [paletteGrid, 'x="148" y="506" width="46" height="74"', "24", 171, 552, true],
    [colorAssets.adsBlock, 'x="290" y="506" width="46" height="74"', "25", 313, 552, true],
  ];

  return renderStage(`<svg class="interface-cases__phone" viewBox="0 0 470 760" aria-hidden="true">
    <rect x="54" y="18" width="362" height="724" rx="62" fill="#070707" />
    <rect x="66" y="30" width="338" height="700" rx="50" fill="#111" />
    <rect x="94" y="80" width="282" height="606" rx="24" fill="#000" />
    <rect x="174" y="44" width="122" height="28" rx="14" fill="#000" />
    <rect x="94" y="80" width="282" height="70" rx="10" fill="#050505" />
    <rect x="112" y="108" width="92" height="10" fill="#fff" />
    <rect x="286" y="108" width="36" height="10" fill="#fff" />
    <rect x="340" y="108" width="26" height="10" fill="#fff" />
    <rect x="104" y="158" width="130" height="126" rx="7" fill="#fff" />
    <rect x="246" y="158" width="130" height="126" rx="7" fill="#fff" />
    <rect x="104" y="318" width="130" height="126" rx="7" fill="#fff" />
    <rect x="246" y="318" width="130" height="126" rx="7" fill="#fff" />
    <rect x="104" y="478" width="130" height="126" rx="7" fill="#fff" />
    <rect x="246" y="478" width="130" height="126" rx="7" fill="#fff" />
    <rect x="132" y="192" width="74" height="54" fill="#000" />
    <rect x="274" y="182" width="74" height="74" rx="37" fill="#000" />
    <rect x="142" y="344" width="54" height="74" fill="#000" />
    <rect x="278" y="342" width="72" height="74" fill="#000" />
    <rect x="148" y="506" width="46" height="74" fill="#000" />
    <rect x="290" y="506" width="46" height="74" fill="#000" />
    ${joinMarkup(phoneItems, ([href, attrs, label, x, y, small]) => `${renderSvgImage(href, attrs)}${renderSvgNumber(label, x, y, small)}`)}
    <rect x="104" y="288" width="74" height="12" fill="#fff" />
    <rect x="104" y="306" width="42" height="8" fill="#888" />
    <rect x="246" y="288" width="78" height="12" fill="#fff" />
    <rect x="246" y="306" width="46" height="8" fill="#888" />
    <rect x="104" y="448" width="88" height="12" fill="#fff" />
    <rect x="104" y="466" width="48" height="8" fill="#888" />
    <rect x="246" y="448" width="82" height="12" fill="#fff" />
    <rect x="246" y="466" width="50" height="8" fill="#888" />
    <rect x="104" y="608" width="76" height="12" fill="#fff" />
    <rect x="104" y="626" width="50" height="8" fill="#888" />
    <rect x="246" y="608" width="76" height="12" fill="#fff" />
    <rect x="246" y="626" width="50" height="8" fill="#888" />
    <rect x="162" y="704" width="146" height="5" rx="3" fill="#fff" />
  </svg>`);
};

export const renderPaletteMedia = () =>
  renderStage(
    `<div class="interface-cases__palette" aria-hidden="true">${"<span class=\"interface-cases__ball\"></span>".repeat(9)}</div>`,
  );

export const renderControlPhoneMedia = () =>
  renderStage(`<svg class="interface-cases__phone" viewBox="0 0 470 760" aria-hidden="true">
    <rect x="54" y="18" width="362" height="724" rx="62" fill="#070707" />
    <rect x="66" y="30" width="338" height="700" rx="50" fill="#111" />
    <rect x="94" y="80" width="282" height="606" rx="24" fill="#000" />
    <rect x="174" y="44" width="122" height="28" rx="14" fill="#000" />
    <g fill="#fff">
      <circle cx="184" cy="132" r="4" />
      <circle cx="202" cy="132" r="4" />
      <circle cx="220" cy="132" r="4" />
      <circle cx="238" cy="132" r="4" />
      <circle cx="184" cy="150" r="4" />
      <circle cx="202" cy="150" r="4" />
      <circle cx="220" cy="150" r="4" />
      <circle cx="238" cy="150" r="4" />
      <circle cx="184" cy="202" r="4" />
      <circle cx="202" cy="202" r="4" />
      <circle cx="220" cy="202" r="4" />
      <circle cx="238" cy="202" r="4" />
      <circle cx="184" cy="220" r="4" />
      <circle cx="202" cy="220" r="4" />
      <circle cx="220" cy="220" r="4" />
      <circle cx="238" cy="220" r="4" />
    </g>
    <g stroke="#f5f5f5" stroke-width="2" fill="none">
      <rect x="138" y="324" width="194" height="290" rx="8" />
      <circle cx="162" cy="366" r="8" />
      <circle cx="190" cy="366" r="8" />
      <circle cx="218" cy="366" r="8" />
      <circle cx="246" cy="366" r="8" />
      <circle cx="274" cy="366" r="8" />
      <circle cx="302" cy="366" r="8" />
      <circle cx="162" cy="410" r="8" />
      <circle cx="190" cy="410" r="8" />
      <circle cx="218" cy="410" r="8" />
      <circle cx="246" cy="410" r="8" />
      <circle cx="274" cy="410" r="8" />
      <circle cx="302" cy="410" r="8" />
      <line x1="162" y1="476" x2="162" y2="570" />
      <line x1="190" y1="476" x2="190" y2="570" />
      <line x1="218" y1="476" x2="218" y2="570" />
      <line x1="246" y1="476" x2="246" y2="570" />
      <line x1="274" y1="476" x2="274" y2="570" />
      <line x1="302" y1="476" x2="302" y2="570" />
      <circle cx="162" cy="558" r="5" />
      <circle cx="190" cy="532" r="5" />
      <circle cx="218" cy="548" r="5" />
      <circle cx="246" cy="522" r="5" />
      <circle cx="274" cy="552" r="5" />
      <circle cx="302" cy="512" r="5" />
      <rect x="350" y="346" width="42" height="64" rx="4" />
      <circle cx="372" cy="438" r="30" />
      <rect x="350" y="488" width="42" height="34" rx="17" />
      <rect x="350" y="544" width="42" height="34" rx="17" />
      <rect x="350" y="600" width="42" height="34" rx="4" />
      <rect x="346" y="656" width="48" height="44" rx="4" />
    </g>
    <g fill="#f5f5f5">
      <rect x="148" y="646" width="12" height="36" rx="2" />
      <rect x="182" y="646" width="12" height="36" rx="2" />
      <rect x="216" y="646" width="12" height="36" rx="2" />
      <rect x="250" y="646" width="12" height="36" rx="2" />
      <rect x="284" y="646" width="12" height="36" rx="2" />
      <rect x="318" y="646" width="12" height="36" rx="2" />
    </g>
  </svg>`);

export const renderMasonryMedia = () => {
  const masonryItems = [
    [colorAssets.adsBlockAlt, 'x="172" y="218" width="112" height="80"', "26", 228, 267],
    [colorAssets.adsBlockWide, 'x="306" y="218" width="112" height="80"', "27", 362, 267],
    [colorAssets.bilobaFlower, 'x="440" y="218" width="112" height="80"', "28", 496, 267],
    [colorAssets.bilobaFlowerStrip, 'x="574" y="218" width="112" height="80"', "29", 630, 267],
    [colorAssets.blueLetters, 'x="708" y="218" width="112" height="80"', "30", 764, 267],
    [colorAssets.dodgerBlue, 'x="842" y="218" width="112" height="80"', "31", 898, 267],
    [colorAssets.event, 'x="172" y="318" width="112" height="80"', "32", 228, 367],
    [colorAssets.feature, 'x="306" y="318" width="112" height="80"', "33", 362, 367],
    [colorAssets.frameStrip, 'x="440" y="318" width="112" height="80"', "34", 496, 367],
    [colorAssets.goldDrop, 'x="574" y="318" width="112" height="80"', "35", 630, 367],
    [colorAssets.goldDropTall, 'x="708" y="318" width="112" height="80"', "36", 764, 367],
    [colorAssets.groupCard, 'x="842" y="318" width="112" height="80"', "37", 898, 367],
    [colorAssets.groupSmall, 'x="172" y="418" width="112" height="80"', "38", 228, 467],
    [colorAssets.groupTall, 'x="306" y="418" width="112" height="80"', "39", 362, 467],
    [colorAssets.pear, 'x="440" y="418" width="112" height="80"', "40", 496, 467],
    [colorAssets.rectangleBlue, 'x="574" y="418" width="112" height="80"', "41", 630, 467],
    [colorAssets.rectangleGreen, 'x="708" y="418" width="112" height="80"', "42", 764, 467],
    [screenUiCurrent, 'x="842" y="418" width="112" height="80"', "43", 898, 467],
  ];

  return renderStage(`<svg class="interface-cases__desktop interface-cases__desktop--masonry" viewBox="0 0 1200 760" aria-hidden="true">
    <defs>
      <linearGradient id="jesteipoolStandGradientC" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#eeeeee" />
        <stop offset="0.55" stop-color="#cfcfcf" />
        <stop offset="1" stop-color="#f7f7f7" />
      </linearGradient>
    </defs>
    <rect x="118" y="156" width="964" height="420" rx="9" fill="#000" />
    <rect x="134" y="172" width="932" height="368" fill="#fff" />
    <rect x="134" y="172" width="932" height="26" fill="#fff" />
    <line x1="134" y1="198" x2="1066" y2="198" stroke="#e3e3e3" />
    <rect x="154" y="181" width="86" height="8" fill="#000" />
    <rect x="548" y="181" width="48" height="8" fill="#000" />
    <rect x="922" y="181" width="42" height="8" fill="#000" />
    <rect x="172" y="218" width="112" height="80" rx="4" fill="#000" />
    <rect x="306" y="218" width="112" height="80" rx="4" fill="#000" />
    <rect x="440" y="218" width="112" height="80" rx="4" fill="#000" />
    <rect x="574" y="218" width="112" height="80" rx="4" fill="#000" />
    <rect x="708" y="218" width="112" height="80" rx="4" fill="#000" />
    <rect x="842" y="218" width="112" height="80" rx="4" fill="#000" />
    <rect x="172" y="318" width="112" height="80" rx="4" fill="#000" />
    <rect x="306" y="318" width="112" height="80" rx="4" fill="#000" />
    <rect x="440" y="318" width="112" height="80" rx="4" fill="#000" />
    <rect x="574" y="318" width="112" height="80" rx="4" fill="#000" />
    <rect x="708" y="318" width="112" height="80" rx="4" fill="#000" />
    <rect x="842" y="318" width="112" height="80" rx="4" fill="#000" />
    <rect x="172" y="418" width="112" height="80" rx="4" fill="#000" />
    <rect x="306" y="418" width="112" height="80" rx="4" fill="#000" />
    <rect x="440" y="418" width="112" height="80" rx="4" fill="#000" />
    <rect x="574" y="418" width="112" height="80" rx="4" fill="#000" />
    <rect x="708" y="418" width="112" height="80" rx="4" fill="#000" />
    <rect x="842" y="418" width="112" height="80" rx="4" fill="#000" />
    ${joinMarkup(masonryItems, ([href, attrs, label, x, y]) => `${renderSvgImage(href, attrs)}${renderSvgNumber(label, x, y)}`)}
    <rect x="520" y="576" width="160" height="132" fill="url(#jesteipoolStandGradientC)" />
    <rect x="520" y="694" width="160" height="16" fill="#bdbdbd" />
    <rect x="520" y="710" width="160" height="8" fill="#e3e3e3" />
  </svg>`);
};
