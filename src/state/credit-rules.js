// Credit-load math: semester totals, the Natural Science credit-gap placeholder,
// GEP "verify" badges, and the completed/in-progress/remaining figures used by the
// What-If planner. See NOTES-original-behavior.md "Credit-load rules" / "What-If".

import {
  getCourseCredits,
  TARGET_LOAD,
  SOFT_MAX,
  HARD_MAX,
  TOTAL_DEGREE_CREDITS,
  VERIFY_GLOBAL_KNOWLEDGE,
  VERIFY_AMER_DEMOCRACY,
} from '../data/agribusiness-catalog.js';
import { calculateNaturalScienceCreditGap } from '../audit/pawplan-audit-core.js';
import { termRank, isSchedulableTerm } from './prereq-engine.js';

export { TARGET_LOAD, SOFT_MAX, HARD_MAX, TOTAL_DEGREE_CREDITS };

export const NATSCI_CREDIT_GAP_ID = 'NATSCI_CREDIT_GAP';

export function resolveCredits(course) {
  if (!course) return 0;
  if (typeof course.units === 'number' && course.units > 0) return course.units;
  return getCourseCredits(course.code);
}

export function semesterCreditTotal(section) {
  return (section?.courses || []).reduce((sum, c) => sum + resolveCredits(c), 0);
}

export function isSemesterOverLimit(section) {
  return semesterCreditTotal(section) > HARD_MAX;
}

function allPlanCourses(state) {
  const fromPlan = state.plan.flatMap((s) => s.courses.map((c) => ({ ...c, term: s.term })));
  const fromTransferred = (state.transferred || []).map((c) => ({ ...c, term: 'Transfer / Test / Prior Credit' }));
  return fromPlan.concat(fromTransferred);
}

/**
 * Recompute the synthetic "Natural Science Credit Remaining" placeholder and return a
 * NEW plan array with it inserted/removed/updated in the first schedulable semester
 * that still has room, or the natural-science home semester if already present.
 * Call this after every plan mutation so the placeholder never goes stale.
 */
export function reconcileNaturalScienceGap(state) {
  const items = allPlanCourses(state).filter((c) => c.id !== NATSCI_CREDIT_GAP_ID);
  const { gap } = calculateNaturalScienceCreditGap(items);

  const plan = state.plan.map((section) => ({
    ...section,
    courses: section.courses.filter((c) => c.id !== NATSCI_CREDIT_GAP_ID),
  }));

  if (gap <= 0) return plan;

  // Prefer the first schedulable semester whose credit load stays <= SOFT_MAX after
  // adding the gap; fall back to the first schedulable semester at all.
  let target =
    plan.find((s) => isSchedulableTerm(s.term) && semesterCreditTotal(s) + gap <= SOFT_MAX) ||
    plan.find((s) => isSchedulableTerm(s.term));
  if (!target) return plan;

  target.courses = [
    ...target.courses,
    {
      id: NATSCI_CREDIT_GAP_ID,
      code: 'Natural Science Credit Remaining',
      name: `${gap} credit${gap === 1 ? '' : 's'} still needed — advisor review`,
      units: gap,
      cat: 'natsci',
      advisorReviewFlag: true,
      synthetic: true,
    },
  ];
  return plan;
}

function isEarnedByTag(course) {
  const name = String(course?.name || '');
  return /\((Completed|Test Credit|Transfer Credit)\)/.test(name) || course?.classification === 'completed_nc_state' || course?.classification === 'transfer_posted';
}

function isInProgressByTag(course) {
  const name = String(course?.name || '');
  return /\(In Progress\)/.test(name) || course?.classification === 'planned_current';
}

export function computeWhatIf(state) {
  const items = allPlanCourses(state);
  const completed = items.filter(isEarnedByTag).reduce((sum, c) => sum + resolveCredits(c), 0);
  const inProgress = items.filter(isInProgressByTag).reduce((sum, c) => sum + resolveCredits(c), 0);
  const remaining = Math.max(0, TOTAL_DEGREE_CREDITS - completed - inProgress);

  // Fall/Spring-only timeline of future regular semesters with their current loads.
  const timeline = state.plan
    .filter((s) => isSchedulableTerm(s.term) && !/Summer/i.test(s.term))
    .map((s) => ({ term: s.term, rank: termRank(s.term), credits: semesterCreditTotal(s) }))
    .sort((a, b) => a.rank - b.rank);

  return { completed, inProgress, remaining, timeline };
}

/**
 * The header's 4-box credit summary (Total Required / Planned / Avg per Sem /
 * Transferred), matching the original's `updateTotals()` bucketing exactly:
 * completed + posted-transfer credits count as "applied", everything else that
 * isn't an unpicked placeholder counts as "planned," and Planned = applied + planned
 * (the label is a little confusing but that's what the original showed).
 *
 * Once an audit is loaded, unpicked "Click to choose" slots DO count: the future plan
 * is built from exactly the requirements the audit says are left, so each slot is
 * real remaining credit. Avg/Sem is the future credit load per future Fall/Spring term.
 */
export function computeCreditSummary(state) {
  let applied = 0;
  let planned = 0;
  let transferredTotal = 0;
  let futureCredits = 0;
  const futureTerms = new Set();

  state.plan.forEach((section) => {
    section.courses.forEach((c) => {
      if (c.synthetic) return; // the natsci-gap placeholder isn't real applied/planned credit
      const units = resolveCredits(c);
      const isPlaceholder = String(c.name || '').startsWith('Click');
      if (c.classification === 'completed_nc_state' || c.classification === 'transfer_posted') {
        applied += units;
        if (c.classification === 'transfer_posted') transferredTotal += units;
        return;
      }
      if (c.classification === 'planned_current') {
        planned += units;
        return;
      }
      if (isPlaceholder && !state.uploadedMode) return;
      planned += units;
      if (isSchedulableTerm(section.term)) {
        futureCredits += units;
        if (!/Summer/i.test(section.term)) futureTerms.add(section.term);
      }
    });
  });
  (state.transferred || []).forEach((c) => {
    const units = resolveCredits(c);
    applied += units;
    transferredTotal += units;
  });

  const regularSemesters = state.plan.filter((s) => isSchedulableTerm(s.term) && !/Summer/i.test(s.term)).length;
  const avgPerSem = state.uploadedMode
    ? futureTerms.size > 0 ? Math.round(futureCredits / futureTerms.size) : 0
    : regularSemesters > 0 ? Math.round(planned / regularSemesters) : 0;

  return {
    totalRequired: TOTAL_DEGREE_CREDITS,
    planned: applied + planned,
    avgPerSem,
    transferred: transferredTotal,
  };
}

export function verifyGEP(state) {
  const codes = new Set(allPlanCourses(state).map((c) => c.code).filter(Boolean));
  const hasAny = (list) => list.some((code) => codes.has(code));
  return {
    globalKnowledge: hasAny(VERIFY_GLOBAL_KNOWLEDGE),
    americanDemocracy: hasAny(VERIFY_AMER_DEMOCRACY),
  };
}
