export const renderResumePage = () => `
  <article class="resume-page">
    <section class="resume-hero" aria-labelledby="resume-title">
      <h1 id="resume-title">резюме</h1>
    </section>

    <section class="cv-section cv-section--resume" id="cv">
      <section class="cv-row cv-row--experience">
        <div class="cv-experience" data-cv-experience data-cv-mode="resume"></div>
      </section>
    </section>
  </article>
`;
