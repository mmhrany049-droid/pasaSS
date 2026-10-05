> v4: the bot's first job is a **mailbox for .ssx/.ssp files** (spec 35). Detailed bot design will be done with the owner; rules below (pairing, forbidden content, proxy, reliability) still apply.

# 15 — Telegram Bot Adapter (R4) — design only

## Role
Optional notification + light interaction channel. Never the system of record.

## Features
`/start` pairing with one-time 6-digit code (10 min TTL) generated in app/hub · daily reminder of today's plan (counts only) · due-review count · exam countdown · teacher announcements (generic) · "new feedback available" ping · `/stop` unlink + delete data.

## Forbidden content in bot messages
grades with names, answers, teacher comments, psych/check-in data, safety reports, photos of student work, tokens.

## Deployment & network
Runs as a separate service next to the hub (or central server) with outbound access to `api.telegram.org`. Config:
```
TG_BOT_TOKEN=...            # secret store, never in repo
TG_MODE=polling|webhook
TG_WEBHOOK_URL=https://...  # webhook only; with secret_token header check
TG_OUTBOUND_PROXY=          # optional standard http(s)/socks5 URL for egress, e.g. corporate/network proxy
TG_ALLOWED_UPDATES=message,callback_query
```
Proxy field is a generic egress setting (operator must comply with applicable law; no obfuscation/VPN features in product). If Telegram is unreachable: queue notifications for 24h then drop; core app unaffected.

## Reliability
Dedup by update_id; idempotent handlers; rate limit 1 msg/s per chat; retry with backoff; audit log without message content.
