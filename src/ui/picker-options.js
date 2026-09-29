// Resolves a DEFAULT_PLAN slot's `picker` id to the list of courses (or free-text
// validation rule) a student can choose from. See NOTES-original-behavior.md
// "Pickable (dashed-border) courses".

import {
  SLASH_COURSES,
  HUM_COURSES,
  SOCSCI_COURSES,
  GEP_ELEC_COURSES,
  IDS_COURSES,
  TECH_ELECTIVE_LIST,
  FREE_EXCLUDED,
  DEPT_OR_TECH_PREFIXES,
} from '../data/agribusiness-catalog.js';

const GROUPED_LISTS = {
  hum: HUM_COURSES,
  socsci: SOCSCI_COURSES,
  gepelec: GEP_ELEC_COURSES,
  ids: IDS_COURSES,
  tech: TECH_ELECTIVE_LIST,
  depttech: TECH_ELECTIVE_LIST,
};

/**
 * @returns {{ mode: 'grouped', groups: {g,courses}[] } | { mode: 'flat', courses: {c,n}[] } | { mode: 'freetext', hint: string, validate: (code:string)=>boolean }}
 */
export function resolvePickerOptions(pickerId) {
  if (pickerId === 'free') {
    return {
      mode: 'freetext',
      hint: 'Any course not already required elsewhere in your major (e.g. not ARE 201, BIO 105, ENG 101...). Enter the course code.',
      validate: (code) => !FREE_EXCLUDED.includes(normalizeCode(code)),
    };
  }
  if (pickerId === 'depttech') {
    return {
      mode: 'grouped',
      groups: TECH_ELECTIVE_LIST,
      freetext: {
        hint: `Or enter any course code starting with: ${DEPT_OR_TECH_PREFIXES.join(', ')}`,
        validate: (code) => DEPT_OR_TECH_PREFIXES.some((p) => normalizeCode(code).startsWith(p)),
      },
    };
  }
  if (GROUPED_LISTS[pickerId]) {
    return { mode: 'grouped', groups: GROUPED_LISTS[pickerId] };
  }
  if (SLASH_COURSES[pickerId]) {
    return { mode: 'flat', courses: SLASH_COURSES[pickerId] };
  }
  return { mode: 'flat', courses: [] };
}

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}
