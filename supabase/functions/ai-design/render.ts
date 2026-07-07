// ════════════════════════════════════════════════════════════════
// Parametric SVG "spec sheet" renderer.
// Draws Front / Side / Top / Inside views with real dimension lines,
// color swatches and the computed price baked in as text — so an
// admin can size up a design at a glance without opening anything.
// ════════════════════════════════════════════════════════════════
import type { FurnitureSpec, PriceBreakdown } from './pricing.ts';

const W = 640, H = 560;
const PAD = 56;
const DRAW_W = W - PAD * 2;
const DRAW_H = 330;

function fmtINR(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function fitBox(wIn: number, hIn: number, maxW: number, maxH: number) {
  const scale = Math.min(maxW / wIn, maxH / hIn);
  return { scale, w: wIn * scale, h: hIn * scale };
}

function dimLineH(x1: number, x2: number, y: number, label: string) {
  return `
    <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#64748B" stroke-width="1"/>
    <line x1="${x1}" y1="${y - 5}" x2="${x1}" y2="${y + 5}" stroke="#64748B" stroke-width="1"/>
    <line x1="${x2}" y1="${y - 5}" x2="${x2}" y2="${y + 5}" stroke="#64748B" stroke-width="1"/>
    <text x="${(x1 + x2) / 2}" y="${y - 8}" font-size="12" fill="#475569" text-anchor="middle" font-family="Arial, sans-serif">${label}</text>
  `;
}

function dimLineV(y1: number, y2: number, x: number, label: string) {
  return `
    <line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#64748B" stroke-width="1"/>
    <line x1="${x - 5}" y1="${y1}" x2="${x + 5}" y2="${y1}" stroke="#64748B" stroke-width="1"/>
    <line x1="${x - 5}" y1="${y2}" x2="${x + 5}" y2="${y2}" stroke="#64748B" stroke-width="1"/>
    <text x="${x - 10}" y="${(y1 + y2) / 2}" font-size="12" fill="#475569" text-anchor="middle" font-family="Arial, sans-serif" transform="rotate(-90 ${x - 10} ${(y1 + y2) / 2})">${label}</text>
  `;
}

function header(title: string) {
  return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="#F8FAFC"/>
    <rect x="0" y="0" width="${W}" height="42" fill="#0B1220"/>
    <text x="20" y="27" font-size="16" font-weight="bold" fill="#FFFFFF" font-family="Arial, sans-serif">SteelCraft — ${title}</text>
  `;
}

function footer(spec: FurnitureSpec, pricing: PriceBreakdown) {
  const y = H - 86;
  return `
    <rect x="0" y="${y}" width="${W}" height="86" fill="#0B1220"/>
    <text x="20" y="${y + 24}" font-size="13" font-weight="bold" fill="#FFFFFF" font-family="Arial, sans-serif">${spec.label}</text>
    <text x="20" y="${y + 44}" font-size="11.5" fill="#94A3B8" font-family="Arial, sans-serif">
      ${spec.widthIn}"×${spec.heightIn}"×${spec.depthIn}"  ·  ${spec.gaugeMM}mm CRCA steel  ·  ${pricing.weightKg} kg  ·  ${spec.doors} door(s)  ·  ${spec.shelves} shelf/shelves  ·  ${spec.drawers} drawer(s)
    </text>
    <text x="20" y="${y + 64}" font-size="11.5" fill="#94A3B8" font-family="Arial, sans-serif">
      Lock: ${spec.lockType}  ·  Mirror: ${spec.mirror ? 'Yes' : 'No'}  ·  Wheels: ${spec.wheels ? 'Yes' : 'No'}
    </text>
    <text x="${W - 20}" y="${y + 34}" font-size="20" font-weight="bold" fill="#F0A82E" font-family="Arial, sans-serif" text-anchor="end">
      ${fmtINR(pricing.estimateMin)} – ${fmtINR(pricing.estimateMax)}
    </text>
    <text x="${W - 20}" y="${y + 54}" font-size="10.5" fill="#94A3B8" font-family="Arial, sans-serif" text-anchor="end">Estimated price (excl. GST)</text>
  `;
}

function colorSwatch(x: number, y: number, color: string, label: string) {
  return `
    <rect x="${x}" y="${y}" width="14" height="14" rx="3" fill="${color}" stroke="#CBD5E1"/>
    <text x="${x + 20}" y="${y + 11}" font-size="11" fill="#475569" font-family="Arial, sans-serif">${label}</text>
  `;
}

function frontView(spec: FurnitureSpec, pricing: PriceBreakdown): string {
  const { w, h } = fitBox(spec.widthIn, spec.heightIn, DRAW_W - 40, DRAW_H - 30);
  const x0 = (W - w) / 2, y0 = 70 + (DRAW_H - 30 - h) / 2;
  const doors = Math.max(1, spec.doors);
  const doorW = w / doors;

  let doorsSvg = '';
  for (let i = 0; i < doors; i++) {
    const dx = x0 + i * doorW;
    doorsSvg += `<rect x="${dx + 2}" y="${y0 + 2}" width="${doorW - 4}" height="${h - 4}" fill="${spec.doorColor}" stroke="#0008" stroke-width="1"/>`;
    // handle
    const handleX = i % 2 === 0 ? dx + doorW - 10 : dx + 10;
    doorsSvg += `<rect x="${handleX - 2}" y="${y0 + h / 2 - 16}" width="4" height="32" rx="2" fill="#D1D5DB"/>`;
    if (i === 0 && spec.mirror) {
      doorsSvg += `<rect x="${dx + 10}" y="${y0 + 14}" width="${doorW - 24}" height="${h - 28}" fill="#BFE3F2" opacity="0.55" stroke="#7FB8CE"/>
        <line x1="${dx + 14}" y1="${y0 + h - 18}" x2="${dx + doorW - 18}" y2="${y0 + 18}" stroke="#FFFFFF" stroke-width="3" opacity="0.5"/>`;
    }
  }
  if (spec.lockType !== 'none') {
    const lockX = x0 + w - 22;
    const lockY = y0 + h / 2 + 30;
    doorsSvg += spec.lockType === 'digital'
      ? `<rect x="${lockX - 8}" y="${lockY - 8}" width="16" height="16" rx="2" fill="#1F2937"/><circle cx="${lockX}" cy="${lockY}" r="2" fill="#22C55E"/>`
      : `<circle cx="${lockX}" cy="${lockY}" r="5" fill="#D1D5DB" stroke="#1F2937"/>`;
  }

  const body = `<rect x="${x0 - 6}" y="${y0 - 6}" width="${w + 12}" height="${h + 12}" rx="6" fill="${spec.bodyColor}"/>`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${header('Front View')}
    ${body}
    ${doorsSvg}
    ${dimLineH(x0, x0 + w, y0 - 18, spec.widthIn + '"')}
    ${dimLineV(y0, y0 + h, x0 - 18, spec.heightIn + '"')}
    ${colorSwatch(20, 52, spec.bodyColor, 'Body')}
    ${colorSwatch(110, 52, spec.doorColor, 'Door')}
    ${footer(spec, pricing)}
  </svg>`;
}

function sideView(spec: FurnitureSpec, pricing: PriceBreakdown): string {
  const { w, h } = fitBox(spec.depthIn, spec.heightIn, DRAW_W - 40, DRAW_H - 30);
  const x0 = (W - w) / 2, y0 = 70 + (DRAW_H - 30 - h) / 2;

  let shelvesSvg = '';
  const n = spec.shelves;
  for (let i = 1; i <= n; i++) {
    const sy = y0 + (h * i) / (n + 1);
    shelvesSvg += `<line x1="${x0 + 4}" y1="${sy}" x2="${x0 + w - 4}" y2="${sy}" stroke="#0006" stroke-width="2" stroke-dasharray="6,4"/>
      <text x="${x0 + w + 6}" y="${sy + 4}" font-size="9.5" fill="#94A3B8" font-family="Arial, sans-serif">Shelf ${i}</text>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${header('Side View')}
    <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="4" fill="${spec.bodyColor}" stroke="#0008"/>
    ${shelvesSvg}
    <rect x="${x0 - 4}" y="${y0}" width="4" height="${h}" fill="${spec.doorColor}"/>
    ${dimLineH(x0, x0 + w, y0 - 18, spec.depthIn + '" depth')}
    ${dimLineV(y0, y0 + h, x0 - 40, spec.heightIn + '"')}
    <text x="20" y="58" font-size="11" fill="#475569" font-family="Arial, sans-serif">Gauge: ${spec.gaugeMM}mm CRCA steel · ${n} shelf level(s)</text>
    ${footer(spec, pricing)}
  </svg>`;
}

function topView(spec: FurnitureSpec, pricing: PriceBreakdown): string {
  const { w, h } = fitBox(spec.widthIn, spec.depthIn, DRAW_W - 40, DRAW_H - 30);
  const x0 = (W - w) / 2, y0 = 70 + (DRAW_H - 30 - h) / 2;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${header('Top View (Footprint)')}
    <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="4" fill="${spec.bodyColor}" opacity="0.85" stroke="#0008"/>
    <rect x="${x0 + 6}" y="${y0 + 6}" width="${w - 12}" height="${h - 12}" fill="none" stroke="#ffffff55" stroke-dasharray="4,4"/>
    ${dimLineH(x0, x0 + w, y0 - 18, spec.widthIn + '" wide')}
    ${dimLineV(y0, y0 + h, x0 - 18, spec.depthIn + '" deep')}
    <text x="20" y="58" font-size="11" fill="#475569" font-family="Arial, sans-serif">Floor footprint — confirm clearance against wall/room dimensions before placing your order.</text>
    ${footer(spec, pricing)}
  </svg>`;
}

function insideView(spec: FurnitureSpec, pricing: PriceBreakdown): string {
  const { w, h } = fitBox(spec.widthIn, spec.heightIn, DRAW_W - 40, DRAW_H - 30);
  const x0 = (W - w) / 2, y0 = 70 + (DRAW_H - 30 - h) / 2;
  const n = spec.shelves;
  const compartments = n + 1;
  const drawerH = spec.drawers > 0 ? h * 0.18 : 0;
  const shelfAreaH = h - drawerH;

  let compartmentsSvg = '';
  for (let i = 0; i < compartments; i++) {
    const cy = y0 + (shelfAreaH * i) / compartments;
    const ch = shelfAreaH / compartments;
    compartmentsSvg += `<rect x="${x0 + 4}" y="${cy + 2}" width="${w - 8}" height="${ch - 4}" fill="#ffffff22" stroke="#0005" stroke-dasharray="3,3"/>
      <text x="${x0 + 10}" y="${cy + ch / 2 + 4}" font-size="10" fill="#E2E8F0" font-family="Arial, sans-serif">Compartment ${i + 1}</text>`;
  }
  let drawersSvg = '';
  if (spec.drawers > 0) {
    const dW = (w - 8) / spec.drawers;
    for (let i = 0; i < spec.drawers; i++) {
      const dx = x0 + 4 + i * dW;
      drawersSvg += `<rect x="${dx + 2}" y="${y0 + shelfAreaH + 4}" width="${dW - 4}" height="${drawerH - 8}" rx="3" fill="#E2E8F0" stroke="#94A3B8"/>
        <text x="${dx + dW / 2}" y="${y0 + shelfAreaH + drawerH / 2 + 4}" font-size="9.5" text-anchor="middle" fill="#475569" font-family="Arial, sans-serif">Drawer ${i + 1}</text>`;
    }
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${header('Inside View (Doors Open)')}
    <rect x="${x0 - 6}" y="${y0 - 6}" width="${w + 12}" height="${h + 12}" rx="6" fill="${spec.bodyColor}"/>
    ${compartmentsSvg}
    ${drawersSvg}
    ${spec.mirror ? `<text x="${x0 + w - 6}" y="${y0 + 16}" font-size="9.5" fill="#BFE3F2" text-anchor="end" font-family="Arial, sans-serif">Mirror on door 1</text>` : ''}
    ${dimLineH(x0, x0 + w, y0 - 18, spec.widthIn + '"')}
    ${dimLineV(y0, y0 + h, x0 - 18, spec.heightIn + '"')}
    ${footer(spec, pricing)}
  </svg>`;
}

export function renderAllViews(spec: FurnitureSpec, pricing: PriceBreakdown) {
  return {
    front: frontView(spec, pricing),
    side: sideView(spec, pricing),
    top: topView(spec, pricing),
    inside: insideView(spec, pricing),
  };
}
