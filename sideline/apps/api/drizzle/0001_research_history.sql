CREATE TABLE IF NOT EXISTS research_history (id uuid PRIMARY KEY, user_id text NOT NULL, context jsonb NOT NULL, answer jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS research_history_user_created ON research_history(user_id, created_at);
