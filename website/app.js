/* ==========================================================================
   GRUPO CASTILLO — CLIENT-SIDE INTERACTIONS & TERMINAL DEMO (v1.1.0)
   ========================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initMobileNavigation();
  initTerminalDemo();
  initFaqAccordion();
  initContactForm();
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
   2. Terminal Demo Simulation Steps (Static Definition)
   -------------------------------------------------------------------------- */
const DEMO_STEPS = [
  {
    delay: 300,
    content: '<div class="terminal-line"><span class="t-prompt">$</span> <span class="t-cmd">castle-gate scan --dir ./api-service --level C1 --project api-service</span></div>'
  },
  {
    delay: 800,
    content: '<div class="terminal-line t-muted">Executing Castle Native Probes (SecurityProbe, DomSemanticsProbe, AstProbe, GitHistoryProbe)...</div>'
  },
  {
    delay: 1400,
    content: '<div class="terminal-line t-blocked">================================================================</div><div class="terminal-line t-blocked">Castle Native Probes Scan &amp; Gate Evaluation: [C1]</div><div class="terminal-line t-muted">Target Project:     api-service (production)</div><div class="terminal-line t-muted">Files Scanned:      18 | Duration: 95 ms</div><div class="terminal-line t-muted">Evidence SHA-256:   d4e1a8b0cc1289fe...</div><div class="terminal-line t-muted">----------------------------------------------------------------</div><div class="terminal-line t-muted">CQS Raw Score:      55.00 / 100.00</div><div class="terminal-line t-blocked">Gate Breakers:      BLOCKED (Mandatory Release Veto)</div><div class="terminal-line t-blocked">Gate Decision:      BLOCKED (Exit Code 1)</div><div class="terminal-line t-warn"><br>BLOCKERS / DEFICIENCIES:</div><div class="terminal-line t-warn">  1. [GB-01] Critical Secret Exposure (AWS Secret Key in config.js:14)</div><div class="terminal-line t-blocked">================================================================</div>'
  },
  {
    delay: 2600,
    content: '<div class="terminal-line" style="margin-top:12px;"><span class="t-prompt">$</span> <span class="t-cmd"># Remediating: Extracted secret to environment store &amp; updated .env.example</span></div>'
  },
  {
    delay: 3400,
    content: '<div class="terminal-line"><span class="t-prompt">$</span> <span class="t-cmd">castle-gate scan --dir ./api-service --level C1 --project api-service --sign --key ./keys/release.pem</span></div>'
  },
  {
    delay: 4000,
    content: '<div class="terminal-line t-muted">Executing Castle Native Probes &amp; evaluating CQS v1.1 Frozen Rules (88 ms)...</div>'
  },
  {
    delay: 4600,
    content: '<div class="terminal-line t-pass">================================================================</div><div class="terminal-line t-pass">Castle Native Probes Scan &amp; Gate Evaluation: [C1]</div><div class="terminal-line t-muted">Target Project:     api-service (production)</div><div class="terminal-line t-muted">Files Scanned:      18 | Duration: 88 ms</div><div class="terminal-line t-muted">Evidence SHA-256:   7a8ab80fb19a1057...</div><div class="terminal-line t-muted">----------------------------------------------------------------</div><div class="terminal-line t-pass">CQS Raw Score:      95.00 / 100.00</div><div class="terminal-line t-pass">Gate Breakers:      CLEARED (0 Active)</div><div class="terminal-line t-pass">Gate Decision:      PASSED (Exit Code 0)</div><div class="terminal-line t-pass"><br>RELEASE AUTHORIZED: Certificate ID REL-CERT-C1-1787088219000</div><div class="terminal-line t-pass">================================================================</div>'
  },
  {
    delay: 5400,
    content: '<div class="terminal-line" style="margin-top:12px;"><span class="t-prompt">$</span> <span class="t-cmd">castle-gate verify-cert --cert .castle/release-certificate.json</span></div>'
  },
  {
    delay: 6000,
    content: '<div class="terminal-line t-pass">[CERTIFICATE VALID] EVAL-1787088219000 authorized for release on "api-service" (production).</div><div class="terminal-line t-muted">  Canonical Algorithm: RFC-8785-JCS</div><div class="terminal-line t-muted">  Certificate Digest:  64a23778bb5ebf14594e8efd675ec3fff840c3763cb31df09cdb8ca4966aa538</div><div class="terminal-line t-muted">  Signature Mode:      ED25519_ASYMMETRIC_SIGNED (Key ID: 3d61237a...)</div><div class="terminal-line t-muted">  Policy Applied:      POL-C1-v1.0.0 (Policy SHA: 835c6a86...)</div>'
  }
];

function initTerminalDemo() {
  const terminalBody = document.getElementById('terminal-body');
  const runDemoBtn = document.getElementById('btn-run-demo');
  const resetDemoBtn = document.getElementById('btn-reset-demo');

  if (!terminalBody || !runDemoBtn) return;

  let isRunning = false;
  let timeouts = [];

  function clearTimeouts() {
    timeouts.forEach(t => clearTimeout(t));
    timeouts = [];
  }

  function startDemo() {
    if (isRunning) return;
    isRunning = true;
    runDemoBtn.disabled = true;
    runDemoBtn.textContent = 'Ejecutando escaneo...';
    clearContainer(terminalBody);

    DEMO_STEPS.forEach((step, index) => {
      const t = setTimeout(() => {
        appendHtmlSafely(terminalBody, step.content);
        terminalBody.scrollTop = terminalBody.scrollHeight;
        if (index === DEMO_STEPS.length - 1) {
          isRunning = false;
          runDemoBtn.disabled = false;
          runDemoBtn.textContent = 'Reiniciar Demostración';
        }
      }, step.delay);
      timeouts.push(t);
    });
  }

  runDemoBtn.addEventListener('click', () => {
    clearTimeouts();
    isRunning = false;
    startDemo();
  });

  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      clearTimeouts();
      isRunning = false;
      clearContainer(terminalBody);
      appendHtmlSafely(terminalBody, '<div class="terminal-line t-muted">// Terminal lista. Haz clic en "Ejecutar Demo en Vivo" para ver el flujo real.</div>');
      runDemoBtn.disabled = false;
      runDemoBtn.textContent = 'Ejecutar Demo en Vivo';
    });
  }
}

/* --------------------------------------------------------------------------
   3. FAQ Accordion
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      faqItems.forEach(other => {
        other.classList.remove('active');
        const otherBtn = other.querySelector('.faq-question');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. Accessible Contact / Lead Capture Form Handler
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');

  if (!form || !formFeedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('client-name').value.trim();
    const email = document.getElementById('client-email').value.trim();
    const company = document.getElementById('client-company').value.trim();
    const service = document.getElementById('client-service').value;

    if (!name || !email || !company) {
      clearContainer(formFeedback);
      appendHtmlSafely(formFeedback, '<div style="padding: 14px; background: rgba(255, 59, 92, 0.12); border: 1px solid var(--status-blocked); border-radius: var(--radius-sm); color: var(--status-blocked); margin-bottom: 16px; font-size: 0.9rem;">Por favor completa todos los campos requeridos (*).</div>');
      return;
    }

    const safeName = escapeHtml(name);
    const safeCompany = escapeHtml(company);
    const safeService = escapeHtml(service);

    form.style.display = 'none';
    clearContainer(formFeedback);
    const feedbackHtml = `
      <div class="glass-panel" style="padding: 32px 24px; border-color: var(--status-pass); text-align: center;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--status-pass-bg); border: 1px solid var(--status-pass); color: var(--status-pass); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin: 0 auto 16px;">✓</div>
        <h4 style="color: var(--text-primary); font-size: 1.3rem; margin-bottom: 8px;">Solicitud Registrada con Éxito</h4>
        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 12px;">
          Gracias <strong>${safeName}</strong>. Hemos registrado los datos de <strong>${safeCompany}</strong> para <strong>${safeService}</strong>.
        </p>
        <p style="color: var(--text-muted); font-size: 0.85rem;">
          Un consultor técnico senior de Grupo Castillo te contactará en menos de 24 horas hábiles.
        </p>
      </div>
    `;
    appendHtmlSafely(formFeedback, feedbackHtml);
  });
}
