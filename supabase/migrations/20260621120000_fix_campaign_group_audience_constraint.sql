alter table public.np_push_campaigns
  add column if not exists audience_group_id uuid references public.np_subscriber_groups(id) on delete set null;

alter table public.np_push_campaigns
  drop constraint if exists push_campaigns_audience_check;

alter table public.np_push_campaigns
  drop constraint if exists np_push_campaigns_audience_check;

alter table public.np_push_campaigns
  add constraint np_push_campaigns_audience_check
  check (audience in ('Selected test subscribers', 'All active subscribers', 'Subscriber group'));
