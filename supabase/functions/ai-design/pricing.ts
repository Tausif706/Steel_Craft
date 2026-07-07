// ════════════════════════════════════════════════════════════════
// Deterministic steel-furniture pricing engine.
// Computes cost from real surface area + weight, NOT a guess from
// the language model. Every multiplier comes from app_settings so
// admins can retune costs without redeploying code.
// ════════════════════════════════════════════════════════════════

export interface FurnitureSpec {
  type: string;            // 'almirah' | 'wardrobe' | 'desk' | 'rack' | 'locker' | 'bed' | 'school' | 'other'
  label: string;           // human readable name, e.g. "3-Door Almirah with Mirror"
  widthIn: number;
  heightIn: number;
  depthIn: number;
  doors: number;
  shelves: number;
  drawers: number;
  bodyColor: string;       // hex
  doorColor: string;       // hex
  mirror: boolean;
  lockType: 'none' | 'key' | 'digital';
  wheels: boolean;
  gaugeMM: number;
  notes?: string;
}

export interface SteelPricingSettings {
  steel_price_per_kg: number;
  steel_density_kg_per_m3: number;
  default_gauge_mm: number;
  finish_cost_per_sqft: number;
  hardware_cost_per_door: number;
  hardware_cost_per_drawer: number;
  mirror_cost: number;
  lock_cost_key: number;
  lock_cost_digital: number;
  wheels_cost: number;
  labor_margin_pct: number;
  estimate_low_pct: number;
  estimate_high_pct: number;
}

export interface PriceBreakdown {
  totalSqft: number;
  weightKg: number;
  materialCost: number;
  hardwareCost: number;
  finishCost: number;
  laborCost: number;
  subtotal: number;
  estimateMin: number;
  estimateMax: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r0 = (n: number) => Math.round(n);

export function normalizeSpec(raw: any): FurnitureSpec {
  const num = (v: any, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  return {
    type: typeof raw?.type === 'string' ? raw.type : 'almirah',
    label: typeof raw?.label === 'string' && raw.label.trim() ? raw.label.trim() : 'Custom Steel Furniture',
    widthIn: num(raw?.widthIn, 36),
    heightIn: num(raw?.heightIn, 72),
    depthIn: num(raw?.depthIn, 18),
    doors: Math.max(0, Math.round(Number(raw?.doors) || 0)),
    shelves: Math.max(0, Math.round(Number(raw?.shelves) || 0)),
    drawers: Math.max(0, Math.round(Number(raw?.drawers) || 0)),
    bodyColor: /^#[0-9a-fA-F]{6}$/.test(raw?.bodyColor) ? raw.bodyColor : '#1B3A5E',
    doorColor: /^#[0-9a-fA-F]{6}$/.test(raw?.doorColor) ? raw.doorColor : '#0F172A',
    mirror: !!raw?.mirror,
    lockType: ['none', 'key', 'digital'].includes(raw?.lockType) ? raw.lockType : 'key',
    wheels: !!raw?.wheels,
    gaugeMM: num(raw?.gaugeMM, 0.6),
    notes: typeof raw?.notes === 'string' ? raw.notes : undefined,
  };
}

export function computePricing(spec: FurnitureSpec, settings: SteelPricingSettings): PriceBreakdown {
  const wFt = spec.widthIn / 12;
  const hFt = spec.heightIn / 12;
  const dFt = spec.depthIn / 12;

  const front = wFt * hFt;
  const back = wFt * hFt;
  const sides = 2 * (dFt * hFt);
  const top = wFt * dFt;
  const bottom = wFt * dFt;
  const shelvesArea = spec.shelves * (wFt * dFt);
  const drawersArea = spec.drawers * (wFt * dFt * 0.6);

  const totalSqft = front + back + sides + top + bottom + shelvesArea + drawersArea;
  const totalSqm = totalSqft * 0.092903;

  const gaugeM = (spec.gaugeMM || settings.default_gauge_mm) / 1000;
  const weightKg = totalSqm * gaugeM * settings.steel_density_kg_per_m3;

  const materialCost = weightKg * settings.steel_price_per_kg;

  let hardwareCost = spec.doors * settings.hardware_cost_per_door
    + spec.drawers * settings.hardware_cost_per_drawer;
  if (spec.mirror) hardwareCost += settings.mirror_cost;
  if (spec.lockType === 'key') hardwareCost += settings.lock_cost_key;
  if (spec.lockType === 'digital') hardwareCost += settings.lock_cost_digital;
  if (spec.wheels) hardwareCost += settings.wheels_cost;

  const finishCost = totalSqft * settings.finish_cost_per_sqft;

  const baseCost = materialCost + hardwareCost + finishCost;
  const laborCost = baseCost * settings.labor_margin_pct;
  const subtotal = baseCost + laborCost;

  return {
    totalSqft: r2(totalSqft),
    weightKg: r2(weightKg),
    materialCost: r0(materialCost),
    hardwareCost: r0(hardwareCost),
    finishCost: r0(finishCost),
    laborCost: r0(laborCost),
    subtotal: r0(subtotal),
    estimateMin: r0(subtotal * settings.estimate_low_pct),
    estimateMax: r0(subtotal * settings.estimate_high_pct),
  };
}

export const DEFAULT_STEEL_SETTINGS: SteelPricingSettings = {
  steel_price_per_kg: 85,
  steel_density_kg_per_m3: 7850,
  default_gauge_mm: 0.6,
  finish_cost_per_sqft: 35,
  hardware_cost_per_door: 250,
  hardware_cost_per_drawer: 350,
  mirror_cost: 1200,
  lock_cost_key: 150,
  lock_cost_digital: 1800,
  wheels_cost: 600,
  labor_margin_pct: 0.35,
  estimate_low_pct: 0.95,
  estimate_high_pct: 1.15,
};
