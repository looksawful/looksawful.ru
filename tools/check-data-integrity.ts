import { cases } from "../src/data/catalog/cases.ts";
import { clients } from "../src/data/catalog/clients.ts";
import { collections } from "../src/data/catalog/collections.ts";
import { engagements } from "../src/data/catalog/engagements.ts";
import { projects } from "../src/data/catalog/projects/index.ts";
import { roles } from "../src/data/taxonomy/roles.ts";
import { mediaAssets } from "../src/data/media/assets/index.ts";
import { mediaEntries } from "../src/data/media/entries/index.ts";

const errors: string[] = [];

function assertUniqueIds(
  entityName: string,
  items: readonly { id: string }[],
): void {
  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push(`${entityName}: duplicate id "${item.id}"`);
    }

    seen.add(item.id);
  }
}

function assertUniqueValues(
  owner: string,
  field: string,
  values?: readonly string[],
): void {
  if (!values) {
    return;
  }

  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`${owner}.${field}: duplicate reference "${value}"`);
    }

    seen.add(value);
  }
}

function assertReferences(
  owner: string,
  field: string,
  values: readonly string[] | undefined,
  validIds: ReadonlySet<string>,
): void {
  if (!values) {
    return;
  }

  for (const value of values) {
    if (!validIds.has(value)) {
      errors.push(`${owner}.${field}: unknown id "${value}"`);
    }
  }
}

function assertPrimaryRole(
  owner: string,
  primaryRoleId: string | undefined,
  roleIds: readonly string[] | undefined,
  roleIdSet: ReadonlySet<string>,
): void {
  if (!primaryRoleId) {
    return;
  }

  if (!roleIdSet.has(primaryRoleId)) {
    errors.push(`${owner}.primaryRoleId: unknown role "${primaryRoleId}"`);
  }

  if (roleIds && !roleIds.includes(primaryRoleId)) {
    errors.push(`${owner}: primaryRoleId "${primaryRoleId}" is missing from roleIds`);
  }
}

assertUniqueIds("Client", clients);
assertUniqueIds("Case", cases);
assertUniqueIds("Collection", collections);
assertUniqueIds("Engagement", engagements);
assertUniqueIds("Project", projects);
assertUniqueIds("Role", roles);
assertUniqueIds("MediaAsset", mediaAssets);
assertUniqueIds("MediaEntry", mediaEntries);

const clientIds = new Set(clients.map(({ id }) => id));
const caseIds = new Set(cases.map(({ id }) => id));
const collectionIds = new Set(collections.map(({ id }) => id));
const engagementIds = new Set(engagements.map(({ id }) => id));
const projectIds = new Set(projects.map(({ id }) => id));
const roleIds = new Set(roles.map(({ id }) => id));
const mediaAssetIds = new Set(mediaAssets.map(({ id }) => id));

for (const item of cases) {
  const owner = `Case(${item.id})`;

  assertUniqueValues(owner, "clientIds", item.clientIds);
  assertUniqueValues(owner, "engagementIds", item.engagementIds);
  assertUniqueValues(owner, "roleIds", item.roleIds);
  assertReferences(owner, "clientIds", item.clientIds, clientIds);
  assertReferences(owner, "engagementIds", item.engagementIds, engagementIds);
  assertReferences(owner, "roleIds", item.roleIds, roleIds);
  assertPrimaryRole(owner, item.primaryRoleId, item.roleIds, roleIds);
}

for (const item of collections) {
  const owner = `Collection(${item.id})`;

  assertUniqueValues(owner, "roleIds", item.roleIds);
  assertReferences(owner, "roleIds", item.roleIds, roleIds);
  assertPrimaryRole(owner, item.primaryRoleId, item.roleIds, roleIds);
}

for (const item of engagements) {
  const owner = `Engagement(${item.id})`;

  assertUniqueValues(owner, "clientIds", item.clientIds);
  assertUniqueValues(owner, "roleIds", item.roleIds);
  assertReferences(owner, "clientIds", item.clientIds, clientIds);
  assertReferences(owner, "roleIds", item.roleIds, roleIds);
  assertPrimaryRole(owner, item.primaryRoleId, item.roleIds, roleIds);
}

for (const item of projects) {
  const owner = `Project(${item.id})`;

  assertUniqueValues(owner, "caseIds", item.caseIds);
  assertUniqueValues(owner, "clientIds", item.clientIds);
  assertUniqueValues(owner, "collectionIds", item.collectionIds);
  assertUniqueValues(owner, "engagementIds", item.engagementIds);
  assertUniqueValues(owner, "roleIds", item.roleIds);

  assertReferences(owner, "caseIds", item.caseIds, caseIds);
  assertReferences(owner, "clientIds", item.clientIds, clientIds);
  assertReferences(owner, "collectionIds", item.collectionIds, collectionIds);
  assertReferences(owner, "engagementIds", item.engagementIds, engagementIds);
  assertReferences(owner, "roleIds", item.roleIds, roleIds);
  assertPrimaryRole(owner, item.primaryRoleId, item.roleIds, roleIds);
}

for (const entry of mediaEntries) {
  const owner = `MediaEntry(${entry.id})`;

  if (!mediaAssetIds.has(entry.assetId)) {
    errors.push(`${owner}.assetId: unknown MediaAsset "${entry.assetId}"`);
  }

  if (entry.posterAssetId && !mediaAssetIds.has(entry.posterAssetId)) {
    errors.push(`${owner}.posterAssetId: unknown MediaAsset "${entry.posterAssetId}"`);
  }

  assertUniqueValues(owner, "projectIds", entry.projectIds);
  assertReferences(owner, "projectIds", entry.projectIds, projectIds);
}

if (errors.length) {
  console.error("Data integrity check failed:\n");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exitCode = 1;
} else {
  console.log(
    `Data integrity OK: ${clients.length} clients, ${cases.length} cases, ${engagements.length} engagements, ${projects.length} projects, ${mediaEntries.length} media entries.`,
  );
}
