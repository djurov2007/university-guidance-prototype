-- PostgreSQL relational design for an offline-controlled catalog.
-- Not applied to any database. Publication also requires the TS semantic gate.
BEGIN;
CREATE SCHEMA IF NOT EXISTS catalog;
REVOKE ALL ON SCHEMA catalog FROM PUBLIC;

CREATE TABLE catalog.releases (
  id text PRIMARY KEY,
  version text NOT NULL CHECK (version ~ '^\d+\.\d+\.\d+$'),
  schema_version integer NOT NULL CHECK (schema_version = 1),
  channel text NOT NULL CHECK (channel IN ('staging', 'published')),
  prepared_on date NOT NULL,
  content_digest text NOT NULL CHECK (content_digest ~ '^[a-f0-9]{64}$'),
  UNIQUE (version, channel)
);
CREATE TABLE catalog.institutions (
  release_id text NOT NULL REFERENCES catalog.releases(id),
  id text NOT NULL, name text NOT NULL CHECK (length(trim(name)) > 0),
  country char(2) NOT NULL CHECK (country IN ('RS','DE','NL','IT')),
  official_hosts text[] NOT NULL CHECK (coalesce(array_length(official_hosts,1),0) > 0),
  PRIMARY KEY (release_id,id), UNIQUE (release_id,id,country)
);
CREATE TABLE catalog.programs (
  release_id text NOT NULL, id text NOT NULL, institution_id text NOT NULL,
  name text NOT NULL, level text NOT NULL CHECK (level IN ('undergraduate','master','phd')),
  country char(2) NOT NULL, city text NOT NULL,
  field text NOT NULL, subfield text NOT NULL,
  classification_basis text NOT NULL CHECK (classification_basis = 'editorial'),
  verification text NOT NULL CHECK (verification IN ('partial','fully_verified')),
  notes text NOT NULL,
  PRIMARY KEY (release_id,id), UNIQUE (release_id,id,institution_id),
  FOREIGN KEY (release_id,institution_id,country) REFERENCES catalog.institutions(release_id,id,country)
);
CREATE TABLE catalog.intakes (
  release_id text NOT NULL, id text NOT NULL, program_id text NOT NULL,
  academic_year text CHECK (academic_year ~ '^20\d{2}/20\d{2}$'),
  label text NOT NULL, scope text NOT NULL CHECK (scope IN ('year_bound','general_policy')),
  CHECK (scope <> 'year_bound' OR academic_year IS NOT NULL),
  PRIMARY KEY (release_id,id), UNIQUE (release_id,id,program_id),
  FOREIGN KEY (release_id,program_id) REFERENCES catalog.programs(release_id,id)
);
CREATE TABLE catalog.sources (
  release_id text NOT NULL, id text NOT NULL, institution_id text NOT NULL,
  title text NOT NULL, url text NOT NULL CHECK (url ~ '^https://[^[:space:]]+$'),
  publisher text NOT NULL,
  authority text NOT NULL CHECK (authority IN ('official','unofficial')),
  authority_reason text NOT NULL CHECK (length(trim(authority_reason)) > 0),
  status text NOT NULL CHECK (status IN ('verified','unverified','unknown','conflicting','stale')),
  accessed_on date NOT NULL, checked_on date NOT NULL CHECK (checked_on >= accessed_on),
  PRIMARY KEY (release_id,id), UNIQUE (release_id,id,institution_id),
  FOREIGN KEY (release_id,institution_id) REFERENCES catalog.institutions(release_id,id)
);
CREATE TABLE catalog.source_programs (
  release_id text NOT NULL, source_id text NOT NULL, program_id text NOT NULL, institution_id text NOT NULL,
  PRIMARY KEY (release_id,source_id,program_id),
  FOREIGN KEY (release_id,source_id,institution_id) REFERENCES catalog.sources(release_id,id,institution_id),
  FOREIGN KEY (release_id,program_id,institution_id) REFERENCES catalog.programs(release_id,id,institution_id)
);
CREATE TABLE catalog.source_intakes (
  release_id text NOT NULL, source_id text NOT NULL, intake_id text NOT NULL, program_id text NOT NULL,
  PRIMARY KEY (release_id,source_id,intake_id),
  FOREIGN KEY (release_id,source_id,program_id) REFERENCES catalog.source_programs(release_id,source_id,program_id),
  FOREIGN KEY (release_id,intake_id,program_id) REFERENCES catalog.intakes(release_id,id,program_id)
);
CREATE TABLE catalog.facts (
  release_id text NOT NULL, id text NOT NULL, program_id text NOT NULL, intake_id text,
  predicate text NOT NULL CHECK (predicate IN ('institution_name','name','level','country','city','language','duration','credits','academic_year','intake_start','tuition','other_cost','application_requirement','application_deadline','scholarship','institutional_requirement')),
  qualifier text NOT NULL, candidate_category text NOT NULL,
  nature text NOT NULL CHECK (nature IN ('institutional','estimate','experience')),
  status text NOT NULL CHECK (status IN ('verified','unverified','unknown','conflicting','stale')),
  value jsonb, unknown_reason text,
  checked_on date NOT NULL, checked_by text NOT NULL CHECK (checked_by IN ('agent','human')),
  note text NOT NULL,
  CHECK ((status = 'unknown' AND value IS NULL AND length(trim(unknown_reason)) > 0 AND unknown_reason IS NOT NULL)
    OR (status <> 'unknown' AND value IS NOT NULL AND jsonb_typeof(value) = 'object'
      AND coalesce(value->>'kind' IN ('text','list','duration','number','money','date'), false))),
  CHECK (nature <> 'experience' OR status <> 'verified'),
  CHECK (predicate NOT IN ('academic_year','intake_start','tuition','other_cost','application_deadline','scholarship') OR intake_id IS NOT NULL),
  PRIMARY KEY (release_id,id), UNIQUE (release_id,id,program_id),
  FOREIGN KEY (release_id,program_id) REFERENCES catalog.programs(release_id,id),
  FOREIGN KEY (release_id,intake_id,program_id) REFERENCES catalog.intakes(release_id,id,program_id)
);
CREATE TABLE catalog.evidence (
  release_id text NOT NULL, id text NOT NULL, fact_id text NOT NULL, source_id text NOT NULL,
  relation text NOT NULL CHECK (relation IN ('supports','contradicts','context')),
  locator text NOT NULL CHECK (length(trim(locator)) > 0),
  paraphrase text NOT NULL CHECK (length(trim(paraphrase)) > 0), checked_on date NOT NULL,
  PRIMARY KEY (release_id,id),
  FOREIGN KEY (release_id,fact_id) REFERENCES catalog.facts(release_id,id),
  FOREIGN KEY (release_id,source_id) REFERENCES catalog.sources(release_id,id)
);
CREATE TABLE catalog.reviews (
  release_id text NOT NULL, id text NOT NULL, program_id text NOT NULL,
  reviewer text NOT NULL, reviewer_kind text NOT NULL CHECK (reviewer_kind IN ('human','agent')),
  decision text NOT NULL CHECK (decision IN ('approved','rejected','pending')),
  reviewed_on date NOT NULL, content_digest text NOT NULL CHECK (content_digest ~ '^[a-f0-9]{64}$'),
  checklist_complete boolean NOT NULL, note text NOT NULL,
  PRIMARY KEY (release_id,id), UNIQUE (release_id,id,program_id),
  FOREIGN KEY (release_id,program_id) REFERENCES catalog.programs(release_id,id)
);
CREATE TABLE catalog.review_unknowns (
  release_id text NOT NULL, review_id text NOT NULL, fact_id text NOT NULL, program_id text NOT NULL,
  PRIMARY KEY (release_id,review_id,fact_id),
  FOREIGN KEY (release_id,review_id,program_id) REFERENCES catalog.reviews(release_id,id,program_id),
  FOREIGN KEY (release_id,fact_id,program_id) REFERENCES catalog.facts(release_id,id,program_id)
);
CREATE INDEX facts_context_idx ON catalog.facts(release_id,program_id,intake_id,predicate);
CREATE INDEX evidence_fact_idx ON catalog.evidence(release_id,fact_id);
CREATE INDEX evidence_source_idx ON catalog.evidence(release_id,source_id);
CREATE INDEX reviews_program_idx ON catalog.reviews(release_id,program_id);

-- Private, default-deny design. No client grants, RLS policies or session implementation.
ALTER TABLE catalog.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.source_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.source_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.review_unknowns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA catalog FROM PUBLIC;
COMMIT;
