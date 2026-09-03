@echo off
if "%DATABASE_URL%"=="" (
  echo Set DATABASE_URL before running this.
  exit /b 1
)
npx prisma db push --accept-data-loss
