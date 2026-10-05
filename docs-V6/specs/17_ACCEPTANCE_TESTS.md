# 17 — Acceptance Tests (Gherkin). Each must be an automated Playwright test.

Feature: Offline
  Scenario: OFF-1 Works without network
    Given the app was loaded once
    And the network is disabled
    When I create a practice session with 20 questions and correct it
    Then results are saved and shown and no network request is attempted

Feature: Books (TKS)
  Scenario: TKS-1 Import seed books
    Given first run
    Then shelf shows "فیزیک ۲ — خیلی سبز" and "شیمی ۲ — مبتکران"
    And Physics 2 has 4 chapters, each section has a theory node and a questions leaf
  Scenario: TKS-2 SSB round trip
    When I edit the tree and switch to SSB tab and back
    Then the tree is identical
  Scenario: TKS-3 Fast key entry
    Given node range 26-60
    When I type "3142231441" with Persian keyboard digits
    Then questions 26..35 get answers 3,1,4,2,2,3,1,4,4,1 and completeness updates
  Scenario: TKS-4 Overlapping ranges rejected
    When I set ranges 1-30 and 25-40 in same scope
    Then error E_RANGE_OVERLAP is shown with node names

Feature: Practice (VKS)
  Scenario: VKS-1 Correction and percent
    Given key known for 1-20
    When I answer 10 correct, 5 wrong, 5 blank
    Then percent shows ۴۱٫۷٪ and counts C10 W5 B5
  Scenario: VKS-2 Uncorrected then auto-correct
    Given questions 21-30 have no key
    When I answer them
    Then they show status U and are excluded from N
    When I later enter their key
    Then they are auto-corrected and stats update
  Scenario: VKS-3 Reason picker
    After correction, «تحلیل خطاها الان / بعداً» is offered; «الان» opens ReasonPicker for W/B, «بعداً» creates ErrorAnalysisTask (v2)
  Scenario: VKS-4 Legacy
    When I record legacy answers
    Then no date is stored and percent is not displayed anywhere for that session
  Scenario: VKS-5 Guess
    When I mark a correct answer as guess
    Then a ReviewItem with origin guessCorrect exists

Feature: Taught (MTS)
  Scenario: MTS-1 Tri-state parent
    When I mark 2 of 4 sections selfStudied
    Then chapter shows partial state and coverage uses only selfStudied/mastered nodes

Feature: Review (MRS)
  Scenario: MRS-1 FSRS scheduling
    Given a wrong answer today
    Then a review is due today; rating good schedules a future due date > today
  Scenario: MRS-2 Priority order
    Then queue order matches reviewPriority.score descending

Feature: Exams (EXS/PAAS)
  Scenario: EXS-1 MCQ exam with sections mapped to topics
  Scenario: EXS-2 Descriptive exam scored out of 20, never converted to percent
  Scenario: EXS-3 Repeat exam shown separately with weight 0.4 in prediction
  Scenario: PAAS-1 Prediction shows P10<=P50<=P90 and warns on untaught topics
  Scenario: PAAS-2 Strategy recommends skipping topics with q<=0.25

Feature: Planner (PLN)
  Scenario: PLN-1 Proposal respects hard blocks and sleep
  Scenario: PLN-2 Overloaded week shows dropped items with reasons and 3 options
  Scenario: PLN-3 Nothing is scheduled until I press approve
  Scenario: PLN-4 Unfinished activities produce move proposals at day end

Feature: Rewards & PSY
  Scenario: RWD-1 No points for raw test volume; daily caps enforced
  Scenario: RWD-2 Rewards can be turned off and disappear from UI
  Scenario: PSY-1 Safety pathway appears on trigger and shows configured numbers
  Scenario: PSY-2 No personality type labels anywhere in UI

Feature: Assistant
  Scenario: AST-1 "امروز چی بخونم؟" returns today's plan items with reasons
  Scenario: AST-2 Unknown query shows intent chips, no invented numbers

Feature: Backup
  Scenario: BAK-1 Export then restore on clean profile reproduces identical counts and analytics
  Scenario: BAK-2 Corrupted backup is rejected with Persian error

Feature: RTL & a11y
  Scenario: A11Y-1 axe has no serious violations on dashboard, practice, review, planner
  Scenario: A11Y-2 Bubble sheet fully operable by keyboard

Feature: Hub (R3, later)  HUB-1 offline teacher edit syncs without duplicates · HUB-2 grade conflict goes to review queue · HUB-3 student cannot see other class
Feature: Telegram (R4, later) TG-1 pairing code expires · TG-2 no grades in messages · TG-3 bot outage does not affect app

Feature: v2 (2026-10-02)
  Scenario: TKS-5 First run shelf also shows "حسابان ۱ — نشر الگو" with 5 chapters
  Scenarios VKS-6..10 (spec 20) · RWD-1..5 (spec 11) · PRF-1..4 (spec 21) · ADP-1..5 (spec 22)
  Scenarios DNAS-1..4 (spec 23) · PAAS-3..7 (spec 24) · AST-1..6 (spec 12)
