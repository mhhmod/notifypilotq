alter table public.np_app_settings
  add column if not exists store_integration_settings jsonb not null default '{}'::jsonb,
  add column if not exists opt_in_discount_settings jsonb not null default '{}'::jsonb;

create table if not exists public.np_shopify_installations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  shop_domain text not null,
  access_token text not null,
  scopes text not null,
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, shop_domain)
);

create table if not exists public.np_discount_codes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  subscriber_id uuid not null references public.np_push_subscribers(id) on delete cascade,
  shopify_discount_id text not null,
  code text not null,
  discount_percent numeric(5, 2) not null check (discount_percent > 0 and discount_percent <= 100),
  status text not null default 'issued' check (status in ('issued', 'used', 'expired', 'cancelled')),
  usage_limit integer not null default 1 check (usage_limit > 0),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create unique index if not exists idx_np_discount_codes_one_active_per_subscriber
  on public.np_discount_codes (tenant_id, subscriber_id)
  where status = 'issued';

create index if not exists idx_np_discount_codes_status_expires
  on public.np_discount_codes (tenant_id, status, expires_at);

create table if not exists public.np_subscriber_activity (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  subscriber_id uuid references public.np_push_subscribers(id) on delete set null,
  activity_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_np_subscriber_activity_tenant_created
  on public.np_subscriber_activity (tenant_id, created_at desc);

alter table public.np_shopify_installations enable row level security;
alter table public.np_discount_codes enable row level security;
alter table public.np_subscriber_activity enable row level security;

create policy "Tenant admins can read discount codes"
  on public.np_discount_codes for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can manage discount codes"
  on public.np_discount_codes for all
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid() and role = 'admin'
    )
  )
  with check (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Tenant admins can read subscriber activity"
  on public.np_subscriber_activity for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can manage subscriber activity"
  on public.np_subscriber_activity for all
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid() and role = 'admin'
    )
  )
  with check (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid() and role = 'admin'
    )
  );
