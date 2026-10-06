# Supabase Remote Schema Analysis

## Scope and target

Read-only investigation only. The linked project is cqsoceyqivsfrarcwptb. No migration, repair, push, reset, pull, remote schema change, or production-data write was performed.

## Migration list

The linked migration ledger remains:

- local and remote agree through 20260628230348;
- 20260719120000 exists only remotely;
- 20260902175716_coupon_bulk_import_foundation.sql exists only locally.

## Remote schema dump

Requested location: qa/remote-schema-current.sql.

Result: no usable dump was captured.

1. The requested Supabase CLI command was run. It connected to the linked project, but its db dump implementation requires Docker Desktop. Docker Desktop is unavailable in this environment.
2. A native pg_dump 18 fallback was then run with the linked CLI's in-memory connection parameters. It connected, but the CLI login role lacks permission to lock public.profiles and the other public tables, which pg_dump requires even for a schema-only dump.

The empty output file is not a schema artifact and must not be used for analysis.

## Coupon schema, indexes, policies, functions, triggers, types, and foreign keys

Unknown/unverifiable from a remote schema dump in this environment.

The prior read-only application/API evidence confirms the remote coupons and stores tables are reachable and that coupons include the fields used by the Phase 1 migration. It does not prove the complete DDL, indexes, constraints, RLS policies, functions, triggers, enum/type definitions, or ownership state.

## Comparison with local artifacts

The local baseline schema and migrations define coupon behavior through 20260628230348. The local Phase 1 migration introduces:

- coupons_store_normalized_code_key expression unique index;
- coupon_import_profiles, coupon_imports, and coupon_import_rows;
- admin RLS policies and grants for those tables;
- commit_coupon_import and rollback_coupon_import RPCs.

No remote dump exists to establish whether objects with any of those names already exist remotely. Do not infer that they do or do not exist from migration-version chronology.

## Evidence concerning 20260719120000

- Directly identifiable evidence: only its remote migration-history version and timestamp.
- Strong inference: none about its SQL/DDL.
- Unknown/unverifiable: every schema object it introduced, altered, or removed.

The remote-only migration cannot be reconstructed from current evidence.

## Confidence

- Migration-ledger divergence: high.
- Exact remote-only migration SQL: none.
- Complete remote schema comparison: none.
- Phase 1 collision/dependency safety: low confidence without a privileged schema dump or original historical SQL.

## Recommended next action

Obtain one of the following before any reconciliation or deployment:

1. the exact 20260719120000 SQL from the original deployer, CI artifacts, Supabase SQL Editor history, or full Git history; or
2. a schema-only dump executed by a privileged database role from an approved environment.

Then compare that evidence with the local migration ledger and recover the exact historical migration file before evaluating the Phase 1 deployment.

## Exact commands for the next phase

From an approved environment with either Docker Desktop plus a sufficiently privileged database role, or native pg_dump credentials with schema-read/lock privileges:

    supabase migration list --linked
    supabase db dump --linked --schema public -f qa/remote-schema-current.sql

After the missing historical SQL is recovered:

    git fetch --unshallow origin
    git log --all --full-history --name-status -S 20260719120000 -- .
    supabase migration list --linked

## Commands that must NOT be run

- supabase migration repair
- supabase db push
- supabase db reset
- supabase db pull
- direct changes to supabase_migrations.schema_migrations
- manual production schema/data changes

REMOTE SCHEMA ANALYSIS: BLOCKED
