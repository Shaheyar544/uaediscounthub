# Supabase Historical Migration Restoration Verification

## File created

Created:

- supabase/migrations/20260719120000_drop_unused_indexes.sql

The file restores the catalog-recovered historical migration version/name, comments/rationale, and all 16 verified DROP INDEX IF EXISTS statements. It was created locally only and was not executed.

## Linked migration verification

Read-only supabase migration list --linked result:

| Version | Local | Remote |
| --- | --- | --- |
| 20260719120000 | Yes | Yes |
| 20260902175716 | Yes | No |

All earlier migration versions match on both sides. The only remaining expected delta is the unapplied Phase 1 coupon bulk-import migration.

The read-only catalog query also confirms the remote migration-history row:

- version: 20260719120000
- name: drop_unused_indexes

## Remote-state confirmation

No migration repair, db push, db reset, db pull, migration-history DML, schema change, coupon mutation, or production-data write was run. The only remote operations were SELECT/read-only migration ledger checks.

## Local validation

| Check | Result |
| --- | --- |
| npx tsc --noEmit | PASS |
| git diff --check | PASS |

## Blockers

None. Phase 1 is now the sole local-only migration. Its deployment remains outside this phase and requires separate explicit authorization plus a fresh coupon-data preflight.

RESTORATION VERIFIED
