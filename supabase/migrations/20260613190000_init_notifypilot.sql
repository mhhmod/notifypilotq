create extension if not exists pgcrypto;

create table if not exists public.np_tenants (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null unique,
  brand_name text not null,
  store_url text not null,
  dashboard_domain text not null,
  store_category text not null,
  internal_integration_mode text not null default 'seeded_mode' check (internal_integration_mode in ('seeded_mode', 'connected_mode')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.np_admin_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  auth_user_id uuid,
  email text not null,
  display_name text not null,
  role text not null default 'admin' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create table if not exists public.np_push_subscribers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  display_name text not null,
  browser text not null,
  device text not null,
  country text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  subscribed_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  endpoint_hash text not null,
  subscription_payload jsonb,
  is_owner_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, endpoint_hash)
);

create table if not exists public.np_push_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  name text not null,
  notification_title text not null,
  notification_body text not null,
  click_url text not null,
  image_url text,
  icon_url text,
  audience text not null check (audience in ('Selected test subscribers', 'All active subscribers')),
  status text not null default 'Draft' check (status in ('Draft', 'Tested', 'Queued', 'Scheduled', 'Sending', 'Sent', 'Failed', 'Cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  total_recipients integer not null default 0 check (total_recipients >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  click_count integer not null default 0 check (click_count >= 0),
  click_rate numeric(6, 2) not null default 0 check (click_rate >= 0),
  created_by uuid references public.np_admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.np_push_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  campaign_id uuid not null references public.np_push_campaigns(id) on delete cascade,
  subscriber_id uuid not null references public.np_push_subscribers(id) on delete cascade,
  status text not null default 'Pending' check (status in ('Pending', 'Queued', 'Sent', 'Failed', 'Skipped')),
  sent_at timestamptz,
  clicked boolean not null default false,
  error text,
  created_at timestamptz not null default now(),
  unique (campaign_id, subscriber_id)
);

create table if not exists public.np_push_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  campaign_id uuid references public.np_push_campaigns(id) on delete cascade,
  subscriber_id uuid references public.np_push_subscribers(id) on delete set null,
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.np_push_clicks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  campaign_id uuid not null references public.np_push_campaigns(id) on delete cascade,
  subscriber_id uuid references public.np_push_subscribers(id) on delete set null,
  click_url text not null,
  user_agent text,
  ip_hash text,
  clicked_at timestamptz not null default now()
);

create table if not exists public.np_app_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.np_tenants(id) on delete cascade,
  brand_settings jsonb not null default '{}'::jsonb,
  push_settings jsonb not null default '{}'::jsonb,
  n8n_settings jsonb not null default '{}'::jsonb,
  safety_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.np_integration_status (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.np_tenants(id) on delete cascade,
  database_status text not null,
  campaign_engine_status text not null,
  push_channel_status text not null,
  subscriber_collection_status text not null,
  storefront_script_status text not null,
  shopify_connection_status text not null,
  live_sending_status text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.np_audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  actor_admin_user_id uuid references public.np_admin_users(id) on delete set null,
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_np_admin_users_auth_user_id on public.np_admin_users(auth_user_id);
create index if not exists idx_np_push_subscribers_tenant_status on public.np_push_subscribers(tenant_id, status);
create index if not exists idx_np_push_campaigns_tenant_created on public.np_push_campaigns(tenant_id, created_at desc);
create index if not exists idx_np_push_campaign_recipients_campaign on public.np_push_campaign_recipients(campaign_id);
create index if not exists idx_np_push_events_campaign_created on public.np_push_events(campaign_id, created_at desc);
create index if not exists idx_np_push_clicks_campaign on public.np_push_clicks(campaign_id);
create index if not exists idx_np_audit_logs_tenant_created on public.np_audit_logs(tenant_id, created_at desc);

alter table public.np_tenants enable row level security;
alter table public.np_admin_users enable row level security;
alter table public.np_push_subscribers enable row level security;
alter table public.np_push_campaigns enable row level security;
alter table public.np_push_campaign_recipients enable row level security;
alter table public.np_push_events enable row level security;
alter table public.np_push_clicks enable row level security;
alter table public.np_app_settings enable row level security;
alter table public.np_integration_status enable row level security;
alter table public.np_audit_logs enable row level security;

create policy "Admin users can read themselves"
  on public.np_admin_users for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "Tenant admins can read tenant"
  on public.np_tenants for select
  to authenticated
  using (
    id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can read subscribers"
  on public.np_push_subscribers for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can update subscribers"
  on public.np_push_subscribers for update
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

create policy "Tenant admins can read campaigns"
  on public.np_push_campaigns for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can manage campaigns"
  on public.np_push_campaigns for all
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

create policy "Tenant admins can read campaign recipients"
  on public.np_push_campaign_recipients for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can manage campaign recipients"
  on public.np_push_campaign_recipients for all
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

create policy "Tenant admins can read events"
  on public.np_push_events for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can manage events"
  on public.np_push_events for all
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

create policy "Tenant admins can read clicks"
  on public.np_push_clicks for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can manage clicks"
  on public.np_push_clicks for all
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

create policy "Tenant admins can read settings"
  on public.np_app_settings for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can update settings"
  on public.np_app_settings for update
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

create policy "Tenant admins can read integration status"
  on public.np_integration_status for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can update integration status"
  on public.np_integration_status for update
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

create policy "Tenant admins can read audit logs"
  on public.np_audit_logs for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );
