# 29 — Specified Future Features (v3) — closes A-27..A-30 (scheduled, not R1-blocking)

## F1 Answer-sheet photo reading (OCR-MCQ) — R1.5
On-device: OpenCV.js (WASM). Pipeline: detect 4 corner markers → perspective warp → grid from template (Ghalamchi-style 10-row columns, user-calibrated once per sheet type) → fill ratio per bubble (dark pixels in circle) → chosen = argmax if ratio ≥ 0.45 and ≥ 1.6× second, else «مبهم» flagged for manual check. Never auto-saves: shows filled BubbleSheet for confirmation. Accuracy gate: ≥ 99% on 30-sheet test set before enabling by default. No upload.

## F2 Visual mistake notebook — R1.5
Attach photo/crop to a ReviewItem (WebP ≤ 200 KB); review card shows image; tags; export notebook PDF per chapter locally. Copyright: personal use only, not shareable (ADR mirrors spec 16).

## F3 Focus timer — R1
Pomodoro-like (length from adaptation arm), distraction tap-counter («حواسم پرت شد»), auto-fills session time (`timeSource = timer`), feeds fatigue model. No app blocking.

## F4 Rank / تراز estimation — R2
Only when user enters ≥ 3 official report cards (percent → تراز → rank pairs per organizer). Model: monotone interpolation (PCHIP) per organizer & subject on user's own report pairs + optional public conversion tables imported as data with source. Output interval, never a single rank; label «تخمینی».

## F5 Parent summary view — R3
Weekly summary card export (adherence, minutes, readiness) chosen by student; no profile/D3/D4.

## F6 Study group mock exams — R3
Shared blueprint + simultaneous timer via LAN hub; only own results visible; no leaderboard.
