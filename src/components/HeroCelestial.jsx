import React, { useEffect, useRef } from 'react';

// ============================================================================
// PALETTE & WORD COLOR CURSOR ENGINE (OFFICIAL SOURCE)
// ============================================================================
const PALETTE_HEX = ['#3B82F6', '#EF4444', '#FCD34D', '#22C55E', '#A855F7', '#FFFFFF'];

let wordColorCursor = 0;
function nextWordColor() {
  const color = PALETTE_HEX[wordColorCursor % PALETTE_HEX.length];
  wordColorCursor++;
  return color;
}

export default function HeroCelestial() {
  const canvasRef = useRef(null);
  const titleRef = useRef(null);
  const ctaBtnRef = useRef(null);
  const buttonLightRef = useRef(null);

  // Reset cursor before rendering so colors are deterministically mapped
  wordColorCursor = 0;

  // 1. Helper to render multicolor eyebrow words
  const renderEyebrow = () => {
    const text = 'FIRMA DE INGENIERÍA DIGITAL & SOBERANÍA TECNOLÓGICA';
    const words = text.split(' ');
    return words.map((word, idx) => {
      const color = nextWordColor();
      return (
        <span key={idx} style={{ color, fontWeight: 700 }}>
          {word}{idx < words.length - 1 ? ' ' : ''}
        </span>
      );
    });
  };

  // 2. Helper to render headline lines with per-word colors and per-char liquid spans
  const renderHeadlineLine = (lineText, lineClass) => {
    const words = lineText.split(' ');
    return (
      <span className={`hero-celestial__title-line ${lineClass}`}>
        {words.map((word, wIdx) => {
          const color = nextWordColor();
          return (
            <span key={wIdx} className="hero__word-wrap">
              {word.split('').map((char, cIdx) => (
                <span key={cIdx} className="hero__char" style={{ color }}>
                  {char}
                </span>
              ))}
              {wIdx < words.length - 1 && <span className="hero__space">&nbsp;</span>}
            </span>
          );
        })}
      </span>
    );
  };

  // 3. Helper to render lead words
  const renderLeadWords = () => {
    const highlightWords = ['Tu', 'sitio.', 'Tu', 'código.', 'Tus', 'cuentas.', 'Siempre.'];
    const bodyWords = ['Desarrollamos', 'plataformas', 'web', 'y', 'sistemas', 'a', 'la', 'medida', 'con', 'validación', 'técnica', 'determinista.'];

    return (
      <>
        <strong className="hero-celestial__copy-highlight">
          {highlightWords.map((word, idx) => {
            const color = nextWordColor();
            return (
              <span key={idx} style={{ color }}>
                {word}{idx < highlightWords.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </strong>
        <br className="hero-celestial__copy-break" />
        {bodyWords.map((word, idx) => {
          const color = nextWordColor();
          return (
            <span key={idx} style={{ color }}>
              {word}{idx < bodyWords.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </>
    );
  };

  // Canvas & Physics lifecycle
  useEffect(() => {
    // ------------------------------------------------------------------------
    // 1. CELESTIAL CANVAS: 2 ORBITAL RINGS & CONSTELLATION PARTICLES (HOMEX/HOMEY)
    // ------------------------------------------------------------------------
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpi = 1;
    let frameId = null;
    let isVisible = false;
    let time = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, rawX: -9999, rawY: -9999 };
    const particles = [];
    const particleCount = 85;

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        const homeX = Math.random() * width;
        const homeY = Math.random() * height;
        particles.push({
          homeX: homeX,
          homeY: homeY,
          x: homeX,
          y: homeY,
          vx: 0,
          vy: 0,
          size: 0.8 + Math.random() * 1.6,
          color: PALETTE_HEX[i % PALETTE_HEX.length],
          baseAlpha: 0.15 + Math.random() * 0.45,
          twinkleSpeed: 0.012 + Math.random() * 0.03,
          twinklePhase: Math.random() * Math.PI * 2,
          depth: 0.2 + Math.random() * 0.8
        });
      }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpi = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpi);
      canvas.height = Math.floor(height * dpi);
      ctx.scale(dpi, dpi);
      if (particles.length === 0) initParticles();
      else {
        for (let i = 0; i < particles.length; i++) {
          particles[i].homeX = Math.random() * width;
          particles[i].homeY = Math.random() * height;
        }
      }
    }

    function drawCelestial() {
      if (!isVisible) return;
      ctx.clearRect(0, 0, width, height);

      time += 0.015;
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      const centerX = width * 0.5 + mouse.x * 24;
      const centerY = height * 0.46 + mouse.y * 18;

      // 2 Architectural Orbital Rings rotating in opposite directions
      ctx.save();

      // Ring 1 (Inner, Clockwise)
      const ring1Radius = Math.min(width, height) * 0.26;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ring1Radius, time * 0.008, time * 0.008 + Math.PI * 2);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.09)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([8, 14]);
      ctx.stroke();

      // Ring 2 (Outer, Counter-Clockwise / Opposite Direction)
      const ring2Radius = Math.min(width, height) * 0.48;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ring2Radius, -time * 0.012, -time * 0.012 + Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.07)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 18]);
      ctx.stroke();

      ctx.restore();

      // Constellation Particles with Cursor Repulsion & Home Elastic Return
      const interactionRadius = 110;
      const forceIntensity = 2.4;
      const springK = 0.04;
      const damping = 0.88;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reducedMotion) {
          // Cursor repulsion
          const dx = mouse.rawX - p.x;
          const dy = mouse.rawY - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < interactionRadius && dist > 0) {
            const f = (1 - dist / interactionRadius) * forceIntensity;
            p.vx -= (dx / dist) * f;
            p.vy -= (dy / dist) * f;
          }

          // Elastic spring return to home position
          const sX = (p.homeX - p.x) * springK;
          const sY = (p.homeY - p.y) * springK;

          p.vx = (p.vx + sX) * damping;
          p.vy = (p.vy + sY) * damping;

          p.x += p.vx;
          p.y += p.vy;
        }

        const twinkle = Math.sin(time * p.twinkleSpeed * 60 + p.twinklePhase);
        const alpha = Math.max(0.08, Math.min(0.85, p.baseAlpha + twinkle * 0.2));
        const renderX = p.x + mouse.x * (p.depth * 20);
        const renderY = p.y + mouse.y * (p.depth * 20);

        ctx.save();
        ctx.beginPath();
        ctx.arc(renderX, renderY, p.size, 0, Math.PI * 2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 3;
        ctx.fill();
        ctx.restore();
      }

      if (!reducedMotion) {
        frameId = requestAnimationFrame(drawCelestial);
      }
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible && !frameId && !reducedMotion) {
          frameId = requestAnimationFrame(drawCelestial);
        } else if (!isVisible && frameId) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
      });
    }, { threshold: 0.05 });

    observer.observe(canvas);
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const onPointerMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth) - 0.5;
      mouse.targetY = (e.clientY / window.innerHeight) - 0.5;
      const rect = canvas.getBoundingClientRect();
      mouse.rawX = e.clientX - rect.left;
      mouse.rawY = e.clientY - rect.top;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    drawCelestial();

    // ------------------------------------------------------------------------
    // 2. HEADLINE PHYSICAL SPRING LIQUID PERTURBATION
    // ------------------------------------------------------------------------
    const title = titleRef.current;
    const chars = title ? Array.from(title.querySelectorAll('.hero__char')) : [];
    let isHoveringTitle = false;
    let charPhysicsFrame = null;

    if (title && chars.length > 0 && !reducedMotion) {
      const charStates = chars.map(() => ({
        targetY: 0,
        currentY: 0,
        targetScaleX: 1,
        currentScaleX: 1,
        targetScaleY: 1,
        currentScaleY: 1,
        targetSkew: 0,
        currentSkew: 0
      }));

      function updateCharPhysics() {
        let needsUpdate = false;

        for (let i = 0; i < chars.length; i++) {
          const s = charStates[i];
          const elem = chars[i];

          s.currentY += (s.targetY - s.currentY) * 0.15;
          s.currentScaleX += (s.targetScaleX - s.currentScaleX) * 0.15;
          s.currentScaleY += (s.targetScaleY - s.currentScaleY) * 0.15;
          s.currentSkew += (s.targetSkew - s.currentSkew) * 0.15;

          if (
            Math.abs(s.targetY - s.currentY) > 0.05 ||
            Math.abs(s.targetScaleY - s.currentScaleY) > 0.005 ||
            Math.abs(s.targetSkew - s.currentSkew) > 0.05
          ) {
            needsUpdate = true;
          }

          elem.style.transform = `translateY(${s.currentY.toFixed(2)}px) scale(${s.currentScaleX.toFixed(3)}, ${s.currentScaleY.toFixed(3)}) skewX(${s.currentSkew.toFixed(2)}deg)`;
        }

        if (isHoveringTitle || needsUpdate) {
          charPhysicsFrame = requestAnimationFrame(updateCharPhysics);
        }
      }

      const onTitlePointerMove = (e) => {
        isHoveringTitle = true;
        const cursorX = e.clientX;
        const cursorY = e.clientY;

        for (let i = 0; i < chars.length; i++) {
          const charRect = chars[i].getBoundingClientRect();
          const charCenterX = charRect.left + charRect.width / 2;
          const charCenterY = charRect.top + charRect.height / 2;

          const dx = cursorX - charCenterX;
          const dy = cursorY - charCenterY;
          const dist = Math.hypot(dx, dy);

          const RADIUS = 95;
          if (dist < RADIUS) {
            const factor = Math.cos((dist / RADIUS) * (Math.PI / 2));
            charStates[i].targetY = -8.0 * factor;
            charStates[i].targetScaleY = 1 + (0.16 * factor);
            charStates[i].targetScaleX = 1 - (0.06 * factor);
            charStates[i].targetSkew = (dx > 0 ? -3.5 : 3.5) * factor;
          } else {
            charStates[i].targetY = 0;
            charStates[i].targetScaleX = 1;
            charStates[i].targetScaleY = 1;
            charStates[i].targetSkew = 0;
          }
        }
        if (!charPhysicsFrame) {
          charPhysicsFrame = requestAnimationFrame(updateCharPhysics);
        }
      };

      const onTitlePointerLeave = () => {
        isHoveringTitle = false;
        for (let i = 0; i < chars.length; i++) {
          charStates[i].targetY = 0;
          charStates[i].targetScaleX = 1;
          charStates[i].targetScaleY = 1;
          charStates[i].targetSkew = 0;
        }
        if (!charPhysicsFrame) {
          charPhysicsFrame = requestAnimationFrame(updateCharPhysics);
        }
      };

      title.addEventListener('pointermove', onTitlePointerMove, { passive: true });
      title.addEventListener('pointerleave', onTitlePointerLeave);
    }

    // ------------------------------------------------------------------------
    // 3. CTA BUTTON CURSOR LIGHT TRACKING & SUBTLE MAGNETISM
    // ------------------------------------------------------------------------
    const ctaBtn = ctaBtnRef.current;
    const buttonLight = buttonLightRef.current;

    if (ctaBtn && buttonLight) {
      const onCtaPointerMove = (e) => {
        const rect = ctaBtn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        buttonLight.style.left = `${x}px`;
        buttonLight.style.top = `${y}px`;

        if (!reducedMotion) {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const magX = (x - centerX) * 0.08;
          const magY = (y - centerY) * 0.08;
          ctaBtn.style.transform = `translate(${magX.toFixed(1)}px, ${magY.toFixed(1)}px) scale(1.01)`;
        }
      };

      const onCtaPointerLeave = () => {
        if (!reducedMotion) {
          ctaBtn.style.transform = 'translate(0px, 0px) scale(1)';
        }
      };

      ctaBtn.addEventListener('pointermove', onCtaPointerMove, { passive: true });
      ctaBtn.addEventListener('pointerleave', onCtaPointerLeave);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      if (frameId) cancelAnimationFrame(frameId);
      if (charPhysicsFrame) cancelAnimationFrame(charPhysicsFrame);
    };
  }, []);

  return (
    <section className="hero-celestial" id="hero-celestial">
      {/* Celestial Background Canvas: 2 Orbital Rings & Constellation Particles */}
      <div className="hero-celestial__canvas-wrap" aria-hidden="true">
        <canvas ref={canvasRef} id="hero-celestial-canvas" className="hero-celestial__canvas" />
        <div className="hero-celestial__contrast-mask" />
      </div>

      {/* Decorative Hexagons (Left & Right) */}
      <div className="hero__hex hero__hex--left" aria-hidden="true" />
      <div className="hero__hex hero__hex--right" aria-hidden="true" />

      <div className="container hero-celestial__content">
        
        {/* EYEBROW MULTICOLOR */}
        <div className="hero-celestial__eyebrow-wrap reveal">
          <span className="hero-celestial__eyebrow">
            <span className="hero-celestial__eyebrow-dot" />
            {renderEyebrow()}
          </span>
        </div>

        {/* HEADLINE INTERACTIVO MULTICOLOR (PERTURBACIÓN FÍSICA LÍQUIDA) */}
        <h1 ref={titleRef} className="hero-celestial__title" id="hero-title" aria-label="Ingeniería Digital. Soberanía Total.">
          {renderHeadlineLine('INGENIERÍA DIGITAL.', 'hero-celestial__title-line--1')}
          {renderHeadlineLine('SOBERANÍA TOTAL.', 'hero-celestial__title-line--2')}
        </h1>

        {/* SUBTÍTULO / COPY MULTICOLOR */}
        <p className="hero-celestial__copy">
          {renderLeadWords()}
        </p>

        {/* CTA PREMIUM REFINADO */}
        <div className="hero-celestial__actions">
          <a
            ref={ctaBtnRef}
            className="hero__button"
            href="/contacto"
            id="hero-cta-btn"
            aria-label="Iniciar Proyecto"
          >
            {/* 1. Aura exterior contenida */}
            <span className="hero__button-aura" aria-hidden="true" />
            {/* 2. Borde multicolor refinado (1.2px) */}
            <span className="hero__button-border" aria-hidden="true" />
            {/* 3. Núcleo oscuro + Luz interna que sigue al cursor */}
            <span className="hero__button-inner">
              <span ref={buttonLightRef} className="hero__button-light" id="hero-button-light" aria-hidden="true" />
              <span className="hero__button-text">INICIAR PROYECTO</span>
              <svg className="hero__button-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </a>
        </div>

      </div>
    </section>
  );
}
