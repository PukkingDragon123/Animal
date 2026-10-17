// Tiny DOM helpers.
export function h(tag, attrs = {}, ...kids) {
  const [t, ...cls] = tag.split('.');
  const el = document.createElement(t || 'div');
  if (cls.length) el.className = cls.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'class') el.className += ' ' + v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
}
export const $ = (sel, root = document) => root.querySelector(sel);
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Button that also fires on pointerdown for snappy touch (prevents double fire)
export function tapBtn(el, fn) {
  let downAt = 0;
  el.addEventListener('pointerdown', (e) => { e.stopPropagation(); downAt = performance.now(); el.classList.add('down'); });
  el.addEventListener('pointerup', (e) => { e.stopPropagation(); el.classList.remove('down'); if (performance.now() - downAt < 800) fn(e); });
  el.addEventListener('pointerleave', () => el.classList.remove('down'));
  return el;
}
export function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
