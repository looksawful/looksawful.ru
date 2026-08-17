# Visual contract

## Desktop
Сохраняется утверждённая композиция: крупные opening frames/mockups, slider 050–051 и video 142 не меняют размер/положение; editorial asymmetry и horizontal reels сохраняются; divider только между группами; credits один раз на группу; Inna Honour — одна лента из 4 фото и две подписи `space-between`; Olovo booklet и MIMI имеют общие подписи; скрытые пользователем media не показываются.

## Mobile
Не единая колонка. Используются повторяемые паттерны: `data-mobile-grid="two"`, `data-mobile-rail`, `data-mobile-two-row-rail="catalog"`, `data-mobile-layout`. Rails без scrollbar, с компактным одинаковым gap и scroll-snap. Крупные media имеют `data-mobile-feature="large"` и остаются full-width.

## Captions
Под media остаётся номер и только уникальный статический текст. Полная подпись: hover/focus на desktop, tap на touch. Overlay не перехватывает pointer events. Reduced motion убирает transition, не информацию.
