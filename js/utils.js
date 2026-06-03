import { BELT_LABELS } from './supabase-config.js';

export function qs(id) {
  return document.getElementById(id);
}

export function toast(message, type = 'ok') {
  const el = qs('toast');
  if (!el) return;
  el.textContent = message;
  el.className = `toast show ${type === 'error' ? 'error' : ''}`;
  setTimeout(() => {
    el.className = 'toast';
  }, 2600);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
}

export function formatDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('pt-BR');
}

export function onlyDigits(value = '') {
  return value.replace(/\D/g, '');
}

export function whatsappLink(phone = '') {
  const clean = onlyDigits(phone);
  return clean ? `https://wa.me/55${clean}` : '#';
}

export function beltText(faixa, grau = 0) {
  const label = BELT_LABELS[faixa] || faixa;
  return `${label} ${grau ? `· ${grau}º grau` : ''}`.trim();
}

export function frequencyPct(presencas = 0, faltas = 0) {
  const total = presencas + faltas;
  return total ? Math.round((presencas / total) * 100) : 0;
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
