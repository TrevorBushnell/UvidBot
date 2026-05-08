CREATE TABLE IF NOT EXISTS lunch_lady (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    category TEXT NOT NULL,
    num_players INT NOT NULL,
    runners TEXT NOT NULL,
    time TIMESTAMP NOT NULL
);