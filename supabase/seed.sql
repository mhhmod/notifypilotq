insert into public.np_tenants (
  id,
  tenant_slug,
  brand_name,
  store_url,
  dashboard_domain,
  store_category,
  internal_integration_mode
) values (
  '11111111-1111-4111-8111-111111111111',
  'sn2-studios',
  'SN2 Studios',
  'https://sn2studios.co',
  'notify.lnnsy.com',
  'Fashion and lifestyle e-commerce',
  'connected_mode'
) on conflict (tenant_slug) do update set
  brand_name = excluded.brand_name,
  store_url = excluded.store_url,
  dashboard_domain = excluded.dashboard_domain,
  store_category = excluded.store_category,
  internal_integration_mode = excluded.internal_integration_mode;

insert into public.np_admin_users (
  id,
  tenant_id,
  email,
  display_name,
  role
) values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'owner@sn2studios.co',
  'Store Admin',
  'admin'
) on conflict (tenant_id, email) do update set
  display_name = excluded.display_name,
  role = excluded.role;

insert into public.np_app_settings (
  tenant_id,
  brand_settings,
  push_settings,
  n8n_settings,
  safety_settings,
  store_integration_settings,
  opt_in_discount_settings
) values (
  '11111111-1111-4111-8111-111111111111',
  '{"storeName":"SN2 Studios","storeUrl":"https://sn2studios.co","defaultNotificationIcon":"https://sn2studios.co/cdn/shop/files/store-icon.png","defaultClickUrl":"https://sn2studios.co/collections/all","timezone":"Africa/Cairo"}',
  '{"vapidPublicKey":"Configured after deployment","vapidPrivateKeyMasked":"••••••••••••••••","vapidSubject":"mailto:admin@sn2studios.co","serviceWorkerStatus":"Ready","subscriberCollectionStatus":"Ready"}',
  '{"baseUrl":"","campaignSenderWebhookStatus":"Ready","lastWorkflowRun":"Not started"}',
  '{"ownerTestMode":true,"liveSendingEnabled":false,"maxSendsPerHour":500,"requireSendConfirmation":true,"allowedTestSubscribers":[]}',
  '{"storeName":"SN2 Studios","storeUrl":"https://sn2studios.co","platform":"Shopify","connectionStatus":"Setup Required","storefrontScript":"Pending Installation","webhooks":"Not Configured","adminApi":"Not Connected","discountCreationStatus":"Shopify Connection Required","ordersWebhookStatus":"Not Configured","pushChannelStatus":"Ready"}',
  '{"enabled":true,"discountPercent":10,"codePrefix":"SN10","expiryHours":48,"popupTitle":"Get 10% off your order","popupBody":"Allow notifications to receive your discount code, private drops, restock alerts, and limited-time offers.","primaryButtonText":"Unlock 10% Off","secondaryButtonText":"Maybe later","successTitle":"Your 10% discount is unlocked","successBody":"Use this code at checkout:","applyDiscountRedirectUrl":"https://sn2studios.co/collections/all","popupDelaySeconds":2,"reShowAfterDismissHours":72}'
) on conflict (tenant_id) do update set
  brand_settings = excluded.brand_settings,
  push_settings = excluded.push_settings,
  n8n_settings = excluded.n8n_settings,
  safety_settings = excluded.safety_settings,
  store_integration_settings = excluded.store_integration_settings,
  opt_in_discount_settings = excluded.opt_in_discount_settings;

insert into public.np_integration_status (
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
