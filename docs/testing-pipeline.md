# Testing and verification pipeline

Нормативные правила находятся в [`docs/testing-policy.md`](./testing-policy.md).

## Обычный engineering push / PR

`.github/workflows/ci-fast.yml` выполняет только:

1. `npm ci`;
2. вычисление canonical media fingerprint;
3. восстановление exact generated-media cache;
4. fail-fast при отсутствии exact cache;
5. `node tools/media-dev-state.mjs --cache-verify`;
6. `npm run typecheck`;
7. `npm run build`.

Глобального Node test-suite на каждый push/PR нет.

## Media changes

`.github/workflows/cms-media.yml` обслуживает только media mutation:

- классифицирует image/video/metadata changes;
- использует exact previous generated-media cache;
- синхронизирует catalog metadata;
- строит только нужные derivatives либо выполняет explicit full rebuild;
- запускает `npm run media:check`;
- проверяет final generated-media cache;
- сохраняет exact final cache;
- может коммитить только разрешённый deterministic generated metadata обратно в `dev`.

`npm run media:check` включает текущие responsive/video delivery contracts, data integrity, catalog stability и permanent media integrity checker.

## Production

`.github/workflows/pages.yml` выполняет:

1. checkout exact `prod` SHA;
2. `npm ci`;
3. exact generated-media cache restore + verify;
4. `npm run typecheck`;
5. `npm run build`;
6. production CV preparation;
7. компактный `npm run test:e2e:production`;
8. CV artifact verification;
9. GitHub Pages upload/deploy;
10. post-deploy проверку exact SHA, `/`, `/cv/` и опубликованных CSS/JS assets.

Production deployment не регенерирует media и не чинит cache miss. Подготовка media должна происходить раньше через `CMS media`.

## Локальные тесты

Оставшиеся `*.test.mjs` не образуют автоматический глобальный suite. Их запускают напрямую, когда задача действительно касается соответствующей подсистемы.

Migration-specific и CI-implementation tests после завершения соответствующей работы удаляются.

Два media derivative contract используются непосредственно командой `npm run media:check`:

- `test/responsive-manifest-contract.test.mjs`;
- `test/video-delivery-contract.test.mjs`.

Production browser smoke запускается через `npm run test:e2e:production`.
