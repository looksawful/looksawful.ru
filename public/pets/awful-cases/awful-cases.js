export function enhanceAwfulCases(root) {
  if (!(root instanceof HTMLElement)) return { setActive() {}, destroy() {} };
  let active = false;
  let destroyed = false;
  const abortController = new AbortController();
  const ATLAS_SRC = "/media/interactive/awful-cases-atlas.png";
  const GROUND_SRC = "/pets/awful-cases/assets/ground.png";
  const PIT_SRC = "/pets/awful-cases/assets/pit.png";
  const FALL1_SRC = "/pets/awful-cases/assets/fall1.png";
  const FALL2_SRC = "/pets/awful-cases/assets/fall2.png";
  const VICTORY_SRC = "/pets/awful-cases/assets/victory.png";
  const FLAG_SRC = "/pets/awful-cases/assets/flag.png";
  const DECOR_SOURCES = [
    "/pets/awful-cases/assets/decor-1.png",
    "/pets/awful-cases/assets/decor-2.png",
    "/pets/awful-cases/assets/decor-3.png"
  ];
  const DICTIONARY = [{"type":"upper","input":"a","output":"A"},{"type":"upper","input":"b","output":"B"},{"type":"upper","input":"c","output":"C"},{"type":"upper","input":"d","output":"D"},{"type":"upper","input":"e","output":"E"},{"type":"upper","input":"f","output":"F"},{"type":"upper","input":"g","output":"G"},{"type":"upper","input":"h","output":"H"},{"type":"upper","input":"i","output":"I"},{"type":"upper","input":"j","output":"J"},{"type":"upper","input":"k","output":"K"},{"type":"upper","input":"l","output":"L"},{"type":"upper","input":"usa","output":"USA"},{"type":"upper","input":"eu","output":"EU"},{"type":"upper","input":"nasa","output":"NASA"},{"type":"upper","input":"html","output":"HTML"},{"type":"upper","input":"css","output":"CSS"},{"type":"upper","input":"api","output":"API"},{"type":"upper","input":"ui","output":"UI"},{"type":"upper","input":"ux","output":"UX"},{"type":"upper","input":"pdf","output":"PDF"},{"type":"upper","input":"url","output":"URL"},{"type":"upper","input":"id","output":"ID"},{"type":"upper","input":"json","output":"JSON"},{"type":"lower","input":"IF","output":"if"},{"type":"lower","input":"BECAUSE","output":"because"},{"type":"lower","input":"HOWEVER","output":"however"},{"type":"lower","input":"BEFORE","output":"before"},{"type":"lower","input":"AFTER","output":"after"},{"type":"lower","input":"BETWEEN","output":"between"},{"type":"lower","input":"INSIDE","output":"inside"},{"type":"lower","input":"OUTSIDE","output":"outside"},{"type":"lower","input":"TODAY","output":"today"},{"type":"lower","input":"TOMORROW","output":"tomorrow"},{"type":"lower","input":"EXAMPLE","output":"example"},{"type":"lower","input":"THEREFORE","output":"therefore"},{"type":"lower","input":"ALSO","output":"also"},{"type":"lower","input":"WINDOW","output":"window"},{"type":"lower","input":"BUTTON","output":"button"},{"type":"lower","input":"SCREEN","output":"screen"},{"type":"toggle","input":"aLEX","output":"Alex"},{"type":"toggle","input":"mARIA","output":"Maria"},{"type":"toggle","input":"jOHN","output":"John"},{"type":"toggle","input":"aNNA","output":"Anna"},{"type":"toggle","input":"sERGEY","output":"Sergey"},{"type":"toggle","input":"mAX","output":"Max"},{"type":"toggle","input":"oLEG","output":"Oleg"},{"type":"toggle","input":"jULIA","output":"Julia"},{"type":"toggle","input":"sONIA","output":"Sonia"},{"type":"toggle","input":"eGOR","output":"Egor"},{"type":"toggle","input":"vOVA","output":"Vova"},{"type":"toggle","input":"iVAN","output":"Ivan"},{"type":"toggle","input":"aLEX mARIA","output":"Alex Maria"},{"type":"toggle","input":"mARIA jOHN","output":"Maria John"},{"type":"toggle","input":"aNNA oLEG","output":"Anna Oleg"},{"type":"toggle","input":"eGOR jULIA","output":"Egor Julia"},{"type":"toggle","input":"sONIA mAX","output":"Sonia Max"},{"type":"toggle","input":"iVAN sERGEY","output":"Ivan Sergey"},{"type":"title","input":"ivan","output":"Ivan"},{"type":"title","input":"maria","output":"Maria"},{"type":"title","input":"john","output":"John"},{"type":"title","input":"anna","output":"Anna"},{"type":"title","input":"sergey","output":"Sergey"},{"type":"title","input":"alex","output":"Alex"},{"type":"title","input":"oleg","output":"Oleg"},{"type":"title","input":"julia","output":"Julia"},{"type":"title","input":"sonia","output":"Sonia"},{"type":"title","input":"egor","output":"Egor"},{"type":"title","input":"vova","output":"Vova"},{"type":"title","input":"max","output":"Max"},{"type":"title","input":"new york","output":"New York"},{"type":"title","input":"los angeles","output":"Los Angeles"},{"type":"title","input":"san francisco","output":"San Francisco"},{"type":"title","input":"jestei pool","output":"Jestei Pool"},{"type":"title","input":"awful cases","output":"Awful Cases"},{"type":"title","input":"case trainer","output":"Case Trainer"},{"type":"title","input":"windows utility","output":"Windows Utility"},{"type":"title","input":"github pages","output":"GitHub Pages"},{"type":"title","input":"sample 78","output":"Sample 78"},{"type":"title","input":"sample 79","output":"Sample 79"}];
  const ACTIONS = {
    upper:  { code:'ArrowUp',    label:'↑' },
    lower:  { code:'ArrowDown',  label:'↓' },
    toggle: { code:'ArrowRight', label:'→' },
    title:  { code:'ArrowLeft',  label:'←' }
  };

  const SESSION_LENGTH = 16;
  const TRAINING_SEQUENCE = [
    'upper','upper','upper','upper',
    'lower','lower','lower','lower',
    'toggle','toggle','toggle','toggle',
    'title','title','title','title'
  ];

  const state = {
    score: 0,
    mistakes: 0,
    index: 0,
    trainingIndex: 0,
    current: null,
    started: false,
    finished: false,
    locked: false,
    session: []
  };

  const canvas = root.querySelector('[data-awful-cases-canvas]');
  const context = canvas instanceof HTMLCanvasElement ? canvas.getContext('2d') : null;
  const score = root.querySelector('[data-awful-cases-score]');
  const progress = root.querySelector('[data-awful-cases-progress]');
  const prompt = root.querySelector('[data-awful-cases-prompt]');
  const answer = root.querySelector('[data-awful-cases-answer]');
  const instruction = root.querySelector('[data-awful-cases-instruction]');
  const start = root.querySelector('[data-awful-cases-start]');
  const restart = root.querySelector('[data-awful-cases-restart]');
  const feedback = root.querySelector('[data-awful-cases-feedback]');
  const actionButtons = Array.from(root.querySelectorAll('[data-awful-cases-action]'));

  if (!(canvas instanceof HTMLCanvasElement) || !context || !score || !progress || !prompt || !answer || !instruction || !start || !restart || !feedback) {
    return { setActive() {}, destroy() {} };
  }

  const imageSources = [
    ['atlas', ATLAS_SRC],
    ['ground', GROUND_SRC],
    ['pit', PIT_SRC],
    ['fall1', FALL1_SRC],
    ['fall2', FALL2_SRC],
    ['victory', VICTORY_SRC],
    ['flag', FLAG_SRC],
    ...DECOR_SOURCES.map((src, index) => [`decor${index + 1}`, src])
  ];
  const images = new Map();
  let loadedImages = 0;

  for (const [key, src] of imageSources) {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      loadedImages += 1;
      render();
    };
    image.onerror = () => {
      loadedImages += 1;
      render();
    };
    image.src = src;
    images.set(key, image);
  }

  function resetState() {
    state.score = 0;
    state.mistakes = 0;
    state.index = 0;
    state.trainingIndex = 0;
    state.current = null;
    state.started = false;
    state.finished = false;
    state.locked = false;
    state.session = [];
  }

  function shuffled(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function createSession() {
    const groups = new Map();
    for (const item of DICTIONARY) {
      if (!groups.has(item.type)) groups.set(item.type, []);
      groups.get(item.type).push(item);
    }
    return TRAINING_SEQUENCE.map((type) => {
      const group = groups.get(type) || DICTIONARY;
      return group[Math.floor(Math.random() * group.length)];
    });
  }

  function currentAction() {
    return state.current ? ACTIONS[state.current.type] : null;
  }

  function updateHud() {
    score.textContent = String(state.score);
    progress.textContent = `${Math.min(state.index + 1, SESSION_LENGTH)}/${SESSION_LENGTH}`;
    prompt.textContent = state.current?.input || '—';
    answer.textContent = state.current?.output || '—';

    if (!state.started) {
      instruction.textContent = 'Нажмите «Начать», затем выбирайте преобразование клавишами-стрелками.';
    } else if (state.finished) {
      instruction.textContent = `Готово. Ошибок: ${state.mistakes}.`;
    } else {
      const action = currentAction();
      instruction.textContent = action ? `Как преобразовать строку? ${action.label}` : '';
    }

    for (const button of actionButtons) {
      const type = button.getAttribute('data-awful-cases-action');
      button.classList.toggle('is-active', type === state.current?.type && state.locked);
    }
  }

  function renderFallback() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f3f3f3';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111';
    context.font = '600 28px system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText('AWFUL CASES', canvas.width / 2, canvas.height / 2);
  }

  function drawSprite(image, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!(image instanceof HTMLImageElement) || !image.complete || !image.naturalWidth) return false;
    context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    return true;
  }

  function render() {
    updateHud();
    const atlas = images.get('atlas');
    if (!(atlas instanceof HTMLImageElement) || !atlas.complete || !atlas.naturalWidth) {
      renderFallback();
      return;
    }

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f6f1e8';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const ground = images.get('ground');
    if (ground instanceof HTMLImageElement && ground.complete && ground.naturalWidth) {
      context.drawImage(ground, 0, canvas.height - 96, canvas.width, 96);
    }

    const pit = images.get('pit');
    if (pit instanceof HTMLImageElement && pit.complete && pit.naturalWidth) {
      context.drawImage(pit, canvas.width - 190, canvas.height - 164, 160, 68);
    }

    const decor = images.get(`decor${(state.index % DECOR_SOURCES.length) + 1}`);
    if (decor instanceof HTMLImageElement && decor.complete && decor.naturalWidth) {
      context.drawImage(decor, 40, 40, 90, 90);
    }

    const frame = state.finished ? 5 : state.locked ? 2 : 0;
    const drawn = drawSprite(atlas, frame * 270, 0, 270, 230, 70, canvas.height - 310, 270, 230);
    if (!drawn) renderFallback();

    if (state.finished) {
      const victory = images.get('victory');
      if (victory instanceof HTMLImageElement && victory.complete && victory.naturalWidth) {
        context.drawImage(victory, canvas.width / 2 - 160, 30, 320, 120);
      }
    }
  }

  function nextQuestion() {
    if (state.index >= SESSION_LENGTH) {
      state.finished = true;
      state.current = null;
      state.locked = false;
      render();
      return;
    }
    state.current = state.session[state.index];
    state.locked = false;
    feedback.textContent = '';
    render();
  }

  function startSession() {
    resetState();
    state.started = true;
    state.session = createSession();
    start.hidden = true;
    restart.hidden = false;
    nextQuestion();
  }

  function answerWith(type) {
    if (!active || !state.started || state.finished || state.locked || !state.current) return;
    state.locked = true;
    const correct = type === state.current.type;
    if (correct) {
      state.score += 1;
      feedback.textContent = 'Верно';
    } else {
      state.mistakes += 1;
      feedback.textContent = `Неверно: ${ACTIONS[state.current.type].label}`;
    }
    render();
    window.setTimeout(() => {
      if (destroyed) return;
      state.index += 1;
      nextQuestion();
    }, 450);
  }

  function onKeyDown(event) {
    if (!active) return;
    const found = Object.entries(ACTIONS).find(([, action]) => action.code === event.code);
    if (!found) return;
    event.preventDefault();
    answerWith(found[0]);
  }

  start.addEventListener('click', startSession, { signal: abortController.signal });
  restart.addEventListener('click', startSession, { signal: abortController.signal });
  for (const button of actionButtons) {
    button.addEventListener('click', () => answerWith(button.getAttribute('data-awful-cases-action')), { signal: abortController.signal });
  }
  window.addEventListener('keydown', onKeyDown, { signal: abortController.signal });

  resetState();
  render();

  return {
    setActive(nextActive) {
      active = Boolean(nextActive);
      if (active) render();
    },
    destroy() {
      destroyed = true;
      abortController.abort();
    }
  };
}
