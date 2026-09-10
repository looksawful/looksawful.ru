const apiBase = "https://api.cloudflare.com/client/v4";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const token = required("CLOUDFLARE_API_TOKEN");
const accountId = required("CLOUDFLARE_ACCOUNT_ID");
const serviceClientId = required("CF_ACCESS_CLIENT_ID");
const project = process.env.CLOUDFLARE_PAGES_PROJECT?.trim() || "looksawful-ru-preview";
const zoneName = process.env.LAB_ZONE_NAME?.trim() || "looksawful.ru";
const customDomain = process.env.LAB_CUSTOM_DOMAIN?.trim() || `lab.${zoneName}`;
const branch = process.env.LAB_BRANCH?.trim() || "lab";
const branchAlias = `${branch}.${project}.pages.dev`;
const accessAppName = "looksawful Lab";

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

async function ensureZeroTrustReady() {
  const payload = await request(`/accounts/${encodeURIComponent(accountId)}/access/organizations`);
  const organization = payload?.result;
  if (!organization || typeof organization !== "object") {
    throw new Error("Cloudflare Zero Trust is not initialized for this account. Complete the one-time Zero Trust onboarding first.");
  }
  console.log(`[lab-cloudflare] Zero Trust organization ready: ${organization.name ?? organization.auth_domain ?? "configured"}`);
}

function appDestinations(app) {
  const destinations = Array.isArray(app?.destinations) ? app.destinations : [];
  return destinations
    .filter((entry) => entry?.type === "public" && typeof entry?.uri === "string")
    .map((entry) => entry.uri);
}

function appMatchesDomain(app, domain) {
  return app?.domain === domain || appDestinations(app).includes(domain);
}

function appMatchesPreviewProject(app) {
  const values = [app?.domain, ...appDestinations(app)].filter((value) => typeof value === "string");
  return values.some((value) => value.includes(`${project}.pages.dev`));
}

async function listAccessApplications() {
  const payload = await request(`/accounts/${encodeURIComponent(accountId)}/access/apps?per_page=100`);
  return Array.isArray(payload?.result) ? payload.result : [];
}

async function requirePreviewAccessApplication() {
  const applications = await listAccessApplications();
  const app = applications.find((entry) => appMatchesPreviewProject(entry));
  if (!app?.id) {
    throw new Error(`Cloudflare Pages preview Access is not enabled for ${project}. Enable the Pages preview access policy before publishing Lab.`);
  }
  console.log(`[lab-cloudflare] Pages preview Access application ready: ${app.name ?? app.id}`);
  return app;
}

async function resolveServiceTokenId() {
  const payload = await request(`/accounts/${encodeURIComponent(accountId)}/access/service_tokens?per_page=1000`);
  const tokens = Array.isArray(payload?.result) ? payload.result : [];
  const serviceToken = tokens.find((entry) => entry?.client_id === serviceClientId && entry?.enabled !== false);
  if (!serviceToken?.id) {
    throw new Error("CF_ACCESS_CLIENT_ID does not match an enabled Cloudflare Access service token in this account.");
  }
  console.log(`[lab-cloudflare] CI service token resolved: ${serviceToken.name ?? serviceToken.id}`);
  return serviceToken.id;
}

async function listApplicationPolicies(appId) {
  const payload = await request(`/accounts/${encodeURIComponent(accountId)}/access/apps/${encodeURIComponent(appId)}/policies?per_page=100`);
  return Array.isArray(payload?.result) ? payload.result : [];
}

function hasEveryoneRule(policy) {
  const include = Array.isArray(policy?.include) ? policy.include : [];
  return include.some((rule) => rule?.everyone && typeof rule.everyone === "object");
}

function hasAccountMemberRule(policy) {
  const include = Array.isArray(policy?.include) ? policy.include : [];
  return policy?.decision === "allow" && include.some(
    (rule) => rule?.cloudflare_account_member?.account_id === accountId,
  );
}

function hasServiceTokenRule(policy, serviceTokenId) {
  const include = Array.isArray(policy?.include) ? policy.include : [];
  return policy?.decision === "non_identity" && include.some(
    (rule) => rule?.service_token?.token_id === serviceTokenId,
  );
}

function assertNoPublicPolicy(policies, label) {
  const unsafe = policies.find((policy) => hasEveryoneRule(policy) && ["allow", "bypass"].includes(policy?.decision));
  if (unsafe) {
    throw new Error(`${label} has an unsafe Everyone ${unsafe.decision} policy (${unsafe.name ?? unsafe.id}). Remove it before using Lab.`);
  }
}

async function ensureAccountMemberPolicy(appId) {
  const policies = await listApplicationPolicies(appId);
  assertNoPublicPolicy(policies, "Lab Access application");
  if (policies.some(hasAccountMemberRule)) {
    console.log("[lab-cloudflare] Cloudflare-account member policy already present");
    return;
  }
  await request(`/accounts/${encodeURIComponent(accountId)}/access/apps/${encodeURIComponent(appId)}/policies`, {
    method: "POST",
    body: JSON.stringify({
      name: "Lab Cloudflare account members",
      decision: "allow",
      include: [{ cloudflare_account_member: { account_id: accountId } }],
      session_duration: "12h",
    }),
  });
  console.log("[lab-cloudflare] created Cloudflare-account member allow policy");
}

async function ensureServiceAuthPolicy(appId, serviceTokenId, name) {
  const policies = await listApplicationPolicies(appId);
  assertNoPublicPolicy(policies, name);
  if (policies.some((policy) => hasServiceTokenRule(policy, serviceTokenId))) {
    console.log(`[lab-cloudflare] ${name} service policy already present`);
    return;
  }
  await request(`/accounts/${encodeURIComponent(accountId)}/access/apps/${encodeURIComponent(appId)}/policies`, {
    method: "POST",
    body: JSON.stringify({
      name,
      decision: "non_identity",
      include: [{ service_token: { token_id: serviceTokenId } }],
    }),
  });
  console.log(`[lab-cloudflare] created ${name} service policy`);
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

async function resolveZone(domain) {
  if (typeof domain?.zone_tag === "string" && domain.zone_tag.trim()) {
    console.log("[lab-cloudflare] using zone id exposed by Pages domain metadata");
    return { id: domain.zone_tag.trim(), source: "pages-domain" };
  }

  const currentDomain = await readPagesDomain();
  if (typeof currentDomain?.result?.zone_tag === "string" && currentDomain.result.zone_tag.trim()) {
    console.log("[lab-cloudflare] using zone id exposed by Pages domain lookup");
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

async function readPagesDomain() {
  const path = `/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(customDomain)}`;
  return request(path);
}

async function waitForDomain() {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const payload = await readPagesDomain();
    const status = payload?.result?.status ?? "unknown";
    console.log(`[lab-cloudflare] domain status ${attempt}/12: ${status}`);
    if (status === "active") return status;
    if (status === "error" || status === "blocked" || status === "deactivated") {
      throw new Error(`Cloudflare Pages domain entered terminal state: ${status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  return "pending";
}

async function ensureLabAccessApplication() {
  const applications = await listAccessApplications();
  let app = applications.find((entry) => appMatchesDomain(entry, customDomain));
  if (!app) {
    const created = await request(`/accounts/${encodeURIComponent(accountId)}/access/apps`, {
      method: "POST",
      body: JSON.stringify({
        name: accessAppName,
        type: "self_hosted",
        domain: customDomain,
        destinations: [{ type: "public", uri: customDomain }],
        session_duration: "12h",
        app_launcher_visible: false,
        allow_iframe: true,
      }),
    });
    app = created?.result;
    console.log(`[lab-cloudflare] created private Access application: ${customDomain}`);
  } else {
    console.log(`[lab-cloudflare] Access application already exists: ${customDomain}`);
  }
  if (!app?.id) throw new Error(`Cloudflare Access application id missing for ${customDomain}.`);
  return app;
}

async function appendSummary(domainStatus, zoneSource) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const { appendFile } = await import("node:fs/promises");
  await appendFile(
    summaryPath,
    [
      "### Lab Cloudflare routing and Access",
      "",
      `- branch alias: https://${branchAlias}`,
      `- custom domain: https://${customDomain}`,
      `- domain status: ${domainStatus}`,
      "- DNS: proxied CNAME to branch alias",
      `- zone resolution: ${zoneSource}`,
      "- human access: Cloudflare account members only",
      "- CI access: exact Access service token",
      "- unsafe Everyone allow/bypass: rejected",
      "",
    ].join("\n"),
  );
}

await ensureZeroTrustReady();
const previewAccessApp = await requirePreviewAccessApplication();
const serviceTokenId = await resolveServiceTokenId();
await ensureServiceAuthPolicy(previewAccessApp.id, serviceTokenId, "looksawful Preview CI");

const domain = await ensurePagesDomain();
const zone = await resolveZone(domain);
await ensureDnsRecord(zone.id);
const domainStatus = await waitForDomain();

const labAccessApp = await ensureLabAccessApplication();
await ensureAccountMemberPolicy(labAccessApp.id);
await ensureServiceAuthPolicy(labAccessApp.id, serviceTokenId, "looksawful Lab CI");
await appendSummary(domainStatus, zone.source);

console.log(`[lab-cloudflare] private Lab ready: https://${customDomain}/lab/ (${domainStatus})`);
