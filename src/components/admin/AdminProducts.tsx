import { useEffect, useState } from 'react';
import { SkeletonAdminTable } from '../ui/Skeleton';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  fetchAdminProducts, createAdminProductThunk, updateAdminProductThunk, deleteAdminProductThunk, uploadAdminProductImageThunk,
} from '../../store/slices';
import { useNotification } from '../../hooks/useNotification';
import { fmt, catIC, catN } from '../../lib/utils';
import { Btn, Field, SelectField, Textarea } from '../../components/ui/shared';
import type { ProductInput } from '../../lib/repo';
import type { Product } from '../../types';

const BADGES = ['', 'Best Seller', 'New', 'Sale', 'Top Rated', 'Premium'];

const emptyForm: ProductInput = {
  name: '', categoryId: '', description: '', sku: '', price: 0, originalPrice: 0, wholesalePrice: 0,
  stockQuantity: 0, material: '', dimensions: '', weight: '', warranty: '', features: [], badge: null,
  accentColor: '#1B3A5E', active: true,
};

export default function AdminProducts() {
  const dispatch = useAppDispatch();
  const notify = useNotification();
  const products = useAppSelector(s => s.admin.products);
  const loaded = useAppSelector(s => s.admin.loaded.products);
  const categories = useAppSelector(s => s.catalog.categories).filter(c => c.id !== 'all');
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [featuresText, setFeaturesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { dispatch(fetchAdminProducts()); }, [dispatch]);

  function openNew() {
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' });
    setFeaturesText('');
    setEditingId('new');
  }
  function openEdit(p: Product) {
    setForm({
      name: p.n, categoryId: p.cat, description: p.d, sku: p.sku ?? '', price: p.p, originalPrice: p.o,
      wholesalePrice: 0, stockQuantity: p.stock ?? 0, material: p.mat, dimensions: p.dim, weight: p.wt,
      warranty: p.wa, features: p.f, badge: p.b, accentColor: p.bg, active: true,
    });
    setFeaturesText(p.f.join(', '));
    setEditingId(p.id);
  }

  async function save() {
    setSaving(true);
    const payload = { ...form, features: featuresText.split(',').map(f => f.trim()).filter(Boolean) };
    try {
      if (editingId === 'new') {
        await dispatch(createAdminProductThunk(payload)).unwrap();
        notify('Product created ✓');
      } else if (typeof editingId === 'number') {
        await dispatch(updateAdminProductThunk({ id: editingId, patch: payload })).unwrap();
        notify('Product updated ✓');
      }
      setEditingId(null);
    } catch (err: any) {
      notify(err.message ?? 'Could not save product', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await dispatch(deleteAdminProductThunk(id));
    notify('Product deleted', 'info');
  }

  async function handleImageUpload(productId: number, file: File) {
    setUploading(true);
    try {
      await dispatch(uploadAdminProductImageThunk({ productId, file })).unwrap();
      notify('Photo uploaded ✓');
    } catch (err: any) {
      notify(err.message ?? 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  if (!loaded) return <div className="text-center py-10 text-[var(--tx3)] text-sm">Loading products…</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[14px] font-bold text-[var(--tx)]">Products ({products.length})</div>
        <Btn onClick={openNew} className="py-1.5 px-3 text-[12px]">+ Add Product</Btn>
      </div>

      {editingId !== null && (
        <div className="bg-[var(--sf)] border-2 border-[var(--dk)] rounded-[16px] p-4 mb-4">
          <div className="text-[13.5px] font-bold text-[var(--tx)] mb-3">{editingId === 'new' ? 'New Product' : 'Edit Product'}</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <SelectField label="Category *" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.n}</option>)}
            </SelectField>
            <Field label="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
            <Field label="Price (₹) *" type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            <Field label="Original / MRP (₹)" type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: Number(e.target.value) })} />
            <Field label="Wholesale Price (₹)" type="number" value={form.wholesalePrice} onChange={e => setForm({ ...form, wholesalePrice: Number(e.target.value) })} />
            <Field label="Stock Quantity *" type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: Number(e.target.value) })} />
            <Field label="Material" value={form.material} onChange={e => setForm({ ...form, material: e.target.value })} />
            <Field label="Dimensions" value={form.dimensions} onChange={e => setForm({ ...form, dimensions: e.target.value })} />
            <Field label="Weight" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
            <Field label="Warranty" value={form.warranty} onChange={e => setForm({ ...form, warranty: e.target.value })} />
            <SelectField label="Badge" value={form.badge ?? ''} onChange={e => setForm({ ...form, badge: e.target.value || null })}>
              {BADGES.map(b => <option key={b} value={b}>{b || '— None —'}</option>)}
            </SelectField>
            <div className="flex items-center gap-2">
              <label className="text-[12.5px] font-bold text-[var(--tx)]">Accent Color</label>
              <input type="color" value={form.accentColor} onChange={e => setForm({ ...form, accentColor: e.target.value })} className="w-9 h-9 rounded-lg border border-[var(--br)]" />
            </div>
            <div className="sm:col-span-2"><Textarea label="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="sm:col-span-2"><Field label="Features (comma-separated)" value={featuresText} onChange={e => setFeaturesText(e.target.value)} /></div>
            <label className="flex items-center gap-2 text-[13px] text-[var(--tx2)]">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />Visible in store
            </label>
          </div>

          {typeof editingId === 'number' && (
            <div className="mt-3">
              <label className="text-[12.5px] font-bold text-[var(--tx)] block mb-1.5">Product Photo</label>
              <input type="file" accept="image/*" disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(editingId, f); }}
                className="text-[12.5px] text-[var(--tx2)]" />
              {uploading && <span className="text-[12px] text-[var(--tx3)] ml-2">Uploading…</span>}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Btn variant="secondary" onClick={() => setEditingId(null)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</Btn>
          </div>
        </div>
      )}

      {products.map(p => (
        <div key={p.id} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3 mb-2 flex items-center gap-3">
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: p.bg }}>
            {p.img ? <img src={p.img} alt="" className="w-full h-full object-cover" /> : <i className={`ti ${catIC(categories, p.cat)} text-[20px] text-white/40`} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-[var(--tx)] truncate">{p.n}</div>
            <div className="text-[11px] text-[var(--tx3)]">{catN(categories, p.cat)} · SKU {p.sku || '—'}</div>
          </div>
          <div className="text-right flex-shrink-0 mr-2">
            <div className="text-[14px] font-extrabold text-[var(--tx)]">{fmt(p.p)}</div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${(p.stock ?? 0) > 5 ? 'bg-green-100 text-green-800' : (p.stock ?? 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {(p.stock ?? 0) > 0 ? `${p.stock} in stock` : 'Out of stock'}
            </span>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Btn variant="secondary" className="py-1.5 px-2.5 text-[11px]" onClick={() => openEdit(p)}>✏️</Btn>
            <Btn variant="danger" className="py-1.5 px-2.5 text-[11px]" onClick={() => handleDelete(p.id)}>🗑</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}
