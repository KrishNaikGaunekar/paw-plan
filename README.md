# Paw Plan

Unofficial degree planning tool for NC State Agribusiness Management (BS) students. Students upload their MyPack degree audit PDF and get an interactive, drag-and-drop semester planner with prerequisite validation, transfer-credit handling, an Economics minor explorer, and a printable advising-prep summary.

**Fully client-side.** The degree audit PDF is parsed entirely in the browser (via [pdf.js](https://mozilla.github.io/pdf.js/)); nothing is uploaded to a server. The working plan autosaves to the browser's `localStorage` on the device being used.

This is a rebuild of an earlier single-file prototype, restructured for maintainability. The audit-parsing logic and NC State-branded design tokens are carried over unchanged from that prototype; everything else — architecture and UI — is new.

## Development

```
npm install
npm run dev
```

## Build & deploy

```
npm run build
```

Outputs a static site to `dist/`. Pushing to `main` deploys automatically to GitHub Pages via `.github/workflows/deploy.yml` — enable Pages for this repo under Settings → Pages → Source: GitHub Actions.

## Project structure

```
src/
  main.js                        entry point
  state/plan-store.js            plan state, undo history, localStorage autosave
  audit/pawplan-audit-core.js    degree-audit PDF text → structured plan data
  data/agribusiness-catalog.js   course/prerequisite/requirement data
  ui/                            toolbar, semester grid, panels
  styles/                        design tokens + component styles
```

## Scope

Single major (Agribusiness Management BS), no accounts, no backend, no advisor-facing views — intentionally, to match the original tool's privacy model and keep this maintainable by the school after handoff.
