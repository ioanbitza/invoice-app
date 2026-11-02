/** Pure rendering helpers shared by the screens: no state, no business rules (ADR-003). Text always goes in as text (R-22). */

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A button that acts; `action` is read by the screen's one delegated listener. */
export function actionButton(label, variant, action) {
  const button = element('button', `button button-${variant}`, label);
  button.type = 'button';
  if (action) button.dataset.action = action;
  return button;
}

/** A link to a route, drawn as a button. */
export function linkButton(label, href, variant) {
  const link = element('a', `button button-${variant}`, label);
  link.href = href;
  return link;
}

export function heading(text) {
  const h1 = element('h1', '', text);
  h1.tabIndex = -1;
  return h1;
}

export function panel(extraClass) {
  return element('div', extraClass ? `panel ${extraClass}` : 'panel');
}

/** spec: { variant, text, action?: { label, name } }. Danger and warning announce at once. */
export function banner(spec) {
  const role = spec.variant === 'danger' || spec.variant === 'warning' ? 'alert' : 'status';
  const node = element('div', `banner banner-${spec.variant}`);
  node.setAttribute('role', role);
  node.tabIndex = -1;
  const icon = document.getElementById(`icon-${spec.variant}`).content.firstElementChild.cloneNode(true);
  node.append(icon, element('p', 'banner-text', spec.text));
  if (spec.action) node.append(actionButton(spec.action.label, 'link', spec.action.name));
  return node;
}

/** The region under the h1 that holds the page banner. */
export function bannerRegion() {
  const region = element('div', 'banner-region');
  region.dataset.bannerRegion = '';
  return region;
}

/** Replaces whatever banner a region holds with the given one. */
export function setBanner(region, spec) {
  const node = banner(spec);
  region.replaceChildren(node);
  return node;
}

/** Fills the one dialog of index.html; the safe button comes first in the DOM. */
export function fillDialog(dialog, content) {
  dialog.querySelector('#dialog-title').textContent = content.title;
  dialog.querySelector('#dialog-text').textContent = content.text;
  const safe = actionButton(content.safeLabel, 'secondary');
  safe.dataset.dialog = 'safe';
  const confirm = actionButton(content.confirmLabel, 'destructive');
  confirm.dataset.dialog = 'confirm';
  dialog.querySelector('#dialog-actions').replaceChildren(safe, confirm);
  return safe;
}

/** A label, a control, a helper and an error, wired by aria-describedby. */
export function field(spec) {
  const wrapper = element('div', 'field');
  const label = element('label', 'field-label', `${spec.label} (${spec.required ? 'required' : 'optional'})`);
  label.htmlFor = spec.id;
  spec.control.id = spec.id;
  const describedBy = [];
  wrapper.append(label, spec.control);
  if (spec.helper) {
    const helper = element('p', 'field-helper', spec.helper);
    helper.id = `${spec.id}-helper`;
    describedBy.push(helper.id);
    wrapper.append(helper);
  }
  if (spec.error) {
    const error = element('p', 'field-error', `Error: ${spec.error}`);
    error.id = `${spec.id}-error`;
    describedBy.push(error.id);
    spec.control.setAttribute('aria-invalid', 'true');
    wrapper.append(error);
  }
  if (describedBy.length > 0) spec.control.setAttribute('aria-describedby', describedBy.join(' '));
  return wrapper;
}

/** spec: { text, action: { label, variant, href or name } }: a link to a route, or a button that acts. */
export function emptyState(spec) {
  const { label, variant, href, name } = spec.action;
  const node = element('div', 'empty-state');
  node.append(element('p', '', spec.text), href ? linkButton(label, href, variant) : actionButton(label, variant, name));
  return node;
}
