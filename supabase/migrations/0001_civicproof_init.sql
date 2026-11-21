-- supabase/migrations/0001_civicproof_init.sql
-- CivicProof Phase 1 & Batch 2 Schema + Strict RLS + Private Storage Policies

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. REPORTS TABLE (Tri-state separation + Ward 18 boundary enforcement)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('pothole', 'garbage')),
  locality_id TEXT NOT NULL DEFAULT 'gvmc-ward-18-mvp' CHECK (locality_id = 'gvmc-ward-18-mvp'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 140),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 1000),
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN 17.732 AND 17.752),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN 83.325 AND 83.348),
  landmark TEXT DEFAULT '',
  external_ref_id TEXT DEFAULT '',

  -- Independent State 1: What the external municipal portal claims
  external_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (external_status IN ('unknown', 'submitted_by_user', 'acknowledged', 'marked_resolved')),

  -- Independent State 2: Citizen's own review (NEVER mutated by AI or external status)
  citizen_review TEXT NOT NULL DEFAULT 'not_reviewed'
    CHECK (citizen_review IN ('not_reviewed', 'confirmed', 'disputed', 'more_evidence_needed')),

  -- Independent State 3: AI assessment job status
  assessment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (assessment_status IN ('pending', 'complete', 'failed')),

  is_synthetic_demo BOOLEAN NOT NULL DEFAULT FALSE,
  ai_consent_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. EVIDENCE TABLE (Before & After sanitized JPEG references + SHA-256 hash)
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('before', 'after')),
  storage_path TEXT NOT NULL UNIQUE,
  sha256_hash TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  has_pii_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ASSESSMENTS TABLE (Provisional AI outputs stored with model & prompt provenance)
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  before_evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
  after_evidence_id UUID REFERENCES public.evidence(id) ON DELETE SET NULL,
  stage1_model_id TEXT NOT NULL,
  stage2_model_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  stage1_raw_json JSONB,
  structured_output JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'complete', 'failed')),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. REVIEWS TABLE (Citizen confirmation / dispute decisions)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('confirmed', 'disputed', 'more_evidence_needed')),
  factual_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. REPORT EVENTS TABLE (Append-only timeline for auditability & export packet)
CREATE TABLE IF NOT EXISTS public.report_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common user queries
CREATE INDEX IF NOT EXISTS idx_reports_owner ON public.reports(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_report ON public.evidence(report_id, phase);
CREATE INDEX IF NOT EXISTS idx_events_report ON public.report_events(report_id, created_at ASC);

-- ============================================================================
-- ENABLE STRICT PER-USER ROW LEVEL SECURITY (ZERO CROSS-USER ACCESS)
-- ============================================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;

-- Reports policies
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "reports_update_own" ON public.reports FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "reports_delete_own" ON public.reports FOR DELETE USING (auth.uid() = owner_id);

-- Evidence policies (owner must own both the row and parent report)
CREATE POLICY "evidence_select_own" ON public.evidence FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "evidence_insert_own" ON public.evidence FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.owner_id = auth.uid())
  );
CREATE POLICY "evidence_delete_own" ON public.evidence FOR DELETE USING (auth.uid() = owner_id);

-- Assessments policies
CREATE POLICY "assessments_select_own" ON public.assessments FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "assessments_insert_own" ON public.assessments FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.owner_id = auth.uid())
  );

-- Reviews policies
CREATE POLICY "reviews_select_own" ON public.reviews FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.owner_id = auth.uid())
  );

-- Report Events policies
CREATE POLICY "events_select_own" ON public.report_events FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "events_insert_own" ON public.report_events FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.owner_id = auth.uid())
  );

-- ============================================================================
-- PRIVATE STORAGE BUCKET & STRICT FOLDER-PREFIX POLICIES
-- Path convention: {auth.uid()}/{report_id}/{phase}-{uuid}.jpg
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('civic-evidence', 'civic-evidence', FALSE, 5242880, ARRAY['image/jpeg'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_select_own_folder" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'civic-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_insert_own_folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'civic-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_delete_own_folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'civic-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);