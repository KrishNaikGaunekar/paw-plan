# Paw Plan — original behavior spec

Reverse-engineered from `_original-index.html` (6,391 lines, single build labeled
`"May 26 2026 audit-core version"` / `"August 18 2026 upper-division audit fixes"`,
build id `upper-division-waiver-electives-v2`). This is a functional spec for
**reimplementing** the UI cleanly — not a description of the DOM code itself, which we are
intentionally not porting. Ported verbatim: `src/audit/pawplan-audit-core.js` (parsing
logic) and `src/data/agribusiness-catalog.js` (all requirement/catalog data). Everything
below is the behavior the new UI needs to reproduce.

## Degree audit upload

Toolbar's primary action opens a modal with 4-step instructions before the file picker even
opens (this copy is load-bearing — it's the only guidance students get for finding the right
PDF; don't cut it, just restyle it):

1. Go to **MyPack Portal** → click **Degree Audit**
2. Press **Ctrl+P** (Cmd+P on Mac) to open Print
3. Change destination to **"Save as PDF"**
4. Click **Save**, then upload the file

Footnote: "Advanced option: Paw Plan can also attempt to read an unofficial transcript, but
the Degree Audit is recommended."

Pipeline on file select: read PDF via `pdf.js` (worker sourced from the same cdnjs pin as
the main library, `pdf.worker.min.js`) → extract text → `parseAuditText` →
`classifyAuditItems` → `matchItemsToRequirements(classified, codeToSlot)` →
`buildPlanSections`. If the detected planning-start term is ambiguous, a confirmation modal
asks the student to pick between the detected term and "the next term" before building the
plan (see `showPlanningStartConfirmation` / `createPlanFromPlanningAnchor` in the original —
not ported, but the two-choice UX is worth keeping: silently guessing wrong here means a
wrong semester count).

Once an audit is loaded, `<body>` gets a `uploaded-mode` class (keeps the upload button
visible so a user — historically an advisor — can switch students/re-upload quickly) and
autosave "arms" (see Autosave below).

## Autosave (localStorage)

- Key: `pawplan-autosave-v1` (**keep this exact key** — a live user's existing autosaved
  plan must keep working after the rebuild ships).
- Schema (`version: 2`):
  ```
  { plan, transferred, nonDegree, advisorReview, withdrawn, creditBuckets, version, savedAt }
  ```
  `plan` is the array of `{term, courses[]}` semester sections (same shape as
  `DEFAULT_PLAN`). `transferred`/`nonDegree`/`advisorReview`/`withdrawn` are flat course-item
  arrays pulled out of the plan sections. `savedAt` is an ISO timestamp.
- Debounced write: 600ms after the last mutation.
- **Arms only after a real user action** while `uploaded-mode` is active — a fresh visit with
  no upload never silently overwrites a previously saved plan.
- On boot, if a saved plan exists, show a dismissible banner — "You have an autosaved plan
  from `<date>` at `<time>`." with **Restore it** / **Start fresh** buttons. Never
  auto-restore silently.

## Save / Load (explicit, file-based — separate from autosave)

- **Save**: downloads the same `buildSaveData()` JSON shape as autosave, as
  `agbus-degree-plan.json` (via a Blob + temporary `<a download>`). Toast: "Plan saved!"
- **Load**: file picker → `JSON.parse` → validate `data.plan` is an array → apply. Toast
  "Plan loaded successfully!" on success, "Invalid plan file" or "Error reading file: …" on
  failure.
- **Reset**: restores `plan = deep-copy(DEFAULT_PLAN)`, clears transferred/withdrawn/
  non-degree/advisor-review lists AND the undo stack. No confirmation dialog in the original
  — worth adding one in the rebuild since it's destructive and irreversible once the undo
  stack is also cleared.

## Undo

Simple stack, capped at **30 entries**, push a deep copy of the relevant state before every
mutating action (`saveUndo()`). Undo button disables (opacity 0.35) when the stack is empty.

## Transfer Mode

Toggle button. While active, every course chip becomes clickable ("Click to transfer" tooltip
on hover) instead of draggable. Clicking a course (with `units > 0` — orientation/unpicked
placeholders are excluded) removes it from its semester and pushes it onto a flat
`transferredCourses` list, shown in a "Transfer / Test / Prior Credit" section. Restoring a
transferred course drops it back into the first Summer section (or the last section if no
Summer section exists).

## Drag-and-drop planner + prerequisite enforcement

Standard HTML5 DnD (`dragstart`/`dragover`/`drop`), plus a **tap-to-move** fallback for touch
and keyboard users (`.course.tap-selected` → `.semester.tap-eligible` / `.tap-review` — tap a
course, then tap a highlighted semester to place it; a bottom action bar shows the pending
move). The rebuild should treat tap-to-move as the primary accessible path, not an
afterthought — it's already how the original handles keyboard/mobile.

**Pickable ("dashed-border") courses**: any plan slot with a `picker` id (see
`DEFAULT_PLAN` in the data module) renders as a dashed-border chip reading "Click to
choose" / "Click to select course". Clicking opens a searchable modal listing the options
from the matching data table (`SLASH_COURSES[picker]`, or `HUM_COURSES` for `"hum"`,
`SOCSCI_COURSES` for `"socsci"`, `GEP_ELEC_COURSES` for `"gepelec"`, `IDS_COURSES` for
`"ids"`, `TECH_ELECTIVE_LIST` for `"tech"`/prefix-matched for `"depttech"`, or the free-
elective rule for `"free"`). Picking a course replaces the placeholder in place (same slot,
same semester).

**Prerequisite-enforced drag** (`checkPrereqViolation(course, fromSem, toSem)` in the
original — logic, not code, to reproduce):
- Course codes have **equivalence groups** (e.g. `MA 121`/`MA 131`/`MA 141`/
  `"MA 121/131/141"` are the same slot) — `PREREQ_ALT` in the data module.
- Before allowing a move, compute what semester every plan course currently sits in
  (`semOf`), pretending the dragged course has already moved.
- **Own-prereq check**: if any of the moved course's hard prereqs (`PREREQS[code]`) are
  scheduled in the same semester or later, block with *"Advisor review needed: `<prereq>` is
  a prerequisite for `<code>`."* — except:
  - `ARE 336` specifically is framed as a **recommendation**, not a hard block: *"`<prereq>`
    is highly recommended to be taken before ARE 336."*
  - A prereq that's also in `SOFT_PREREQS` for this course gets the friendlier message:
    *"Take MA 121 as early as possible — ARE 301 and ARE 433 depend on it."*
- **Dependent check**: if moving this course would put it at or after a semester where one
  of *its* dependents (a course that lists it as a prereq) is scheduled, block with the
  mirrored message ("`<code>` is a prerequisite for `<dependent>`"), same soft/ARE-336
  exceptions.
- **Difficulty-pair warning** (soft, allows override): warns if `ACC 210` lands in the same
  semester as `EC/ARE 301`, or `ACC 210` with `ST 311`/equivalent — "Heavy load: … is
  challenging. We recommend splitting them across semesters."
- **ARE 490 placement rule**: `ARE 490` (capstone career seminar) must stay within the
  student's **last 3 active coursework semesters** — moving it earlier warns "ARE 490 should
  stay near the end of the plan."
- Blocked drop targets get a `drop-blocked` visual state (red-tinted); allowed hover targets
  get `drop-hover` (green-tinted, dashed border).

## Credit-load rules

- `TARGET_LOAD = 15`, `SOFT_MAX = 17`, `HARD_MAX = 18` credits/semester — used when
  auto-placing a newly-unlocked requirement into a semester: prefer the earliest eligible
  semester that stays ≤17, fall back to ≤18, otherwise fall back to a fixed "year 3" slot.
- Semester header credit total turns red/`over` styling above 18.
- **Natural Science credit gap**: after every plan change, sum credits of items tagged
  natural-science (`cat === 'natsci'` or audit section `'4'`) that aren't
  non-degree/advisor-review. Required = **11 credits** total. If short, inject a synthetic
  "Natural Science Credit Remaining" placeholder course (id `NATSCI_CREDIT_GAP`) showing the
  exact remaining credits, flagged for advisor review. Remove and recompute this placeholder
  on every render so it never goes stale.
- **Total degree credits = 120** (used by What-If scenario math: `remaining = 120 -
  (completed + in-progress)`).

## Minor Explorer

Despite the toolbar button label only mentioning Economics, the underlying data
(`MINORS` in the catalog module) covers **three minors**: Economics, Business
Administration, Environmental Science. Each minor has: `totalCr`, a description, a
`requirements[]` list where each row is either already satisfied by a required AgBus course
(`status: "major"`, 0 extra cost) or genuinely additional (`status: "extra"`, with
`majorNote` suggesting which elective slot it could double up with), `extraCr` (net new
credits beyond the major), a GPA requirement, and free-text `notes` (declare timing,
transfer-credit caps, department contact, etc — Environmental Science's notes include an
advisor email/phone that should stay verbatim). The rebuild should surface all three minors,
not just Economics — this looks like copy that fell behind the data.

## "What-If" scenario planner

Opens a modal computing: completed credits (courses tagged `(Completed)`/`(Test Credit)`/
`(Transfer Credit)` in their name, plus everything in `transferredCourses`), in-progress
credits (tagged `(In Progress)`), and remaining credits (`120 - earned`). Builds a semester
timeline (Fall/Spring only — Summer excluded) with per-semester current credit loads for
every future regular semester, so a student can see what happens to their remaining-credit
distribution under different assumptions (the exact slider/scenario UI wasn't fully traced —
treat the credit-math above as authoritative and design new controls around it, e.g. "graduate
by `<term>`" → shows required credits/semester, or "take `<N>` credits/semester" → shows
projected graduation term).

## Advising Prep (printable summary)

Opens a **separate blob-URL HTML document** (its own inline stylesheet, not the app's), not
a print dialog on the current page. Contents, in order:
1. Banner: title "Advising Prep Sheet — Paw Plan", generation date.
2. Semester grid (2-column) showing each semester's courses and per-semester credit total.
3. **Issues** list (red, left-border card) — currently only "semester over 18 credits"
   (`<term>: <N> credits (over 18 max)`); extend this list rather than replace it.
4. **Unfilled slots** list (blue italic) — any course whose name still starts with "Click"
   (i.e. an un-picked placeholder), with its term.
5. **GEP verify badges** — green "met" / red "unmet" pills for Global Knowledge
   (`VERIFY_GLOBAL_KNOWLEDGE`, ~347 codes) and American Democracy (`VERIFY_AMER_DEMOCRACY`,
   17 codes): met if ANY course anywhere in the plan or transferred list matches a code in
   that list.
6. A blank lined "notes" area for the advisor to write in during the meeting.
- Print stylesheet zeroes page margins to `0.4in` and forces exact color printing for the
  banner.

## Onboarding / welcome content

A `#welcome-card` (first-visit hero) and a collapsible `#instructions-panel` (`<details>`)
carry the explanatory copy — both should become dismissible/collapsible in the rebuild
rather than fixed blocking content, per the redesign brief. A `#restore-banner` (see
Autosave) and a "sample mode" (`body.sample-mode`) exist where the plan section is shown
scaled-down/non-interactive-looking as a preview before a real audit is uploaded — worth
keeping as the "try it before you upload anything" affordance.

## Legend / category colors

`CATEGORIES` (ported in the data module) defines 8 course categories with label + color used
for the colored stripe (`cat-stripe`) on every course chip: Orientation, Comm & Tech, Math
Sciences, Natural Sciences, Dept Core, Tech/Dept Elective, GEP, Free Elective. A collapsible
legend (`<details class="legend-toggle">`) explains these; keep it collapsed by default like
the original.

## Things that looked like bugs or fragile assumptions — don't blindly carry forward

- `_PREREQ_ALT` (data module `PREREQ_ALT`) and the separate inline `altForms()` function in
  `checkPrereqViolation` are **two different, overlapping, hand-maintained equivalence-group
  tables** that must stay in sync by convention only — no shared source of truth. The
  rebuild should collapse these into one table.
- Course-credit defaults to **3** for anything not in `COURSE_CREDITS` (`getCourseCredits`) —
  reasonable default, but silent; consider surfacing "assumed 3 credits" somewhere for a
  code the app doesn't recognize.
- The Minor Explorer toolbar/label only advertises "Economics" even though 3 minors are
  modeled (see above) — likely copy that wasn't updated when Business Administration /
  Environmental Science were added. Fix in the rebuild rather than replicate.
- `DEPT_OR_TECH_PREFIXES` is prefix-based (any course code starting with one of ~50
  three-letter prefixes counts), while `DEPT_VALID_CODES` is an exact-match allowlist used
  alongside it for the same "Dept or Technical Elective" picker — two different matching
  strategies feeding one picker. Worth a single consistent rule going forward, but don't
  change the actual set of allowed courses without advisor sign-off.
- The build carries two goatcounter analytics-style build comments in the HTML
  (`paw-plan-build` meta tags) that look like manual version bookkeeping rather than real
  tooling — replace with normal git history/tags in the rebuild.
- A `goatcounter` analytics script tag (`jtreme.goatcounter.com`) is loaded at the very end
  of the page — confirm with the client whether they want analytics carried over (and if so,
  whether goatcounter specifically, given it's tied to the current site owner's account) or
  dropped/replaced.
