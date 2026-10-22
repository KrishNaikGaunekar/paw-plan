// Classifies degree-audit table rows (see audit-rows.js) into what the student has
// already done vs. what's still left, using the audit's own status icon as the source
// of truth instead of re-deriving it from grade/term heuristics. Heuristics are only
// the fallback for rows that have no icon (Non-degree Courses rows, older exports).
//
// Pure — no DOM, no pdf.js — so it's exercised directly by scripts/check-audits.mjs.

import { extractCourseCodes, parseAuditText, parseTerm } from './pawplan-audit-core.js';

const NC_STATE_GRADE = /^([A-D][+-]?|S)$/;
const TRANSFER_GRADE = /^(T[A-D][+-]?|TR|TS|CR)$/; // transfer (T*), test/exam credit (CR)
const NOT_EARNED_GRADE = /^(F|U|W|IN|NR|LA)$/;
const VERIFY_ONLY = /Global Knowledge|American Democracy/i;
// MyPack planner placeholders ("ELECT 5", "GEP 210"): a slot the student planned, not a course.
const PLANNER_PLACEHOLDER = /^(ELECT\s*\d+|GEP\s+\d{3})$/;

/** "Calculus I [ Course provides excess units ]" -> { title: "Calculus I", notes: [...] } */
function splitNotes(text) {
  const notes = [];
  const title = String(text || '')
    .replace(/\[\s*([^\]]*?)\s*\]/g, (_, note) => {
      if (note) notes.push(note);
      return ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
  return { title, notes };
}

/**
 * Status for a row printed without its icon (Non-degree rows, older exports, PDFs whose
 * icons came out as pictures). A graded row is complete. Of the ungraded rows with a
 * term, only the earliest term is enrolled; later terms are courses planned in MyPack.
 */
function inferStatus(row, enrolledTerm) {
  if (row.status) return row.status;
  const g = row.grade;
  if (g && g !== 'Verify') return 'complete';
  if (row.term && !g) return PLANNER_PLACEHOLDER.test(row.classCode) || termKey(parseTerm(row.term)) > termKey(enrolledTerm) ? 'planned' : 'enrolled';
  return 'unmet';
}

function earliestUngradedTerm(rows) {
  return rows
    .filter((r) => !r.status && r.term && !r.grade)
    .map((r) => parseTerm(r.term))
    .filter(Boolean)
    .sort((a, b) => termKey(a) - termKey(b))[0] || '';
}

/**
 * @param {object[]} rows - output of extractAuditRows().rows
 * @returns {{
 *   taken: object[], inProgress: object[], remaining: object[],
 *   nonDegree: object[], advisorReview: object[], currentTerm: string
 * }}
 */
export function classifyAuditRows(rows) {
  const taken = [];
  const inProgress = [];
  const remaining = [];
  const nonDegree = [];
  const advisorReview = [];

  const enrolledTerm = earliestUngradedTerm(rows.filter((r) => r.kind === 'row'));

  rows
    .filter((r) => r.kind === 'row')
    .forEach((row) => {
      const { title, notes } = splitNotes(row.title);
      const code = row.classCode && !PLANNER_PLACEHOLDER.test(row.classCode) ? row.classCode : '';
      const term = parseTerm(row.term);
      const grade = row.grade;
      const status = inferStatus(row, enrolledTerm);
      const base = {
        code,
        title,
        notes,
        units: row.units || 0,
        term,
        grade,
        section: row.section,
        status,
        wildcard: /\*|\dGEP\b/.test(code),
        raw: [row.classCode, row.title, row.units ? row.units.toFixed(1) + ' cr' : '', row.term, grade].filter(Boolean).join('  '),
      };

      if (row.section === '99') {
        // A planned placeholder here is a slot in the MyPack planner, not credit on the audit.
        if (status === 'planned' && !code) return;
        nonDegree.push(base);
        return;
      }

      // An approved waiver satisfies the requirement without credit: nothing to take or count.
      if (grade === 'WA') return;

      // A "MET" row repeats a course already listed above it, to show it also satisfies a
      // GEP co-requirement (Global Knowledge, transfer-GEP waiver...). A unit-less "PF"
      // row is world-language proficiency from high school. Neither is a new course.
      if (grade === 'MET' || (grade === 'PF' && !base.units)) return;

      if (status === 'complete') {
        if (NOT_EARNED_GRADE.test(grade)) {
          advisorReview.push({ ...base, reason: `Audit marks this complete with grade ${grade}; confirm it counts.` });
          return;
        }
        if (grade === 'TIP') {
          taken.push({ ...base, classification: 'transfer_posted', source: 'Transfer', pending: true });
          advisorReview.push({ ...base, reason: 'Transfer credit is still in progress (TIP) and not yet posted.' });
          return;
        }
        const classification = TRANSFER_GRADE.test(grade) || base.wildcard
          ? 'transfer_posted'
          : NC_STATE_GRADE.test(grade) || grade === 'PF'
            ? 'completed_nc_state'
            : 'transfer_posted';
        taken.push({ ...base, classification, source: classification === 'completed_nc_state' ? 'NC State' : /^CR$/.test(grade) ? 'Exam' : 'Transfer' });
        return;
      }

      if (status === 'enrolled') {
        inProgress.push({ ...base, classification: 'planned_current' });
        return;
      }

      // planned or unmet: still needs to be satisfied.
      if (VERIFY_ONLY.test(title)) {
        advisorReview.push({ ...base, reason: 'The audit still needs this GEP co-requirement verified. It is usually met by a course taken for another requirement.' });
        return;
      }
      if (/Degree Units Required/i.test(title)) return;
      remaining.push({
        ...base,
        label: title || row.classCode,
        codes: extractCourseCodes(`${row.classCode} ${title}`).filter((c) => !PLANNER_PLACEHOLDER.test(c)),
        plannedTerm: status === 'planned' ? term : '',
      });
    });

  return { taken, inProgress, remaining, nonDegree, advisorReview, currentTerm: detectCurrentTerm(taken, inProgress) };
}

const SEASON_ORDER = { Spring: 0, Summer: 1, Fall: 2 };
export function termKey(term) {
  const m = String(term || '').match(/(Spring|Summer|Fall)\s+(\d{4})/);
  return m ? parseInt(m[2], 10) * 3 + SEASON_ORDER[m[1]] : -1;
}

function detectCurrentTerm(taken, inProgress) {
  const pick = (list) => list.map((c) => c.term).filter(Boolean).sort((a, b) => termKey(b) - termKey(a))[0];
  return pick(inProgress) || pick(taken) || '';
}

/**
 * Legacy path for audits without a recognizable table (no CLASS/TITLE header found):
 * run the original line-based parser and adapt its items into the same row shape.
 */
export function rowsFromLegacyText(text) {
  return parseAuditText(text).map((item) => {
    const termText = (item.raw.match(/(Fall|Spring|Sum1|Sum2|Summer)\s+'?\d{2,4}/) || [''])[0];
    const isGroup = item.type === 'requirement_group';
    return {
      kind: 'row',
      section: item.section,
      status: isGroup ? 'unmet' : /Add To Planner/i.test(item.raw) ? 'unmet' : null,
      classCode: isGroup ? '' : item.code,
      title: isGroup ? item.raw : item.raw.replace(item.code, '').trim(),
      units: item.units,
      term: termText,
      grade: item.grade === 'VERIFY' ? 'Verify' : item.grade,
      action: '',
    };
  });
}
