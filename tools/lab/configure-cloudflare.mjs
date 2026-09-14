const apiBase = "https://api.cloudflare.com/client/v4";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const token = required("CLOUDFLARE_API_TOKEN");
const accountId = required("CLOUDFLARE_ACCOUNT_ID");
const project = process.env.CLOUDFLARE_PAGES_PROJECT?.trim() || "looksawful-ru-preview";
const zoneName = process.env.LAB_ZONE_NAME?.trim() || "looksawful.ru";
const customDomain = process.env.LAB_CUSTOM_DOMAIN?.trim() || `lab.${zoneName}`;
const branch = process.env.LAB_BRANCH?.trim() || "lab";
const branchAlias = `${branch}.${project}.pages.dev`;

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const errors = Array.isArray(payload?.errors)
      ? payload.errors.map((error) => `${error.code ?? "?"}: ${error.message ?? "unknown error"}`).join("; ")
      : `HTTP ${response.status}`;
    throw new Error(`Cloudflare API ${options.method ?? "GET"} ${path} failed: ${errors}`);
  }

  return payload;
}

async function ensurePagesDomain() {
  const path = `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}/domains`;
  const list = await request(path);
  const domains = Array.isArray(list?.result) ? list.result : [];
  let domain = domains.find((entry) => entry?.name === customDomain);

  if (!domain) {
    const created = await request(path, {
      method: "POST",
      body: JSON.stringify({ name: customDomain }),
    });
    domain = created?.result;
    console.log(`[lab-cloudflare] attached Pages domain: ${customDomain}`);
  } else {
    console.log(`[lab-cloudflare] Pages domain already attached: ${customDomain}`);
  }

  return domain;
}

async function readPagesDomain() {
  const path = `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(customDomain)}`;
  return request(path);
}

async function resolveZone(domain) {
  if (typeof domain?.zone_tag === "string" && domain.zone_tag.trim()) {
    return { id: domain.zone_tag.trim(), source: "pages-domain" };
  }

  const currentDomain = await readPagesDomain();
  if (typeof currentDomain?.result?.zone_tag === "string" && currentDomain.result.zone_tag.trim()) {
    return { id: currentDomain.result.zone_tag.trim(), source: "pages-domain" };
  }

  const query = new URLSearchParams({ name: zoneName, status: "active", per_page: "50" });
  const payload = await request(`/zones?${query}`);
  const zones = Array.isArray(payload?.result) ? payload.result : [];
  const zone = zones.find((entry) => entry?.name === zoneName && entry?.account?.id === accountId)
    ?? zones.find((entry) => entry?.name === zoneName);
  if (!zone?.id) throw new Error(`Active Cloudflare zone not found: ${zoneName}`);
  return { id: zone.id, source: "zone-list" };
}

async function ensureDnsRecord(zoneId) {
  const base = `/zones/${encodeURIComponent(zoneId)}/dns_records`;
  const query = new URLSearchParams({ type: "CNAME", name: customDomain, per_page: "100" });
  const payload = await request(`${base}?${query}`);
  const records = Array.isArray(payload?.result) ? payload.result : [];
  const existing = records[0];
  const desired = {
    type: "CNAME",
    name: customDomain,
    content: branchAlias,
    proxied: true,
    ttl: 1,
  };

  if (!existing) {
    await request(base, { method: "POST", body: JSON.stringify(desired) });
    console.log(`[lab-cloudflare] created proxied CNAME ${customDomain} -> ${branchAlias}`);
    return;
  }

  const matches = existing.type === desired.type
    && existing.name === desired.name
    && existing.content === desired.content
    && existing.proxied === true;

  if (matches) {
    console.log(`[lab-cloudflare] DNS already correct: ${customDomain} -> ${branchAlias}`);
    return;
  }

  await request(`${base}/${encodeURIComponent(existing.id)}`, {
    method: "PUT",
    body: JSON.stringify(desired),
  });
  console.log(`[lab-cloudflare] updated proxied CNAME ${customDomain} -> ${branchAlias}`);
}

async function waitForDomain() {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const payload = await readPagesDomain();
    const status = payload?.result?.status ?? "unknown";
    console.log(`[lab-cloudflare] domain status ${attempt}/12: ${status}`);
    if (status === "active") return status;
    if (["error", "blocked", "deactivated"].includes(status)) {
      throw new Error(`Cloudflare Pages domain entered terminal state: ${status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  return "pending";
}

async function appendSummary(domainStatus, zoneSource) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const { appendFile } = await import("node:fs/promises");
  await appendFile(
    summaryPath,
    [
      "### Lab Cloudflare routing",
      "",
      `- branch alias: https://${branchAlias}`,
      `- custom domain: https://${customDomain}`,
      `- domain status: ${domainStatus}`,
      "- DNS: proxied CNAME to branch alias",
      `- zone resolution: ${zoneSource}`,
      "- authentication: Pages Function + LAB_PASSWORD",
      "",
    ].join("\n"),
  );
}

const domain = await ensurePagesDomain();
const zone = await resolveZone(domain);
await ensureDnsRecord(zone.id);
const domainStatus = await waitForDomain();
await appendSummary(domainStatus, zone.source);

console.log(`[lab-cloudflare] Lab routing ready: https://${customDomain}/lab/ (${domainStatus})`);
