/**
 * Minimal Toxiproxy HTTP API client for managing proxies and toxics.
 */
const TOXIPROXY_URL = process.env.TOXIPROXY_URL ?? "http://localhost:8474";

interface Proxy {
  name: string;
  listen: string;
  upstream: string;
  enabled: boolean;
}

interface Toxic {
  name: string;
  type: string;
  stream: "upstream" | "downstream";
  toxicity: number;
  attributes: Record<string, number>;
}

export async function createProxy(
  name: string,
  listen: string,
  upstream: string
): Promise<Proxy> {
  const res = await fetch(`${TOXIPROXY_URL}/proxies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, listen, upstream, enabled: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    // Proxy may already exist
    if (res.status === 409) {
      return getProxy(name);
    }
    throw new Error(`Failed to create proxy: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getProxy(name: string): Promise<Proxy> {
  const res = await fetch(`${TOXIPROXY_URL}/proxies/${name}`);
  if (!res.ok) throw new Error(`Proxy ${name} not found`);
  return res.json();
}

export async function deleteProxy(name: string): Promise<void> {
  await fetch(`${TOXIPROXY_URL}/proxies/${name}`, { method: "DELETE" });
}

export async function disableProxy(name: string): Promise<void> {
  await fetch(`${TOXIPROXY_URL}/proxies/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: false }),
  });
}

export async function enableProxy(name: string): Promise<void> {
  await fetch(`${TOXIPROXY_URL}/proxies/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: true }),
  });
}

export async function addToxic(
  proxyName: string,
  toxic: {
    name: string;
    type: string;
    stream?: "upstream" | "downstream";
    toxicity?: number;
    attributes: Record<string, number>;
  }
): Promise<Toxic> {
  const res = await fetch(`${TOXIPROXY_URL}/proxies/${proxyName}/toxics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stream: "downstream",
      toxicity: 1.0,
      ...toxic,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to add toxic: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function removeToxic(
  proxyName: string,
  toxicName: string
): Promise<void> {
  await fetch(
    `${TOXIPROXY_URL}/proxies/${proxyName}/toxics/${toxicName}`,
    { method: "DELETE" }
  );
}

export async function removeAllToxics(proxyName: string): Promise<void> {
  const res = await fetch(`${TOXIPROXY_URL}/proxies/${proxyName}/toxics`);
  if (!res.ok) return;
  const toxics: Toxic[] = await res.json();
  for (const toxic of toxics) {
    await removeToxic(proxyName, toxic.name);
  }
}

/**
 * Check if Toxiproxy is available.
 */
export async function isToxiproxyAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${TOXIPROXY_URL}/version`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
