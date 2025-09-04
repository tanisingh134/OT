import { logger } from './logger.js';

// Attach generic logging to clicks and form submissions
document.addEventListener('click', (e) => {
  const target = e.target;
  if (target instanceof HTMLElement) {
    const info = { tag: target.tagName, id: target.id || null, cls: target.className || null, text: (target.innerText || '').slice(0, 40) };
    logger.info('ui_click', info);
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  if (form instanceof HTMLFormElement) {
    const info = { id: form.id || null, action: form.action || null };
    logger.info('ui_submit', info);
  }
});


