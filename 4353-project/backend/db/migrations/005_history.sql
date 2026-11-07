CREATE TABLE IF NOT EXISTS "History" (
    "historyId" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL
        REFERENCES "UserCredentials" ("userId") ON DELETE CASCADE,
    "record" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_user
ON "History" ("userId");