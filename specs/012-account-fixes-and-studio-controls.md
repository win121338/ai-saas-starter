# 012 — Account fixes and compact studio controls

## Problem

Email changes, password recovery and account deletion report success without
completing when email delivery is unavailable. The studio lacks photo ratios
and its controls require excessive scrolling.

## Solution

Enable direct email changes for unverified accounts in keyless development;
retain the existing verification flow when email is configured. Disable password
recovery with an actionable message when delivery is unavailable. Delete accounts
using the password or Better Auth's recent-session check and only navigate after
confirmed deletion. Show errors and recover from failed requests.

Add original, square, landscape and portrait photo ratios with matching center
crop previews and server-side cropping. Collapse upload, style and model controls
after selection; allow reopening each control and editing prompts separately.

## Out of scope

New email providers, credentials, dependencies, plans and database changes.

## Data changes

None. Ratios are validated and applied to the persisted input image. Existing
account cleanup and credit/subscription APIs remain in place.

## Test plan

Cover email change and login, unavailable recovery, password reset token expiry
and reuse, password-protected deletion, failed requests, ratio validation,
oriented image cropping, auto-collapse/reopen and persisted cropped dimensions.
