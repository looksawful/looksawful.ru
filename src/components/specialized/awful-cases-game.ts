/** Exact canonical DOM contract for the interactive Awful Cases game. */
export function renderAwfulCasesGame(): string {
  return String.raw`<figure class="media mockup awful-cases-game" data-device="browser">
              <div class="mockup__frame">
                <div class="mockup__viewport">
                  <div class="runner-game-shell" data-awful-cases id="runnerGameShell"><canvas aria-label="awful cases trainer" data-awful-cases-canvas id="game" tabindex="0"></canvas>
                    <div class="game-title">Awful Cases - обучающая игра</div>
                    <div class="start" data-awful-cases-start data-awful-cases-onboarding id="startPanel">
                      <div class="start__eyebrow" data-awful-cases-onboarding-kicker></div>
                      <div class="start__title" data-awful-cases-onboarding-title></div>
                      <p class="start__copy" data-awful-cases-onboarding-copy></p>
                      <div class="start__actions" data-awful-cases-onboarding-actions></div>
                      <div class="start__tip" data-awful-cases-onboarding-tip></div>
                      <button class="start__button" data-awful-cases-start-button id="startButton" type="button">старт</button>
                    </div>
                    <div class="restart" data-awful-cases-restart hidden="" id="restartPanel">
                      <div class="restart__title" data-awful-cases-restart-title id="restartTitle">начать заново</div>
                      <div class="restart__meta" data-awful-cases-restart-meta id="restartMeta">стрелки + PgDn / Del</div><button class="restart__button" data-awful-cases-restart-button id="restartButton" type="button">начать заново</button>
                    </div>
                    <div class="runner-controls__prompt" data-awful-cases-prompt hidden="" aria-live="polite"></div>
                    <div aria-label="Awful Cases controls" class="runner-controls" data-awful-cases-controls hidden="" id="runnerControls"><button data-runner-action="upper" data-awful-cases-action="upper" type="button"><b>↑</b><span>upper</span></button><button data-runner-action="lower" data-awful-cases-action="lower" type="button"><b>↓</b><span>lower</span></button><button data-runner-action="title" data-awful-cases-action="title" type="button"><b>←</b><span>title</span></button><button data-runner-action="toggle" data-awful-cases-action="toggle" type="button"><b>→</b><span>toggle</span></button><button data-runner-action="lint" data-awful-cases-action="lint" type="button"><b>PgDn</b><span>typography</span></button><button data-runner-action="sentence" data-awful-cases-action="sentence" type="button"><b>Del</b><span>sentence</span></button></div>
                  </div>
                </div>
              </div>
              <figcaption class="media__caption">
                <p class="media__caption-line"><span class="media__index">01</span><span class="media__title">Игра-обучалка о том как пользоваться программой</span></p>
              </figcaption>
            </figure>`;
}
