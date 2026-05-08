CREATE TABLE IF NOT EXISTS sm64_coop (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    category TEXT NOT NULL,
    num_players INT NOT NULL,
    runners TEXT NOT NULL,
    time TIMESTAMP NOT NULL
);
