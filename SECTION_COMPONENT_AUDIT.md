# section component audit

strict rule: if a style can change in one section, it stays local.

## 1. hero
- title: хиро
- id/class target: hero
- css: src/styles/sections/hero.css
- css exists: yes
- css size: 134 bytes / 8 lines
- behavior hooks found near section: data-visual-demo, data-three-scene
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 2. jestei-cover
- title: шапка джести пула
- id/class target: jestei-cover
- css: src/styles/sections/jestei-cover.css
- css exists: yes
- css size: 182 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 3. jestei-logo
- title: новый знак
- id/class target: jestei-logo
- css: src/styles/sections/jestei-logo.css
- css exists: yes
- css size: 166 bytes / 8 lines
- behavior hooks found near section: data-lightbox-item, data-media-item, data-visual-demo
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 4. jestei-type
- title: новый шрифт
- id/class target: jestei-type
- css: src/styles/sections/jestei-type.css
- css exists: yes
- css size: 168 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 5. jestei-color
- title: добавили цвет + цветовая система
- id/class target: jestei-color
- css: src/styles/sections/jestei-color.css
- css exists: yes
- css size: 209 bytes / 8 lines
- behavior hooks found near section: data-lightbox-item, data-media-item
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 6. jestei-words
- title: нашли слова
- id/class target: jestei-words
- css: src/styles/sections/jestei-words.css
- css exists: yes
- css size: 171 bytes / 8 lines
- behavior hooks found near section: data-policy-book
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 7. jestei-interface
- title: улучшили интерфейс
- id/class target: jestei-interface
- css: src/styles/sections/jestei-interface.css
- css exists: yes
- css size: 197 bytes / 8 lines
- behavior hooks found near section: data-lightbox-item, data-media-item, data-playlist-filter-embed, data-animation
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 8. jestei-filter
- title: создали систему фильтрации
- id/class target: jestei-filter
- css: src/styles/sections/jestei-filter.css
- css exists: yes
- css size: 203 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 9. jestei-event-nav
- title: упростили навигацию event
- id/class target: jestei-event-nav
- css: src/styles/sections/jestei-event-nav.css
- css exists: yes
- css size: 205 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 10. jestei-promo
- title: промо-организмы
- id/class target: jestei-promo
- css: src/styles/sections/jestei-promo.css
- css exists: yes
- css size: 179 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 11. jestei-landings
- title: лендинговая экосистема
- id/class target: jestei-landings
- css: src/styles/sections/jestei-landings.css
- css exists: yes
- css size: 202 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 12. jestei-tariffs
- title: пересобрали тарифные сценарии
- id/class target: jestei-tariffs
- css: src/styles/sections/jestei-tariffs.css
- css exists: yes
- css size: 212 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 13. jestei-graphics
- title: обновили графику + графический дизайн и микс-медиа
- id/class target: jestei-graphics
- css: src/styles/sections/jestei-graphics.css
- css exists: yes
- css size: 251 bytes / 8 lines
- behavior hooks found near section: data-lightbox-item, data-media-item
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 14. styx-cover
- title: styx jewels шапка
- id/class target: styx-cover
- css: src/styles/sections/styx-cover.css
- css exists: yes
- css size: 166 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 15. styx-graphics
- title: графический дизайн
- id/class target: styx-graphics
- css: src/styles/sections/styx-graphics.css
- css exists: yes
- css size: 188 bytes / 8 lines
- behavior hooks found near section: data-lightbox-item, data-media-item, data-animation
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 16. styx-packaging
- title: бренд и упаковка
- id/class target: styx-packaging
- css: src/styles/sections/styx-packaging.css
- css exists: yes
- css size: 186 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 17. styx-communications
- title: коммуникации и реклама
- id/class target: styx-communications
- css: src/styles/sections/styx-communications.css
- css exists: yes
- css size: 213 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 18. styx-print
- title: печатная продукция
- id/class target: styx-print
- css: src/styles/sections/styx-print.css
- css exists: yes
- css size: 179 bytes / 8 lines
- behavior hooks found near section: data-lightbox-item, data-media-item, data-animation
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 19. styx-photo-art
- title: фото и арты
- id/class target: styx-photo-art
- css: src/styles/sections/styx-photo-art.css
- css exists: yes
- css size: 176 bytes / 8 lines
- behavior hooks found near section: data-lightbox-item, data-media-item
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 20. styx-scanography
- title: экспериментальная + предметная сканография
- id/class target: styx-scanography
- css: src/styles/sections/styx-scanography.css
- css exists: yes
- css size: 242 bytes / 8 lines
- behavior hooks found near section: data-lightbox-item, data-media-item
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 21. berserk-timer
- title: berserk timer
- id/class target: berserk-timer
- css: src/styles/sections/berserk-timer.css
- css exists: yes
- css size: 166 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 22. awful-cases
- title: awful cases
- id/class target: awful-cases
- css: src/styles/sections/awful-cases.css
- css exists: yes
- css size: 158 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 23. awful-audit
- title: awful audit
- id/class target: awful-audit
- css: src/styles/sections/awful-audit.css
- css exists: yes
- css size: 158 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 24. shootings
- title: съёмки
- id/class target: shootings
- css: src/styles/sections/shootings.css
- css exists: yes
- css size: 153 bytes / 8 lines
- behavior hooks found near section: data-lightbox-item, data-media-item
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.

## 25. resume
- title: резюме
- id/class target: resume
- css: src/styles/sections/resume.css
- css exists: yes
- css size: 144 bytes / 8 lines
- behavior hooks found near section: none detected
- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.
- similar-but-not-common: not enough local css yet. keep local unless exact identical primitive is proven.
- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.
