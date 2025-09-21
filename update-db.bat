@echo off
set DATABASE_URL=postgresql://neondb_owner:REDACTED_DB_PASSWORD@ep-flat-sound-ag98carx-pooler.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
npx prisma db push --accept-data-loss