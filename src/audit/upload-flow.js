// Turns an uploaded degree-audit PDF into a plan the semester grid can render.
//
// Design note (deliberate simplification vs. the original — see
// NOTES-original-behavior.md): the original had a "confirm planning start term"
// modal for ambiguous cases. This rebuild instead overlays audit results directly
// onto the fixed DEFAULT_PLAN template (matched courses replace their slot in
// place; unmatched-but-completed/transfer/in-progress items land in the three
// catch-all sections; still-unmet requirements simply keep their template
// placeholder) — no term-shifting, so there's nothing ambiguous to confirm. If the
// client wants explicit control over "which semester am I starting from," that's a
// good follow-up feature rather than something to guess at now.

// Deliberately pure (no pdf.js import) — see pdf-text-extractor.js for turning a PDF
// into text; this module only turns that text into a plan. Keeping it pure means it
// can be exercised directly (e.g. in a Node-based smoke test) without a browser.
import { DEFAULT_PLAN, CODE_TO_SLOT } from '../data/agribusiness-catalog.js';
import {
  parseAuditText,
  classifyAuditItems,
  matchItemsToRequirements,
} from './pawplan-audit-core.js';

const BUCKET_SECTION = {
  completed_nc_state: 'Completed NC State Courses',
  transfer_posted: 'Transfer / Test / Prior Credit',
  planned_current: 'In Progress / Planned from Audit',
};

function toCourseChip(item, idSuffix) {
  const gradeTag = item.grade ? ` (${item.grade})` : '';
  return {
    id: `audit-${idSuffix}`,
    code: item.code,
    name: `${item.code}${gradeTag}${item.term ? ' — ' + item.term : ''}`,
    units: item.units || 0,
    cat: 'dept',
    classification: item.classification,
    historical: true,
  };
}

/**
 * @param {string} rawText - extracted PDF text
 * @returns {{ plan: object[], advisorReview: object[], nonDegree: object[] }}
 */
export function buildPlanFromAuditText(rawText) {
  const parsed = parseAuditText(rawText);
  const classified = classifyAuditItems(parsed);
  const matched = matchItemsToRequirements(classified, CODE_TO_SLOT);

  const plan = JSON.parse(JSON.stringify(DEFAULT_PLAN));
  const advisorReview = [];
  const nonDegree = [];
  const filledSlotIds = new Set();

  matched.forEach((item, i) => {
    const bucketTerm = BUCKET_SECTION[item.classification];
    const isWaived = item.classification === 'waived_requirement';

    if ((bucketTerm || isWaived) && item.matchedRequirement) {
      // Try to place this course directly into its DEFAULT_PLAN slot.
      for (const section of plan) {
        const idx = section.courses.findIndex((c) => c.id === item.matchedRequirement);
        if (idx === -1) continue;
        filledSlotIds.add(item.matchedRequirement);
        if (isWaived) {
          section.courses[idx] = {
            ...section.courses[idx],
            name: 'Waived (advisor approved)',
            picker: undefined,
            waived: true,
          };
        } else {
          section.courses[idx] = toCourseChip(item, i);
        }
        return;
      }
    }

    if (bucketTerm) {
      const section = plan.find((s) => s.term === bucketTerm);
      if (section) section.courses.push(toCourseChip(item, i));
      return;
    }

    if (item.classification === 'non_degree') {
      nonDegree.push(item);
      return;
    }

    if (item.classification === 'unmet_requirement' || item.classification === 'waived_requirement') {
      return; // template placeholder already represents this
    }

    // The ported classifier's catch-all lands here for a completely ordinary "haven't
    // taken this required course yet" audit row (no grade, no term — e.g. "EC 202 ...
    // Add To Planner") whenever it can't find a more specific branch. If that row maps
    // to a plain, non-picker DEFAULT_PLAN slot, the template already shows it correctly
    // as an upcoming requirement — flagging it for advisor review would just be noise.
    // Real ambiguity (MET/VERIFY rows, wildcards, an actual grade/term present) still
    // has a matching signal below and stays in the list.
    if (!item.grade && !item.term && item.matchedRequirement) {
      const templateSlot = DEFAULT_PLAN.flatMap((s) => s.courses).find((c) => c.id === item.matchedRequirement);
      if (templateSlot && !templateSlot.picker) return;
    }

    // advisor_review, transfer_in_progress, and anything else that needs a human look.
    advisorReview.push(item);
  });

  return { plan, advisorReview, nonDegree };
}
