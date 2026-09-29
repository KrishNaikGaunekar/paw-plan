import { CATEGORIES } from '../data/agribusiness-catalog.js';

export function renderLegend(container) {
  container.innerHTML = `
    <details class="legend-toggle">
      <summary>Course color legend</summary>
      <ul class="legend-list">
        ${Object.values(CATEGORIES)
          .map((cat) => `<li><span class="legend-swatch" style="background:${cat.color}"></span>${cat.label}</li>`)
          .join('')}
      </ul>
    </details>`;
}
