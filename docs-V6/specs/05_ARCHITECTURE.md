# 05 — Architecture

## Layers
```
Presentation  (React, RTL, charts, bubble sheet, calendar)       src/ui, src/features/*
Application   (commands, validation, undo, import/export)        src/app
Domain        (TKS VKS MTS EXS MRS PAAS PLN RWD PSY AST)         src/domain/*
Engine        (pure functions: scoring, aggregation, mastery,    src/engine/*
               prediction, review, planning, bkt, graph)          (runs in Worker)
Infrastructure(Dexie db, migrations, PWA, backup, jalali,        src/infra/*
               digits, worker bridge, crypto)
```
Rule: upper layers depend on lower only. `engine/` imports nothing from UI/infra (pure, testable in Node).

## Repository layout
```
ss/
  package.json  vite.config.ts  tsconfig.json  ASSUMPTIONS.md  CHANGELOG.md
  public/fonts/Vazirmatn/*   public/manifest.webmanifest
  seed/*.ssb
  src/
    main.tsx  App.tsx  routes.tsx
    i18n/fa.json
    infra/db/{schema.ts,migrations/*.ts,repositories/*.ts}
    infra/{jalali.ts,digits.ts,backup.ts,crypto.ts,persist.ts,worker.ts,eventBus.ts}
    engine/{scoring.ts,aggregation.ts,coverage.ts,mastery.ts,prediction.ts,
            strategy.ts,similarity.ts,reviewPriority.ts,trend.ts,calibration.ts,
            planner/*.ts,bkt.ts,skillGraph.ts,prng.ts}
    domain/{tks,vks,mts,exs,mrs,dnas,paas,pln,rwd,psy,ast}/*
    features/{dashboard,books,practice,legacy,taught,exams,review,analytics,
              prep,planner,rewards,checkin,assistant,settings}/*
    ui/components/{BubbleSheet,TreeChecklist,KeyPad,JalaliDatePicker,Countdown,
                   StatCard,ChartBox,Modal,Toast,EmptyState,ReasonPicker,ExplainPopover}
  tests/{unit,property,e2e,vectors}
  tools/ci/no-remote-ai-check.mjs
```

## Domain event bus (in-process, typed)
| Event | Payload | Emitted by | Invalidates / triggers |
|---|---|---|---|
| `book.changed` | bookId | TKS | DNAS, PAAS caches; re-correct U attempts |
| `key.changed` | bookId, questionIds[] | TKS | auto-correction job (U→C/W) |
| `session.saved` | sessionId | VKS | MRS upsert, DNAS, RWD, INT update |
| `attempt.corrected` | attemptIds[] | VKS | MRS, DNAS |
| `taught.changed` | bookId,nodeIds | MTS | DNAS coverage, PAAS warnings |
| `exam.saved` | examId | EXS | DNAS, PAAS calibration, MRS |
| `review.logged` | reviewItemId | MRS | DNAS, RWD |
| `prediction.saved` | examId | PAAS | DNAS calibration chart |
| `plan.input.changed` | — | PLN | mark current proposal stale |
| `plan.approved` | proposalId | PLN | create PlannedActivities |
| `activity.completed` | activityId | PLN | RWD, PLN actual-time learning |
| `checkin.saved` | checkinId | PSY | PLN capacity, safety check |

Events are persisted in `domainEvents` table (append-only, for audit + future sync outbox).

## Caching
Derived results stored in `analyticsCache` keyed by `(kind, scopeKey, inputsHash)`. Any event above deletes matching keys. UI shows a subtle "updating" state; never shows stale data without a badge.

## Worker contract
`engineApi` (Comlink) exposes async functions mirroring `engine/*` signatures. Inputs are plain JSON; never pass Dexie objects.

## Performance budgets
Bubble sheet input latency < 16 ms · correction of 100 questions < 50 ms · dashboard first render < 1.5 s on mid Android with 20k attempts · Monte-Carlo 5000 runs < 300 ms in worker.

## Reserved for R3+ (add now, unused)
Every entity has `ownerId` (local user id), `orgId: null`, `syncState: 'local'`. Do not build sync now.
