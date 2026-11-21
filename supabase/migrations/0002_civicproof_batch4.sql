-- supabase/migrations/0002_civicproof_batch4.sql
-- Adds reproducible export snapshots and opt-in public-safe sharing controls

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS is_public_shared BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_summary TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.export_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_version TEXT NOT NULL DEFAULT 'none',
  snapshot_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_snapshots_report
  ON public.export_snapshots(report_id, created_at DESC);

ALTER TABLE public.export_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_select_own" ON public.export_snapshots
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "snapshots_insert_own" ON public.export_snapshots
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.owner_id = auth.uid())
  );