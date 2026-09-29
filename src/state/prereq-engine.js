// Prerequisite-enforcement rules for the drag-and-drop / tap-to-move planner.
//
// This is a clean reimplementation of the original `checkPrereqViolation` behavior
// (see NOTES-original-behavior.md), not a line-for-line port — the original DOM code
// wasn't ported per the redesign plan. It intentionally collapses the original's two
// separate, hand-maintained equivalence tables (`_PREREQ_ALT` and an inline `altForms()`)
// into ONE index built from `PREREQ_ALT` + `SLOT_ID_TO_COMBINED_LABEL`, per the "fragile
// assumptions" note — do not reintroduce a second table without a reason.

import {
  PREREQS,
  SOFT_PREREQS,
  PREREQ_ALT,
  SLOT_ID_TO_COMBINED_LABEL,
} from '../data/agribusiness-catalog.js';

const ARE_336 = 'ARE 336';

// code (any alt-form, including a DEFAULT_PLAN slot id) -> canonical PREREQS/SOFT_PREREQS key.
let altIndexCache = null;
function buildAltIndex() {
  if (altIndexCache) return altIndexCache;
  const index = new Map();
  const add = (canonical, form) => {
    if (!index.has(form)) index.set(form, canonical);
  };
  Object.entries(PREREQ_ALT).forEach(([canonical, forms]) => {
    add(canonical, canonical);
    forms.forEach((f) => add(canonical, f));
  });
  // Slot ids (e.g. "MA121") resolve to the same combined label PREREQS is keyed by.
  Object.entries(SLOT_ID_TO_COMBINED_LABEL).forEach(([slotId, combinedLabel]) => {
    add(combinedLabel, slotId);
    add(combinedLabel, combinedLabel);
  });
  altIndexCache = index;
  return index;
}

// Resolve any code/slot-id string to the canonical key PREREQS/SOFT_PREREQS use, falling
// back to the string itself (most course codes aren't part of an equivalence group).
export function canonicalCode(code) {
  return buildAltIndex().get(code) || code;
}

// True if `code` (any alt-form) is "the same slot" as `canonical` (a PREREQS-key form).
function matchesCanonical(code, canonical) {
  return canonicalCode(code) === canonicalCode(canonical);
}

const SEASON_RANK = { Fall: 0, Spring: 1, Summer: 2 };

// Chronological rank for a DEFAULT_PLAN term label. Special buckets (Completed NC State
// Courses / Transfer.../ In Progress...) are already "in the past" relative to any
// schedulable semester, so they rank below everything.
export function termRank(term) {
  const m = String(term || '').match(/(Fall|Spring|Summer)[^Y]*Year\s*(\d)/i);
  if (!m) return -1;
  const year = parseInt(m[2], 10);
  const season = SEASON_RANK[m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()] ?? 0;
  return year * 3 + season;
}

export function isSchedulableTerm(term) {
  return termRank(term) >= 0;
}

// Map every course code currently in the plan to the rank of the semester it's in,
// substituting `overrideCode`'s semester with `overrideRank` (used to evaluate a
// not-yet-committed drag/tap move before it's applied).
function buildSemOf(plan, overrideCode, overrideRank) {
  const semOf = new Map();
  plan.forEach((section) => {
    const rank = termRank(section.term);
    section.courses.forEach((c) => {
      if (!c.code || c.name?.startsWith('Click')) return;
      const canon = canonicalCode(c.code);
      const effectiveRank = overrideCode && matchesCanonical(c.code, overrideCode) ? overrideRank : rank;
      const existing = semOf.get(canon);
      // A course can appear via more than one alt-form entry point; keep the earliest.
      if (existing === undefined || effectiveRank < existing) semOf.set(canon, effectiveRank);
    });
  });
  return semOf;
}

function findDependents(canonicalPrereqCode) {
  return Object.entries(PREREQS)
    .filter(([, prereqs]) => prereqs.some((p) => matchesCanonical(p, canonicalPrereqCode)))
    .map(([dependentCode]) => dependentCode);
}

/**
 * Evaluate whether moving `course` (a plan-course item, must have `.code`) into
 * `toTerm` should be blocked, warned, or allowed.
 *
 * Returns { level: 'block'|'warn'|'ok', messages: string[] }. `block` should prevent
 * the drop; `warn` should allow it with a visible confirmation/toast.
 */
export function checkPrereqViolation(course, toTerm, plan) {
  const toRank = termRank(toTerm);
  const messages = [];
  let level = 'ok';

  const escalate = (newLevel) => {
    if (newLevel === 'block') level = 'block';
    else if (newLevel === 'warn' && level !== 'block') level = 'warn';
  };

  const canonSelf = canonicalCode(course.code);
  const semOf = buildSemOf(plan, course.code, toRank);

  // --- Own-prereq check: are this course's prereqs satisfied by `toRank`? ---
  const ownPrereqs = PREREQS[canonSelf] || [];
  ownPrereqs.forEach((prereqCode) => {
    const canonPrereq = canonicalCode(prereqCode);
    const prereqRank = semOf.get(canonPrereq);
    const satisfied = prereqRank !== undefined && prereqRank < toRank;
    if (satisfied) return;

    const isSoft = (SOFT_PREREQS[canonSelf] || []).some((p) => matchesCanonical(p, canonPrereq));
    if (canonSelf === ARE_336) {
      messages.push(`${prereqCode} is highly recommended to be taken before ARE 336.`);
      escalate('warn');
    } else if (isSoft) {
      messages.push(`Take ${prereqCode} as early as possible — courses later in the plan depend on it.`);
      escalate('warn');
    } else {
      messages.push(`Advisor review needed: ${prereqCode} is a prerequisite for ${course.code}.`);
      escalate('block');
    }
  });

  // --- Dependent check: would this move push a dependent's prereq too late? ---
  const dependents = findDependents(canonSelf);
  dependents.forEach((dependentCode) => {
    const depRank = semOf.get(canonicalCode(dependentCode));
    if (depRank === undefined) return; // dependent isn't placed yet — nothing to violate
    if (toRank < depRank) return; // still satisfied

    const isSoft = (SOFT_PREREQS[dependentCode] || []).some((p) => matchesCanonical(p, canonSelf));
    if (canonicalCode(dependentCode) === ARE_336) {
      messages.push(`${course.code} is highly recommended to be taken before ARE 336.`);
      escalate('warn');
    } else if (isSoft) {
      messages.push(`Take ${course.code} as early as possible — ${dependentCode} depends on it.`);
      escalate('warn');
    } else {
      messages.push(`Advisor review needed: ${course.code} is a prerequisite for ${dependentCode}.`);
      escalate('block');
    }
  });

  // --- Difficulty-pair warning (soft, always allows override) ---
  const DIFFICULT_PAIRS = [
    ['ACC 210', 'EC/ARE 301'],
    ['ACC 210', 'ST 311, BUS 350 or ST 350'],
  ];
  const targetSection = plan.find((s) => s.term === toTerm);
  DIFFICULT_PAIRS.forEach(([a, b]) => {
    const isA = matchesCanonical(course.code, a);
    const isB = matchesCanonical(course.code, b);
    if (!isA && !isB) return;
    const otherCode = isA ? b : a;
    const hasOther = (targetSection?.courses || []).some((c) => matchesCanonical(c.code, otherCode));
    if (hasOther) {
      messages.push(`Heavy load: ${a} and ${b} together is challenging. We recommend splitting them across semesters.`);
      escalate('warn');
    }
  });

  // --- ARE 490 placement rule ---
  if (canonSelf === canonicalCode('ARE 490')) {
    const activeRanks = plan
      .filter((s) => isSchedulableTerm(s.term) && s.courses.some((c) => c.code && !c.name?.startsWith('Click')))
      .map((s) => termRank(s.term))
      .sort((a, b) => a - b);
    const lastThreeStart = activeRanks[Math.max(0, activeRanks.length - 3)];
    if (lastThreeStart !== undefined && toRank < lastThreeStart) {
      messages.push('ARE 490 should stay near the end of the plan.');
      escalate('warn');
    }
  }

  return { level, messages };
}
