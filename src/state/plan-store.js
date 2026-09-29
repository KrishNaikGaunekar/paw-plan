// Central plan state: the single source of truth the UI renders from and mutates
// through. Pub/sub (`subscribe`) instead of a framework — see README for why.
//
// Autosave schema/semantics ported from NOTES-original-behavior.md ("Autosave"):
// debounced 600ms writes, only arms after a real user action while an audit is loaded,
// never auto-restores (the UI shows a banner and lets the student choose).

import { DEFAULT_PLAN, AUTOSAVE_KEY, AUTOSAVE_SCHEMA_VERSION } from '../data/agribusiness-catalog.js';
import { checkPrereqViolation } from './prereq-engine.js';
import { reconcileNaturalScienceGap } from './credit-rules.js';

const UNDO_LIMIT = 30;
const AUTOSAVE_DEBOUNCE_MS = 600;

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function freshState() {
  return {
    plan: deepCopy(DEFAULT_PLAN),
    transferred: [],
    nonDegree: [],
    advisorReview: [],
    withdrawn: [],
    uploadedMode: false,
  };
}

function buildSaveData(state) {
  return {
    version: AUTOSAVE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    plan: state.plan,
    transferred: state.transferred,
    nonDegree: state.nonDegree,
    advisorReview: state.advisorReview,
    withdrawn: state.withdrawn,
  };
}

class PlanStore {
  constructor() {
    this.state = freshState();
    this.undoStack = [];
    this.listeners = new Set();
    this.autosaveArmed = false;
    this._autosaveTimer = null;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  _pushUndo() {
    this.undoStack.push(deepCopy(this.state));
    if (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift();
  }

  _reconcileNatSci() {
    this.state.plan = reconcileNaturalScienceGap(this.state);
  }

  _scheduleAutosave() {
    if (!this.autosaveArmed) return;
    if (this._autosaveTimer) clearTimeout(this._autosaveTimer);
    this._autosaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(buildSaveData(this.state)));
      } catch {
        // localStorage unavailable (private mode, quota, etc.) — silently skip autosave.
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  // Call once a real user action happens while an audit is loaded — never on boot.
  armAutosave() {
    this.autosaveArmed = true;
  }

  // --- read helpers ---

  canUndo() {
    return this.undoStack.length > 0;
  }

  findCourse(courseId) {
    for (const section of this.state.plan) {
      const course = section.courses.find((c) => c.id === courseId);
      if (course) return { course, section };
    }
    return null;
  }

  // --- mutations (each: push undo, mutate, reconcile, autosave, notify) ---

  _commit(mutateFn) {
    this._pushUndo();
    mutateFn();
    this._reconcileNatSci();
    this._scheduleAutosave();
    this._notify();
  }

  loadAuditPlan(plan, { transferred, nonDegree, advisorReview, withdrawn } = {}) {
    // Loading a fresh audit replaces the working plan; the undo stack is intentionally
    // cleared too (there's nothing meaningful to undo back to before an upload).
    this.undoStack = [];
    this.state = {
      plan,
      transferred: transferred || [],
      nonDegree: nonDegree || [],
      advisorReview: advisorReview || [],
      withdrawn: withdrawn || [],
      uploadedMode: true,
    };
    this._reconcileNatSci();
    this._notify();
  }

  /** Returns { ok: true } or { ok: false, level: 'block'|'warn', messages: [...] }. */
  previewMove(courseId, toTerm) {
    const found = this.findCourse(courseId);
    if (!found) return { ok: false, level: 'block', messages: ['Course not found.'] };
    const result = checkPrereqViolation(found.course, toTerm, this.state.plan);
    if (result.level === 'block') return { ok: false, level: 'block', messages: result.messages };
    if (result.level === 'warn') return { ok: false, level: 'warn', messages: result.messages };
    return { ok: true };
  }

  /** Move a course to `toTerm`, ignoring soft warnings the caller already confirmed. */
  moveCourse(courseId, toTerm) {
    const found = this.findCourse(courseId);
    if (!found) return;
    const targetSection = this.state.plan.find((s) => s.term === toTerm);
    if (!targetSection || targetSection === found.section) return;
    this._commit(() => {
      found.section.courses = found.section.courses.filter((c) => c.id !== courseId);
      targetSection.courses = [...targetSection.courses, found.course];
    });
  }

  /** Replace a picker placeholder in place with a chosen course. */
  pickCourse(placeholderId, chosen) {
    this._commit(() => {
      for (const section of this.state.plan) {
        const idx = section.courses.findIndex((c) => c.id === placeholderId);
        if (idx === -1) continue;
        const prev = section.courses[idx];
        section.courses[idx] = {
          ...prev,
          code: chosen.c,
          name: chosen.n,
          units: prev.units, // slot's declared credit weight stays authoritative
          picker: undefined,
        };
        return;
      }
    });
  }

  addSemester(afterTerm, label) {
    this._commit(() => {
      const idx = this.state.plan.findIndex((s) => s.term === afterTerm);
      const entry = { term: label, courses: [] };
      if (idx === -1) this.state.plan.push(entry);
      else this.state.plan.splice(idx + 1, 0, entry);
    });
  }

  // --- Transfer Mode ---

  transferCourse(courseId) {
    const found = this.findCourse(courseId);
    if (!found || resolveUnits(found.course) <= 0) return;
    this._commit(() => {
      found.section.courses = found.section.courses.filter((c) => c.id !== courseId);
      this.state.transferred = [...this.state.transferred, found.course];
    });
  }

  restoreTransferredCourse(courseId) {
    const course = this.state.transferred.find((c) => c.id === courseId);
    if (!course) return;
    this._commit(() => {
      this.state.transferred = this.state.transferred.filter((c) => c.id !== courseId);
      const summer = this.state.plan.find((s) => /^Summer/.test(s.term));
      const target = summer || this.state.plan[this.state.plan.length - 1];
      target.courses = [...target.courses, course];
    });
  }

  // --- Undo / Save / Load / Reset ---

  undo() {
    if (!this.undoStack.length) return;
    this.state = this.undoStack.pop();
    this._scheduleAutosave();
    this._notify();
  }

  reset() {
    this.state = freshState();
    this.undoStack = [];
    this._scheduleAutosave();
    this._notify();
  }

  exportSaveData() {
    return buildSaveData(this.state);
  }

  /** Throws if `data` doesn't look like a valid save file — caller shows the error toast. */
  importSaveData(data) {
    if (!data || !Array.isArray(data.plan)) throw new Error('Invalid plan file');
    this._pushUndo();
    this.state = {
      plan: data.plan,
      transferred: data.transferred || [],
      nonDegree: data.nonDegree || [],
      advisorReview: data.advisorReview || [],
      withdrawn: data.withdrawn || [],
      uploadedMode: true,
    };
    this._reconcileNatSci();
    this._scheduleAutosave();
    this._notify();
  }

  // --- Autosave restore-on-boot ---

  readAutosave() {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.plan)) return null;
      return data;
    } catch {
      return null;
    }
  }

  restoreFromAutosave(data) {
    this.state = {
      plan: data.plan,
      transferred: data.transferred || [],
      nonDegree: data.nonDegree || [],
      advisorReview: data.advisorReview || [],
      withdrawn: data.withdrawn || [],
      uploadedMode: true,
    };
    this.armAutosave();
    this._reconcileNatSci();
    this._notify();
  }
}

function resolveUnits(course) {
  return typeof course.units === 'number' ? course.units : 0;
}

export const planStore = new PlanStore();
