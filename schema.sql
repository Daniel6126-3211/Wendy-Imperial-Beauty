-- ============================================================================
-- WENDY BEAUTY & SPA — database schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> paste -> Run.
-- Safe to re-run: uses "if not exists" / "or replace" throughout.
-- ============================================================================

-- ---------- admins (who is allowed to use /admin) ----------
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- ---------- products ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text default '',
  price numeric,                 -- null = "PRICE ON REQUEST"
  available boolean,             -- null = "AVAILABILITY TO BE CONFIRMED"
  badge text,                    -- e.g. NEW / TRENDING / POPULAR / LIMITED / COMING SOON
  image_url text,
  colors text,
  sizes text,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ---------- banners / homepage content (hero, category tiles, promo rows) ----------
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  slot text not null,            -- 'hero' | 'category:<name>' | 'editorial:<name>'
  headline text,
  subtext text,
  cta_label text,
  cta_href text,
  image_url text,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ---------- beauty & spa services ----------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'BEAUTY', -- SALON / BEAUTY / SPA
  published boolean not null default true,
  sort_order int not null default 0
);

-- ---------- booking requests (from the Beauty & Spa form) ----------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  service text not null,
  preferred_date date,
  preferred_time time,
  message text,
  status text not null default 'new',  -- new | contacted | confirmed | completed | cancelled
  created_at timestamptz default now()
);

-- ---------- product / general enquiries (from WhatsApp / bag "request order confirmation") ----------
create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  product_summary text,          -- free text list of items enquired about
  message text,
  channel text default 'website', -- website | whatsapp
  status text not null default 'new', -- new | handled
  created_at timestamptz default now()
);

-- ---------- team members ----------
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_group text not null,  -- Hair & Beauty Specialists / Cosmetics Consultants / etc.
  photo_url text,
  published boolean not null default true,
  sort_order int not null default 0
);

-- ---------- customer reviews (admin-approved only) ----------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  quote text not null,
  rating int check (rating between 1 and 5),
  published boolean not null default false,
  created_at timestamptz default now()
);

-- ---------- site settings (single row) ----------
create table if not exists settings (
  id int primary key default 1,
  whatsapp_1 text not null default '2348137609506',
  whatsapp_2 text not null default '2349012314878',
  contact_email text not null default 'dannydj786@gmail.com',
  site_tagline text not null default 'LOOK GOOD • FEEL CONFIDENT • BE YOU',
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Public visitors: read-only on published content, insert-only on
-- bookings/enquiries. Only signed-in admins (present in admin_users) can
-- write to catalogue/content tables or read booking/enquiry contact details.
-- ============================================================================

alter table admin_users enable row level security;
alter table products enable row level security;
alter table banners enable row level security;
alter table services enable row level security;
alter table bookings enable row level security;
alter table enquiries enable row level security;
alter table team_members enable row level security;
alter table reviews enable row level security;
alter table settings enable row level security;

create or replace function is_admin() returns boolean as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$ language sql security definer;

-- products
drop policy if exists "public read published products" on products;
create policy "public read published products" on products for select using (published = true or is_admin());
drop policy if exists "admin write products" on products;
create policy "admin write products" on products for all using (is_admin()) with check (is_admin());

-- banners
drop policy if exists "public read published banners" on banners;
create policy "public read published banners" on banners for select using (published = true or is_admin());
drop policy if exists "admin write banners" on banners;
create policy "admin write banners" on banners for all using (is_admin()) with check (is_admin());

-- services
drop policy if exists "public read published services" on services;
create policy "public read published services" on services for select using (published = true or is_admin());
drop policy if exists "admin write services" on services;
create policy "admin write services" on services for all using (is_admin()) with check (is_admin());

-- bookings: anyone can submit, only admins can read/update
drop policy if exists "public insert bookings" on bookings;
create policy "public insert bookings" on bookings for insert with check (true);
drop policy if exists "admin read bookings" on bookings;
create policy "admin read bookings" on bookings for select using (is_admin());
drop policy if exists "admin update bookings" on bookings;
create policy "admin update bookings" on bookings for update using (is_admin());

-- enquiries: anyone can submit, only admins can read/update
drop policy if exists "public insert enquiries" on enquiries;
create policy "public insert enquiries" on enquiries for insert with check (true);
drop policy if exists "admin read enquiries" on enquiries;
create policy "admin read enquiries" on enquiries for select using (is_admin());
drop policy if exists "admin update enquiries" on enquiries;
create policy "admin update enquiries" on enquiries for update using (is_admin());

-- team_members
drop policy if exists "public read published team" on team_members;
create policy "public read published team" on team_members for select using (published = true or is_admin());
drop policy if exists "admin write team" on team_members;
create policy "admin write team" on team_members for all using (is_admin()) with check (is_admin());

-- reviews
drop policy if exists "public read published reviews" on reviews;
create policy "public read published reviews" on reviews for select using (published = true or is_admin());
drop policy if exists "admin write reviews" on reviews;
create policy "admin write reviews" on reviews for all using (is_admin()) with check (is_admin());

-- settings
drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);
drop policy if exists "admin write settings" on settings;
create policy "admin write settings" on settings for update using (is_admin());

-- admin_users: admins can see the admin list; nobody can self-promote
drop policy if exists "admin read admin_users" on admin_users;
create policy "admin read admin_users" on admin_users for select using (is_admin());

-- ============================================================================
-- STORAGE — bucket for product/banner/team photos
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

drop policy if exists "public read site images" on storage.objects;
create policy "public read site images" on storage.objects for select using (bucket_id = 'site-images');
drop policy if exists "admin upload site images" on storage.objects;
create policy "admin upload site images" on storage.objects for insert with check (bucket_id = 'site-images' and is_admin());
drop policy if exists "admin delete site images" on storage.objects;
create policy "admin delete site images" on storage.objects for delete using (bucket_id = 'site-images' and is_admin());

-- ============================================================================
-- After running this file:
-- 1. Create your login in Supabase Dashboard -> Authentication -> Users -> Add user
-- 2. Copy that user's UID, then run:
--    insert into admin_users (user_id) values ('paste-uid-here');
-- 3. Seed starting products/services — see supabase/seed.sql
-- ============================================================================
