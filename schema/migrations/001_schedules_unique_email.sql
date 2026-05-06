ALTER TABLE schedules ADD COLUMN unique_email TEXT NOT NULL DEFAULT '';
UPDATE schedules SET unique_email = CASE
  WHEN INSTR(email, '+') > 0 AND INSTR(email, '+') < INSTR(email, '@')
  THEN SUBSTR(email, 1, INSTR(email, '+') - 1) || SUBSTR(email, INSTR(email, '@'))
  ELSE email
END;
CREATE INDEX IF NOT EXISTS idx_schedules_unique_email ON schedules(unique_email);
