# QA checklist

## Boundaries
- [ ] Один `.cv-item--sensetique`; existing `data-cv-theme="item-03"`; нет нового global font/palette; accordion работает site runtime.

## Desktop
- [ ] Совпадает с прототипом.
- [ ] 050–051 и video 142 не изменены.
- [ ] Canvas обслуживает existing runtime.
- [ ] Divider только между группами; reels без scrollbar.
- [ ] Inna Honour: 4 фото + две подписи.
- [ ] Group 27 hidden; 013/014/152/153 hidden; 139/140/147 в первой студийной композиции; 175 крупный в Wood.Metal.PANIC!.

## Mobile: 320, 375/390, 430 px
- [ ] Нет общего single-column потока.
- [ ] 2-column grids не переполняют viewport.
- [ ] Rails скроллятся пальцем, scrollbar скрыт.
- [ ] Olovo catalogue — две строки.
- [ ] Opening frames крупные; 050–051 и 142 не ужаты/не перемещены; flipbook помещается.

## Captions
- [ ] Номер виден; повторяющиеся credits под кадрами скрыты; уникальные подписи видимы.
- [ ] Desktop hover/focus показывает полную подпись.
- [ ] Touch tap открывает/переключает; tap по свободному месту внутри Sensetique закрывает.
- [ ] Video controls не блокируются overlay; reduced motion без transition.

## Runtime
- [ ] Нет MutationObserver/IntersectionObserver.
- [ ] Единственный local ResizeObserver — studio justified rows.
- [ ] Site fallback и reel runtime не продублированы.
