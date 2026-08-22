/* ==========================================================================
   GRUPO CASTILLO — CASTLE IMPACT CLIENT INTERACTIONS (v1.1.0)
   ========================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initMobileNavigation();
  initImpactForm();
});

/* --------------------------------------------------------------------------
   Helpers: DOM Sanitization & Insertion (Zero-XSS)
   -------------------------------------------------------------------------- */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function appendHtmlSafely(targetElement, htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const nodes = Array.from(doc.body.childNodes);
  for (const node of nodes) {
    targetElement.appendChild(document.importNode(node, true));
  }
}

function clearContainer(targetElement) {
  while (targetElement.firstChild) {
    targetElement.removeChild(targetElement.firstChild);
  }
}

/* --------------------------------------------------------------------------
   1. Mobile Navigation Toggle
   -------------------------------------------------------------------------- */
function initMobileNavigation() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    navMenu.classList.toggle('active');
  });

  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* --------------------------------------------------------------------------
   2. Accessible Castle Impact Postulation Form Handler
   -------------------------------------------------------------------------- */
function initImpactForm() {
  const form = document.getElementById('impact-form');
  const formFeedback = document.getElementById('impact-form-feedback');

  if (!form || !formFeedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const orgName = document.getElementById('org-name').value.trim();
    const repName = document.getElementById('rep-name').value.trim();
    const repEmail = document.getElementById('rep-email').value.trim();
    const repPhone = document.getElementById('rep-phone') ? document.getElementById('rep-phone').value.trim() : '';
    const orgMission = document.getElementById('org-mission').value.trim();
    const orgNeed = document.getElementById('org-need').value.trim();
    const orgJustification = document.getElementById('org-justification').value.trim();
    const acceptTerms = document.getElementById('accept-terms').checked;

    if (!orgName || !repName || !repEmail || !orgMission || !orgNeed || !orgJustification || !acceptTerms) {
      clearContainer(formFeedback);
      appendHtmlSafely(formFeedback, '<div style="padding: 14px; background: rgba(255, 59, 92, 0.12); border: 1px solid var(--status-blocked); border-radius: var(--radius-sm); color: var(--status-blocked); margin-bottom: 16px; font-size: 0.9rem;">Por favor completa todos los campos requeridos (*) y acepta los términos del programa.</div>');
      return;
    }

    const safeOrg = escapeHtml(orgName);
    const safeRep = escapeHtml(repName);
    const safeEmail = escapeHtml(repEmail);

    form.style.display = 'none';
    clearContainer(formFeedback);
    const feedbackHtml = `
      <div class="glass-panel" style="padding: 36px 28px; border-color: var(--status-pass); text-align: center;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--status-pass-bg); border: 1px solid var(--status-pass); color: var(--status-pass); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h4 style="color: var(--text-primary); font-size: 1.35rem; margin-bottom: 8px;">Postulación Registrada</h4>
        <p style="color: var(--text-secondary); font-size: 0.96rem; margin-bottom: 14px;">
          Gracias <strong>${safeRep}</strong>. Hemos registrado la información de <strong>${safeOrg}</strong> para evaluación técnica.
        </p>
        <p style="color: var(--text-muted); font-size: 0.86rem; line-height: 1.6; max-width: 500px; margin: 0 auto;">
          El equipo de ingeniería de Grupo Castillo analizará la viabilidad técnica y los antecedentes de la solicitud. En caso de preselección para la fase de diagnóstico, te contactaremos a través de <strong>${safeEmail}</strong>.
        </p>
      </div>
    `;
    appendHtmlSafely(formFeedback, feedbackHtml);
  });
}
