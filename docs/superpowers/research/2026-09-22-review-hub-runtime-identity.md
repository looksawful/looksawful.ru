# Review Hub runtime identity under RLS

Date: 2026-09-22  
Wayfinder ticket: https://github.com/looksawful/looksawful.ru/issues/1150

## Question

What exact Supabase runtime/auth/RLS contract should the Private Review Hub use so one dedicated runtime identity can read/write private Review data, the Worker never carries `service_role`, schema deployment is reproducible from the repository, and current Supabase security advisors do not require accepting avoidable privilege warnings?

## Primary sources

- Supabase Auth admin user creation: https://supabase.com/docs/reference/javascript/auth-admin-createuser
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase password auth: https://supabase.com/docs/guides/auth/passwords
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Current Review Hub candidate PR: https://github.com/looksawful/looksawful.ru/pull/1122
- Parent private-review program: https://github.com/looksawful/looksawful.ru/issues/1087
- Versioned schema at candidate head: `tools/supabase/review-hub.sql`
- Runtime adapter at candidate head: `lab/functions/review-storage-supabase.js`

## Findings

### 1. The Worker does not need `service_role`

Supabase documents that service keys bypass RLS and are intended for administrative/server tasks. That is broader authority than the Review Hub runtime needs.

The runtime can instead authenticate as one dedicated Supabase Auth user using a publishable key plus a Worker-held password, receive a normal user JWT, and let RLS remain authoritative.

The current PR candidate does **not** implement this model. At head `3d20d34cdef8c5162fb87e504290ca5ec8249a30`, the Worker adapter requires `SUPABASE_SECRET_KEY`, sends it as both `apikey` and bearer authorization, and the Postgres RPCs are `SECURITY DEFINER` functions executable by `service_role`.

### 2. Provisioning and runtime authority should be separate

Supabase's admin `createUser` API is server-only and supports both `email_confirm: true` and server-owned `app_metadata`.

Recommended provisioning contract:

1. A trusted provisioning step creates or updates exactly one dedicated Auth user.
2. Provisioning sets a generated strong password, confirms the identity, and sets server-owned `app_metadata` such as `role: "review_hub_runtime"`.
3. The provisioning authority may use `service_role` or equivalent Supabase administrative credentials, but those credentials never enter the Worker runtime and never enter feature/candidate build steps.
4. The Worker stores only the runtime password plus ordinary environment configuration and signs in through normal password auth.

Do not bootstrap this identity with a public signup path or an `auth.users` auto-confirm trigger. The earlier experimental live helper was removed, which is the correct direction.

### 3. RLS should authorize the dedicated principal, not merely the Postgres role

Supabase explicitly warns that `TO authenticated` alone is authentication, not authorization. RLS must add a principal predicate.

For a deployment-portable contract, use server-controlled JWT claims from `raw_app_meta_data`, not `user_metadata`. Supabase documents `raw_app_meta_data` as suitable for authorization because ordinary users cannot edit it.

A Review Hub policy should therefore require all of:

- `TO authenticated`;
- a non-null authenticated identity;
- non-anonymous auth;
- the server-owned Review Hub runtime role/claim.

An exact `auth.uid()` binding is even narrower and can be added if the project wants a deployment-specific principal id. The key invariant is that the policy identifies one provisioning-controlled runtime principal rather than granting all authenticated users.

### 4. Review RPCs should remain inside the RLS boundary

For normal Review Hub reads/writes:

- use `SECURITY INVOKER`, not `SECURITY DEFINER`;
- revoke function execution from `public` and `anon`;
- grant execution only to `authenticated`;
- grant only the table privileges required by the operations;
- enforce row access through RLS;
- keep key-prefix, payload, CAS/etag, retention and other domain validation inside the RPC implementation.

This preserves the useful atomic Postgres operations without turning the RPC into an RLS bypass.

Any genuinely privileged maintenance operation should be a separate trusted maintenance authority, not an excuse to broaden the interactive Review Hub runtime.

### 5. Storage should use the same runtime principal

Supabase private Storage buckets are governed by RLS. Upsert requires the combination of INSERT, SELECT and UPDATE policies; deletion requires DELETE.

The private Review evidence bucket should therefore have policies that authorize the same dedicated runtime principal and restrict object names to the Review Hub prefix. The browser never receives the Supabase JWT or direct Storage authority; the authenticated Admin Worker remains the application boundary.

### 6. Reproducible versus deployment-only state

**Versioned in the repository:**

- Review control/state schema;
- RLS enablement and policies;
- `SECURITY INVOKER` RPC definitions;
- grants/revokes;
- runtime-role claim semantics;
- Review object-prefix validation;
- Storage policy contract;
- executable tests proving anon/ordinary-authenticated denial and runtime-principal success.

**Deployment-only:**

- Supabase project URL;
- publishable key/config;
- dedicated runtime password;
- private bucket id if the project continues to treat it as deployment-private;
- provisioning-only admin/service credentials;
- Vault/cron/maintenance tokens and remote deployment identifiers.

The publishable key is not a secret, but keeping environment-specific values out of the public repository is consistent with the repository's current policy.

### 7. Current live state does not yet satisfy this contract

Read-only inspection of the connected Supabase project on 2026-09-22 showed:

- Review Hub control table exists and has RLS enabled;
- no dedicated Review Hub runtime Auth user exists;
- no runtime-signup helper remains;
- three Review Hub RPCs exist;
- Security Advisor reports the control table as RLS-enabled with no policies, which matches the current service-role-only candidate rather than the desired authenticated-runtime design.

This is an architectural mismatch, not a missing secret. The Worker adapter, schema/RPC execution mode, policies and provisioning path all need to change together if the Supabase route is retained.

## Decision-ready answer

If Supabase is the selected storage/control substrate, the recommended contract is:

> trusted provisioning creates one confirmed Review Hub Auth principal; the Worker authenticates as that principal with normal password auth and holds no `service_role`; Postgres and private Storage authorize only that principal through RLS; ordinary Review RPCs run as `SECURITY INVOKER`; administrative credentials exist only in provisioning/maintenance boundaries.

This satisfies the owner's stated Wayfinder direction while preserving fail-closed access and avoiding a standing RLS-bypass credential in the Worker.

## Newly surfaced decision

The parent program still explicitly chooses private R2 + JSON manifests + no database, while PR #1122 implements Supabase Postgres + private Storage. Runtime-identity research cannot settle that product/architecture choice. It should be resolved as a separate Wayfinder decision before PR #1122 can become merge-ready.
