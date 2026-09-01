// Drain in-flight contexts even when another worker fails, before runtime cleanup.
export async function mapWithConcurrency(items, concurrency, callback) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("invalid concurrency");
  const results = new Array(items.length);
  let next = 0;
  let failure;
  async function worker() {
    while (!failure && next < items.length) {
      const index = next++;
      try { results[index] = await callback(items[index], index); }
      catch (error) { failure ??= error; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  if (failure) throw failure;
  return results;
}
