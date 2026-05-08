CREATE TABLE IF NOT EXISTS race_data (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    game TEXT,
    host TEXT,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    racer_data TEXT NOT NULL CHECK (json_valid(racer_data))
);