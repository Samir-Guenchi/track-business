const DEFAULT_TIMEOUT_MS = 1_000;

/** Runs a probe and reports false on error or after the timeout, so readiness never hangs. */
export async function probe(
  run: () => Promise<unknown>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  const attempt = run().then(
    () => true,
    () => false,
  );
  try {
    return await Promise.race([attempt, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
