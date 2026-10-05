// Utilitários de interface compartilhados pelas telas

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function fmtDate(iso, { weekday = true } = {}) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  const base = `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`;
  return weekday ? `${WD[d.getDay()]}, ${base}` : base;
}

export function relDay(iso, todayIso, tomorrowIso) {
  if (iso === todayIso) return 'Hoje';
  if (iso === tomorrowIso) return 'Amanhã';
  return fmtDate(iso);
}

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer;
export function toast(msg, type = '') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 3200);
}

let sheetCleanup = null;
export function openSheet(title, bodyHtml, onMount) {
  const sheet = $('#sheet');
  sheet.innerHTML = `
    <div class="grab"></div>
    <div class="sheet-head"><h2>${esc(title)}</h2><button type="button" class="close" aria-label="Fechar" data-close>×</button></div>
    <div class="sheet-body">${bodyHtml}</div>`;
  sheet.hidden = false;
  $('#sheet-backdrop').hidden = false;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  sheetCleanup = onMount ? onMount(sheet) : null;
  sheet.querySelector('input, select, textarea, button:not([data-close])')?.focus();
}

export function closeSheet() {
  $('#sheet').hidden = true;
  $('#sheet-backdrop').hidden = true;
  $('#sheet').innerHTML = '';
  if (typeof sheetCleanup === 'function') sheetCleanup();
  sheetCleanup = null;
}

export const searchIcon = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1 1 10 2Zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"/></svg>`;

export function loading(el) {
  el.innerHTML = '<p class="muted center" style="padding:40px 0">Carregando…</p>';
}

export const typeTag = (type) => {
  const cls = { Edital: 'warn', Oportunidade: 'ok', Palestra: 'accent', Curso: 'accent' }[type] || '';
  return `<span class="tag ${cls}">${esc(type)}</span>`;
};

export const statusTag = (status, label) => {
  const cls = { aprovada: 'ok', em_analise: 'warn', enviada: '', recusada: 'danger', cancelada: '' }[status] || '';
  return `<span class="tag ${cls}">${esc(label)}</span>`;
};

// Debounce para buscas
export function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
