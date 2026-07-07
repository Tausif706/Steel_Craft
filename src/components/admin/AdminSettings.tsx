import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchAdminSettings, updateAdminSettingThunk } from '../../store/slices';
import { useNotification } from '../../hooks/useNotification';
import { Btn } from '../../components/ui/shared';
import { DEFAULT_STEEL_SETTINGS } from '../../lib/steelPricingDefaults';

const FIELD_LABELS: Record<string, string> = {
  steel_price_per_kg: 'Steel price (₹ / kg)',
  finish_cost_per_sqft: 'Powder coat finish (₹ / sq ft)',
  hardware_cost_per_door: 'Hardware per door (₹)',
  hardware_cost_per_drawer: 'Hardware per drawer (₹)',
  mirror_cost: 'Mirror add-on (₹)',
  lock_cost_key: 'Key lock (₹)',
  lock_cost_digital: 'Digital lock (₹)',
  wheels_cost: 'Wheels add-on (₹)',
  labor_margin_pct: 'Labor & overhead margin (0–1)',
  estimate_low_pct: 'Estimate range — low multiplier',
  estimate_high_pct: 'Estimate range — high multiplier',
  default_gauge_mm: 'Default steel gauge (mm)',
  steel_density_kg_per_m3: 'Steel density (kg / m³)',
};

export default function AdminSettings() {
  const dispatch = useAppDispatch();
  const notify = useNotification();
  const settings = useAppSelector(s => s.admin.settings);
  const loaded = useAppSelector(s => s.admin.loaded.settings);
  const [steel, setSteel] = useState(DEFAULT_STEEL_SETTINGS);
  const [gstPct, setGstPct] = useState(18);
  const [freeShip, setFreeShip] = useState(10000);
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(fetchAdminSettings()); }, [dispatch]);
  useEffect(() => {
    if (settings.steel_pricing) setSteel({ ...DEFAULT_STEEL_SETTINGS, ...settings.steel_pricing });
    if (settings.gst_rate?.rate != null) setGstPct(Math.round(settings.gst_rate.rate * 100));
    if (settings.free_shipping_threshold?.amount != null) setFreeShip(settings.free_shipping_threshold.amount);
  }, [settings]);

  async function saveAll() {
    setSaving(true);
    try {
      await Promise.all([
        dispatch(updateAdminSettingThunk({ key: 'steel_pricing', value: steel })).unwrap(),
        dispatch(updateAdminSettingThunk({ key: 'gst_rate', value: { rate: gstPct / 100 } })).unwrap(),
        dispatch(updateAdminSettingThunk({ key: 'free_shipping_threshold', value: { amount: freeShip } })).unwrap(),
      ]);
      notify('Settings saved ✓');
    } catch (err: any) {
      notify(err.message ?? 'Could not save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <div className="text-center py-10 text-[var(--tx3)] text-sm">Loading settings…</div>;

  return (
    <div className="max-w-[640px]">
      <div className="text-[14px] font-bold text-[var(--tx)] mb-1">AI Builder Pricing Engine</div>
      <p className="text-[12px] text-[var(--tx2)] mb-4">
        These values drive the automatic price calculation for AI-designed custom furniture — based on real steel
        surface area &amp; weight, not a guess. Changing them here updates pricing immediately for new designs.
      </p>
      <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 grid sm:grid-cols-2 gap-3 mb-6">
        {Object.entries(steel).map(([key, value]) => (
          <div key={key}>
            <label className="block text-[11.5px] font-bold text-[var(--tx)] mb-1">{FIELD_LABELS[key] ?? key}</label>
            <input type="number" step="any" value={value}
              onChange={e => setSteel(s => ({ ...s, [key]: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-[var(--br)] rounded-[9px] text-[13px] bg-[var(--bg2)] text-[var(--tx)] outline-none" />
          </div>
        ))}
      </div>

      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">Storefront</div>
      <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 grid sm:grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-[11.5px] font-bold text-[var(--tx)] mb-1">GST Rate (%)</label>
          <input type="number" value={gstPct} onChange={e => setGstPct(Number(e.target.value))}
            className="w-full px-3 py-2 border border-[var(--br)] rounded-[9px] text-[13px] bg-[var(--bg2)] text-[var(--tx)] outline-none" />
        </div>
        <div>
          <label className="block text-[11.5px] font-bold text-[var(--tx)] mb-1">Free shipping above (₹)</label>
          <input type="number" value={freeShip} onChange={e => setFreeShip(Number(e.target.value))}
            className="w-full px-3 py-2 border border-[var(--br)] rounded-[9px] text-[13px] bg-[var(--bg2)] text-[var(--tx)] outline-none" />
        </div>
      </div>

      <Btn onClick={saveAll} disabled={saving}>{saving ? 'Saving…' : 'Save All Settings'}</Btn>
    </div>
  );
}
