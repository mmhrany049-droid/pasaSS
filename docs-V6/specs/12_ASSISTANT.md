# 12 — Assistant v2 (AST) — Telegram-bot-style guided assistant, no AI APIs
Owner request: «شبیه بات‌های تلگرام؛ بتوانم یکی‌یکی سؤال‌ها و جواب‌ها را بگردم و به هدفم برسم».
v2 = **guided flows with buttons** (primary) + free-text intent detection (secondary) + local search. Same flow files run in the R4 Telegram adapter unchanged.

## 1. UI (`/assistant` + floating launcher on every screen)
- Chat thread. Bot messages may carry: text (templated), a **card** (numbers/chart thumb), **inline keyboard** (button rows under the message), and a **reply keyboard** (persistent main menu at bottom).
- Every bot message has «⬅️ برگشت» and «🏠 منوی اصلی». Breadcrumb at top («منو › آمادگی آزمون › قلمچی جمعه»).
- Slash commands: `/start` `/menu` `/today` `/log` `/exam` `/review` `/status` `/help` `/search`. Typing `/` shows the list.
- Free text always allowed; if an intent is matched with confidence ≥ 0.6 the matching flow starts, else «منظورت کدام بود؟» + top 4 intents as buttons.
- Keyboard: number keys 1–9 press the n-th button; Esc = back.

## 2. Main menu (reply keyboard, 2 columns)
📝 ثبت تست سریع · 📅 امروز چی کار کنم؟ · 🎯 آمادگی آزمون · 🔁 مرور امروز · 📊 وضعیت من · 🧭 مشاور مطالعه · 🎁 پاداش و ماموریت · 🔎 جستجو · ❓ راهنمای برنامه

## 3. Flow DSL (`src/assistant/flows/*.json`, schema `schemas/assistant_flow.schema.json`)
```
Flow  = { id, version, title_fa, entry: NodeId, nodes: { [NodeId]: Node } }
Node  = { type: "message"|"menu"|"ask"|"action"|"card"|"end",
          text_fa?: Template,             // {{slot}} placeholders, Persian digits on render
          buttons?: Button[][],           // rows
          ask?: { slot, input: "number"|"text"|"choice"|"date"|"answerString", validate?, choicesFrom? },
          action?: { handler, args, saveAs? },   // calls domain/engine; result stored in slot
          next?: NodeId | Branch[] }
Button = { label_fa, next?: NodeId, flow?: FlowId, set?: {slot: value}, deepLink?: Route }
Branch = { if: Expr, next: NodeId }       // Expr over slots: ==, <, >, &&, ||, exists()
```
- `choicesFrom` = dynamic buttons from a handler (e.g. subjects, books of subject, suggested ranges, upcoming exams).
- Conversation state `{flowId, nodeId, slots, history[]}` persisted per conversation; «ادامه از همان‌جا» after reload.
- Telegram mapping (R4): inline keyboard ↔ `buttons`; `callback_data = flowId:nodeId:buttonIndex` (≤ 64 bytes); reply keyboard ↔ main menu. Grades/sensitive numbers are replaced by «در برنامه ببین» deep links in TG (ADR-024).

## 4. Required flows (R1)
| Flow | Path |
|---|---|
| `log.quick` | درس (buttons) → کتاب → بازه (buttons: suggested next block / node list / «دستی») → «پاسخ‌ها را پشت هم بفرست: مثل 3140221…» (`answerString`, length validated) → زمان (chips) → result card + «تحلیل خطا الان/بعداً». Uses the same service as spec 20. |
| `today` | energy? (۱–۵ buttons, skippable) → top 3 activities + due reviews with «شروع» buttons → «جابه‌جا کن» / «کوچکش کن» |
| `exam.prep` | pick exam → readiness card (RI + P10/50/90 per subject) → buttons: «نزده‌ها» «نخوانده‌ها» «در حال فراموشی» «استراتژی سر جلسه» «برنامه آمادگی بریز» → each opens list card with actions |
| `review` | due count → card-by-card review inside chat (again/hard/good/easy buttons) |
| `status` | weekly KPIs → «چرا افت کردم؟» (insights spec 23) / «نشتی درصدم کجاست؟» / «بهترین ساعتم؟» |
| `coach` | Q&A decision tree (§5) |
| `rewards` | coins, active quests, shop items with «خرید» buttons |
| `search` | query → results grouped: راهنما / مشاور / مباحث کتاب‌ها / تسک‌های برنامه |
| `replan` | «امروز نرسیدم» → unfinished items → move proposals |
| `procrastination` | spec 11 helper as a flow |
| `onboarding` | first run: pick books, school pace, exam dates, availability, optional profile questionnaires |

## 5. Coach knowledge base (مشاور مطالعه) `src/assistant/kb/coach.fa.json`
Decision trees over problem areas: تمرکز · اهمال‌کاری · اضطراب امتحان · فراموشی · کمبود وقت · افت درصد · بی‌انگیزگی · خواب و انرژی · تست‌زنی و حدس · مرور. Each tree asks 2–4 diagnostic questions (buttons), then returns an **advice card**: one evidence-based technique, how to do it in SS (action button that creates an activity/setting), and a source line (e.g., «منبع: Yang et al., 2021, Psychological Bulletin»). Entries carry `evidenceLevel: meta-analysis | RCT | expert`. Content rules: no diagnosis; anxiety/sleep trees always end with the safety pathway check and «اگر ادامه داشت با مشاور مدرسه حرف بزن».

## 6. Proactive messages (in-app only in R1)
Morning brief, evening wrap-up, exam countdown (7/3/1 days), open error tasks. Max 2/day, quiet hours, each type toggleable; send time chosen by spec 22 (`startNudge`).

## 7. Rules (unchanged + new)
- Never fabricate numbers: every number comes from a handler result; if data is insufficient say so + what to log.
- Safety lexicon check runs on every free-text input before intent detection.
- Persian normalization as v1 (ي→ی, ك→ک, tatweel/diacritics removal, ZWNJ unify, digits).
- Logs local and clearable. R4 optional self-hosted LLM may only rephrase handler output.

## Acceptance
- AST-1 «امروز چی بخونم؟» starts `today` flow and returns plan items with reasons.
- AST-2 Unknown query shows 4 intent buttons, no invented numbers.
- AST-3 `log.quick` with answer string of wrong length shows validation and re-asks.
- AST-4 Back/home buttons work at every node; state resumes after reload.
- AST-5 Every flow JSON validates against schema; CI renders every node once (no dead ends).
- AST-6 Coach advice cards always include a source line.
