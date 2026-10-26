# 007 — Art job feedback and local recovery

## Problem

A Wanx edit can sit on the creation page for minutes showing only “processing.” The page refreshes database state but does not keep polling the provider after the short development background loop ends. The owner needs a trustworthy progress indication, a clear explanation when a job stalls or fails, and a restrained finished-artwork reveal.

The observed successful Wanx response used a `dashscope-<number>.oss-cn-*.aliyuncs.com` result host. The previous downloader only accepted `dashscope-result-*`, so it repeatedly rejected this valid image even though the provider task had succeeded.

## Solution

Show the real queued, submitting, and processing stages, elapsed time, and an indeterminate activity bar without a fabricated percentage. In development, an authenticated owner viewing an active job triggers targeted worker checks on the same refresh interval so a saved provider task can complete even without a local scheduler. Longer waits and provider rate limiting have clear messages. Finished results gain subtle warm star and glow motion that respects reduced-motion preferences. Failed jobs explain the known failure category and whether credits were refunded, with a way back to the studio.

Accept the observed official DashScope OSS bucket pattern while continuing to reject unrelated or lookalike hosts. If a status check fails, retain the provider task ID, show a retry notice, and clear it when checking succeeds.

## Out of scope

Invented model percentages, changing prompts or credit prices, automatic resubmission of uncertain provider outcomes, and replacing the required production worker scheduler.

## Data changes

None. Existing job status and failure-code fields are used. Credit corrections remain in `src/lib/credits/`; no new charges occur during status checks.

## Test plan

- Verify targeted processing cannot claim another job and does not resubmit an already processing task.
- Verify a locally stalled Wanx job can be polled to completion and preserves its single charge.
- Verify provider access errors and rate limits map to useful failure or waiting states.
- Verify progress and failure copy in English and Chinese, then run typecheck, lint, and Vitest.
