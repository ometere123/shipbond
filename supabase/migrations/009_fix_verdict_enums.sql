-- Align DB verdict/bond_action values with GenLayer contract output.
-- Contract returns UPPERCASE; API layer maps to these lowercase DB values.
--
-- reviews: 'pass','fail','undetermined' → 'passed','partial_pass','failed','needs_human_review'
-- reviews bond_action: 'return','slash','pending' → 'return','slash','hold'
-- settlements: 'pass','fail' → 'passed','partial_pass','failed'
-- settlements bond_action: 'return','slash' → 'return','slash','hold'

-- ── reviews ──────────────────────────────────────────────────────────────────

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_verdict_check,
  DROP CONSTRAINT IF EXISTS reviews_bond_action_check;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_verdict_check CHECK (
    verdict IS NULL OR verdict IN ('passed', 'partial_pass', 'failed', 'needs_human_review')
  ),
  ADD CONSTRAINT reviews_bond_action_check CHECK (
    bond_action IS NULL OR bond_action IN ('return', 'slash', 'hold')
  );

-- ── settlements ───────────────────────────────────────────────────────────────

ALTER TABLE public.settlements
  DROP CONSTRAINT IF EXISTS settlements_verdict_check,
  DROP CONSTRAINT IF EXISTS settlements_bond_action_check;

ALTER TABLE public.settlements
  ADD CONSTRAINT settlements_verdict_check CHECK (
    verdict IN ('passed', 'partial_pass', 'failed')
  ),
  ADD CONSTRAINT settlements_bond_action_check CHECK (
    bond_action IN ('return', 'slash', 'hold')
  );
