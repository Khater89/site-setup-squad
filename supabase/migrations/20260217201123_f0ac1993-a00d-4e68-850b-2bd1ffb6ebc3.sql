
ALTER TABLE public.provider_wallet_ledger DROP CONSTRAINT provider_wallet_ledger_reason_check;

ALTER TABLE public.provider_wallet_ledger ADD CONSTRAINT provider_wallet_ledger_reason_check
  CHECK (reason = ANY (ARRAY['commission', 'settlement', 'adjustment', 'platform_fee']));
