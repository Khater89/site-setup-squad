
-- Add CHECK constraint to ensure settlement amounts are positive and reasonable
-- Using a trigger instead of CHECK constraint for better flexibility

CREATE OR REPLACE FUNCTION public.validate_wallet_ledger_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- For settlements, enforce positive amount with a reasonable upper limit
  IF NEW.reason = 'settlement' THEN
    IF NEW.amount <= 0 THEN
      RAISE EXCEPTION 'Settlement amount must be positive';
    END IF;
    IF NEW.amount > 50000 THEN
      RAISE EXCEPTION 'Settlement amount exceeds maximum allowed (50,000)';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_wallet_ledger_before_insert
  BEFORE INSERT ON public.provider_wallet_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_wallet_ledger_entry();
