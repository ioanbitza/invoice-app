import { element, heading, linkButton, panel } from './components.js';

/** Screen 7.7: no record text and no part of the hash is ever shown (R-31). */
export function renderNotFound(container) {
  const h1 = heading('Page not found');
  h1.dataset.screen = 'not-found';
  const box = panel('panel-form');
  const links = element('div', 'button-row');
  links.append(linkButton('Go to customers', '#/customers', 'secondary'), linkButton('Go to orders', '#/orders', 'secondary'));
  box.append(element('p', '', 'This page does not exist, or the record was deleted.'), links);
  container.replaceChildren(h1, box);
  return h1;
}
