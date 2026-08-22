import type { LogoVariantData } from "../../types/logo.ts";
import type { LogoRevisionId } from "./revisions.ts";

export const logoVariants = [
  {
    id: "jestei-current-symbol",
    revisionId: "jestei-pool-current",
    name: "Эмблема",
    kind: "symbol",
    orientation: "square",
  },
  {
    id: "jestei-current-wordmark",
    revisionId: "jestei-pool-current",
    name: "Надпись",
    kind: "wordmark",
    orientation: "horizontal",
  },
  {
    id: "jestei-current-lockup-horizontal",
    revisionId: "jestei-pool-current",
    name: "Надпись + эмблема",
    kind: "lockup",
    orientation: "horizontal",
  },
  {
    id: "jestei-current-lockup-stacked",
    revisionId: "jestei-pool-current",
    name: "Надпись под эмблемой",
    kind: "lockup",
    orientation: "stacked",
  },
  {
    id: "styx-current-primary",
    revisionId: "styx-jewel-current",
    name: "Основная версия",
    kind: "wordmark",
    orientation: "horizontal",
  },
  {
    id: "styx-current-monogram",
    revisionId: "styx-jewel-current",
    name: "Сокращённая версия S",
    kind: "monogram",
  },
  {
    id: "sensetique-current-photostudio-lockup",
    revisionId: "sensetique-current",
    name: "Sensetique Photostudio",
    kind: "lockup",
  },
  {
    id: "sensetique-current-production-agency-lockup",
    revisionId: "sensetique-current",
    name: "Sensetique Production Agency",
    kind: "lockup",
  },
  {
    id: "sensetique-current-lockup-112-r18-c01",
    revisionId: "sensetique-current",
    name: "Lockup 112 / r18 / c01",
    kind: "lockup",
    description:
      "Идентификатор сохранён из имени SVG-файла; точную семантику варианта уточним при полном файловом аудите Sensetique.",
  },
  {
    id: "sensetique-current-lockup-062-r01-c02",
    revisionId: "sensetique-current",
    name: "Lockup 062 / r01 / c02",
    kind: "lockup",
    description:
      "Идентификатор сохранён из имени SVG-файла; точную семантику варианта уточним при полном файловом аудите Sensetique.",
  },
  {
    id: "lyve-moscow-current-primary",
    revisionId: "lyve-moscow-current",
    name: "Основная версия",
  },
  {
    id: "illumihand-current-primary",
    revisionId: "illumihand-current",
    name: "Основная версия",
  },
] as const satisfies readonly LogoVariantData<LogoRevisionId>[];

export type LogoVariant = (typeof logoVariants)[number];
export type LogoVariantId = LogoVariant["id"];
