// Frontend-side mirror of supabase/functions/ai-design/pricing.ts DEFAULT_STEEL_SETTINGS.
// Used only as a fallback shape for the Admin Settings form before the
// real values are loaded from (or saved to) the app_settings table.
export const DEFAULT_STEEL_SETTINGS = {
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
