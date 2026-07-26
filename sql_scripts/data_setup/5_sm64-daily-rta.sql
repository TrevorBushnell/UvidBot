CREATE TABLE sm64_daily_rta (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    star_id TEXT NOT NULL REFERENCES sm64_ss(id),
    player TEXT NOT NULL,
    time TIMESTAMP NOT NULL
);