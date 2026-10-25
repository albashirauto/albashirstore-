-- =====================================================================
-- Al Bashir Autos: full product editor fields
-- Run AFTER 002_dashboard.sql. Safe to run again.
-- =====================================================================

-- ---------- public product fields (shown on the website) ----------
alter table public.products add column if not exists details_html text;              -- full description (rich text)
alter table public.products add column if not exists video_url text;                 -- YouTube link
alter table public.products add column if not exists specs jsonb default '[]';       -- [{label, value}]
alter table public.products add column if not exists variants jsonb default '[]';    -- [{name, sku, price, stock}]
alter table public.products add column if not exists bundle jsonb default '[]';      -- [{product_id, qty}]
alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_description text;
alter table public.products add column if not exists condition text default 'new';   -- new | used | refurbished
alter table public.products add column if not exists warranty text;
alter table public.products add column if not exists stock_status text default 'auto'; -- auto | in_stock | out_of_stock
alter table public.products add column if not exists show_stock boolean default true;  -- show "Only 3 left" etc.

-- ---------- private purchase details (admins only, same table as cost price) ----------
alter table public.product_costs add column if not exists supplier_name text;
alter table public.product_costs add column if not exists supplier_phone text;
alter table public.product_costs add column if not exists supplier_sku text;
alter table public.product_costs add column if not exists location text;            -- rack / shelf in the shop
alter table public.product_costs add column if not exists reorder_level int;        -- alert when stock falls to this
alter table public.product_costs add column if not exists purchase_notes text;
