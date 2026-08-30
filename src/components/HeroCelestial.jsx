import { useEffect, useRef, useState } from "react";

const headline = ["INGENIERÍA DIGITAL.", "SOBERANÍA TOTAL."];
const EYEBROW_TEXT = "Firma de Ingeniería Digital & Soberanía Tecnológica";
const LEAD_TEXT =
  "Tu sitio. Tu código. Tus cuentas. Siempre. Desarrollamos plataformas web y sistemas a la medida con validación técnica determinista.";

// Misma paleta de 6 colores que usan las partículas del canvas.
const PALETTE_HEX = ["#3B82F6", "#EF4444", "#FCD34D", "#22C55E", "#A855F7", "#FFFFFF"];

export default function HeroCelestial() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const buttonRef = useRef(null);
  const letterEls = useRef([]);
  const pointerRef = useRef({ x: -1000, y: -1000, active: false });
  const entranceDoneRef = useRef(false);
  const [entered, setEntered] = useState(false);
  const [liquid, setLiquid] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    let frame = 0;
    let active = false;
    let particles = [];
    const pointer = pointerRef.current;
    const palette = [[59,130,246],[239,68,68],[250,204,21],[34,197,94],[168,85,247],[255,255,255]];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = section.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = rect.width < 640 ? 34 : 42;
      particles = [];

      for (let y = gap / 2, row = 0; y < rect.height; y += gap * 0.86, row += 1) {
        for (let x = gap / 2; x < rect.width; x += gap) {
          const homeX = x + (row % 2 ? gap / 2 : 0);
          if (homeX < rect.width) {
            particles.push({
              x: homeX, y, homeX, homeY: y, vx: 0, vy: 0,
              phase: Math.random() * 6.28,
              twinkleSpeed: 0.35 + Math.random() * 0.9,
              color: palette[Math.floor(Math.random() * palette.length)],
              ring: false,
            });
          }
        }
      }

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const shortSide = Math.min(rect.width, rect.height);
      const rings = [
        { radius: shortSide * 0.34, speed: 0.00028 },
        { radius: shortSide * 0.46, speed: -0.00019 },
      ];
      rings.forEach(({ radius, speed }) => {
        const spacing = rect.width < 640 ? 12 : 15;
        const count = Math.max(40, Math.floor((2 * Math.PI * radius) / spacing));
        for (let i = 0; i < count; i += 1) {
          const angle = (i / count) * Math.PI * 2;
          particles.push({
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius,
            homeX: cx + Math.cos(angle) * radius,
            homeY: cy + Math.sin(angle) * radius,
            vx: 0, vy: 0,
            phase: Math.random() * 6.28,
            twinkleSpeed: 0.35 + Math.random() * 0.9,
            color: palette[Math.floor(Math.random() * palette.length)],
            ring: true,
            angle, cx, cy, radius, ringSpeed: speed,
          });
        }
      });
    };

    const draw = (time = 0) => {
      if (!active) return;
      const rect = section.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        if (!reduced) {
          if (p.ring) {
            p.angle += p.ringSpeed;
            p.homeX = p.cx + Math.cos(p.angle) * p.radius;
            p.homeY = p.cy + Math.sin(p.angle) * p.radius;
          }
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distance = Math.max(Math.hypot(dx, dy), 1);
          if (pointer.active && distance < 170) {
            const force = (170 - distance) / 170;
            p.vx += (dx / distance) * force * 2.1;
            p.vy += (dy / distance) * force * 2.1;
          }
          p.vx += (p.homeX - p.x) * 0.016;
          p.vy += (p.homeY - p.y) * 0.016;
          p.vx *= 0.9;
          p.vy *= 0.9;
          p.x += p.vx;
          p.y += p.vy;
        }
        const offset = Math.hypot(p.x - p.homeX, p.y - p.homeY);
        const base = p.ring ? 0.3 : 0.18;
        const twinkle = Math.sin(time * 0.001 * p.twinkleSpeed + p.phase) * 0.12;
        const intensity = reduced ? (p.ring ? 0.5 : 0.32) : base + twinkle + Math.min(offset / 90, 0.5);
        const size = (p.ring ? 1.5 : 0.8) + Math.min(offset / 60, 1.4);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${Math.min(Math.max(intensity, 0.05), 0.85)})`;
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    const onPointer = (event) => {
      const rect = section.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
      section.style.setProperty("--cursor-x", `${pointer.x}px`);
      section.style.setProperty("--cursor-y", `${pointer.y}px`);
    };

    const onLeave = () => { pointer.active = false; };

    const observer = new IntersectionObserver(([entry]) => {
      setEntered(entry.isIntersecting);
      active = entry.isIntersecting;
      if (active) {
        frame = requestAnimationFrame(draw);
        if (!entranceDoneRef.current) {
          setTimeout(() => { entranceDoneRef.current = true; setLiquid(true); }, 1600);
        }
      } else {
        cancelAnimationFrame(frame);
      }
    }, { threshold: 0.08 });

    resize();
    observer.observe(section);
    window.addEventListener("resize", resize, { passive: true });
    section.addEventListener("pointermove", onPointer, { passive: true });
    section.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      section.removeEventListener("pointermove", onPointer);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const section = sectionRef.current;
    if (!section) return;
    const letters = letterEls.current.filter(Boolean);
    if (!letters.length) return;

    let localCenters = [];
    const measure = () => {
      const sRect = section.getBoundingClientRect();
      localCenters = letters.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - sRect.left, y: r.top + r.height / 2 - sRect.top };
      });
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });

    const states = letters.map(() => ({ tx: 0, ty: 0, sx: 1, sy: 1, skew: 0, vtx: 0, vty: 0, vsx: 0, vsy: 0, vskew: 0 }));
    const RADIUS = 130;
    let frame = 0;
    let running = false;

    const spring = (s, key, vk, target, k, d) => {
      const force = (target - s[key]) * k;
      s[vk] = (s[vk] + force) * d;
      s[key] += s[vk];
    };

    const tick = (time) => {
      if (!entranceDoneRef.current) { running = false; return; }
      const p = pointerRef.current;
      let needsMore = false;
      for (let i = 0; i < letters.length; i += 1) {
        const c = localCenters[i];
        const s = states[i];
        if (!c) continue;
        let tx = 0, ty = 0, sx = 1, sy = 1, skew = 0;
        if (p.active) {
          const dx = c.x - p.x;
          const dy = c.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < RADIUS) {
            const inf = Math.pow(1 - dist / RADIUS, 2);
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            tx = nx * inf * 12;
            ty = ny * inf * 12 + Math.sin(time * 0.004 + i) * inf * 5;
            sx = 1 - inf * 0.12;
            sy = 1 + inf * 0.28;
            skew = nx * inf * 7;
          }
        }
        spring(s, "tx", "vtx", tx, 0.12, 0.7);
        spring(s, "ty", "vty", ty, 0.12, 0.7);
        spring(s, "sx", "vsx", sx, 0.12, 0.7);
        spring(s, "sy", "vsy", sy, 0.12, 0.7);
        spring(s, "skew", "vskew", skew, 0.12, 0.7);
        letters[i].style.transform = `translate(${s.tx.toFixed(2)}px, ${s.ty.toFixed(2)}px) scale(${s.sx.toFixed(3)}, ${s.sy.toFixed(3)}) skewX(${s.skew.toFixed(2)}deg)`;
        if (p.active || Math.abs(s.vtx) > 0.04 || Math.abs(s.vty) > 0.04 || Math.abs(s.vsx) > 0.004 || Math.abs(s.vsy) > 0.004 || Math.abs(s.vskew) > 0.04 || Math.abs(s.tx) > 0.1 || Math.abs(s.ty) > 0.1 || Math.abs(s.skew) > 0.1) {
          needsMore = true;
        }
      }
      if (needsMore) frame = requestAnimationFrame(tick);
      else running = false;
    };

    const start = () => {
      if (!entranceDoneRef.current || running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    section.addEventListener("pointermove", start, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      section.removeEventListener("pointermove", start);
    };
  }, []);

  const moveButton = (event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    button.style.setProperty("--mx", `${(event.clientX - rect.left - rect.width / 2) * 0.14}px`);
    button.style.setProperty("--my", `${(event.clientY - rect.top - rect.height / 2) * 0.18}px`);
    button.style.setProperty("--bx", `${event.clientX - rect.left}px`);
    button.style.setProperty("--by", `${event.clientY - rect.top}px`);
  };

  const resetButton = () => {
    buttonRef.current?.style.setProperty("--mx", "0px");
    buttonRef.current?.style.setProperty("--my", "0px");
  };

  // --- Render helpers: colores por palabra + refs de letras para el efecto líquido ---
  // wordColorCursor y letterRefCursor son locales a cada render; el orden de
  // renderizado (eyebrow -> headline -> lead) determina el ciclo de colores
  // y el orden en el que las letras se registran en letterEls.
  let wordColorCursor = 0;
  const nextWordColor = () => {
    const color = PALETTE_HEX[wordColorCursor % PALETTE_HEX.length];
    wordColorCursor += 1;
    return color;
  };

  let letterRefCursor = 0;
  const pushLetterRef = (el) => {
    letterEls.current[letterRefCursor] = el;
    letterRefCursor += 1;
  };

  // Eyebrow: mismo efecto letra-por-letra + líquido que el titular, con color por palabra.
  const renderEyebrow = (text) => {
    let currentColor = nextWordColor();
    return text.split("").map((ch, i) => {
      const delay = `${i * 0.012}s`;
      if (ch === " ") {
        currentColor = nextWordColor();
        return (
          <span
            className="hero__letter hero__letter--eyebrow"
            style={{ "--delay": delay }}
            aria-hidden="true"
            key={`eb-sp-${i}`}
            ref={pushLetterRef}
          >
            {"\u00a0"}
          </span>
        );
      }
      return (
        <span
          className="hero__letter hero__letter--eyebrow"
          style={{ "--delay": delay, color: currentColor }}
          aria-hidden="true"
          key={`eb-${i}`}
          ref={pushLetterRef}
        >
          {ch}
        </span>
      );
    });
  };

  // Titular: conserva el esquema de delay original (lineIndex + index de línea), agrega color por palabra.
  const renderHeadlineLine = (line, lineIndex) => {
    let currentColor = nextWordColor();
    return line.split("").map((ch, index) => {
      const delay = `${lineIndex * 0.12 + index * 0.018}s`;
      if (ch === " ") {
        currentColor = nextWordColor();
        return (
          <span
            className="hero__letter"
            style={{ "--delay": delay }}
            aria-hidden="true"
            key={`hl-sp-${lineIndex}-${index}`}
            ref={pushLetterRef}
          >
            {"\u00a0"}
          </span>
        );
      }
      return (
        <span
          className="hero__letter"
          style={{ "--delay": delay, color: currentColor }}
          aria-hidden="true"
          key={`hl-${lineIndex}-${index}`}
          ref={pushLetterRef}
        >
          {ch}
        </span>
      );
    });
  };

  // Lead: solo color por palabra (conserva la animación de entrada en bloque existente).
  const renderLeadWords = (text) => {
    const words = text.split(" ");
    const nodes = [];
    words.forEach((word, i) => {
      nodes.push(
        <span key={`lead-${i}`} style={{ color: nextWordColor() }}>
          {word}
        </span>
      );
      if (i < words.length - 1) nodes.push(" ");
    });
    return nodes;
  };

  return (
    <section ref={sectionRef} className={`hero ${entered ? "is-entered" : ""}`} aria-labelledby="hero-title">
      <canvas ref={canvasRef} className="hero__dust" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />
      <div className="hero__hex hero__hex--left" aria-hidden="true" />
      <div className="hero__hex hero__hex--right" aria-hidden="true" />

      <div className="hero__content">
        <div className="hero__eyebrow">
          <span className="hero__eyebrow-text">{renderEyebrow(EYEBROW_TEXT)}</span>
        </div>
        <h1 id="hero-title" className={`hero__title ${liquid ? "hero__title--live" : ""}`} aria-label="Ingeniería digital. Soberanía total.">
          {headline.map((line, lineIndex) => (
            <span className="hero__line" key={line}>
              {renderHeadlineLine(line, lineIndex)}
            </span>
          ))}
        </h1>
        <p className="hero__lead">{renderLeadWords(LEAD_TEXT)}</p>
        <div className="hero__action-shell">
          <a
            ref={buttonRef}
            href="/contacto"
            className="hero__button"
            aria-label="Iniciar Proyecto con Grupo Castillo"
            onPointerMove={moveButton}
            onPointerLeave={resetButton}
          >
            <span className="hero__button-light" aria-hidden="true" />
            <span>Iniciar Proyecto</span>
          </a>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        @property --angle {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
        .hero { --z-bg: 0; --z-geometry: 1; --z-content: 2; --cursor-x: 50%; --cursor-y: 50%; position: relative; isolation: isolate; min-height: 100svh; overflow: hidden; display: grid; place-items: center; padding: 7rem 1.25rem 5rem; color: #FFFFFF; background: #000000; font-family: "Google Sans", "Product Sans", "Poppins", ui-sans-serif, system-ui, sans-serif; clip-path: polygon(0 0, 100% 0, 100% 92%, 93% 100%, 7% 100%, 0 92%); }
        .hero::before { content: ""; position: absolute; inset: 0; z-index: var(--z-bg); background: radial-gradient(circle at var(--cursor-x) var(--cursor-y), rgba(255,255,255,.05), transparent 26rem), linear-gradient(120deg, transparent 35%, rgba(255,255,255,.02) 50%, transparent 65%); }
        .hero__dust, .hero__grain { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .hero__dust { z-index: var(--z-bg); opacity: .9; }
        .hero__grain { z-index: var(--z-geometry); opacity: .16; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.34'/%3E%3C/svg%3E"); mix-blend-mode: soft-light; }
        .hero__content { position: relative; z-index: var(--z-content); width: min(72rem, 100%); text-align: center; }
        .hero__eyebrow { display: flex; justify-content: center; align-items: center; margin-bottom: clamp(2rem, 6vw, 4.5rem); color: #FFFFFF; font-family: "Google Sans", "Product Sans", "Poppins", ui-sans-serif, system-ui, sans-serif; font-size: .72rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; }
        .hero__eyebrow-text { display: inline; }
        .hero__title { margin: 0; font-size: clamp(2.9rem, 8.8vw, 8.4rem); font-weight: 800; line-height: .86; letter-spacing: -.075em; text-transform: uppercase; text-wrap: balance; }
        .hero__line { display: flex; justify-content: center; white-space: nowrap; }
        .hero__letter { display: inline-block; min-width: .18em; opacity: 0; color: #FFFFFF; transform: translateY(1.3em); transition: opacity .5s ease var(--delay), transform .55s cubic-bezier(.16,1,.3,1) var(--delay); }
        .hero__letter--eyebrow { min-width: .12em; }
        .hero.is-entered .hero__letter { opacity: 1; transform: translateY(0); }
        .hero__title--live .hero__letter { transition: none; will-change: transform; transform: translate(0,0) scale(1,1) skewX(0deg); }
        .hero.is-entered .hero__lead, .hero.is-entered .hero__action-shell { opacity: 1; transform: translateY(0); }
        .hero__lead { max-width: 44rem; margin: 2rem auto 0; color: #FFFFFF; font-size: clamp(1rem, 2vw, 1.25rem); line-height: 1.6; opacity: 0; transform: translateY(1.2rem); transition: opacity .5s ease .72s, transform .55s cubic-bezier(.16,1,.3,1) .72s; }
        .hero__action-shell { margin-top: clamp(2.5rem, 6vw, 4.5rem); opacity: 0; transform: translateY(1.6rem); transition: opacity .5s ease .92s, transform .6s cubic-bezier(.34,1.4,.64,1) .92s; }
        .hero__button { --mx: 0px; --my: 0px; --bx: 50%; --by: 50%; position: relative; isolation: isolate; display: inline-flex; align-items: center; justify-content: center; gap: .6rem; min-width: min(23rem, 88vw); padding: 1.35rem 2.25rem; overflow: visible; border: none; border-radius: 999px; color: #FFFFFF; background: transparent; font-family: "Google Sans", "Product Sans", "Poppins", ui-sans-serif, system-ui, sans-serif; font-size: .9rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; text-decoration: none; transform: translate(var(--mx), var(--my)); transition: transform .22s cubic-bezier(.2,.8,.2,1); cursor: pointer; }
        .hero__button::before { content: ""; position: absolute; inset: -2px; z-index: 0; border-radius: 999px; padding: 2px; background: conic-gradient(from var(--angle), #4285F4, #9B72CB, #D96570, #F2A93B, #34A853, #4285F4); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; animation: hero-aura-spin 3.2s linear infinite; }
        .hero__button::after { content: ""; position: absolute; inset: -14px; z-index: -1; border-radius: 999px; background: conic-gradient(from var(--angle), rgba(66,133,244,.55), rgba(155,114,203,.55), rgba(217,101,112,.55), rgba(242,169,59,.55), rgba(52,168,83,.55), rgba(66,133,244,.55)); filter: blur(20px); opacity: .55; animation: hero-aura-spin 3.2s linear infinite; transition: opacity .3s ease, filter .3s ease; }
        .hero__button:hover::after { opacity: .9; filter: blur(24px); }
        .hero__button:focus-visible { outline: 3px dashed #FFFFFF; outline-offset: 6px; }
        .hero__button > span:not(.hero__button-light) { position: relative; z-index: 2; }
        .hero__button-light { position: absolute; z-index: 1; width: 7rem; height: 7rem; left: var(--bx); top: var(--by); border-radius: 50%; background: rgba(255,255,255,.35); filter: blur(24px); transform: translate(-50%,-50%); opacity: .4; pointer-events: none; }
        .hero__hex { position: absolute; z-index: var(--z-geometry); width: clamp(8rem, 18vw, 16rem); aspect-ratio: .866; border: 1px solid rgba(255,255,255,.12); background: linear-gradient(135deg, rgba(255,255,255,.03), transparent 56%); clip-path: polygon(25% 6.7%,75% 6.7%,100% 50%,75% 93.3%,25% 93.3%,0 50%); pointer-events: none; }
        .hero__hex--left { left: -5rem; top: 16%; transform: rotate(20deg); border-color: rgba(168,85,247,.55); background: linear-gradient(135deg, rgba(168,85,247,.08), transparent 56%); box-shadow: 0 0 44px rgba(168,85,247,.22); }
        .hero__hex--right { right: -4rem; bottom: 12%; transform: rotate(-16deg); border-color: rgba(59,130,246,.55); background: linear-gradient(135deg, rgba(59,130,246,.08), transparent 56%); box-shadow: 0 0 44px rgba(59,130,246,.22); }
        @keyframes hero-aura-spin { to { --angle: 360deg; } }
        @media (max-width: 640px) { .hero { min-height: 92svh; padding-inline: 1rem; clip-path: polygon(0 0, 100% 0, 100% 95%, 92% 100%, 8% 100%, 0 95%); } .hero__title { font-size: clamp(2.4rem, 13vw, 4.6rem); line-height: .92; } .hero__eyebrow { font-size: .6rem; letter-spacing: .12em; } .hero__lead { max-width: 30rem; } }
        @media (prefers-reduced-motion: reduce) { .hero *, .hero *::before, .hero *::after { animation: none !important; scroll-behavior: auto !important; transition-duration: .12s !important; } .hero__letter, .hero__lead, .hero__action-shell { opacity: 1 !important; transform: none !important; } .hero__button { transform: none !important; } .hero__button::before, .hero__button::after { animation: none !important; } }
        @media (max-width: 640px) { .hero__letter { transition-duration: .42s, .46s; } }
      `}</style>
    </section>
  );
}
