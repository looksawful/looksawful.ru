-- Private Review Hub D1 control-plane schema.
-- Public-safe: contains no database ids, API credentials or Review evidence.

CREATE TABLE IF NOT EXISTS review_hub_objects (
  key TEXT PRIMARY KEY CHECK (key LIKE 'review-hub/v1/%'),
  kind TEXT NOT NULL CHECK (kind IN ('json', 'binary')),
  body_text TEXT,
  asset_id TEXT,
  public_id TEXT,
  resource_type TEXT,
  delivery_type TEXT,
  content_type TEXT NOT NULL,
  custom_metadata TEXT NOT NULL DEFAULT '{}',
  expires_at TEXT,
  etag TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (kind = 'json'
      AND body_text IS NOT NULL
      AND asset_id IS NULL
      AND public_id IS NULL
      AND resource_type IS NULL
      AND delivery_type IS NULL)
    OR
    (kind = 'binary'
      AND body_text IS NULL
      AND asset_id IS NOT NULL
      AND public_id IS NOT NULL
      AND resource_type = 'image'
      AND delivery_type = 'authenticated')
  )
);

CREATE INDEX IF NOT EXISTS review_hub_objects_expires_at_idx
  ON review_hub_objects (expires_at)
  WHERE expires_at IS NOT NULL;
