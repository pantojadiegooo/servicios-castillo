import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

async function generateFavicons() {
  const svgFavicon = fs.readFileSync(path.join(publicDir, 'assets/brand/favicon/favicon.svg'));

  // Favicon 16x16
  const fav16 = await sharp(svgFavicon)
    .resize(16, 16, { fit: 'contain', background: { r: 10, g: 12, b: 15, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), fav16);

  // Favicon 32x32
  const fav32 = await sharp(svgFavicon)
    .resize(32, 32, { fit: 'contain', background: { r: 10, g: 12, b: 15, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), fav32);
  fs.writeFileSync(path.join(publicDir, 'favicon-32.png'), fav32); // compatibilidad retroactiva

  // Favicon 48x48
  const fav48 = await sharp(svgFavicon)
    .resize(48, 48, { fit: 'contain', background: { r: 10, g: 12, b: 15, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), fav48);

  // Apple Touch Icon 180x180
  const appleTouch = await sharp(svgFavicon)
    .resize(180, 180, { fit: 'contain', background: { r: 10, g: 12, b: 15, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

  // Android Chrome 192x192
  const android192 = await sharp(svgFavicon)
    .resize(192, 192, { fit: 'contain', background: { r: 10, g: 12, b: 15, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'android-chrome-192x192.png'), android192);

  // Android Chrome 512x512
  const android512 = await sharp(svgFavicon)
    .resize(512, 512, { fit: 'contain', background: { r: 10, g: 12, b: 15, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'android-chrome-512x512.png'), android512);

  // Favicon ICO (Multi-resolution: 16x16, 32x32, 48x48)
  const pngBuffers = [fav16, fav32, fav48];
  const dimensions = [{ w: 16, h: 16 }, { w: 32, h: 32 }, { w: 48, h: 48 }];
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  for (let i = 0; i < count; i++) {
    const buf = pngBuffers[i];
    const { w, h } = dimensions[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(w, 0);
    entry.writeUInt8(h, 1);
    entry.writeUInt8(0, 2); // Palette colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset to image data
    entries.push(entry);
    offset += buf.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...pngBuffers]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Favicons generados exitosamente en public/');
}

async function generateOgImage() {
  const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="heroGlow" cx="25%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#12304A" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="#0A0C0F" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#0A0C0F" stop-opacity="1"/>
    </radialGradient>

    <radialGradient id="accentGlow" cx="80%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#3E7C93" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#0A0C0F" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3E7C93" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#12304A" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#3E7C93" stop-opacity="0.3"/>
    </linearGradient>

    <linearGradient id="badgeBorder" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3E7C93" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#12304A" stop-opacity="0.4"/>
    </linearGradient>

    <!-- Precision Technical Grid -->
    <pattern id="techGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#12304A" stroke-width="0.75" stroke-opacity="0.35"/>
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="#0A0C0F"/>
  <rect width="1200" height="630" fill="url(#heroGlow)"/>
  <rect width="1200" height="630" fill="url(#accentGlow)"/>
  <rect width="1200" height="630" fill="url(#techGrid)"/>

  <!-- Outer Precision Frame -->
  <rect x="28" y="28" width="1144" height="574" rx="16" fill="none" stroke="url(#cardBorder)" stroke-width="1.5"/>

  <!-- Corner Tech Crosshairs -->
  <path d="M 42 28 L 42 42 L 28 42" fill="none" stroke="#3E7C93" stroke-width="2" opacity="0.8"/>
  <path d="M 1158 28 L 1158 42 L 1172 42" fill="none" stroke="#3E7C93" stroke-width="2" opacity="0.8"/>
  <path d="M 42 602 L 42 588 L 28 588" fill="none" stroke="#3E7C93" stroke-width="2" opacity="0.8"/>
  <path d="M 1158 602 L 1158 588 L 1172 588" fill="none" stroke="#3E7C93" stroke-width="2" opacity="0.8"/>

  <!-- Top Eyebrow Badge -->
  <g transform="translate(80, 75)">
    <rect x="0" y="0" width="310" height="34" rx="6" fill="#12304A" fill-opacity="0.6" stroke="url(#badgeBorder)" stroke-width="1"/>
    <circle cx="16" cy="17" r="3.5" fill="#3E7C93"/>
    <text x="30" y="22" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" font-weight="700" fill="#E8EAEC" letter-spacing="2">FIRMA DE INGENIERÍA DIGITAL</text>
  </g>

  <!-- Top Right Domain -->
  <g transform="translate(1120, 97)">
    <text x="0" y="0" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="15" font-weight="600" fill="#9AA3AC" text-anchor="end" letter-spacing="1">grupocastillo.lat</text>
  </g>

  <!-- Master Lockup: Isotype + Outlined Wordmark -->
  <g transform="translate(50, 140) scale(1.15)">
    <!-- Symbol / Isotype Corte Castillo -->
    <g transform="translate(26,26) scale(0.54217) translate(-40,-18)">
      <path d="M60.20,27.54 L43.77,27.54 L43.77,177.54 L114.79,177.54 L60.20,27.54 Z" fill="#3E7C93"/>
      <path d="M123.25,174.46 L158.23,174.46 L158.23,24.46 L68.66,24.46 L123.25,174.46 Z" fill="#E8EAEC"/>
    </g>

    <!-- Outlined Vector Glyphs -->
    <g transform="translate(122.14,92.30) scale(0.06000,-0.06000)"><path d="M528 480Q509 515 473.5 533.5Q438 552 390 552Q307 552 257.0 497.5Q207 443 207 352Q207 255 259.5 200.5Q312 146 404 146Q467 146 510.5 178.0Q554 210 574 270H357V396H729V237Q710 173 664.5 118.0Q619 63 549.0 29.0Q479 -5 391 -5Q287 -5 205.5 40.5Q124 86 78.5 167.0Q33 248 33 352Q33 456 78.5 537.5Q124 619 205.0 664.5Q286 710 390 710Q516 710 602.5 649.0Q689 588 717 480Z" fill="#E8EAEC"/></g>
    <g transform="translate(172.96,92.30) scale(0.06000,-0.06000)"><path d="M420 0 274 265H233V0H62V702H349Q432 702 490.5 673.0Q549 644 578.0 593.5Q607 543 607 481Q607 411 567.5 356.0Q528 301 451 278L613 0ZM233 386H339Q386 386 409.5 409.0Q433 432 433 474Q433 514 409.5 537.0Q386 560 339 560H233Z" fill="#E8EAEC"/></g>
    <g transform="translate(217.18,92.30) scale(0.06000,-0.06000)"><path d="M230 702V282Q230 219 261.0 185.0Q292 151 352 151Q412 151 444.0 185.0Q476 219 476 282V702H647V283Q647 189 607.0 124.0Q567 59 499.5 26.0Q432 -7 349 -7Q266 -7 200.5 25.5Q135 58 97.0 123.5Q59 189 59 283V702Z" fill="#E8EAEC"/></g>
    <g transform="translate(264.58,92.30) scale(0.06000,-0.06000)"><path d="M339 252H233V0H62V702H339Q423 702 481.0 673.0Q539 644 568.0 593.0Q597 542 597 476Q597 415 569.0 364.5Q541 314 483.0 283.0Q425 252 339 252ZM423 476Q423 518 399.0 541.0Q375 564 326 564H233V388H326Q375 388 399.0 411.0Q423 434 423 476Z" fill="#E8EAEC"/></g>
    <g transform="translate(307.12,92.30) scale(0.06000,-0.06000)"><path d="M33 353Q33 456 81.5 538.0Q130 620 212.5 666.0Q295 712 394 712Q493 712 575.5 666.0Q658 620 705.5 538.0Q753 456 753 353Q753 250 705.0 167.5Q657 85 575.0 39.0Q493 -7 394 -7Q295 -7 212.5 39.0Q130 85 81.5 167.5Q33 250 33 353ZM579 353Q579 446 528.5 501.5Q478 557 394 557Q309 557 258.5 502.0Q208 447 208 353Q208 260 258.5 204.5Q309 149 394 149Q478 149 528.5 205.0Q579 261 579 353Z" fill="#E8EAEC"/></g>
    <g transform="translate(383.68,92.30) scale(0.06000,-0.06000)"><path d="M386 710Q511 710 600.0 644.0Q689 578 719 464H531Q510 508 471.5 531.0Q433 554 384 554Q305 554 256.0 499.0Q207 444 207 352Q207 260 256.0 205.0Q305 150 384 150Q433 150 471.5 173.0Q510 196 531 240H719Q689 126 600.0 60.5Q511 -5 386 -5Q284 -5 203.5 40.5Q123 86 78.0 167.0Q33 248 33 352Q33 456 78.0 537.5Q123 619 203.5 664.5Q284 710 386 710Z" fill="#E8EAEC"/></g>
    <g transform="translate(434.50,92.30) scale(0.06000,-0.06000)"><path d="M499 124H237L195 0H16L270 702H468L722 0H541ZM455 256 368 513 282 256Z" fill="#E8EAEC"/></g>
    <g transform="translate(483.82,92.30) scale(0.06000,-0.06000)"><path d="M42 210H224Q228 171 251.0 150.5Q274 130 311 130Q349 130 371.0 147.5Q393 165 393 196Q393 222 375.5 239.0Q358 256 332.5 267.0Q307 278 260 292Q192 313 149.0 334.0Q106 355 75.0 396.0Q44 437 44 503Q44 601 115.0 656.5Q186 712 300 712Q416 712 487.0 656.5Q558 601 563 502H378Q376 536 353.0 555.5Q330 575 294 575Q263 575 244.0 558.5Q225 542 225 511Q225 477 257.0 458.0Q289 439 357 417Q425 394 467.5 373.0Q510 352 541.0 312.0Q572 272 572 209Q572 149 541.5 100.0Q511 51 453.0 22.0Q395 -7 316 -7Q239 -7 178.0 18.0Q117 43 80.5 92.0Q44 141 42 210Z" fill="#E8EAEC"/></g>
    <g transform="translate(525.82,92.30) scale(0.06000,-0.06000)"><path d="M567 702V565H381V0H210V565H24V702Z" fill="#E8EAEC"/></g>
    <g transform="translate(566.38,92.30) scale(0.06000,-0.06000)"><path d="M233 702V0H62V702Z" fill="#E8EAEC"/></g>
    <g transform="translate(589.18,92.30) scale(0.06000,-0.06000)"><path d="M233 132H457V0H62V702H233Z" fill="#E8EAEC"/></g>
    <g transform="translate(622.90,92.30) scale(0.06000,-0.06000)"><path d="M233 132H457V0H62V702H233Z" fill="#E8EAEC"/></g>
    <g transform="translate(656.62,92.30) scale(0.06000,-0.06000)"><path d="M33 353Q33 456 81.5 538.0Q130 620 212.5 666.0Q295 712 394 712Q493 712 575.5 666.0Q658 620 705.5 538.0Q753 456 753 353Q753 250 705.0 167.5Q657 85 575.0 39.0Q493 -7 394 -7Q295 -7 212.5 39.0Q130 85 81.5 167.5Q33 250 33 353ZM579 353Q579 446 528.5 501.5Q478 557 394 557Q309 557 258.5 502.0Q208 447 208 353Q208 260 258.5 204.5Q309 149 394 149Q478 149 528.5 205.0Q579 261 579 353Z" fill="#E8EAEC"/></g>
  </g>

  <!-- Precision Technical Divider Line -->
  <line x1="80" y1="320" x2="1120" y2="320" stroke="#12304A" stroke-width="1.5"/>
  <line x1="80" y1="320" x2="380" y2="320" stroke="#3E7C93" stroke-width="2.5"/>

  <!-- Core Headline / Value Proposition -->
  <g transform="translate(80, 388)">
    <text x="0" y="0" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="33" font-weight="700" fill="#E8EAEC" letter-spacing="-0.3">
      Desarrollo Web &amp; Ingeniería de Software
    </text>
    <text x="0" y="44" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="400" fill="#9AA3AC" letter-spacing="0.2">
      Sistemas críticos, plataformas web y gobernanza técnica para empresas.
    </text>
  </g>

  <!-- Bottom Value Pillars Pills -->
  <g transform="translate(80, 496)">
    <!-- Pill 1 -->
    <g transform="translate(0, 0)">
      <rect width="280" height="44" rx="8" fill="#12304A" fill-opacity="0.45" stroke="#3E7C93" stroke-width="1" stroke-opacity="0.5"/>
      <text x="140" y="27" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="600" fill="#E8EAEC" text-anchor="middle">Software a la Medida</text>
    </g>

    <!-- Pill 2 -->
    <g transform="translate(300, 0)">
      <rect width="280" height="44" rx="8" fill="#12304A" fill-opacity="0.45" stroke="#3E7C93" stroke-width="1" stroke-opacity="0.5"/>
      <text x="140" y="27" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="600" fill="#E8EAEC" text-anchor="middle">Plataformas Web</text>
    </g>

    <!-- Pill 3 -->
    <g transform="translate(600, 0)">
      <rect width="320" height="44" rx="8" fill="#12304A" fill-opacity="0.45" stroke="#3E7C93" stroke-width="1" stroke-opacity="0.5"/>
      <text x="160" y="27" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="600" fill="#E8EAEC" text-anchor="middle">Soberanía Tecnológica</text>
    </g>
  </g>
</svg>
`;

  const ogBuffer = await sharp(Buffer.from(ogSvg))
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogBuffer);
  fs.writeFileSync(path.join(publicDir, 'og-default.png'), ogBuffer);
  console.log('✓ Imagen Open Graph generada exitosamente en public/og-image.png y public/og-default.png');
}

async function main() {
  await generateFavicons();
  await generateOgImage();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
