export const renderResumePage = ({ embedded = false } = {}) => `
  <article class="resume-page">
    <section class="resume-hero" aria-labelledby="resume-title">
      <p class="resume-hero__eyebrow">иван крушинский · digital-дизайнер</p>
      <h1 id="resume-title">резюме</h1>
      <p>
        Я проектирую интерфейсы, визуальные системы и цифровые продукты: от структуры сервиса и дизайн-системы до
        лендингов, брендовой графики и аккуратной передачи решений в разработку.
      </p>
    </section>

    <section class="resume-summary" aria-label="обо мне">
      <div class="resume-summary__lead">
        <h2>обо мне</h2>
        <p>
          Работаю на стыке продуктового дизайна, арт-дирекшна и фронтенда. Умею разбирать бизнес-задачу,
          переводить её в понятный пользовательский сценарий, собирать визуальную систему и доводить макеты до
          реализации вместе с разработкой.
        </p>
        <p>
          Сильнее всего полезен там, где нужно одновременно думать о продукте, интерфейсе, визуальном языке и
          качестве финальной сборки: музыкальные сервисы, бренды, портфолио, лендинги, сложные промо-страницы и
          дизайн-системы.
        </p>
      </div>
      <div class="resume-summary__facts">
        <section>
          <h3>фокус</h3>
          <ul>
            <li>ui/ux и продуктовый дизайн</li>
            <li>арт-дирекшн цифровых продуктов</li>
            <li>дизайн-системы и визуальные правила</li>
            <li>брендинг, графика и промо-материалы</li>
          </ul>
        </section>
        <section>
          <h3>инструменты</h3>
          <ul>
            <li>figma, прототипы, dev mode</li>
            <li>html, css, базовый javascript</li>
            <li>анимации, canvas, three.js в связке с дизайном</li>
            <li>подготовка макетов и спецификаций для разработки</li>
          </ul>
        </section>
      </div>
    </section>

    <section class="cv-section cv-section--resume" id="${embedded ? "resume-cv" : "cv"}">
      <div class="resume-section-heading">
        <p>опыт</p>
        <h2>таймлайн проектов и ролей</h2>
      </div>
      <section class="cv-row cv-row--experience">
        <div class="cv-experience" data-cv-experience data-cv-mode="resume"></div>
      </section>
    </section>
  </article>
`;
