alter table public.np_discount_codes
  add column if not exists claim_fingerprint text,
  add column if not exists claim_ip_hash text;

create unique index if not exists idx_np_discount_codes_one_claim_fingerprint
  on public.np_discount_codes (tenant_id, claim_fingerprint)
  where claim_fingerprint is not null;

create index if not exists idx_np_discount_codes_claim_ip_created
  on public.np_discount_codes (tenant_id, claim_ip_hash, created_at desc)
  where claim_ip_hash is not null;
