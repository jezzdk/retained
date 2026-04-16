CREATE TABLE IF NOT EXISTS otp_attempts (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  used        INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
  id                 TEXT PRIMARY KEY,
  session_id         TEXT NOT NULL,
  email              TEXT NOT NULL,
  url                TEXT NOT NULL,
  questions_json     TEXT NOT NULL,
  pre_answers_json   TEXT,
  final_answers_json TEXT,
  study_at           INTEGER,
  study_sent         INTEGER DEFAULT 0,
  studied_at         INTEGER,
  test_at            INTEGER,
  test_sent          INTEGER DEFAULT 0,
  completed_at       INTEGER,
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS idx_schedules_study ON schedules(study_sent, study_at);
CREATE INDEX IF NOT EXISTS idx_schedules_test ON schedules(test_sent, test_at, studied_at);
