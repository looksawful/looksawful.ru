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

export async function runSuiteWithDeadline({ name, timeoutMs, run, logger = console }) {
  if (typeof name !== "string" || !name.trim()) throw new Error("suite name is required");
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error(`invalid suite timeout: ${timeoutMs}`);
  if (typeof run !== "function") throw new Error(`suite ${name} requires a run function`);

  const suiteName = name.trim();
  const startedAt = Date.now();
  const timeoutMessage = `${suiteName} timed out after ${timeoutMs} ms`;
  let timer;

  logger.log(`[e2e-suite] START ${suiteName} timeout=${timeoutMs}ms`);

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    const result = await Promise.race([
      Promise.resolve().then(run),
      timeout,
    ]);
    logger.log(`[e2e-suite] PASS ${suiteName} duration=${Date.now() - startedAt}ms`);
    return result;
  } catch (error) {
    const isTimeout = error instanceof Error && error.message === timeoutMessage;
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[e2e-suite] ${isTimeout ? "TIMEOUT" : "FAIL"} ${suiteName}: ${message}`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
