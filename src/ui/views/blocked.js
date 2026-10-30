import { actionButton, bannerRegion, element, heading, panel, setBanner } from './components.js';

const TEXTS = Object.freeze({
  corrupt: {
    title: 'The saved data cannot be read',
    text: 'Nothing has been changed. Copy the stored text to keep it, or start with empty data. (STO-03)',
  },
  newer: {
    title: 'This data is from a newer version',
    text: 'It was saved by a newer version of the app, and nothing has been changed. Copy the stored text to keep it, or start with empty data. (STO-04)',
  },
  unavailable: {
    title: 'Browser storage cannot be used',
    text: "Your browser's storage is unavailable. Allow storage for this site, then reload the page. (STO-02)",
  },
});

const COPIED = 'Stored text copied. Keep it somewhere safe before you start with empty data.';
const COPY_FAILED = 'Copying failed: the browser did not allow it.';

function buildActions(reason) {
  const row = element('div', 'button-row');
  if (reason === 'unavailable') row.append(actionButton('Reload', 'primary', 'reload'));
  else row.append(actionButton('Copy stored text', 'primary', 'copy'));
  row.append(actionButton('Start with empty data', 'destructive-quiet', 'start-empty'));
  return row;
}

function showStoredText(box, region, text) {
  const area = element('textarea', 'stored-text');
  area.readOnly = true;
  area.rows = 8;
  area.value = text;
  const label = element('label', 'field-label', 'Stored text');
  label.htmlFor = 'stored-text';
  area.id = 'stored-text';
  region.after(label, area);
  area.focus();
  area.select();
  box.querySelector('[data-action="show-text"]')?.remove();
}

async function copyText(region, text, button) {
  button.disabled = true;
  button.textContent = 'Copying...';
  try {
    await navigator.clipboard.writeText(text);
    setBanner(region, { variant: 'success', text: COPIED });
  } catch {
    setBanner(region, {
      variant: 'danger',
      text: COPY_FAILED,
      action: { label: 'Show stored text', name: 'show-text' },
    });
  }
  button.disabled = false;
  button.textContent = 'Copy stored text';
}

/**
 * Screen 7.8. model: { reason, text }. actions: { startEmpty({ opener, onFailed }), bannerFor(code) }.
 * The stored text is shown only after a failed copy and a click on Show stored text (ADR-004, R-31).
 */
export function renderBlocked(container, model, actions) {
  const { title, text } = TEXTS[model.reason];
  const h1 = heading(title);
  const box = panel('panel-form');
  const region = bannerRegion();
  box.append(region, element('p', '', text), buildActions(model.reason));
  box.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const name = button.dataset.action;
    if (name === 'copy') copyText(region, model.text, button);
    if (name === 'show-text') showStoredText(box, region, model.text);
    if (name === 'start-empty') {
      actions.startEmpty({
        opener: button,
        onFailed: (code) => setBanner(region, actions.bannerFor(code)).focus(),
      });
    }
  });
  container.replaceChildren(element('p', 'app-name', 'Invoice app'), h1, box);
  return h1;
}
