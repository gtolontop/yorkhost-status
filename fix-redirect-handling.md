# Fix for Redirect Handling in Monitoring System

## Issue
The monitoring system is incorrectly marking https://yorkhost.fr/ as down because:
1. The site returns a 308 redirect to /fr
2. The check is configured with expectedStatus: 200
3. Two different monitoring implementations handle redirects differently

## Quick Fix
Update the database check configuration:

```sql
-- Remove expectedStatus requirement to allow redirects
UPDATE checks 
SET expected_status = NULL
WHERE target = 'https://yorkhost.fr';

-- Or change the check type to HTTPS
UPDATE checks 
SET type = 'HTTPS'
WHERE target = 'https://yorkhost.fr';
```

## Code Fixes Needed

### 1. In `workers/monitor.ts`:
- Line 195: The validateHttpResponse function checks for exact status match
- This causes 308 redirects to fail when expectedStatus is 200

### 2. In `src/lib/monitoring/checker.ts`:
- The fetch implementation always follows redirects
- It accepts any 2xx-3xx status as success

### Recommendation
1. Standardize redirect handling across both implementations
2. Consider 3xx redirects as success when followRedirects is true
3. Only check expectedStatus after following redirects
4. Update seed data to use HTTPS check type for HTTPS URLs