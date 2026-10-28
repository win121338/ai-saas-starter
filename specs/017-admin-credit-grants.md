# 017 — Administrator credit grants

## Problem

Member management shows balances but operators cannot replenish a member's credits manually.

## Solution

Each member row has an Add credits dialog showing the recipient, a positive integer amount and a required reason. Authorized administrators submit a Server Action; the ledger appends an admin_adjust entry and increments the balance in the same database transaction as the audit event. A stable UUID identifies each attempt, preventing duplicate additions on retries and rejecting reuse with changed details. Show clear errors or a receipt and refresh balances after success.

## Out of scope

No deductions, automatic grants to actual members, changes to plans/prices/standard credit allocations, schema changes or dependencies.

## Data changes

None. Use the existing admin_adjust ledger type and admin audit table. Manual grants use admin_grant_<requestId> as the idempotency key. Ledger operations remain entirely under src/lib/credits/; neither old transactions nor subscriptions are rewritten.

## Test plan

Real PostgreSQL tests cover ledger/cache equality, audit details, duplicate/concurrent requests, changed-request rejection, missing recipients, invalid quantities and rollback on failure. Server Action tests cover administrator checks and input handling. Browser tests cover a regular member being denied, an administrator granting to a member, refreshed balances, audit visibility and an intentional second grant. All database verification uses isolated test databases. Run typecheck, lint and the full unit suite.
