const HEALTH_TIMEOUT_MS = 30_000;
const HEALTH_INTERVAL_MS = 500;
const REGISTER_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Polls the health endpoint until the server answers. */
export async function waitForHealth(base: string, timeoutMs = HEALTH_TIMEOUT_MS): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(HEALTH_INTERVAL_MS);
  }
  throw new Error(`Server at ${base} did not become healthy within ${timeoutMs / 1000}s`);
}

/** Stores the public URL so the projector QR code updates; retries a few times. */
export async function registerPublicUrl(base: string, pin: string, url: string): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= REGISTER_RETRIES; attempt += 1) {
    try {
      const res = await fetch(`${base}/api/settings/public-url`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-host-pin': pin },
        body: JSON.stringify({ url }),
      });
      if (res.ok) return;
      lastError = new Error(`Server answered ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(RETRY_DELAY_MS * attempt);
  }
  throw new Error(`Could not register the public URL: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

export async function fetchLanUrl(base: string, pin: string): Promise<string | null> {
  try {
    const res = await fetch(`${base}/api/settings`, { headers: { 'x-host-pin': pin } });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { lanUrl?: string } };
    return body.data?.lanUrl ?? null;
  } catch {
    return null;
  }
}
