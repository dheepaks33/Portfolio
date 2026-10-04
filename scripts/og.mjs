// Renders public/og.png (1200×630 social preview) from an inline SVG.
// Run once after changing the copy: `npm run og`. Uses system serif/mono fonts.

import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const ink = '#16161a';
const muted = '#5f5f64';
const accent = '#a65112';
const bg = '#f6f4ef';

// I²C trace spelling "DS" (same encoding as src/components/I2CTrace.astro).
const P = 30;
const x0 = 80;
const byte = (v) => Array.from({ length: 8 }, (_, i) => Boolean((v >> (7 - i)) & 1));
const bits = [...byte(0x44), false, ...byte(0x53), false];
const startX = x0 + 16;
const clk0 = x0 + 32;
const end = clk0 + bits.length * P;
const stopX = end + P / 2 + 10;
const xEnd = stopX + 40;

function wave(events, hi, lo) {
  let level = true;
  let d = `M${x0} ${hi}`;
  for (const [x, next] of events) {
    if (next === level) continue;
    d += ` H${x} L${x + 2} ${next ? hi : lo}`;
    level = next;
  }
  return `${d} H${xEnd}`;
}

const scl = [[clk0, false]];
bits.forEach((_, i) => scl.push([clk0 + i * P + P / 2, true], [clk0 + (i + 1) * P, false]));
scl.push([end + P / 2, true]);
const sda = [[startX, false]];
bits.forEach((b, i) => sda.push([clk0 + i * P + 4, b]));
sda.push([stopX, true]);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <text x="80" y="104" font-family="Consolas, 'DejaVu Sans Mono', monospace" font-size="22" letter-spacing="2" fill="${muted}">
    <tspan fill="${accent}">0x00</tspan>  EMBEDDED SOFTWARE ENGINEER
  </text>
  <text x="76" y="250" font-family="Georgia, 'DejaVu Serif', serif" font-size="106" fill="${ink}">Dheepak Selvakumar</text>
  <text x="80" y="318" font-family="'Segoe UI', 'DejaVu Sans', sans-serif" font-size="32" fill="${ink}">I write software that runs close to the hardware.</text>
  <text x="80" y="366" font-family="'Segoe UI', 'DejaVu Sans', sans-serif" font-size="24" fill="${muted}">Real-time C on Cadence HiFi DSPs · I2C · I2S · drivers · tools</text>

  <g fill="none" stroke-width="2.5" stroke-linejoin="round">
    <path d="${wave(scl, 440, 470)}" stroke="${muted}"/>
    <path d="${wave(sda, 500, 530)}" stroke="${accent}"/>
  </g>
  <g font-family="Consolas, 'DejaVu Sans Mono', monospace" font-size="15" fill="${muted}" text-anchor="middle">
    <text x="${startX}" y="562" fill="${accent}">S</text>
    <text x="${clk0 + 4 * P}" y="562" fill="${ink}">0x44 'D'</text>
    <text x="${clk0 + 8.5 * P}" y="562">A</text>
    <text x="${clk0 + 13 * P}" y="562" fill="${ink}">0x53 'S'</text>
    <text x="${clk0 + 17.5 * P}" y="562">A</text>
    <text x="${stopX}" y="562" fill="${accent}">P</text>
  </g>
  <text x="${W - 80}" y="562" text-anchor="end" font-family="Consolas, 'DejaVu Sans Mono', monospace" font-size="20" fill="${muted}">dheepaks33.github.io/Portfolio</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL('../public/og.png', import.meta.url)));
console.log('wrote public/og.png');
