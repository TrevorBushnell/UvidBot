BEGIN TRANSACTION;

-- 1. Create temporary table with desired schema
CREATE TABLE sm64_daily_rta_new (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    star_id TEXT NOT NULL REFERENCES sm64_ss(id),
    player TEXT NOT NULL,
    time TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Copy data (existing rows get current timestamp)
INSERT INTO sm64_daily_rta_new (id, star_id, player, time, submitted_at)
SELECT id, star_id, player, time, CURRENT_TIMESTAMP
FROM sm64_daily_rta;

-- 3. Replace old table
DROP TABLE sm64_daily_rta;
ALTER TABLE sm64_daily_rta_new RENAME TO sm64_daily_rta;

COMMIT;