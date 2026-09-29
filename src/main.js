import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { planStore } from './state/plan-store.js';
import { renderBrandHeader } from './ui/brand-header.js';
import { renderToolbar, onRerender as onToolbarRerender } from './ui/toolbar.js';
import { renderLegend } from './ui/legend.js';
import { renderSemesterGrid, initSemesterGrid, onRerender as onGridRerender } from './ui/semester-grid.js';
import { renderStatusPanels, onRerender as onStatusRerender, checkForAutosave } from './ui/status-panels.js';

const app = document.getElementById('app');
app.innerHTML = `
  <header>
    <div id="brand-root"></div>
    <div id="toolbar-root"></div>
  </header>
  <main>
    <div id="status-root"></div>
    <div id="legend-root"></div>
    <div id="grid-root"></div>
  </main>
`;

const brandRoot = document.getElementById('brand-root');
const toolbarRoot = document.getElementById('toolbar-root');
const statusRoot = document.getElementById('status-root');
const legendRoot = document.getElementById('legend-root');
const gridRoot = document.getElementById('grid-root');

initSemesterGrid(gridRoot);

function render() {
  renderBrandHeader(brandRoot);
  renderToolbar(toolbarRoot);
  renderStatusPanels(statusRoot);
  renderLegend(legendRoot);
  renderSemesterGrid(gridRoot);
}

onToolbarRerender(render);
onGridRerender(render);
onStatusRerender(render);
planStore.subscribe(render);

checkForAutosave();
render();
