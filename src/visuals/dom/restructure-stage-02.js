const CASE_ROOT_SELECTOR = [
  '[data-jestei-chapter-frame]',
  '.project-chapter',
  '.block'
].join(',');

const ARTIFACT_SELECTOR = [
  '.hero',
  '#hero',
  '#resume',
  '.resume',
  '.project__header',
  '.site-header',
  '[data-site-header]',
  '[data-nav-island]',
  '[data-proximity]',
  '.proximity',
  '.proximity-control',
  '[data-visual-demo]',
  '[data-playlist-filter]',
  '.playlist-filter',
  '.playlist-filter-embed',
  '.jestei-policy-marquee',
  '[data-jestei-policy-marquee]',
  '.policy-book',
  '.policy-book-reader',
  '[data-policy-book]',
  '.logo-inspector',
  '[data-logo-inspector]',
  'canvas',
  'svg'
].join(',');

function isInsideProtectedArea(node) {
  return Boolean(node.closest(ARTIFACT_SELECTOR));
}

function directChildBySelector(node, selector) {
  return Array.from(node.children).find((child) => child.matches(selector));
}

function moveRelevantClasses(source, target) {
  const keep = Array.from(source.classList).filter((name) => (
    name.startsWith('list-card--') ||
    name.startsWith('card--') ||
    name.startsWith('text-')
  ));

  keep.forEach((name) => target.classList.add(`stage-02-source-${name}`));
}

function createHeading(sourceTitle) {
  if (!sourceTitle) return null;

  const heading = document.createElement('h4');
  heading.className = 'stage-02-text-section__title';
  heading.innerHTML = sourceTitle.innerHTML;
  heading.setAttribute('data-stage-02-preserved-heading', '');

  return heading;
}

function createParagraphFromListItem(item) {
  const paragraph = document.createElement('p');
  paragraph.className = 'stage-02-text-section__paragraph';
  paragraph.innerHTML = item.innerHTML;
  paragraph.setAttribute('data-stage-02-preserved-text', '');
  return paragraph;
}

function createSubsectionFromItem(item) {
  const title = item.querySelector(':scope > .responsibility-card__item-title, :scope > .list-card__item-title, :scope > strong, :scope > b');
  const text = item.querySelector(':scope > .responsibility-card__item-text, :scope > .list-card__item-text');

  if (!title || !text) {
    return createParagraphFromListItem(item);
  }

  const group = document.createElement('section');
  group.className = 'stage-02-text-subsection';

  const heading = document.createElement('h5');
  heading.className = 'stage-02-text-subsection__title';
  heading.innerHTML = title.innerHTML;

  const paragraph = document.createElement('p');
  paragraph.className = 'stage-02-text-section__paragraph';
  paragraph.innerHTML = text.innerHTML;

  group.append(heading, paragraph);
  return group;
}

function convertListCard(card) {
  if (card.dataset.stage02Converted === 'true') return null;
  if (isInsideProtectedArea(card)) return null;

  const list = directChildBySelector(card, '.list-card__list, ul, ol');
  const title = directChildBySelector(card, '.list-card__title, h4, h5, h6');

  if (!list) return null;

  const section = document.createElement('article');
  section.className = 'stage-02-text-section';
  section.setAttribute('data-stage-02-text-section', '');
  moveRelevantClasses(card, section);

  const heading = createHeading(title);
  if (heading) section.append(heading);

  Array.from(list.children).forEach((item) => {
    if (!item.matches('li')) return;
    section.append(createSubsectionFromItem(item));
  });

  const looseParagraphs = Array.from(card.children).filter((child) => (
    child.matches('p') && child !== title && child !== list
  ));

  looseParagraphs.forEach((paragraph) => {
    const p = document.createElement('p');
    p.className = 'stage-02-text-section__paragraph';
    p.innerHTML = paragraph.innerHTML;
    section.append(p);
  });

  if (section.children.length === 0) return null;
  card.dataset.stage02Converted = 'true';

  return section;
}

function convertListCardGroup(group) {
  if (group.dataset.stage02Converted === 'true') return;
  if (isInsideProtectedArea(group)) return;

  const cards = Array.from(group.querySelectorAll(':scope > .list-card'));
  if (!cards.length) return;

  const converted = cards.map(convertListCard).filter(Boolean);
  if (!converted.length) return;

  const wrapper = document.createElement('section');
  wrapper.className = 'stage-02-text-sections';
  wrapper.setAttribute('data-stage-02-text-sections', '');
  wrapper.setAttribute('aria-label', group.getAttribute('aria-label') || 'текстовые разделы');

  converted.forEach((section) => wrapper.append(section));

  group.dataset.stage02Converted = 'true';
  group.replaceWith(wrapper);
}

function convertPlainLists(root) {
  const lists = Array.from(root.querySelectorAll('.block > ul, .text-block > ul, .project-chapter > ul'));
  lists.forEach((list) => {
    if (list.dataset.stage02Converted === 'true') return;
    if (isInsideProtectedArea(list)) return;
    if (list.closest('.stage-02-text-section, .stage-02-text-sections')) return;

    const wrapper = document.createElement('section');
    wrapper.className = 'stage-02-text-section stage-02-text-section--from-plain-list';
    wrapper.setAttribute('data-stage-02-text-section', '');

    Array.from(list.children).forEach((item) => {
      if (!item.matches('li')) return;
      wrapper.append(createSubsectionFromItem(item));
    });

    if (!wrapper.children.length) return;
    list.dataset.stage02Converted = 'true';
    list.replaceWith(wrapper);
  });
}

function markReadableTextContainers(root) {
  const containers = root.querySelectorAll('.block, .text-block, .project-chapter, .jestei-chapter-panel');
  containers.forEach((container) => {
    if (isInsideProtectedArea(container)) return;
    container.classList.add('stage-02-readable-flow');
  });
}

export function initRestructureStage02() {
  if (document.documentElement.dataset.stage02TextRestructured === 'true') return;

  const roots = Array.from(document.querySelectorAll(CASE_ROOT_SELECTOR)).filter((root) => {
    if (isInsideProtectedArea(root)) return false;
    return !root.closest('#resume, .resume, .hero, #hero, .project__header');
  });

  roots.forEach((root) => {
    markReadableTextContainers(root);

    const groups = Array.from(root.querySelectorAll('.list-cards'));
    groups.forEach(convertListCardGroup);

    convertPlainLists(root);
  });

  document.documentElement.dataset.stage02TextRestructured = 'true';
}
