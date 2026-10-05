# 06 — Domain Model
Machine-readable definitions: `schemas/entities.schema.json` (JSON Schema 2020-12). This file explains rules not expressible in schema.

## Common fields (all entities)
`id` (UUID v7), `createdAt`, `updatedAt` (ISO UTC), `dataVersion` (int), `archived` (bool), `ownerId`, `orgId` (null in R1), `syncState` ('local').

## Dexie tables and indexes (R1)
```
subjects:        id, order, group
books:           id, subjectId, archived
nodes:           id, bookId, parentId, [bookId+order], kind
questions:       id, bookId, nodeId, [bookId+number]
sessions:        id, bookId, kind, localDate
attempts:        id, sourceId, questionRef, bookId, nodeId, [questionRef+attemptIndex], localDate, result
taughtStates:    [bookId+nodeId], state
taughtEvents:    id, [bookId+nodeId], at
exams:           id, status, solarDate, organizer
examAttempts:    id, examId, isRepeat
reviewItems:     id, questionRef, due, state
reviewLogs:      id, reviewItemId, at
reasons:         id, order
goals:           id, deadline, status
availability:    id, weekday, kind
proposals:       id, weekStart, status
activities:      id, proposalId, localDate, status
rewardEvents:    id, at, kind
checkins:        id, localDate
questionnaireResponses: id, instrumentId, at
skills:          id, bookId|subjectId
skillEdges:      id, from, to, type
skillStates:     skillId
assistantLogs:   id, at          (local only, user can clear)
domainEvents:    ++seq, name, at
analyticsCache:  key
settings:        key
images:          id, ownerType, ownerId
// v2 (dataVersion 2, migration adds tables + Session.timeSource='timer' if durationSec else 'none')
sessionDrafts:   id
errorTasks:      id, sessionId, status, localDate
coinTx:          id, at, kind
rewardItems:     id, active
quests:          id, [scope+localDate], status
badges:          [bookId+nodeId], tier
records:         id, kind
behaviorSignals: signal, computedAt
traitScores:     id, instrumentId, trait
adaptArms:       [decision+arm+bucket]
adaptDecisions:  id, decision, at
blueprints:      id, examId, organizer
readiness:       id, examId, at
insights:        id, weekStart, templateId
conversations:   id, flowId
```

## Key invariants
1. A question belongs to exactly one leaf-capable node (`topic`, `mixed`, `checkup`, `comprehensive`, `final`). Never to `theory`.
2. Node `qStart..qEnd` ranges within the same numbering scope must not overlap (validation error `E_RANGE_OVERLAP`).
3. `Attempt.result` is derived from `chosen` and `Question.answer`: chosen=0 → B; answer null → U; chosen==answer → C; else W. Recomputed on `key.changed`.
4. `attemptIndex` = 1 + count of earlier attempts on the same `questionRef` (by `at`, legacy first).
5. Legacy sessions: `localDate=null`, percent never displayed, included in coverage & mastery with weight 0.3.
6. Deleting a session deletes its attempts and recomputes ReviewItems (soft delete with undo for 10 s).
7. TaughtState of a parent = tri-state derived from children (all/none/some); checking a parent writes children.
8. Exam sections reference `{bookId,nodeIds[]}[]` (one section may span books) or free `topicLabels[]` for external exams.
9. Descriptive (تشریحی) exam: score out of `maxScore` (default 20), per-question rubric scores; never converted to MCQ percent; analytics show `score/maxScore`.
10. ReviewItem is created when an attempt is W, B, or (C and isGuess), or user marks `important`. One ReviewItem per questionRef.

## State machines
- ReviewItem: `new → learning → review ↔ relearning → mastered` (mastered when FSRS stability ≥ 60 d and last 2 reviews Good/Easy). `suspended` from any state by user.
- Exam: `upcoming → taken (results pending) → graded`; `repeat` attempts attach to graded exam.
- Proposal: `draft → approved | discarded`; approved becomes `active`; when inputs change → `stale` (user prompted to regenerate).
- Activity: `planned → inProgress → done | partial | skipped | moved`.
- Goal: `active → achieved | missed | archived`.
