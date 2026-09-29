// Brand header — text/layout/badge carried over from the original site (per the
// client's request to keep the existing branding), plus the original's live
// 4-box credit summary (Total Required / Planned / Avg per Sem / Transferred).
// See computeCreditSummary in credit-rules.js for the exact bucketing this mirrors.

import { planStore } from '../state/plan-store.js';
import { computeCreditSummary } from '../state/credit-rules.js';

function statBoxHtml(label, value, valueClass = '') {
  return `<div class="credit-box"><div class="cb-label">${label}</div><div class="cb-value ${valueClass}">${value}</div></div>`;
}

export function renderBrandHeader(container) {
  const summary = computeCreditSummary(planStore.state);
  const plannedClass = summary.planned < summary.totalRequired ? 'warning' : 'ok';

  container.innerHTML = `
    <div class="nc-university-bar">
      <strong>NC State University</strong>
      <span>Unofficial advising and planning tool</span>
    </div>
    <div class="brand-header">
      <div class="brand-header-inner">
        <div class="header-brand">
          <img class="brand-badge" src="${import.meta.env.BASE_URL}nc-state-abm-badge.png" alt="NC State Agribusiness Management badge" />
          <div>
            <h1 class="brand-title"><span class="brand-title-main">Paw Plan</span><span class="brand-title-divider">|</span>Agribusiness Management, BS</h1>
            <div class="brand-subtitle">College of Agriculture &amp; Life Sciences · NC State University · Interactive 4-Year Degree Planner</div>
          </div>
        </div>
        <div class="credit-summary">
          ${statBoxHtml('Total Required', summary.totalRequired)}
          ${statBoxHtml('Planned', summary.planned, plannedClass)}
          ${statBoxHtml('Avg / Sem', summary.avgPerSem)}
          ${statBoxHtml('Transferred', summary.transferred, 'transferred')}
        </div>
      </div>
    </div>`;
}
