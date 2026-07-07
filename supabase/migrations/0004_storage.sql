-- ════════════════════════════════════════════════════════════════
-- STEELCRAFT — STORAGE BUCKETS
-- Run after 0003_rls.sql
-- Two public-read buckets:
--   product-images   → uploaded by admins via the Admin UI
--   design-previews  → written by the ai-design Edge Function
--                       (service role key bypasses these policies)
-- ════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values
  ('product-images',  'product-images',  true),
  ('design-previews', 'design-previews', true)
on conflict (id) do nothing;

-- Public read for both buckets
create policy "public_read_product_images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "public_read_design_previews" on storage.objects
  for select using (bucket_id = 'design-previews');

-- Admins can manage product photos directly from the Admin UI
create policy "admin_write_product_images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "admin_update_product_images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

create policy "admin_delete_product_images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- design-previews is written only by the Edge Function (service role),
-- which bypasses RLS entirely — no client-side insert policy is granted.
