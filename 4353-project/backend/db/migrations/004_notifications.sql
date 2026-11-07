CREATE TABLE IF NOT EXISTS "Notification" (
    "notificationId" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL
        REFERENCES "UserCredentials" ("userId") ON DELETE CASCADE,
    "message" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_notification_user
ON "Notification" ("userId");