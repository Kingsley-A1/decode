# Decode Release Readiness Runbook

## Release Gates

Run these checks before promoting a production deployment:

```bash
npm run ci
npm run smoke:e2e
npm run lhci
```

`npm run ci` covers lint, TypeScript, unit tests, Prisma schema validation, and the production Next.js build. `npm run smoke:e2e` runs the Playwright smoke suite against either the local app or `PLAYWRIGHT_BASE_URL`. `npm run lhci` starts the built app and measures Lighthouse performance and accessibility budgets.

Preview deployments are checked by the `deployment_status` GitHub workflow when Vercel reports a successful deployment URL. Set `SMOKE_DYNAMIC_SLUG` as a GitHub secret when there is a stable production-safe dynamic QR fixture; the dynamic redirect smoke test is skipped when that fixture is not configured.

## Core Web Vitals Targets

Decode measures Core Web Vitals in production through Vercel Speed Insights and checks lab regressions through Lighthouse CI.

| Metric | Target | Primary Measurement |
| --- | --- | --- |
| LCP | `<= 2.5 s` | Vercel Speed Insights, Lighthouse CI warning budget |
| INP | `<= 200 ms` | Vercel Speed Insights |
| CLS | `<= 0.05` | Vercel Speed Insights, Lighthouse CI warning budget |
| Accessibility | `>= 95` Lighthouse score | Lighthouse CI error budget |

Lighthouse CI uses Total Blocking Time `<= 200 ms` as the lab proxy for interaction responsiveness because INP is a field metric. Treat a Speed Insights INP regression on the generator, scanner, verifier, dashboard, or dynamic redirect flow as a release blocker until investigated.

## Observability Checks

Every API JSON response includes `requestId` in the response body and an `x-request-id` header. Dynamic QR HTML responses and redirects also include `x-request-id`. Ask support and QA to attach this value to production bug reports so Sentry events and Vercel logs can be correlated.

Sentry must be configured with `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` before production source maps are expected to upload. Builds still pass without `SENTRY_AUTH_TOKEN`, but source-map upload is disabled.

After a production deployment, inspect early runtime errors:

```bash
vercel logs <deployment-url> --level error --since 1h
```

If request IDs appear in user reports but no Sentry event is visible, search Vercel runtime logs by the same request ID and verify that the production deployment has the expected Sentry DSN environment variables.

## CockroachDB Backup Baseline

Production CockroachDB must have scheduled backups or point-in-time recovery enabled before non-additive migrations are allowed. For Cockroach Cloud, verify backups from the cluster console before release. For self-managed clusters, store encrypted backups in a restricted bucket that is separate from application uploads.

Before a risky migration, take an explicit backup and record the backup location in the release notes:

```bash
cockroach sql --url "$DATABASE_URL" --execute "SHOW BACKUPS"
```

If the organization uses external backups, run the approved `BACKUP DATABASE` command for the production database and verify that `SHOW BACKUPS` lists the backup. Do not put backup credentials in application `.env` files; use the database operations secret store or the Cockroach Cloud backup integration.

## Migration Procedure

Check migration status before deployment:

```bash
npx prisma migrate status
npx prisma validate
```

Generate migrations locally with representative schema changes, review the SQL, then apply through the normal release path:

```bash
npx prisma migrate dev --name <short-change-name>
npx prisma migrate deploy
```

Prefer expand-and-contract migrations for user data. Add nullable columns and new tables first, deploy code that writes both shapes when needed, backfill in bounded jobs, then remove old columns in a later release. Avoid destructive migrations in the same deployment that introduces dependent application code.

## Failed Deployment Rollback

If a Vercel deployment fails smoke tests or produces production errors, immediately promote the last healthy deployment from the Vercel dashboard or CLI:

```bash
vercel rollback <deployment-url>
```

After rollback, verify `npm run smoke:e2e` against the restored URL, inspect Sentry for new errors, and keep the failed deployment available for log inspection. Do not rerun the same production promotion until the root cause is isolated and the fix passes the preview smoke suite.

## Failed Migration Recovery

If `prisma migrate deploy` fails before applying a migration, stop the deployment and fix the migration locally. If it fails after partially applying SQL, inspect the Prisma migration table and CockroachDB schema manually before changing migration history.

Use `npx prisma migrate resolve` only after the database state has been repaired and the team agrees whether the migration should be marked applied or rolled back. If application data was corrupted or a destructive statement shipped, restore from the verified backup or perform a forward repair migration; do not assume Git rollback can undo database state.

## Release Owner Checklist

Record the release SHA, Vercel deployment URL, Prisma migration IDs, backup verification, smoke-test result, Lighthouse result, and post-deploy error scan in the release note. The release is not ready for promotion unless the rollback deployment is known and the migration recovery path has an owner.
