/** Exact canonical DOM contract for the interactive Awful Cases game. */
export function renderAwfulCasesGame(): string {
  return String.raw`<figure class="media mockup awful-cases-game" data-device="browser">
              <div class="mockup__frame">
                <div class="mockup__viewport">
                  <div class="runner-game-shell" id="runnerGameShell" tabindex="0"><canvas aria-label="awful cases trainer" id="game" tabindex="0"></canvas>
                    <div class="game-title">Awful Cases - обучающая игра</div>
                    <div class="start" id="startPanel">
                      <div class="start__label">демонстрационный режим</div><button class="start__button" id="startButton" type="button">старт</button>
                    </div>
                    <div class="restart" hidden="" id="restartPanel">
                      <div class="restart__title" id="restartTitle">начать заново</div>
                      <div class="restart__meta" id="restartMeta">только стрелочки</div><button class="restart__button" id="restartButton" type="button">начать заново</button>
                    </div>
                    <div aria-label="mobile controls" class="runner-controls" hidden="" id="runnerControls"><button data-runner-action="upper" type="button"><b>↑</b><span>upper</span></button><button data-runner-action="lower" type="button"><b>↓</b><span>lower</span></button><button data-runner-action="title" type="button"><b>←</b><span>title</span></button><button data-runner-action="toggle" type="button"><b>→</b><span>toggle</span></button></div>
                  </div>
                </div>
              </div>
              <figcaption class="media__caption">
                <p class="media__caption-line"><span class="media__index">01</span><span class="media__title">Игра-обучалка о том как пользоваться программой</span></p>
              </figcaption>
            </figure>`;
}
