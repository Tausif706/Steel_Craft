import { z } from 'zod';

// ─── CHECKOUT ADDRESS ──────────────────────────────────────
export const addressSchema = z.object({
  cnm:   z.string().min(2, 'Full name is required'),
  cph:   z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone'),
  cem:   z.string().email('Invalid email').or(z.literal('')),
  ca1:   z.string().min(5, 'Address Line 1 is required'),
  ca2:   z.string().optional(),
  city:  z.string().min(2, 'City is required'),
  state: z.string().min(1, 'Select a state'),
  pin:   z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN'),
});
export type AddressData = z.infer<typeof addressSchema>;

// ─── COUPON ────────────────────────────────────────────────
export const couponSchema = z.object({
  coupon: z.string(),
});
export type CouponData = z.infer<typeof couponSchema>;

// ─── WHOLESALE / RFQ ───────────────────────────────────────
export const rfqSchema = z.object({
  co:  z.string().min(2, 'Company name is required'),
  nm:  z.string().optional(),
  ph:  z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone'),
  em:  z.string().email('Invalid email'),
  ci:  z.string().optional(),
  pr:  z.string().optional(),
  qty: z.coerce.number().min(10, 'Minimum 10 units for wholesale'),
  no:  z.string().optional(),
});
export type RFQData = z.infer<typeof rfqSchema>;

// ─── CONTACT FORM ──────────────────────────────────────────
export const contactSchema = z.object({
  name:    z.string().min(2, 'Name is required'),
  phone:   z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone').or(z.literal('')),
  email:   z.string().email('Invalid email'),
  subject: z.string().min(1, 'Select a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});
export type ContactData = z.infer<typeof contactSchema>;

// ─── PROFILE ───────────────────────────────────────────────
export const profileSchema = z.object({
  userName: z.string().min(2, 'Name is required'),
  phone:    z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone').or(z.literal('')),
  email:    z.string().email('Invalid email').or(z.literal('')),
  city:     z.string().optional(),
  state:    z.string().optional(),
});
export type ProfileData = z.infer<typeof profileSchema>;

// ─── ACCOUNT PROFILE (Supabase Auth-backed) ─────────────────
export const accountProfileSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName:  z.string().optional(),
  phone:     z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone'),
});
export type AccountProfileData = z.infer<typeof accountProfileSchema>;
