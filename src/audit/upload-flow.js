// Turns an uploaded degree audit into a plan the semester grid can render.
//
// The audit is the source of truth, so nothing is guessed about the past:
//   - every course the audit shows as complete (NC State, transfer, test credit) goes
//     into the fixed "Taken / Transferred" section, exactly as the audit lists it;
//   - currently enrolled courses go into "In Progress (current term)";
//   - the future semesters contain only what the audit says is still unmet or planned,
//     sized to the remaining credits the audit reports, starting the term after the
//     current one. A requirement the student already planned in MyPack (★ rows) keeps
//     that term; everything else is packed in curriculum order, ~15 credits per
//     semester, with prerequisites before the courses that need them.
//
// Deliberately pure (no pdf.js import) so it can run in a Node smoke test.

import {
  DEFAULT_PLAN,
  CODE_TO_SLOT,
  PREREQS,
  AUDIT_SECTION_TO_CAT,
  TARGET_LOAD,
  TAKEN_TERM,
  IN_PROGRESS_TERM,
} from '../data/agribusiness-catalog.js';
import { extractAuditRows } from './audit-rows.js';
import { classifyAuditRows, rowsFromLegacyText, termKey } from './mypack-audit-parser.js';
import { canonicalCode } from '../state/prereq-engine.js';

// Requirement wording on the audit -> the DEFAULT_PLAN slots that represent it, in order.
const POOL_RULES = [
  [/ARE 400-level/i, ['ARE4A', 'ARE4B']],
  [/ARE Elective/i, ['ARE3A', 'ARE3B']],
  [/Departmental or Technical/i, ['RSTD4', 'RSTD5', 'RSTD6']],
  [/Technical Electives?/i, ['RSTD1', 'RSTD2', 'RSTD3']],
  [/Humanities/i, ['HUMGEP', 'GEPHUMANITIES']],
  [/Social Sciences?/i, ['SOCSCI']],
  [/HES Fitness/i, ['HESF1']],
  [/HES Fit Elective|HES Activity/i, ['HESF2']],
  [/Interdisc/i, ['IDS201']],
  [/GEP Elective/i, ['GEPELEC']],
  [/Free Electives?/i, ['FREE1', 'FREE2', 'FREE3']],
  [/^Statistics/i, ['ST311']],
];

const TEMPLATE_SLOTS = new Map();
DEFAULT_PLAN.forEach((section, semIndex) =>
  section.courses.forEach((course, pos) => TEMPLATE_SLOTS.set(course.id, { course, order: semIndex * 100 + pos })),
);

function poolFor(req) {
  if (/Natural Science Elective/i.test(req.label)) return req.units >= 4 ? ['MEA', 'NATSCI1'] : ['NATSCI1', 'MEA'];
  for (const [re, pool] of POOL_RULES) if (re.test(req.label)) return pool;
  const slotId = req.codes.map((c) => CODE_TO_SLOT[c]).find(Boolean);
  return slotId ? [slotId] : null;
}

/** Expand one remaining requirement into plan slots whose credits add up to what's left. */
function slotsForRequirement(req, usedIds, index) {
  const cat = AUDIT_SECTION_TO_CAT[req.section] || 'free';
  const pool = poolFor(req);
  const fromAudit = { auditLabel: req.label, plannedTerm: req.plannedTerm };

  if (!pool) {
    // No template slot for this requirement — show it exactly as the audit words it.
    return [{
      id: `REQ-${index}`,
      code: req.code || req.label,
      name: req.code ? req.title : 'Requirement from your audit',
      units: req.units || 3,
      cat,
      order: 9000 + index,
      ...fromAudit,
    }];
  }

  const slots = [];
  let remaining = req.units || TEMPLATE_SLOTS.get(pool[0])?.course.units || 3;
  let i = 0;
  while (remaining > 0) {
    const templateId = pool[Math.min(i, pool.length - 1)];
    const template = TEMPLATE_SLOTS.get(templateId);
    const templateUnits = template?.course.units || 3;
    // A single-course requirement takes its full credit; pools split into slot-sized
    // chunks, folding a 1-credit leftover into the last chunk (4 cr left -> one 4 cr slot,
    // not 3 + 1).
    let units = pool.length === 1 && i === 0 ? remaining : Math.min(templateUnits, remaining);
    if (remaining - units === 1) units = remaining;
    let id = templateId;
    for (let n = 2; usedIds.has(id); n++) id = `${templateId}-${n}`;
    usedIds.add(id);
    slots.push({
      ...(template ? JSON.parse(JSON.stringify(template.course)) : { code: req.label, name: 'Click to choose', cat }),
      id,
      units,
      order: (template?.order ?? 9000) + i,
      ...fromAudit,
    });
    remaining -= units;
    i++;
    if (i > 12) break; // malformed units — never loop forever
  }
  return slots;
}

function nextTerm(term) {
  const m = String(term).match(/(Spring|Summer|Fall)\s+(\d{4})/);
  if (!m) return null;
  const y = parseInt(m[2], 10);
  return m[1] === 'Fall' ? `Spring ${y + 1}` : `Fall ${y}`; // regular terms only
}

function termAfterToday() {
  const now = new Date();
  const y = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 8) return `Spring ${y + 1}`;
  if (month <= 4) return `Fall ${y}`;
  return `Fall ${y}`;
}

function toHistoryChip(item, i, prefix) {
  return {
    id: `${prefix}-${i}`,
    code: item.code || item.title,
    name: item.title || item.code,
    units: item.units || 0,
    grade: item.grade || '',
    termTaken: item.term || '',
    source: item.source || '',
    cat: AUDIT_SECTION_TO_CAT[item.section] || 'free',
    auditSection: item.section,
    classification: item.classification,
    historical: true,
    note: item.wildcard ? 'Generic' : item.notes?.find((n) => /excess units/i.test(n)) ? 'Excess units' : '',
  };
}

/** Pack slots into semesters: pinned terms first, then curriculum order, prereqs first. */
function packFutureSemesters(slots, doneCodes, startTerm) {
  const terms = [startTerm];
  const load = (t) => semesters.get(t).reduce((n, c) => n + (c.units || 0), 0);
  const semesters = new Map([[startTerm, []]]);
  const ensure = (idx) => {
    while (terms.length <= idx) {
      const t = nextTerm(terms[terms.length - 1]);
      terms.push(t);
      semesters.set(t, []);
    }
  };
  const placedAt = new Map(); // canonical code -> term index

  const record = (slot, idx) => {
    ensure(idx);
    semesters.get(terms[idx]).push(slot);
    placedAt.set(canonicalCode(slot.code), Math.min(idx, placedAt.get(canonicalCode(slot.code)) ?? idx));
  };

  const pinned = slots.filter((s) => s.plannedTerm && /Spring|Fall/.test(s.plannedTerm));
  const rest = slots.filter((s) => !pinned.includes(s)).sort((a, b) => a.order - b.order);

  pinned.forEach((slot) => {
    let idx = 0;
    while (termKey(terms[idx]) < termKey(slot.plannedTerm)) {
      idx++;
      ensure(idx);
    }
    record(slot, idx);
  });

  const capstone = rest.filter((s) => canonicalCode(s.code) === canonicalCode('ARE 490'));
  rest
    .filter((s) => !capstone.includes(s))
    .forEach((slot) => {
      const prereqs = PREREQS[canonicalCode(slot.code)] || [];
      let minIdx = 0;
      prereqs.forEach((p) => {
        const canon = canonicalCode(p);
        if (doneCodes.has(canon)) return;
        if (placedAt.has(canon)) minIdx = Math.max(minIdx, placedAt.get(canon) + 1);
      });
      let idx = minIdx;
      ensure(idx);
      while (load(terms[idx]) + (slot.units || 0) > TARGET_LOAD) {
        idx++;
        ensure(idx);
      }
      record(slot, idx);
    });

  // ARE 490 (career seminar) belongs at the end of the plan.
  capstone.forEach((slot) => record(slot, terms.length - 1));

  // Summer sessions between regular terms, empty, so courses can be dragged there.
  const plan = [];
  terms.forEach((t, i) => {
    plan.push({ term: t, courses: semesters.get(t).map(({ order, plannedTerm, ...c }) => c) });
    if (t.startsWith('Spring') && i < terms.length - 1) plan.push({ term: `Summer ${t.slice(7)}`, courses: [] });
  });
  return plan;
}

/**
 * @param {{pages?: object[], text?: string}} extracted - from pdf-text-extractor.js
 * @returns {{ plan: object[], advisorReview: object[], nonDegree: object[], summary: object }}
 */
export function buildPlanFromAudit(extracted) {
  const table = extracted.pages ? extractAuditRows(extracted.pages) : { rows: [], hasTable: false };
  const rows = table.hasTable ? table.rows : rowsFromLegacyText(extracted.text || '');
  const result = classifyAuditRows(rows);

  const takenChips = result.taken.map((c, i) => toHistoryChip(c, i, 'taken'));
  const inProgressChips = result.inProgress.map((c, i) => toHistoryChip(c, i, 'ip'));

  const doneCodes = new Set([...result.taken, ...result.inProgress].map((c) => canonicalCode(c.code)));
  const usedIds = new Set();
  const slots = result.remaining.flatMap((req, i) => slotsForRequirement(req, usedIds, i));

  const startTerm = nextTerm(result.currentTerm) || termAfterToday();
  const future = slots.length ? packFutureSemesters(slots, doneCodes, startTerm) : [{ term: startTerm, courses: [] }];

  const plan = [
    ...future,
    { term: TAKEN_TERM, courses: takenChips },
    { term: IN_PROGRESS_TERM, courses: inProgressChips },
  ];

  const sum = (list) => list.reduce((n, c) => n + (c.units || 0), 0);
  return {
    plan,
    advisorReview: result.advisorReview,
    nonDegree: result.nonDegree,
    summary: {
      currentTerm: result.currentTerm,
      startTerm,
      takenCredits: sum(result.taken),
      inProgressCredits: sum(result.inProgress),
      remainingCredits: sum(slots),
      usedTableParser: table.hasTable,
    },
  };
}

/** Back-compat for callers that only have plain text (no positioned items). */
export function buildPlanFromAuditText(rawText) {
  return buildPlanFromAudit({ text: rawText });
}
