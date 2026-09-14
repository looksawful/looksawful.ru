import { renderCodeBlock } from "../content/code-block.ts";
import { escapeHtml } from "../../utils/html.ts";

const BERSERK_ASCII = `███   ▄███▄   █▄▄▄▄   ▄▄▄▄▄   ▄███▄   █▄▄▄▄ █  █▀
█  █  █▀   ▀  █  ▄▀  █     ▀▄ █▀   ▀  █  ▄▀ █▄█
█ ▀ ▄ ██▄▄    █▀▀▌ ▄  ▀▀▀▀▄   ██▄▄    █▀▀▌  █▀▄
█  ▄▀ █▄   ▄▀ █  █  ▀▄▄▄▄▀    █▄   ▄▀ █  █  █  █
███   ▀███▀      █             ▀███▀     █     █
                ▀                       ▀     ▀
             █▄
           ▄     █▀▄▀█
       ▄▄▄▀▀ ▄█  █ █ █  ▄███▄   █▄▄▄▄
    ▀▀▀ █    ██  █ ▀ █  █▀   ▀  █  ▄▀
        █    ██  █   █  ██▄▄    █▀▀█▌
       █     ▐█      █  █▄   ▄▀ █   █
      ▀       ▐     ▀   ▀███▀      █`;

interface TerminalSlide {
  title: string;
  body: string;
  meta: string;
}

const TERMINAL_SLIDES: readonly TerminalSlide[] = [
  {
    title: "Запуск.",
    body: `BERSERK TIMER

version: 0.2.1-beta

Enter timer duration in minutes [max 180]
(or press Enter for 5 min default):

What are you planning to do?
(or press Enter to skip):

> write docs`,
    meta: "Длительность и цель сессии.",
  },
  {
    title: "Режим свидетеля.",
    body: ` ▄▄▄▄▀ ▄█ █▀▄▀█ ▄███▄   █▄▄▄▄
▀▀▀ █    █ █ █ █ █▀   ▀  █  ▄▀
    █    █ █ ▄ █ ██▄▄    █▀▀▌
   █     ▐█    █ █▄   ▄▀ █  █
  ▀       ▐   ▀  ▀███▀     █

TIMER FINISHED

Completed at: 22:41:03
Goal:         write docs

What did you accomplish?
(or press Enter to skip, 'skip' to cancel,
'k' to stop alert):`,
    meta: "Результат после завершения сессии.",
  },
  {
    title: "Запуск.",
    body: `BERSERK TIMER
made by ivan krushinski aka looksawful
© 2025
version: 0.2.1-beta

INSTRUCTIONS:
  • Set timer duration in minutes
  • Presets: -x / -s / -m / -l / -X / -t
  • Maximum duration: 3 hours
  • Set your goal for this session
  • Choose sound: --sound alert1.wav

During timer:
  p - pause/resume
  q - quit
  r - restart
  v - view today's log
  g - set/change goal
  m - silent mode
  s - audio settings`,
    meta: "Инструкции, пресеты и управление с клавиатуры.",
  },
  {
    title: "Настройки звука.",
    body: `═══ AUDIO SETTINGS ═══

Volume: [#####-----] 5/10
Sound:  alert1.wav (1/4)

Available sounds:
  > 1. alert1.wav
    2. alert2.wav
    3. alert3.wav
    4. alert4.wav

Commands:
  0       = Toggle silent mode
  1-10    = Set volume
  +/-     = Volume up/down
  t       = Test current settings
  Enter   = Close menu`,
    meta: "Выбор сигнала и управление громкостью.",
  },
  {
    title: "Помощь.",
    body: `TIMER COMMANDS:

p - Pause/Resume timer
q - Quit timer (with confirmation)
x - Zero the timer
r - Restart timer from beginning
v - View today's witness log
d - Delete today's witness log
u - Update duration
g - Set/change goal
m - Toggle silent mode
s - Open audio settings
h - Show this help screen
k - Stop currently playing sound

Press Enter to return to timer...`,
    meta: "Полный список команд таймера.",
  },
  {
    title: "логи",
    body: `# system log
logs/berserk.log

# witness activity log
logs/witness_log_YYYY-MM-DD.txt`,
    meta: "Системные события и ответы свидетеля сохраняются отдельно, поэтому завершённые сессии можно просматривать позже.",
  },
];

function renderCaption(title: string, meta: string): string {
  return `<figcaption class="media__caption">
    <p class="media__caption-line">
      <span class="media__title">${escapeHtml(title)}</span>
      <span class="media__meta">${escapeHtml(meta)}</span>
    </p>
  </figcaption>`;
}

function renderTerminalSlide(slide: TerminalSlide, active = false): string {
  const activeAttribute = active ? ' data-active=""' : "";
  return `<figure class="media-deck__slide" data-slide=""${activeAttribute}>
    <div class="media-deck__terminal">
      <div class="media-deck__terminal-bar cluster">${escapeHtml(slide.title)}</div>
      <div class="media-deck__terminal-body" data-deck-fit-viewport="">
        <pre data-deck-fit="">${escapeHtml(slide.body)}</pre>
      </div>
    </div>
    ${renderCaption(slide.title, slide.meta)}
  </figure>`;
}

function renderAudioSlide(): string {
  return `<figure class="media-deck__slide" data-slide="">
    <div class="media-deck__terminal">
      <div class="media-deck__terminal-bar cluster">Звуковые сигналы.</div>
      <div class="media-deck__terminal-body" data-deck-fit-viewport="">
        <div class="berserk-audio" data-berserk-audio-player="">
          <div class="berserk-audio__head cluster"><span>audio settings / player</span><span data-audio-status="">ready</span></div>
          <div aria-hidden="true" class="berserk-audio__wave">▁▂▃▆█▆▃▂▁▂▅▇▅▂▁▃▆█▇▃▂▁▁▂▃▆█▆▃▂▁▂▅▇▅▂▁▂▅▇▅▂▁</div>
          <div class="berserk-audio__row cluster"><button aria-pressed="false" class="berserk-audio__button" data-audio-play="" type="button">play / pause</button></div>
          <div class="berserk-audio__progress" data-audio-progress=""><span data-audio-progress-fill=""></span></div>
          <div class="berserk-audio__meta cluster"><span data-audio-current="">00:00</span><span data-audio-duration="">00:00</span></div>
          <div class="berserk-audio__line cluster"><strong id="berserk-volume-label">Volume:</strong><input aria-labelledby="berserk-volume-label" data-audio-volume="" max="1" min="0" step="0.01" type="range" value="0.5"><em data-audio-volume-text="">5/10</em></div>
          <div class="berserk-audio__sounds cluster"><button aria-pressed="true" class="berserk-audio__sound is-active" data-audio-sound="alert1.wav" type="button">alert1</button><button aria-pressed="false" class="berserk-audio__sound" data-audio-sound="alert2.wav" type="button">alert2</button><button aria-pressed="false" class="berserk-audio__sound" data-audio-sound="alert3.wav" type="button">alert3</button><button aria-pressed="false" class="berserk-audio__sound" data-audio-sound="alert4.wav" type="button">alert4</button></div>
          <audio preload="metadata"></audio>
        </div>
      </div>
    </div>
    ${renderCaption("Звуковые сигналы.", "Выбор alert-файла, воспроизведение и настройка громкости.")}
  </figure>`;
}

function renderGridIcon(): string {
  return `<svg aria-hidden="true" focusable="false" height="14" viewBox="0 0 14 14" width="14">
    <g fill="currentColor">
      <rect height="5" rx="1" width="5" x="1" y="1"></rect>
      <rect height="5" rx="1" width="5" x="8" y="1"></rect>
      <rect height="5" rx="1" width="5" x="1" y="8"></rect>
      <rect height="5" rx="1" width="5" x="8" y="8"></rect>
    </g>
  </svg>`;
}

function renderDeck(): string {
  const slides = [
    renderTerminalSlide(TERMINAL_SLIDES[0], true),
    renderTerminalSlide(TERMINAL_SLIDES[1]),
    renderTerminalSlide(TERMINAL_SLIDES[2]),
    renderTerminalSlide(TERMINAL_SLIDES[3]),
    renderTerminalSlide(TERMINAL_SLIDES[4]),
    renderAudioSlide(),
    renderTerminalSlide(TERMINAL_SLIDES[5]),
  ];
  const dots = slides.map((_, index) => `<button${index === 0 ? ' aria-current="true" data-active=""' : ""} aria-label="Экран ${index + 1}" class="media-deck__dot" data-deck-dot="" type="button"></button>`).join("");

  return `<div class="media-deck" data-deck-autoplay="ping-pong" data-deck-interval="10000" data-deck-layout="track" data-media-deck="">
    <div class="media-deck__toolbar cluster"><button aria-label="Предыдущий кадр" class="media-deck__button" data-deck-prev="" type="button">←</button><button aria-label="Сетка" aria-pressed="false" class="media-deck__button" data-deck-toggle-grid="" type="button">${renderGridIcon()}</button><button aria-label="Следующий кадр" class="media-deck__button" data-deck-next="" type="button">→</button></div>
    <div class="media-deck__viewport" data-deck-viewport=""><div class="media-deck__track reel" data-deck-track="">${slides.join("\n")}</div></div>
    <div aria-label="Навигация по экранам" class="media-deck__dots cluster">${dots}</div>
  </div>`;
}

function renderCodeBlocks(): string {
  const install = renderCodeBlock({
    title: "Установка.",
    language: "shell",
    code: `git clone https://github.com/looksawful/berserk-timer
cd berserk-timer
pip install -r requirements.txt`,
    description: "Клонирование репозитория и установка зависимостей.",
  });
  const run = renderCodeBlock({
    title: "Запуск.",
    language: "shell",
    code: `# start a 10 minute timer
python -m src.main 10

# start a 1.5 minute timer
python -m src.main 1.5

# preset
python -m src.main -s

# start silently
python -m src.main 25 --mute`,
    description: "Примеры длительности, пресетов и silent mode.",
  });
  return `<div class="grid code-block-grid" style="--grid-columns: repeat(2, minmax(0, 1fr))">${install}\n${run}</div>`;
}

/** Historical Berserk Timer case content, mounted through the canonical EntityPage boundary. */
export function renderBerserkTimerShowcase(): string {
  return `<section class="project__section wrapper stack" id="berserk-timer-showcase" data-section-type="specialized" data-project-id="berserk-timer" data-media-caption-scope data-media-caption-numbering="off">
    <figure class="media terminal" data-presentation="banner" data-terminal-theme="dark">
      <pre aria-hidden="true">${escapeHtml(BERSERK_ASCII)}</pre>
      ${renderCaption("CLI-таймер с режимом свидетеля и гибкой настройкой длительности.", "Целью было сделать простой CLI-таймер для Windows, который после каждой сессии спрашивает: «Чем вы занимались?». Он сочетает гибкость, простоту и отсутствие рекламы.")}
    </figure>
  </section>
  <div class="divider wrapper" aria-hidden="true"></div>
  <section class="project__section wrapper stack" data-section-type="specialized" data-project-id="berserk-timer" data-media-caption-scope data-media-caption-numbering="off">${renderDeck()}</section>
  <div class="divider wrapper" aria-hidden="true"></div>
  <section class="project__section wrapper stack" data-section-type="specialized" data-project-id="berserk-timer" data-media-caption-numbering="off">${renderCodeBlocks()}</section>
  <div class="divider wrapper" aria-hidden="true"></div>
  <footer class="project__footer cluster" data-reveal-group>
    <a download="berserk-timer-v0.2.1-beta.zip" href="https://github.com/looksawful/berserk-timer/archive/refs/tags/v0.2.1-beta.zip" data-reveal="copy">Скачать исходники</a>
    <a href="https://github.com/looksawful/berserk-timer/releases/tag/v0.2.1-beta" rel="noopener noreferrer" target="_blank" data-reveal="copy">Релиз v0.2.1-beta</a>
    <a href="https://github.com/looksawful/berserk-timer" rel="noopener noreferrer" target="_blank" data-reveal="copy">looksawful / berserk-timer</a>
  </footer>`;
}
