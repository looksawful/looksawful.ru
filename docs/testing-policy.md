# Политика тестов и проверок

Статус: нормативный документ репозитория.

Цель — держать автоматический контур маленьким. Проверка остаётся постоянной только тогда, когда защищает актуальный долгоживущий риск и не дублирует более дешёвую гарантию.

## Постоянный контур

### Обычная разработка

На engineering push/PR достаточно:

- `npm ci`;
- exact generated-media cache verify;
- `npm run typecheck`;
- `npm run build`.

Глобального `test:fast`, полного unit-suite и full E2E на каждый push нет.

### Media

При изменении media источников или metadata `CMS media` отвечает за:

- deterministic media generation;
- exact previous/final cache integrity;
- `npm run media:check`;
- сохранение только разрешённого generated metadata.

`media:check` проверяет актуальные source/derivative/data invariants. Он не должен зависеть от истории завершённых миграций.

### Production

Перед публикацией `prod` обязательны:

- exact generated-media cache verify;
- typecheck;
- production build;
- компактный production browser smoke;
- CV artifact verification;
- GitHub Pages deployment;
- post-deploy проверка exact commit SHA, `/`, `/cv/` и собранных CSS/JS assets.

Production deploy не регенерирует media. Cache miss является ошибкой и должен исправляться через media pipeline до deployment.

## Жизненный цикл тестов

Тест, созданный для конкретного бага, миграции или рефакторинга, по умолчанию временный.

После завершения работы:

- migration-specific tests удаляются;
- тесты устройства CI/YAML удаляются, если реальный workflow уже выполняет соответствующую проверку;
- runtime/contract tests можно оставить в репозитории для локального использования, но они не становятся автоматическим глобальным CI без отдельного обоснования;
- literal copy не фиксируется тестами, если текст разрешено редактировать через CMS.

Название `regression test` само по себе не является причиной хранить тест постоянно.

## Что нельзя ослаблять случайно

Следующие гарантии считаются архитектурными:

- TypeScript должен компилироваться;
- production build должен завершаться успешно;
- production должен публиковать exact ожидаемый SHA;
- опубликованные root/CV/assets должны реально отвечать после deployment;
- generated media cache должен соответствовать exact source fingerprint;
- media registry не должен содержать dangling identities, отсутствующие canonical sources или логические byte/pixel duplicates;
- CMS/media automation не должна коммитить произвольные engineering-файлы.

Любая новая тяжёлая проверка добавляется только для конкретного повторяющегося риска. По умолчанию она локальная или временная, а не scheduled/global CI.
