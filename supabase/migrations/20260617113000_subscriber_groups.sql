create table if not exists public.np_subscriber_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.np_subscriber_group_members (
  tenant_id uuid not null references public.np_tenants(id) on delete cascade,
  group_id uuid not null references public.np_subscriber_groups(id) on delete cascade,
  subscriber_id uuid not null references public.np_push_subscribers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, subscriber_id)
);

alter table public.np_push_campaigns
  add column if not exists audience_group_id uuid references public.np_subscriber_groups(id) on delete set null;

alter table public.np_push_campaigns
  drop constraint if exists np_push_campaigns_audience_check;

alter table public.np_push_campaigns
  add constraint np_push_campaigns_audience_check
  check (audience in ('Selected test subscribers', 'All active subscribers', 'Subscriber group'));

create unique index if not exists idx_np_subscriber_groups_tenant_name
  on public.np_subscriber_groups(tenant_id, lower(name));

create index if not exists idx_np_subscriber_groups_tenant
  on public.np_subscriber_groups(tenant_id, name);

create index if not exists idx_np_subscriber_group_members_subscriber
  on public.np_subscriber_group_members(tenant_id, subscriber_id);

create index if not exists idx_np_push_campaigns_audience_group
  on public.np_push_campaigns(tenant_id, audience_group_id);

alter table public.np_subscriber_groups enable row level security;
alter table public.np_subscriber_group_members enable row level security;

create policy "Tenant admins can read subscriber groups"
  on public.np_subscriber_groups for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can manage subscriber groups"
  on public.np_subscriber_groups for all
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

create policy "Tenant admins can read subscriber group members"
  on public.np_subscriber_group_members for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from public.np_admin_users where auth_user_id = auth.uid()
    )
  );

create policy "Tenant admins can manage subscriber group members"
  on public.np_subscriber_group_members for all
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
