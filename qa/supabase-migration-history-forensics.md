# Supabase Migration History Forensics

## Scope

Read-only investigation. No migration, migration repair, database push/reset, remote schema change, or production-data write was performed.

## Local and remote migration ledgers

The linked project is cqsoceyqivsfrarcwptb.supabase.co.

| Version | Local | Remote |
| --- | --- | --- |
| 20260317000001 | Yes | Yes |
| 20260318000001 | Yes | Yes |
| 20260318032309 | Yes | Yes |
| 20260319011058 | Yes | Yes |
| 20260319011728 | Yes | Yes |
| 20260319012830 | Yes | Yes |
| 20260319020810 | Yes | Yes |
| 20260319022514 | Yes | Yes |
| 20260319035341 | Yes | Yes |
| 20260327000001 | Yes | Yes |
| 20260327000002 | Yes | Yes |
| 20260620000001 | Yes | Yes |
| 20260628230348 | Yes | Yes |
| 20260719120000 | **No** | **Yes** |
| 20260902175716 | **Yes** | **No** |

## Exact divergence

The ledger first diverges at 20260719120000:

- Every local migration through 20260628230348 is recorded remotely.
- 20260719120000 is remote-only.
- 20260902175716_coupon_bulk_import_foundation.sql is local-only and is not applied remotely.

This is a single visible remote-only version, not evidence of a sequence of missing versions. The local project is an imperative-migrations project because config.toml has db.migrations.schema_paths set to an empty list.

## Local repository and Git forensics

Searches covered the workspace, all locally available refs, full local file history, unreachable objects, migration directories, QA/docs, and locally visible branch references.

Findings:

- No file, reference, commit diff, reflog-reachable object, or unreachable Git object contains 20260719120000.
- The local checkout is shallow/grafted at commit 1d6f28b, dated 2026-06-30.
- Only main and origin/main are locally checked out. Remote reference inspection reports main, security/auth-and-uploads, and fix/patch-vulnerabilities-1c5cd6af-1784455016, but none is locally fetched for historical inspection.
- The local migration directory contains no version between 20260628230348 and 20260902175716.

Therefore the missing SQL cannot be recovered from this local checkout.

## Remote schema evidence

The Supabase CLI confirms that db dump is intended to dump remote schema. A dry run did not alter remote state. The actual dump could not proceed because the CLI requires Docker Desktop here and Docker Desktop is unavailable.

supabase db pull was intentionally not run. Although it is normally a remote-read operation, it creates a new local migration from schema drift. In this forensic state, that generated file could obscure the original missing migration and does not recover its historical SQL.

No remote schema comparison can therefore verify the exact DDL associated with 20260719120000 from this environment.

## Missing migration classification

The evidence supports **C: remote migration history contains an entry whose schema change cannot be verified**.

It is not possible to distinguish A from B with currently available evidence:

- A remains possible: a local migration file was deleted before this shallow checkout.
- B remains possible: it was applied manually/remotely and was never committed to this repository.

The migration-history ledger stores the version, not an independently recoverable copy of the SQL, so its presence alone does not identify the statement set.

## Phase 1 dependency analysis

The Phase 1 migration references public.coupons, public.stores, and public.profiles, plus new coupon_import tables/functions. The referenced base tables and the coupon fields used by Phase 1 are established by migrations at or before 20260628230348 and are present in the read-only application/export evidence.

There is no textual or chronological direct dependency on 20260719120000. However, absence of the missing migration SQL and schema dump means a semantic collision cannot be ruled out—for example, a table, index, policy, or function name introduced by that remote-only migration.

## Recommended safe recovery path

1. Obtain the SQL for 20260719120000 from the original deployer, CI logs/artifacts, Supabase SQL Editor history, a complete repository clone, or a database backup/dump from an environment with pg_dump/Docker access.
2. Review the recovered SQL against the remote public schema and the local migration ledger.
3. Add the exact historical migration file to source control with version 20260719120000. Do not synthesize a placeholder or use migration repair merely to make the ledgers look aligned.
4. In a non-production clone, verify that the recovered migration reproduces the remote schema and that Phase 1 applies without collision.
5. Re-run supabase migration list --linked. Only when the sole remaining delta is the reviewed Phase 1 migration should deployment be reconsidered.

## Commands that SHOULD be run next

- git fetch --unshallow origin, or obtain a full clone, then search all history for 20260719120000.
- git log --all --full-history --name-status -S 20260719120000 -- .
- supabase db dump --linked --schema public --file <outside-repository-path> from a machine with Docker Desktop/pg_dump support.
- supabase migration list --linked after the historical file is recovered and reviewed.

## Commands that MUST NOT be run

- supabase migration repair
- supabase db push
- supabase db reset
- supabase db pull in this checkout before the historical SQL is recovered
- direct SQL intended to update supabase_migrations.schema_migrations
- any manual production schema or coupon-data change

FORENSICS STATUS: COMPLETE
