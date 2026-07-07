-- ════════════════════════════════════════════════════════════════
-- STEELCRAFT — SEED DATA
-- Safe to re-run (uses ON CONFLICT). Run after 0004_storage.sql.
-- ════════════════════════════════════════════════════════════════

insert into public.categories (id, name, icon, sort_order) values
  ('almirahs',  'Steel Almirahs',    'ti-box',              1),
  ('wardrobes', 'Wardrobes',         'ti-layout-columns',   2),
  ('otables',   'Office Tables',     'ti-device-desktop',   3),
  ('ochairs',   'Office Chairs',     'ti-armchair',         4),
  ('racks',     'Storage Racks',     'ti-stack-3',          5),
  ('lockers',   'Lockers',           'ti-lock',             6),
  ('beds',      'Steel Beds',        'ti-bed',              7),
  ('school',    'School Furniture',  'ti-school',           8)
on conflict (id) do update set name = excluded.name, icon = excluded.icon, sort_order = excluded.sort_order;

insert into public.products
  (category_id, name, slug, description, sku, price, original_price, stock_quantity,
   material, dimensions, weight, warranty, features, badge, accent_color, rating, review_count)
values
  ('almirahs', '3-Door Steel Almirah Pro', '3-door-steel-almirah-pro',
   'Premium CRCA steel almirah, double lock, 3 adjustable shelves.', 'SC-ALM-001', 8500, 10200, 40,
   'CRCA Steel 0.6mm', '72"×36"×18"', '45 kg', '5 Years',
   array['Powder Coat','Double Lock','3 Shelves','Anti-Rust'], 'Best Seller', '#1B3A5E', 4.7, 234),

  ('otables', 'Executive L-Shape Desk', 'executive-l-shape-desk',
   'L-shaped desk with cable tray and scratch-proof surface.', 'SC-DSK-001', 12000, 15000, 25,
   'Steel + MFC Top', '60"×48"×30"', '60 kg', '3 Years',
   array['Cable Tray','Levelers','Scratch-proof','Powder Frame'], 'New', '#2A1B5E', 4.5, 187),

  ('racks', '5-Tier Industrial Rack', '5-tier-industrial-rack',
   'Galvanized heavy-duty rack, 500 kg per shelf.', 'SC-RCK-001', 6500, 8000, 60,
   'Galvanized Steel', '72"×36"×14"', '35 kg', '7 Years',
   array['500 kg/shelf','Tool-free','Adjustable','Rust Proof'], 'Top Rated', '#1B3D2E', 4.8, 312),

  ('wardrobes', '4-Door Wardrobe + Mirror', '4-door-wardrobe-mirror',
   'Spacious wardrobe with mirrors, hanging rod and 4 drawers.', 'SC-WRD-001', 14500, 18000, 18,
   'CRCA + Mirror', '84"×60"×20"', '85 kg', '5 Years',
   array['Full Mirror','Hanging Rod','4 Drawers','Premium Finish'], 'Sale', '#3D2A1B', 4.6, 156),

  ('lockers', '6-Section Staff Locker', '6-section-staff-locker',
   '6-compartment locker with individual key locks.', 'SC-LCK-001', 9800, 12000, 22,
   'CRCA Steel 0.8mm', '78"×36"×18"', '55 kg', '5 Years',
   array['6 Keys','Vented Doors','Sloping Top','Powder Coated'], null, '#1B3D3D', 4.4, 98),

  ('beds', 'Heavy Duty Steel Bed', 'heavy-duty-steel-bed',
   'Hospital-grade MS pipe bed with adjustable backrest.', 'SC-BED-001', 7200, 9000, 30,
   'MS Pipe 1.5"', '75"×36"×35"', '40 kg', '3 Years',
   array['Hospital Grade','Adjustable Back','Side Rails','Easy Clean'], null, '#3D1B2A', 4.3, 76),

  ('school', 'School Bench-Desk Set', 'school-bench-desk-set',
   'BIS certified 2-seater bench-desk, anti-tip.', 'SC-SCH-001', 3200, 4000, 120,
   'MS Steel + Plywood', '48"×18"×30"', '18 kg', '3 Years',
   array['BIS Certified','Anti-tip','Footrest','Durable'], 'Best Seller', '#2A3D1B', 4.6, 445),

  ('almirahs', '2-Door Home Almirah', '2-door-home-almirah',
   'Compact 2-door home almirah with key lock.', 'SC-ALM-002', 5800, 7200, 55,
   'CRCA Steel 0.5mm', '66"×30"×16"', '32 kg', '5 Years',
   array['2 Shelves','Key Lock','Compact','Powder Coat'], null, '#1B3A5E', 4.5, 203),

  ('ochairs', 'Ergonomic Office Chair', 'ergonomic-office-chair',
   'Steel frame chair with mesh back and lumbar support.', 'SC-CHR-001', 4500, 6000, 70,
   'Steel + Mesh', '42"×24"×24"', '12 kg', '2 Years',
   array['Lumbar Support','Height Adj.','360° Swivel','Mesh Back'], 'Sale', '#2A1B5E', 4.4, 167),

  ('racks', '4-Drawer Filing Cabinet', '4-drawer-filing-cabinet',
   'Vertical filing cabinet, central lock, full-extension drawers.', 'SC-RCK-002', 7500, 9500, 45,
   'Cold Rolled Steel', '52"×15"×18"', '28 kg', '5 Years',
   array['Central Lock','Full Extension','Label Holders','Anti-tilt'], 'Top Rated', '#1B3D2E', 4.7, 289),

  ('otables', '2-Person Workstation', '2-person-workstation',
   'Open-plan workstation with shared pedestal.', 'SC-DSK-002', 18500, 22000, 15,
   'Steel + MDF Top', '72"×48"×30"', '75 kg', '3 Years',
   array['Shared Pedestal','Cable Port','Privacy Panel','Modular'], 'New', '#3D2A1B', 4.5, 134),

  ('wardrobes', 'Sliding Wardrobe 3-Door', 'sliding-wardrobe-3-door',
   'Soft-close sliding wardrobe with LED light.', 'SC-WRD-002', 16000, 20000, 12,
   'CRCA + Aluminium', '84"×54"×24"', '90 kg', '7 Years',
   array['Soft Close','LED Light','2 Hanging Rods','Modular Shelf'], 'Premium', '#1B3A5E', 4.8, 198)
on conflict (sku) do nothing;

-- ── Coupons ──────────────────────────────────────────────────
insert into public.coupons (code, discount_type, discount_value, min_order_value, active) values
  ('STEEL10', 'percent', 10, 0, true)
on conflict (code) do nothing;

-- ── AI Builder pricing engine settings (admin-tunable) ─────────
-- All amounts in INR. Tune these from Admin → Settings as your
-- actual material/labor costs change — no code changes needed.
insert into public.app_settings (key, value) values
  ('gst_rate',               '{"rate": 0.18}'),
  ('free_shipping_threshold','{"amount": 10000}'),
  ('steel_pricing', '{
      "steel_price_per_kg": 85,
      "steel_density_kg_per_m3": 7850,
      "default_gauge_mm": 0.6,
      "finish_cost_per_sqft": 35,
      "hardware_cost_per_door": 250,
      "hardware_cost_per_drawer": 350,
      "mirror_cost": 1200,
      "lock_cost_key": 150,
      "lock_cost_digital": 1800,
      "wheels_cost": 600,
      "labor_margin_pct": 0.35,
      "estimate_low_pct": 0.95,
      "estimate_high_pct": 1.15
    }')
on conflict (key) do update set value = excluded.value;
