insert into public.tenants (
  id,
  tenant_slug,
  brand_name,
  store_url,
  dashboard_domain,
  store_category,
  internal_integration_mode
) values (
  '11111111-1111-4111-8111-111111111111',
  'store',
  'GrindCTRL',
  'https://grindctrl.cloud',
  'notify.grindctrl.cloud',
  'Premium fashion and lifestyle e-commerce',
  'seeded_mode'
) on conflict (tenant_slug) do update set
  brand_name = excluded.brand_name,
  store_url = excluded.store_url,
  dashboard_domain = excluded.dashboard_domain,
  store_category = excluded.store_category,
  internal_integration_mode = excluded.internal_integration_mode;

insert into public.admin_users (
  id,
  tenant_id,
  email,
  display_name,
  role
) values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'owner@notify.grindctrl.cloud',
  'Store Admin',
  'admin'
) on conflict (tenant_id, email) do update set
  display_name = excluded.display_name,
  role = excluded.role;

insert into public.push_subscribers (
  id,
  tenant_id,
  display_name,
  browser,
  device,
  country,
  status,
  subscribed_at,
  last_seen_at,
  endpoint_hash,
  is_owner_allowed
) values
  ('30000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Visitor WEB-1001','Chrome','Android','Egypt','Active','2026-06-02T09:20:00Z','2026-06-13T08:10:00Z','endpoint_1001',true),
  ('30000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Visitor WEB-1002','Safari','iPhone','United Arab Emirates','Active','2026-06-03T12:45:00Z','2026-06-12T20:18:00Z','endpoint_1002',true),
  ('30000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','Visitor WEB-1003','Edge','Windows','Egypt','Active','2026-06-04T15:12:00Z','2026-06-13T11:24:00Z','endpoint_1003',true),
  ('30000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','Visitor WEB-1004','Chrome','macOS','Saudi Arabia','Active','2026-05-28T18:30:00Z','2026-06-11T16:42:00Z','endpoint_1004',false),
  ('30000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','Visitor WEB-1005','Firefox','Desktop','Egypt','Active','2026-05-30T10:01:00Z','2026-06-13T07:58:00Z','endpoint_1005',false),
  ('30000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','Visitor WEB-1006','Chrome','Android','Kuwait','Active','2026-06-05T14:50:00Z','2026-06-12T13:07:00Z','endpoint_1006',false),
  ('30000000-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','Visitor WEB-1007','Safari','iPhone','Qatar','Inactive','2026-05-19T17:12:00Z','2026-06-04T09:40:00Z','endpoint_1007',false),
  ('30000000-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','Visitor WEB-1008','Chrome','Android','Egypt','Active','2026-06-07T11:38:00Z','2026-06-13T09:33:00Z','endpoint_1008',false),
  ('30000000-0000-4000-8000-000000000009','11111111-1111-4111-8111-111111111111','Visitor WEB-1009','Safari','macOS','United Arab Emirates','Active','2026-06-01T19:15:00Z','2026-06-10T18:05:00Z','endpoint_1009',false),
  ('30000000-0000-4000-8000-000000000010','11111111-1111-4111-8111-111111111111','Visitor WEB-1010','Edge','Windows','Saudi Arabia','Active','2026-05-31T08:42:00Z','2026-06-13T06:55:00Z','endpoint_1010',false),
  ('30000000-0000-4000-8000-000000000011','11111111-1111-4111-8111-111111111111','Visitor WEB-1011','Chrome','Android','Jordan','Active','2026-06-08T12:20:00Z','2026-06-13T10:12:00Z','endpoint_1011',false),
  ('30000000-0000-4000-8000-000000000012','11111111-1111-4111-8111-111111111111','Visitor WEB-1012','Firefox','Desktop','Egypt','Inactive','2026-05-21T11:00:00Z','2026-06-02T14:22:00Z','endpoint_1012',false),
  ('30000000-0000-4000-8000-000000000013','11111111-1111-4111-8111-111111111111','Visitor WEB-1013','Chrome','Windows','Egypt','Active','2026-06-09T09:24:00Z','2026-06-13T08:44:00Z','endpoint_1013',false),
  ('30000000-0000-4000-8000-000000000014','11111111-1111-4111-8111-111111111111','Visitor WEB-1014','Safari','iPhone','Saudi Arabia','Active','2026-06-09T17:09:00Z','2026-06-12T21:31:00Z','endpoint_1014',false),
  ('30000000-0000-4000-8000-000000000015','11111111-1111-4111-8111-111111111111','Visitor WEB-1015','Chrome','Android','United Arab Emirates','Active','2026-06-10T07:50:00Z','2026-06-13T09:01:00Z','endpoint_1015',false),
  ('30000000-0000-4000-8000-000000000016','11111111-1111-4111-8111-111111111111','Visitor WEB-1016','Edge','Windows','Egypt','Active','2026-06-10T10:35:00Z','2026-06-13T11:11:00Z','endpoint_1016',false),
  ('30000000-0000-4000-8000-000000000017','11111111-1111-4111-8111-111111111111','Visitor WEB-1017','Chrome','macOS','Kuwait','Active','2026-06-10T13:05:00Z','2026-06-12T15:46:00Z','endpoint_1017',false),
  ('30000000-0000-4000-8000-000000000018','11111111-1111-4111-8111-111111111111','Visitor WEB-1018','Safari','iPad','Qatar','Active','2026-06-11T18:28:00Z','2026-06-13T07:37:00Z','endpoint_1018',false),
  ('30000000-0000-4000-8000-000000000019','11111111-1111-4111-8111-111111111111','Visitor WEB-1019','Chrome','Android','Egypt','Active','2026-06-11T20:17:00Z','2026-06-13T06:49:00Z','endpoint_1019',false),
  ('30000000-0000-4000-8000-000000000020','11111111-1111-4111-8111-111111111111','Visitor WEB-1020','Firefox','Desktop','Saudi Arabia','Inactive','2026-05-24T16:42:00Z','2026-06-01T12:02:00Z','endpoint_1020',false),
  ('30000000-0000-4000-8000-000000000021','11111111-1111-4111-8111-111111111111','Visitor WEB-1021','Chrome','Android','Egypt','Active','2026-06-12T07:18:00Z','2026-06-13T10:39:00Z','endpoint_1021',false),
  ('30000000-0000-4000-8000-000000000022','11111111-1111-4111-8111-111111111111','Visitor WEB-1022','Safari','iPhone','United Arab Emirates','Active','2026-06-12T15:33:00Z','2026-06-13T09:29:00Z','endpoint_1022',false),
  ('30000000-0000-4000-8000-000000000023','11111111-1111-4111-8111-111111111111','Visitor WEB-1023','Edge','Windows','Egypt','Active','2026-06-12T19:22:00Z','2026-06-13T11:03:00Z','endpoint_1023',false),
  ('30000000-0000-4000-8000-000000000024','11111111-1111-4111-8111-111111111111','Visitor WEB-1024','Chrome','Android','Jordan','Active','2026-06-13T06:40:00Z','2026-06-13T10:03:00Z','endpoint_1024',false),
  ('30000000-0000-4000-8000-000000000025','11111111-1111-4111-8111-111111111111','Visitor WEB-1025','Safari','iPhone','Egypt','Active','2026-06-13T08:14:00Z','2026-06-13T11:19:00Z','endpoint_1025',false)
on conflict (tenant_id, endpoint_hash) do update set
  status = excluded.status,
  last_seen_at = excluded.last_seen_at,
  is_owner_allowed = excluded.is_owner_allowed;

insert into public.push_campaigns (
  id,
  tenant_id,
  name,
  notification_title,
  notification_body,
  click_url,
  image_url,
  icon_url,
  audience,
  status,
  scheduled_at,
  sent_at,
  total_recipients,
  sent_count,
  failed_count,
  click_count,
  click_rate,
  created_by,
  created_at
) values
  ('40000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Winter Drop Early Access','Winter Drop is live','Explore the latest pieces before they sell out.','https://grindctrl.cloud/collections/new-arrivals','https://grindctrl.cloud/cdn/shop/files/drop-preview.jpg','https://grindctrl.cloud/cdn/shop/files/store-icon.png','All active subscribers','Sent',null,'2026-06-12T08:00:00Z',21,20,1,8,40.00,'22222222-2222-4222-8222-222222222222','2026-06-12T07:30:00Z'),
  ('40000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Private Weekend Offer','Private weekend offer','Enjoy limited savings on selected essentials through Sunday.','https://grindctrl.cloud/collections/weekend-edit',null,null,'All active subscribers','Sent',null,'2026-06-07T11:00:00Z',18,18,0,6,33.30,'22222222-2222-4222-8222-222222222222','2026-06-07T10:15:00Z'),
  ('40000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','Back in Stock Alert','Back in stock','The bestselling tailored vest is available again in limited quantities.','https://grindctrl.cloud/products/tailored-vest',null,null,'All active subscribers','Sent',null,'2026-06-03T15:45:00Z',15,14,1,5,35.70,'22222222-2222-4222-8222-222222222222','2026-06-03T15:20:00Z'),
  ('40000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','New Collection Launch','The new collection arrives tonight','Preview sculpted layers, soft tailoring, and everyday statement pieces.','https://grindctrl.cloud/collections/collection-preview',null,null,'All active subscribers','Scheduled','2026-06-14T18:00:00Z',null,22,0,0,0,0.00,'22222222-2222-4222-8222-222222222222','2026-06-13T06:00:00Z'),
  ('40000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','Last Chance Sale','Last chance to shop the edit','Final sizes are moving quickly. Complete your picks today.','https://grindctrl.cloud/collections/sale',null,null,'Selected test subscribers','Draft',null,null,3,0,0,0,0.00,'22222222-2222-4222-8222-222222222222','2026-06-13T09:45:00Z')
on conflict (id) do update set
  status = excluded.status,
  sent_count = excluded.sent_count,
  failed_count = excluded.failed_count,
  click_count = excluded.click_count,
  click_rate = excluded.click_rate;

with selected as (
  select id, row_number() over (order by subscribed_at asc) as rn
  from public.push_subscribers
  where tenant_id = '11111111-1111-4111-8111-111111111111' and status = 'Active'
  order by subscribed_at asc
  limit 21
)
insert into public.push_campaign_recipients (
  tenant_id,
  campaign_id,
  subscriber_id,
  status,
  sent_at,
  clicked,
  error
)
select
  '11111111-1111-4111-8111-111111111111',
  '40000000-0000-4000-8000-000000000001',
  id,
  case when rn = 21 then 'Failed' else 'Sent' end,
  case when rn = 21 then null else '2026-06-12T08:00:00Z'::timestamptz end,
  rn <= 8,
  case when rn = 21 then 'Delivery endpoint inactive' else null end
from selected
on conflict (campaign_id, subscriber_id) do update set
  status = excluded.status,
  sent_at = excluded.sent_at,
  clicked = excluded.clicked,
  error = excluded.error;

with selected as (
  select id, row_number() over (order by subscribed_at asc) as rn
  from public.push_subscribers
  where tenant_id = '11111111-1111-4111-8111-111111111111' and status = 'Active'
  order by subscribed_at asc
  limit 18
)
insert into public.push_campaign_recipients (
  tenant_id,
  campaign_id,
  subscriber_id,
  status,
  sent_at,
  clicked
)
select
  '11111111-1111-4111-8111-111111111111',
  '40000000-0000-4000-8000-000000000002',
  id,
  'Sent',
  '2026-06-07T11:00:00Z'::timestamptz,
  rn <= 6
from selected
on conflict (campaign_id, subscriber_id) do update set
  status = excluded.status,
  sent_at = excluded.sent_at,
  clicked = excluded.clicked;

with selected as (
  select id, row_number() over (order by subscribed_at asc) as rn
  from public.push_subscribers
  where tenant_id = '11111111-1111-4111-8111-111111111111' and status = 'Active'
  order by subscribed_at asc
  limit 15
)
insert into public.push_campaign_recipients (
  tenant_id,
  campaign_id,
  subscriber_id,
  status,
  sent_at,
  clicked,
  error
)
select
  '11111111-1111-4111-8111-111111111111',
  '40000000-0000-4000-8000-000000000003',
  id,
  case when rn = 15 then 'Failed' else 'Sent' end,
  case when rn = 15 then null else '2026-06-03T15:45:00Z'::timestamptz end,
  rn <= 5,
  case when rn = 15 then 'Delivery endpoint inactive' else null end
from selected
on conflict (campaign_id, subscriber_id) do update set
  status = excluded.status,
  sent_at = excluded.sent_at,
  clicked = excluded.clicked,
  error = excluded.error;

with selected as (
  select id
  from public.push_subscribers
  where tenant_id = '11111111-1111-4111-8111-111111111111' and status = 'Active'
  order by subscribed_at asc
  limit 22
)
insert into public.push_campaign_recipients (
  tenant_id,
  campaign_id,
  subscriber_id,
  status,
  clicked
)
select
  '11111111-1111-4111-8111-111111111111',
  '40000000-0000-4000-8000-000000000004',
  id,
  'Queued',
  false
from selected
on conflict (campaign_id, subscriber_id) do update set
  status = excluded.status,
  clicked = excluded.clicked;

insert into public.push_campaign_recipients (
  tenant_id,
  campaign_id,
  subscriber_id,
  status,
  clicked
)
select
  '11111111-1111-4111-8111-111111111111',
  '40000000-0000-4000-8000-000000000005',
  id,
  'Pending',
  false
from public.push_subscribers
where tenant_id = '11111111-1111-4111-8111-111111111111' and is_owner_allowed = true
on conflict (campaign_id, subscriber_id) do update set
  status = excluded.status,
  clicked = excluded.clicked;

insert into public.app_settings (
  tenant_id,
  brand_settings,
  push_settings,
  n8n_settings,
  safety_settings,
  store_integration_settings,
  opt_in_discount_settings
) values (
  '11111111-1111-4111-8111-111111111111',
  '{"storeName":"GrindCTRL","storeUrl":"https://grindctrl.cloud","defaultNotificationIcon":"https://grindctrl.cloud/cdn/shop/files/store-icon.png","defaultClickUrl":"https://grindctrl.cloud/collections/new-arrivals","timezone":"Africa/Cairo"}',
  '{"vapidPublicKey":"Configured after deployment","vapidPrivateKeyMasked":"â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢","vapidSubject":"mailto:admin@grindctrl.cloud","serviceWorkerStatus":"Ready","subscriberCollectionStatus":"Ready"}',
  '{"baseUrl":"https://n8n.grindctrl.cloud","campaignSenderWebhookStatus":"Ready","lastWorkflowRun":"Not started"}',
  '{"ownerTestMode":true,"liveSendingEnabled":false,"maxSendsPerHour":500,"requireSendConfirmation":true,"allowedTestSubscribers":["Visitor WEB-1001","Visitor WEB-1002","Visitor WEB-1003"]}',
  '{"storeName":"GrindCTRL","storeUrl":"https://grindctrl.cloud","platform":"Shopify","connectionStatus":"Setup Required","storefrontScript":"Pending Installation","webhooks":"Not Configured","adminApi":"Not Connected","discountCreationStatus":"Shopify Connection Required","ordersWebhookStatus":"Not Configured","pushChannelStatus":"Ready"}',
  '{"enabled":true,"discountPercent":10,"codePrefix":"PUSH10","expiryHours":48,"popupTitle":"Get 10% off your order","popupBody":"Allow notifications to receive your discount code, private drops, restock alerts, and limited-time offers.","primaryButtonText":"Unlock 10% Off","secondaryButtonText":"Maybe later","successTitle":"Your 10% discount is unlocked","successBody":"Use this code at checkout:","applyDiscountRedirectUrl":"https://grindctrl.cloud/collections/new-arrivals","popupDelaySeconds":2,"reShowAfterDismissHours":72}'
) on conflict (tenant_id) do update set
  brand_settings = excluded.brand_settings,
  push_settings = excluded.push_settings,
  n8n_settings = excluded.n8n_settings,
  safety_settings = excluded.safety_settings,
  store_integration_settings = excluded.store_integration_settings,
  opt_in_discount_settings = excluded.opt_in_discount_settings;

insert into public.discount_codes (
  id,
  tenant_id,
  subscriber_id,
  shopify_discount_id,
  code,
  discount_percent,
  status,
  usage_limit,
  expires_at,
  used_at,
  used_order_id,
  created_at,
  updated_at
) values
  ('80000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000001','local_PUSH10-WEB1001','PUSH10-WEB1001',10,'issued',1,'2026-06-15T09:20:00Z',null,null,'2026-06-13T09:20:00Z','2026-06-13T09:20:00Z'),
  ('80000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000002','local_PUSH10-WEB1002','PUSH10-WEB1002',10,'used',1,'2026-06-14T12:45:00Z','2026-06-13T16:18:00Z','gid://shopify/Order/1002001','2026-06-12T12:45:00Z','2026-06-13T16:18:00Z'),
  ('80000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000003','local_PUSH10-WEB1003','PUSH10-WEB1003',10,'issued',1,'2026-06-15T15:12:00Z',null,null,'2026-06-13T15:12:00Z','2026-06-13T15:12:00Z'),
  ('80000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000004','local_PUSH10-WEB1004','PUSH10-WEB1004',10,'expired',1,'2026-06-02T18:30:00Z',null,null,'2026-05-31T18:30:00Z','2026-06-02T18:30:00Z')
on conflict (tenant_id, code) do update set
  status = excluded.status,
  used_at = excluded.used_at,
  used_order_id = excluded.used_order_id,
  updated_at = excluded.updated_at;

insert into public.subscriber_activity (
  id,
  tenant_id,
  subscriber_id,
  activity_type,
  message,
  metadata,
  created_at
) values
  ('81000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000001','Discount issued','10% opt-in code issued','{"code":"PUSH10-WEB1001"}','2026-06-13T09:20:00Z'),
  ('81000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000002','Discount used','Opt-in discount used at checkout','{"code":"PUSH10-WEB1002"}','2026-06-13T16:18:00Z'),
  ('81000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','30000000-0000-4000-8000-000000000003','Discount issued','10% opt-in code issued','{"code":"PUSH10-WEB1003"}','2026-06-13T15:12:00Z')
on conflict (id) do nothing;

insert into public.integration_status (
  tenant_id,
  database_status,
  campaign_engine_status,
  push_channel_status,
  subscriber_collection_status,
  storefront_script_status,
  shopify_connection_status,
  live_sending_status
) values (
  '11111111-1111-4111-8111-111111111111',
  'Connected',
  'Ready',
  'Ready',
  'Ready',
  'Pending Installation',
  'Setup Required',
  'Disabled'
) on conflict (tenant_id) do update set
  database_status = excluded.database_status,
  campaign_engine_status = excluded.campaign_engine_status,
  push_channel_status = excluded.push_channel_status,
  subscriber_collection_status = excluded.subscriber_collection_status,
  storefront_script_status = excluded.storefront_script_status,
  shopify_connection_status = excluded.shopify_connection_status,
  live_sending_status = excluded.live_sending_status;

insert into public.push_events (
  id,
  tenant_id,
  campaign_id,
  event_type,
  message,
  created_at
) values
  ('50000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000001','Created','Campaign created','2026-06-12T07:30:00Z'),
  ('50000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000001','Live send requested','Live send requested by owner','2026-06-12T07:58:00Z'),
  ('50000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000001','Campaign queued','Campaign queued for active subscribers','2026-06-12T07:59:00Z'),
  ('50000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000001','Send completed','Delivery completed with one inactive endpoint','2026-06-12T08:02:00Z'),
  ('50000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000002','Send completed','Delivery completed','2026-06-07T11:02:00Z'),
  ('50000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000003','Send completed','Delivery completed with one inactive endpoint','2026-06-03T15:48:00Z'),
  ('50000000-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000004','Created','Campaign created','2026-06-13T06:00:00Z'),
  ('50000000-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000004','Campaign queued','Campaign scheduled for June 14, 2026','2026-06-13T06:07:00Z'),
  ('50000000-0000-4000-8000-000000000009','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000005','Saved draft','Draft saved','2026-06-13T09:45:00Z')
on conflict (id) do nothing;

insert into public.push_clicks (
  id,
  tenant_id,
  campaign_id,
  subscriber_id,
  click_url,
  clicked_at
) values
  ('60000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','https://grindctrl.cloud/collections/new-arrivals','2026-06-12T08:04:00Z'),
  ('60000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','https://grindctrl.cloud/collections/new-arrivals','2026-06-12T08:07:00Z'),
  ('60000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000003','https://grindctrl.cloud/collections/new-arrivals','2026-06-12T08:12:00Z'),
  ('60000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000004','https://grindctrl.cloud/collections/weekend-edit','2026-06-07T11:05:00Z'),
  ('60000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000005','https://grindctrl.cloud/collections/weekend-edit','2026-06-07T11:08:00Z'),
  ('60000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000006','https://grindctrl.cloud/products/tailored-vest','2026-06-03T15:52:00Z')
on conflict (id) do nothing;

insert into public.audit_logs (
  id,
  tenant_id,
  actor_admin_user_id,
  actor_email,
  action,
  entity_type,
  entity_id,
  created_at
) values
  ('70000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','owner@notify.grindctrl.cloud','campaign create','campaign','40000000-0000-4000-8000-000000000001','2026-06-12T07:30:00Z'),
  ('70000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','owner@notify.grindctrl.cloud','send live','campaign','40000000-0000-4000-8000-000000000001','2026-06-12T07:58:00Z'),
  ('70000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','owner@notify.grindctrl.cloud','settings update','settings',null,'2026-06-11T10:18:00Z'),
  ('70000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','owner@notify.grindctrl.cloud','store connection test','integration',null,'2026-06-10T13:42:00Z')
on conflict (id) do nothing;



