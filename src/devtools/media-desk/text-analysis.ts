import type { ContentDeskTextEntry } from "./editor-model.ts";

export interface TextDeskFilter {
  query?: string;
  sourcePath?: string;
}

export interface TextSourceCount {
  sourcePath: string;
  count: number;
}

export interface RepeatedTextValue {
  value: string;
  count: number;
}

export interface TextDeskAnalysis {
  totalEntries: number;
  uniqueSources: number;
  emptyValues: number;
  averageLength: number;
  medianLength: number;
  entriesPerSource: readonly TextSourceCount[];
  longestValues: readonly { entry: ContentDeskTextEntry; length: number }[];
  repeatedValues: readonly RepeatedTextValue[];
}

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

export function filterTextDeskEntries(
  entries: readonly ContentDeskTextEntry[],
  filter: TextDeskFilter,
): readonly ContentDeskTextEntry[] {
  const query = normalize(filter.query ?? "");
  return entries.filter((entry) => {
    if (filter.sourcePath && entry.sourcePath !== filter.sourcePath) return false;
    if (!query) return true;
    return normalize(`${entry.sourcePath} ${entry.fieldPath} ${entry.value}`).includes(query);
  });
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function analyzeTextDeskEntries(entries: readonly ContentDeskTextEntry[]): TextDeskAnalysis {
  const sourceCounts = new Map<string, number>();
  const repeated = new Map<string, { value: string; count: number }>();
  const lengths = entries.map(({ value }) => value.length);

  for (const entry of entries) {
    sourceCounts.set(entry.sourcePath, (sourceCounts.get(entry.sourcePath) ?? 0) + 1);
    const value = entry.value.trim();
    if (value.length < 12) continue;
    const key = value.toLocaleLowerCase();
    const existing = repeated.get(key);
    repeated.set(key, existing ? { value: existing.value, count: existing.count + 1 } : { value, count: 1 });
  }

  return {
    totalEntries: entries.length,
    uniqueSources: sourceCounts.size,
    emptyValues: entries.filter(({ value }) => value.trim().length === 0).length,
    averageLength: entries.length === 0 ? 0 : lengths.reduce((sum, value) => sum + value, 0) / entries.length,
    medianLength: median(lengths),
    entriesPerSource: [...sourceCounts.entries()]
      .map(([sourcePath, count]) => ({ sourcePath, count }))
      .sort((left, right) => right.count - left.count || left.sourcePath.localeCompare(right.sourcePath)),
    longestValues: entries
      .map((entry) => ({ entry, length: entry.value.length }))
      .sort((left, right) => right.length - left.length)
      .slice(0, 10),
    repeatedValues: [...repeated.values()]
      .filter(({ count }) => count > 1)
      .sort((left, right) => right.count - left.count || right.value.length - left.value.length)
      .slice(0, 20),
  };
}
