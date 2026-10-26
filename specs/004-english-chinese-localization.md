# 004 — English-first localization

## Problem

Artora targets an international audience, but users who prefer Chinese cannot read or navigate the site in Chinese. Changing language must not replace the established English URLs used for promotion.

## Solution

Keep English at the existing paths, including `/`, `/styles`, `/pricing`, account pages, and the studio. Offer equivalent Chinese pages under `/zh` and a visible language switch on marketing, account, and workspace screens. Switching languages stays on the equivalent page and preserves query parameters and anchors. Internal navigation, account callbacks, job redirects, page titles, document language, canonical links, and sitemap entries follow the selected language. Chinese is chosen explicitly; English remains the default regardless of browser language.

## Out of scope

Automatic geolocation or browser-language redirects, translated artwork prompts, localized payment currencies, translated transactional emails, and additional languages. The real production domain must replace `siteConfig.url` when deployment is configured.

## Data changes

None. The selected language is encoded in the URL and is not stored in the database.

## Test plan

- English routes keep their original URLs and English copy.
- Chinese marketing pages render at `/zh`, with `lang="zh-CN"`, translated content, and equivalent internal links.
- Language switching preserves the current path, query, and anchor.
- Signed-out access to `/zh/generate` redirects to `/zh/login` with the Chinese return path; post-login and email callbacks retain that destination.
- Chinese workspace navigation and artwork routes remain under `/zh`.
- Both languages appear in the sitemap with reciprocal `hreflang`; private pages remain excluded.
