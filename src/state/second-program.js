// Second major / second degree audit support.
//
// A student can add a second program in two ways:
//   1. pick a second major from DOUBLE_MAJORS (catalog data), or
//   2. upload another MyPack degree audit (e.g. the audit for their second major,
//      or a What-If audit for a major they're considering).
// Both end up as course chips tagged `program: 'major2'` (category "major2") merged
// into the existing plan. Courses the plan already has (by canonical code) are never
// added twice — that overlap is exactly what makes a double major affordable.
//
// Pure: no DOM, so it can be exercised from Node.

import { TAKEN_TERM, IN_PROGRESS_TERM, HARD_MAX, PREREQS } from '../data/agribusiness-catalog.js';
import { canonicalCode, isSchedulableTerm, termRank } from './prereq-engine.js';

export const SECOND_PROGRAM_TAG = 'major2';

// Audit requirement groups every NC State degree shares; the first degree already plans them.
const UNIVERSITY_WIDE = /Humanities|Social Science|HES\b|Health|Fitness|Interdisc|GEP|General Education|Free Elective|Global Knowledge|American Democracy|World Language|Foreign Language|Writing|Degree Units/i;

function credits(section) {
  return section.courses.reduce((n, c) => n + (c.units || 0), 0);
}

/** Every canonical course code anywhere in the plan (taken, in progress, planned). */
export function planCodes(plan, transferred = []) {
  const codes = new Set();
  const add = (code) => {
    String(code || '')
      .split(/\s*(?:\/|,|\bor\b)\s*/i)
      .forEach((part) => part && codes.add(canonicalCode(part)));
    codes.add(canonicalCode(code));
  };
  // An unchosen "Click to choose" slot lists every option in its code ("ST 311, BUS 350 or
  // ST 350"); it hasn't satisfied any of them yet, so it doesn't count.
  plan.forEach((s) => s.courses.forEach((c) => !String(c.name || '').startsWith('Click') && add(c.code)));
  transferred.forEach((c) => add(c.code));
  return codes;
}

/** Codes offered by still-unchosen "Click to choose" slots, e.g. MA 114 in "MA 114, 231 or 241". */
export function pickableCodes(plan) {
  const codes = new Set();
  plan.forEach((s) =>
    s.courses.forEach((c) => {
      if (!String(c.name || '').startsWith('Click')) return;
      // "MA 114, 231 or 241" -> MA 114, MA 231, MA 241 (bare numbers reuse the last prefix)
      let prefix = '';
      String(c.code || '')
        .split(/\s*(?:\/|,|\bor\b)\s*/i)
        .forEach((part) => {
          const m = part.trim().match(/^([A-Z]{1,5})?\s*(\d{3})/);
          if (!m) return;
          if (m[1]) prefix = m[1];
          if (prefix) codes.add(canonicalCode(`${prefix} ${m[2]}`));
        });
    }),
  );
  return codes;
}

/** Drop every chip a previous second program added. */
export function stripSecondProgram(plan) {
  return plan.map((s) => ({ ...s, courses: s.courses.filter((c) => c.program !== SECOND_PROGRAM_TAG) }));
}

function nextRegularTerm(term) {
  const real = String(term).match(/^(Spring|Fall)\s+(\d{4})$/);
  if (real) return real[1] === 'Fall' ? `Spring ${+real[2] + 1}` : `Fall ${real[2]}`;
  const rel = String(term).match(/^(Spring|Fall)\s+—\s+Year\s+(\d+)$/);
  if (rel) return rel[1] === 'Fall' ? `Spring — Year ${rel[2]}` : `Fall — Year ${+rel[2] + 1}`;
  return null;
}

/**
 * Place slots into the plan's future Fall/Spring semesters without going over HARD_MAX
 * (double majors routinely carry 18 credits),
 * putting a course after any of its prerequisites already placed in the plan. Adds new
 * semesters at the end when the existing ones are full.
 */
export function placeSlots(plan, slots) {
  const out = plan.map((s) => ({ ...s, courses: [...s.courses] }));
  const regular = () =>
    out
      .filter((s) => isSchedulableTerm(s.term) && !/Summer/i.test(s.term))
      .sort((a, b) => termRank(a.term) - termRank(b.term));

  const rankOf = new Map();
  out.forEach((s) => s.courses.forEach((c) => rankOf.set(canonicalCode(c.code), termRank(s.term))));

  // On the blank 4-year template ("Fall — Year 1"…), 300+ level courses don't go in
  // Year 1. Audit plans already start at the student's next term, so no floor there.
  const template = regular().some((s) => /Year\s*\d/.test(s.term));
  const yearTwoRank = template ? termRank(regular()[2]?.term) : -1;

  slots.forEach((slot) => {
    const level = slot.level ?? parseInt(String(slot.code).match(/\b(\d)\d{2}\b/)?.[1] || '0', 10);
    // A lab goes in the same semester as (or after) its lecture.
    const coreqRank = Math.max(-1, ...(slot.coreqs || []).map((c) => rankOf.get(canonicalCode(c)) ?? -1));
    const prereqRank = Math.max(
      coreqRank - 1,
      level >= 3 ? yearTwoRank - 1 : -1,
      ...[...(PREREQS[canonicalCode(slot.code)] || []), ...(slot.prereqs || [])].map((p) => rankOf.get(canonicalCode(p)) ?? -1),
    );
    let target = regular().find((s) => termRank(s.term) > prereqRank && credits(s) + (slot.units || 0) <= HARD_MAX);
    if (!target) {
      const terms = regular();
      const last = terms[terms.length - 1];
      const label = last ? nextRegularTerm(last.term) : null;
      if (!label) {
        target = terms[0] || out[0];
      } else {
        target = { term: label, courses: [] };
        // New semesters go right before the fixed Taken / In Progress sections.
        const fixedIdx = out.findIndex((s) => s.term === TAKEN_TERM || s.term === IN_PROGRESS_TERM);
        out.splice(fixedIdx === -1 ? out.length : fixedIdx, 0, target);
      }
    }
    target.courses.push(slot);
    rankOf.set(canonicalCode(slot.code), termRank(target.term));
  });
  return out;
}

/** Course level (1-5) of a requirement: its own code, else the lowest of its options. */
function levelOf(req) {
  const lv = (code) => parseInt(String(code).match(/\b(\d)\d{2}\b/)?.[1] || '0', 10);
  if (lv(req.code)) return lv(req.code);
  const opts = (req.options || []).map(lv).filter(Boolean);
  return opts.length ? Math.min(...opts) : 0;
}

/**
 * Turn a DOUBLE_MAJORS entry into chips. Requirements already satisfied by the plan
 * (any code in `alts` present) are reported as shared, not added.
 * @returns {{ slots: object[], shared: object[], pickInPlan: {req, pick}[] }}
 */
export function slotsForCatalogMajor(majorName, major, existingCodes, pickable = new Set()) {
  const slots = [];
  const shared = [];
  const pickInPlan = [];
  major.requirements.forEach((req, i) => {
    const alts = req.alts?.length ? req.alts : [req.code];
    if (alts.some((a) => existingCodes.has(canonicalCode(a)))) {
      shared.push(req);
      return;
    }
    // The plan has an open slot that offers this course: choosing it there covers both majors.
    const pick = alts.find((a) => pickable.has(canonicalCode(a)));
    if (pick) {
      pickInPlan.push({ req, pick });
      return;
    }
    const isChoice = !!req.options?.length;
    slots.push({
      id: `M2-${i}`,
      code: req.code,
      name: isChoice ? 'Click to choose' : req.note,
      units: req.cr,
      cat: SECOND_PROGRAM_TAG,
      program: SECOND_PROGRAM_TAG,
      programName: majorName,
      ...(req.prereqs ? { prereqs: req.prereqs } : {}),
      ...(req.coreqs ? { coreqs: req.coreqs } : {}),
      level: req.level ?? levelOf(req),
      ...(isChoice ? { picker: 'program2', pickerOptions: req.options.map((c) => ({ c, n: req.note })) } : {}),
    });
  });
  return { slots, shared, pickInPlan };
}

/**
 * Merge a second classified audit (classifyAuditRows output) into the plan:
 *   - completed / enrolled courses the plan doesn't already show are added to the
 *     Taken / In Progress sections;
 *   - unmet requirements the plan doesn't already cover become 2nd-program chips.
 * @returns {{ plan: object[], added: number, shared: number, newHistory: number }}
 */
export function mergeSecondAudit(plan, transferred, classified, programName, toHistoryChip) {
  let out = stripSecondProgram(plan);
  const existing = planCodes(out, transferred);

  const addHistory = (term, list, prefix) => {
    const section = out.find((s) => s.term === term);
    if (!section) return 0;
    let n = 0;
    list.forEach((item, i) => {
      const canon = canonicalCode(item.code);
      if (!item.code || existing.has(canon)) return;
      existing.add(canon);
      section.courses.push({ ...toHistoryChip(item, i, prefix), program: SECOND_PROGRAM_TAG, programName });
      n++;
    });
    return n;
  };
  const newHistory = addHistory(TAKEN_TERM, classified.taken, 'm2-taken') + addHistory(IN_PROGRESS_TERM, classified.inProgress, 'm2-ip');

  // Requirement wording the plan already holds (from the first audit), and university-wide
  // requirements (GEP, health/fitness, free electives) that one degree's courses satisfy for both.
  const existingLabels = new Set(out.flatMap((s) => s.courses.map((c) => c.auditLabel)).filter(Boolean));
  const pickable = pickableCodes(out);

  let shared = 0;
  const slots = [];
  classified.remaining.forEach((req, i) => {
    const codes = req.codes?.length ? req.codes : req.code ? [req.code] : [];
    const coveredCourse = codes.length && codes.length <= 2 && codes.some((c) => existing.has(canonicalCode(c)) || pickable.has(canonicalCode(c)));
    if (coveredCourse || existingLabels.has(req.label) || UNIVERSITY_WIDE.test(req.label || '')) {
      shared++;
      return;
    }
    slots.push({
      id: `M2-A${i}`,
      code: req.code || req.label,
      name: req.code ? req.title || req.label : 'Requirement from your 2nd audit',
      units: req.units || 3,
      cat: SECOND_PROGRAM_TAG,
      program: SECOND_PROGRAM_TAG,
      programName,
      auditLabel: req.label,
    });
  });

  out = placeSlots(out, slots);
  return { plan: out, added: slots.length, shared, newHistory };
}
