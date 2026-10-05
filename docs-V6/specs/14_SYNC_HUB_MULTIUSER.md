> v4: near-term multi-user is file-based (spec 35/36). This hub design remains the long-term option.

# 14 — Hub, Sync, Multi-user, Schools & Classes (R3) — design only

## Topology
```
Student device (PWA, IndexedDB, outbox)  ─┐
Teacher device                            ├─ School LAN ─ HUB (Fastify + Postgres/SQLite, HTTPS)
Parent device (limited)                  ─┘                 │ (optional, later) ─ Central server
```
Hub runs offline on a school PC/mini-server; LAN-only by default; no public exposure.

## Roles (context-scoped)
student, teacher, assistant, guardian, schoolAdmin, author, reviewer, safetyOfficer, platformAdmin. Permission matrix in `schemas` R3_RoleAssignment; enforced server-side (ABAC: role + context + data class).

## Structures
Organization → School → AcademicPeriod → ClassSection(kind: schoolClass | sharedClass (multi-school) | extracurricular) → Enrollment; Assignment (book ranges/question set, due), Submission (answers), ClassQuestionSet, Discussion (thread per class/assignment, moderated), Project (group work), Announcement, Gradebook (teacher-authoritative).

## Interaction safety
Private classes by default · no adult↔child DMs by default · discussion only inside class/project · report/block · teacher moderation queue · no phone-number discovery · guardians see only approved progress fields.

## Sync protocol (see `api/hub_sync.openapi.yaml`)
- Push: batch of `SyncOperation{operationId, entity, entityId, op, baseVersion, deviceId, payload}`; server idempotent on operationId.
- Pull: `cursor` → changes + tombstones + new cursor, scoped to user's contexts.
- Conflicts: attempts/events append-only; personal notes merge; grades/roles/membership server-authoritative; drafts keep both versions; published content immutable.
- Device enrollment with one-time code shown by teacher/admin; tokens short-lived; revocation list.
- UI sync states: local / pending / synced / stale / conflict.

## What changes in client for R3
Add auth + device key, map `ownerId`→real userId, enable outbox from `domainEvents`, add class features. No changes to engines.
